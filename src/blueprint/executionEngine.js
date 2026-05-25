import cronParser from 'cron-parser'
import { v4 as uuidv4 } from 'uuid'
import {
  applyTemplate,
  buildGraph,
  compareValues,
  getByPath,
  parseTemplatePayload,
  parseValue,
  resolveMappingValue
} from './blueprintUtils'

function createLogEntry(nodeId, level, input, output, error, msgId) {
  return {
    id: `${nodeId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
    nodeId,
    level,
    input,
    output,
    error,
    msgId
  }
}

function normalizeMessage(message = {}) {
  return {
    id: message.id || uuidv4(),
    payload: message.payload,
    topic: message.topic,
    timestamp: message.timestamp ?? Date.now(),
    meta: message.meta ?? {}
  }
}

async function executeNode(node, msg, context) {
  const input = normalizeMessage(msg)

  switch (node.type) {
    case 'mqtt-subscribe':
      return input
    case 'inject':
      return normalizeMessage({
        ...input,
        payload: parseValue(node.data.payloadText)
      })
    case 'timer':
      return input
    case 'delay':
      await new Promise((resolve) => setTimeout(resolve, Number(node.data.delayMs || 0)))
      return input
    case 'filter': {
      const left = getByPath(input, node.data.fieldPath)
      const right = parseValue(node.data.compareValue)
      const passed = compareValues(left, node.data.operator, right)
      if (!passed) {
        context.addLog(createLogEntry(node.id, 'info', input, null, '消息被 Filter 节点拦截。', input.id))
        return null
      }
      return input
    }
    case 'switch': {
      const rules = node.data.rules || []
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i]
        const left = getByPath(input, rule.property)
        const right = parseValue(rule.value)
        if (compareValues(left, rule.operator, right)) {
          return { ...input, __sourceHandle: `source-${i}` }
        }
      }
      return { ...input, __sourceHandle: `source-${rules.length}` } // default/else
    }
    case 'map': {
      const mappingConfig = parseValue(node.data.mappingsText)
      const nextPayload = Object.entries(mappingConfig).reduce((accumulator, [key, value]) => {
        accumulator[key] = resolveMappingValue(value, input)
        return accumulator
      }, {})

      return normalizeMessage({
        ...input,
        payload: nextPayload
      })
    }
    case 'mqtt-publish': {
      const topic = applyTemplate(node.data.topic, input)
      const payload = parseTemplatePayload(node.data.payloadTemplate, input)
      await context.publishMessage({
        topic,
        payload,
        qos: Number(node.data.qos ?? 0),
        retain: Boolean(node.data.retain)
      })
      return input
    }
    case 'update-device': {
      const deviceId = node.data.deviceId || context.getSelectedDeviceId()
      const value = getByPath(input, node.data.valuePath)
      context.updateDevice({
        id: deviceId,
        property: node.data.property,
        value
      })
      return input
    }
    case 'logger':
      context.addLog(createLogEntry(node.id, 'info', input, input, null, input.id))
      return input
    default:
      throw new Error(`Unsupported node type: ${node.type}`)
  }
}

export async function runBlueprintTrigger({
  sourceNodeIds,
  initialMessage,
  nodes,
  edges,
  isRunActive,
  setNodeStatus,
  addLog,
  publishMessage,
  updateDevice,
  getSelectedDeviceId,
  shouldStartTimers = false // 新增参数
}) {
  const { nodeMap, adjacency } = buildGraph(nodes, edges)
  const context = {
    addLog,
    publishMessage,
    updateDevice,
    getSelectedDeviceId
  }

  // 只有在明确要求时才处理 Timer 节点（通常只有主流程启动时）
  const intervals = new Set()

  if (shouldStartTimers) {
    const timerNodes = nodes.filter((n) => n.type === 'timer')
    timerNodes.forEach((node) => {
      if (node.data.mode === 'cron') {
        try {
          const interval = cronParser.parseExpression(node.data.cron)
          let timerId = null
          
          const scheduleNext = () => {
            if (!isRunActive()) return
            const timeout = interval.next().getTime() - Date.now()
            timerId = setTimeout(async () => {
              intervals.delete(timerId)
              await walk(node.id, { id: uuidv4(), payload: {}, topic: 'timer/cron', timestamp: Date.now() })
              scheduleNext()
            }, Math.max(0, timeout))
            intervals.add(timerId)
          }
          scheduleNext()
        } catch (e) {
          addLog(createLogEntry(node.id, 'error', null, null, `Cron 表达式错误: ${e.message}`))
        }
      } else {
        const timer = setInterval(() => {
          if (!isRunActive()) return
          walk(node.id, { id: uuidv4(), payload: {}, topic: 'timer/interval', timestamp: Date.now() })
        }, Number(node.data.interval || 5000))
        intervals.add(timer)
      }
    })
  }

  // 限制递归深度，防止死循环导致网页崩溃
  const MAX_RECURSION_DEPTH = 50

  async function walk(nodeId, incomingMessage, depth = 0) {
    if (!isRunActive() || depth > MAX_RECURSION_DEPTH) {
      if (depth > MAX_RECURSION_DEPTH) {
        addLog(createLogEntry(nodeId, 'error', null, null, '检测到可能的死循环或递归过深，已停止该分支。', incomingMessage.id))
      }
      return
    }

    const node = nodeMap.get(nodeId)
    if (!node) {
      return
    }

    setNodeStatus(nodeId, 'running')

    try {
      const output = await executeNode(node, incomingMessage, context)
      if (!isRunActive()) {
        return
      }

      setNodeStatus(nodeId, 'success')

      if (output == null) {
        return
      }

      const downstream = adjacency.get(nodeId) || []
      const tasks = downstream.map((edge) => {
        // 如果是 Switch 节点，检查 sourceHandle 是否匹配
        if (node.type === 'switch') {
          if (edge.sourceHandle === output.__sourceHandle) {
            return walk(edge.target, output, depth + 1)
          }
          return Promise.resolve()
        } else {
          return walk(edge.target, output, depth + 1)
        }
      })
      
      await Promise.all(tasks)
    } catch (error) {
      setNodeStatus(nodeId, 'error')
      addLog(
        createLogEntry(
          nodeId,
          'error',
          normalizeMessage(incomingMessage),
          null,
          error instanceof Error ? error.message : String(error),
          incomingMessage.id
        )
      )
    }
  }

  // 初始触发
  const rootTasks = sourceNodeIds.map(id => walk(id, normalizeMessage(initialMessage), 0))
  await Promise.all(rootTasks)

  return () => {
    intervals.forEach((timer) => {
      if (typeof timer === 'number' || (typeof timer === 'object' && timer !== null)) {
        clearTimeout(timer)
        clearInterval(timer)
      }
    })
    intervals.clear()
  }
}
