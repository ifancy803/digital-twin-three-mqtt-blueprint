import { NODE_LIBRARY_BY_TYPE, createDefaultBlueprintDocument } from './nodeLibrary'

export const BLUEPRINT_STORAGE_KEY = 'digital-twin-blueprint-v1'
export const DEVICE_PROPERTIES = [
  { value: 'status', label: '状态 (String)' },
  { value: 'temperature', label: '温度 (Number)' },
  { value: 'color', label: '颜色 (Hex String)' },
  { value: 'position', label: '位置 (Array: [x,y,z])' },
  { value: 'rotation', label: '旋转 (Array: [x,y,z])' },
  { value: 'scale', label: '缩放 (Array: [x,y,z])' }
]

export function getNodeDefinition(type) {
  return NODE_LIBRARY_BY_TYPE[type]
}

export function normalizeBlueprintDocument(input) {
  const fallback = createDefaultBlueprintDocument()
  const document = input && typeof input === 'object' ? input : {}

  return {
    nodes: Array.isArray(document.nodes) ? document.nodes : fallback.nodes,
    edges: Array.isArray(document.edges) ? document.edges : fallback.edges,
    viewport: document.viewport ?? fallback.viewport,
    metadata: {
      name: document.metadata?.name || fallback.metadata.name,
      version: document.metadata?.version || '1.0.0',
      updatedAt: document.metadata?.updatedAt || new Date().toISOString()
    }
  }
}

export function buildGraph(nodes, edges) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const adjacency = new Map()

  nodes.forEach((node) => {
    adjacency.set(node.id, [])
  })

  edges.forEach((edge) => {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      return
    }

    adjacency.get(edge.source).push({
      target: edge.target,
      sourceHandle: edge.sourceHandle
    })
  })

  return { nodeMap, adjacency }
}

export function detectCycles(nodes, edges) {
  const { adjacency } = buildGraph(nodes, edges)
  const visited = new Set()
  const active = new Set()
  const cycleNodes = new Set()

  function dfs(nodeId) {
    if (active.has(nodeId)) {
      cycleNodes.add(nodeId)
      return true
    }

    if (visited.has(nodeId)) {
      return false
    }

    visited.add(nodeId)
    active.add(nodeId)

    const nextNodes = adjacency.get(nodeId) || []
    for (const edge of nextNodes) {
      if (dfs(edge.target)) {
        cycleNodes.add(nodeId)
      }
    }

    active.delete(nodeId)
    return cycleNodes.has(nodeId)
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id)
    }
  })

  return Array.from(cycleNodes)
}

export function collectSubscriptionTopics(nodes) {
  return nodes
    .filter((node) => node.type === 'mqtt-subscribe')
    .map((node) => node.data?.topic?.trim())
    .filter(Boolean)
}

export function parseValue(textValue) {
  if (typeof textValue !== 'string') {
    return textValue
  }

  const trimmed = textValue.trim()
  if (!trimmed) {
    return ''
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

export function getByPath(source, path) {
  if (!path) {
    return source
  }

  const segments = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  let current = source
  for (const segment of segments) {
    if (current == null) {
      return undefined
    }

    current = current[segment]
  }

  return current
}

export function resolveMappingValue(value, msg) {
  if (typeof value === 'string') {
    if (
      value.startsWith('payload.') ||
      value.startsWith('meta.') ||
      value.startsWith('topic') ||
      value.startsWith('timestamp')
    ) {
      return getByPath(msg, value)
    }

    return value
  }

  return value
}

export function applyTemplate(template, msg) {
  if (typeof template !== 'string') {
    return template
  }

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawPath) => {
    const value = getByPath(msg, rawPath.trim())
    if (value == null) {
      return ''
    }

    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  })
}

export function parseTemplatePayload(template, msg) {
  const rendered = applyTemplate(template, msg)
  return parseValue(rendered)
}

export function compareValues(left, operator, right) {
  switch (operator) {
    case 'eq':
      return left === right
    case 'ne':
      return left !== right
    case 'gt':
      return Number(left) > Number(right)
    case 'gte':
      return Number(left) >= Number(right)
    case 'lt':
      return Number(left) < Number(right)
    case 'lte':
      return Number(left) <= Number(right)
    case 'includes':
      return String(left ?? '').includes(String(right ?? ''))
    default:
      return false
  }
}

export function matchMqttTopic(filter, topic) {
  if (!filter || !topic) {
    return false
  }

  if (filter === topic) {
    return true
  }

  const filterParts = filter.split('/')
  const topicParts = topic.split('/')

  for (let index = 0; index < filterParts.length; index += 1) {
    const filterPart = filterParts[index]
    const topicPart = topicParts[index]

    if (filterPart === '#') {
      return true
    }

    if (filterPart === '+') {
      if (topicPart == null) {
        return false
      }
      continue
    }

    if (filterPart !== topicPart) {
      return false
    }
  }

  return filterParts.length === topicParts.length
}

export function createEmptyValidationErrors() {
  return {
    graph: [],
    nodes: {}
  }
}

export function validateBlueprint(nodes, edges) {
  const errors = createEmptyValidationErrors()
  const cycleNodes = detectCycles(nodes, edges)

  if (cycleNodes.length > 0) {
    errors.graph.push('蓝图存在循环依赖，运行前需要打断环路。')
    cycleNodes.forEach((nodeId) => {
      errors.nodes[nodeId] = [...(errors.nodes[nodeId] || []), '当前节点位于循环依赖中。']
    })
  }

  nodes.forEach((node) => {
    const nodeErrors = []
    const data = node.data || {}

    if (!getNodeDefinition(node.type)) {
      nodeErrors.push('未知节点类型。')
    }

    if (node.type === 'mqtt-subscribe' && !data.topic?.trim()) {
      nodeErrors.push('订阅节点必须配置 topic。')
    }

    if (node.type === 'mqtt-publish') {
      if (!data.topic?.trim()) {
        nodeErrors.push('发布节点必须配置 topic 模板。')
      }
      if (!String(data.payloadTemplate ?? '').trim()) {
        nodeErrors.push('发布节点必须配置 payload 模板。')
      }
    }

    if (node.type === 'inject' && !String(data.payloadText ?? '').trim()) {
      nodeErrors.push('Inject 节点必须提供 payload。')
    }

    if (node.type === 'filter') {
      if (!data.fieldPath?.trim()) {
        nodeErrors.push('Filter 节点必须配置字段路径。')
      }
      if (!data.operator) {
        nodeErrors.push('Filter 节点必须选择比较操作符。')
      }
    }

    if (node.type === 'map') {
      try {
        const parsed = parseValue(data.mappingsText)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          nodeErrors.push('Map 节点的映射必须是 JSON 对象。')
        }
      } catch {
        nodeErrors.push('Map 节点的映射 JSON 不合法。')
      }
    }

    if (node.type === 'update-device') {
      if (!DEVICE_PROPERTIES.includes(data.property)) {
        nodeErrors.push('Update 3D Device 节点的 property 不合法。')
      }
      if (!data.valuePath?.trim()) {
        nodeErrors.push('Update 3D Device 节点必须配置 valuePath。')
      }
    }

    if (nodeErrors.length > 0) {
      errors.nodes[node.id] = nodeErrors
    }
  })

  return {
    isValid: errors.graph.length === 0 && Object.keys(errors.nodes).length === 0,
    errors
  }
}
