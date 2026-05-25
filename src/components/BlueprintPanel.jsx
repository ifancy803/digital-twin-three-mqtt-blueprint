import { useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useBlueprintStore } from '../store/blueprintStore'
import { useTwinStore } from '../store/twinStore'
import { NODE_LIBRARY } from '../blueprint/nodeLibrary'
import { DEVICE_PROPERTIES } from '../blueprint/blueprintUtils'
import { FilterNode } from '../blueprint/nodes/FilterNode'
import { InjectNode } from '../blueprint/nodes/InjectNode'
import { LoggerNode } from '../blueprint/nodes/LoggerNode'
import { MapNode } from '../blueprint/nodes/MapNode'
import { MqttPublishNode } from '../blueprint/nodes/MqttPublishNode'
import { MqttSubscribeNode } from '../blueprint/nodes/MqttSubscribeNode'
import { UpdateDeviceNode } from '../blueprint/nodes/UpdateDeviceNode'
import { TimerNode } from '../blueprint/nodes/TimerNode'
import { DelayNode } from '../blueprint/nodes/DelayNode'
import { SwitchNode } from '../blueprint/nodes/SwitchNode'

const nodeTypes = {
  'mqtt-subscribe': MqttSubscribeNode,
  'mqtt-publish': MqttPublishNode,
  inject: InjectNode,
  filter: FilterNode,
  map: MapNode,
  'update-device': UpdateDeviceNode,
  logger: LoggerNode,
  timer: TimerNode,
  delay: DelayNode,
  switch: SwitchNode
}

const FILTER_OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'includes', label: 'includes' }
]

function Palette() {
  const addNode = useBlueprintStore((state) => state.addNode)

  return (
    <aside className="blueprint-palette">
      <div className="blueprint-section-title">节点面板</div>
      <p className="palette-hint">支持拖拽到画布，也可以点击卡片直接添加。</p>
      <div className="palette-list">
        {NODE_LIBRARY.map((item) => (
          <button
            key={item.type}
            type="button"
            className="palette-item"
            draggable
            onClick={() => addNode(item.type, { x: 220, y: 180 })}
            onDragStart={(event) => {
              event.dataTransfer.setData('application/reactflow', item.type)
              event.dataTransfer.effectAllowed = 'move'
            }}
          >
            <span className="palette-item-group">{item.group}</span>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function Toolbar() {
  const fileInputRef = useRef(null)
  const isRunning = useBlueprintStore((state) => state.isRunning)
  const validationErrors = useBlueprintStore((state) => state.validationErrors)
  const runBlueprint = useBlueprintStore((state) => state.runBlueprint)
  const stopBlueprint = useBlueprintStore((state) => state.stopBlueprint)
  const validate = useBlueprintStore((state) => state.validateBlueprint)
  const saveLocal = useBlueprintStore((state) => state.saveBlueprintToLocal)
  const loadLocal = useBlueprintStore((state) => state.loadBlueprintFromLocal)
  const exportBlueprint = useBlueprintStore((state) => state.exportBlueprint)
  const importBlueprint = useBlueprintStore((state) => state.importBlueprint)
  const clearLogs = useBlueprintStore((state) => state.clearLogs)
  const clearBlueprint = useBlueprintStore((state) => state.clearBlueprint)

  const graphErrorCount = validationErrors.graph.length + Object.keys(validationErrors.nodes).length

  return (
    <div className="blueprint-toolbar">
      <button className="primary" onClick={() => runBlueprint()}>
        {isRunning ? '重新运行' : '运行'}
      </button>
      <button className="ghost" onClick={() => stopBlueprint()}>
        停止
      </button>
      <button className="ghost" onClick={() => validate()}>
        校验
      </button>
      <button className="ghost" onClick={() => saveLocal()}>
        保存到本地
      </button>
      <button className="ghost" onClick={() => loadLocal()}>
        读取本地
      </button>
      <button
        className="ghost"
        onClick={() => {
          const json = exportBlueprint()
          const blob = new Blob([json], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = 'digital-twin-blueprint.json'
          anchor.click()
          window.URL.revokeObjectURL(url)
        }}
      >
        导出 JSON
      </button>
      <button className="ghost" onClick={() => fileInputRef.current?.click()}>
        导入 JSON
      </button>
      <button className="ghost" onClick={() => clearLogs()}>
        清空日志
      </button>
      <button
        className="ghost danger"
        onClick={() => {
          if (window.confirm('确认清空当前蓝图画布吗？')) {
            clearBlueprint()
          }
        }}
      >
        清空画布
      </button>
      <span className={`toolbar-validation ${graphErrorCount > 0 ? 'invalid' : 'valid'}`}>
        {graphErrorCount > 0 ? `校验问题 ${graphErrorCount}` : '校验通过'}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          const text = await file.text()
          importBlueprint(text)
          event.target.value = ''
        }}
      />
    </div>
  )
}

function PropertyField({ label, children, hint }) {
  return (
    <label className="inspector-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function NodeInspector() {
  const selectedNodeId = useBlueprintStore((state) => state.selectedNodeId)
  const nodes = useBlueprintStore((state) => state.nodes)
  const updateNodeData = useBlueprintStore((state) => state.updateNodeData)
  const devices = useTwinStore((state) => state.devices)
  const selectedDeviceId = useTwinStore((state) => state.selectedDeviceId)

  const selectedNode = nodes.find((node) => node.id === selectedNodeId)

  useEffect(() => {
    if (!selectedNode || selectedNode.type !== 'update-device') {
      return
    }

    if (!selectedNode.data.deviceId && selectedDeviceId) {
      updateNodeData(selectedNode.id, { deviceId: selectedDeviceId })
    }
  }, [selectedNode, selectedDeviceId, updateNodeData])

  if (!selectedNode) {
    return (
      <aside className="blueprint-inspector">
        <div className="blueprint-section-title">属性面板</div>
        <p className="empty-hint">选择一个节点后，可在这里编辑其配置。</p>
      </aside>
    )
  }

  const data = selectedNode.data || {}

  return (
    <aside className="blueprint-inspector">
      <div className="blueprint-section-title">属性面板</div>
      <div className="inspector-meta">
        <strong>{selectedNode.type}</strong>
        <span>ID: {selectedNode.id}</span>
      </div>

      {'label' in data ? (
        <PropertyField label="标题">
          <input value={data.label || ''} onChange={(event) => updateNodeData(selectedNode.id, { label: event.target.value })} />
        </PropertyField>
      ) : null}

      {selectedNode.type === 'mqtt-subscribe' ? (
        <>
          <PropertyField label="Topic">
            <input
              value={data.topic || ''}
              onChange={(event) => updateNodeData(selectedNode.id, { topic: event.target.value })}
            />
          </PropertyField>
          <PropertyField label="QoS">
            <select value={data.qos ?? 0} onChange={(event) => updateNodeData(selectedNode.id, { qos: Number(event.target.value) })}>
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </PropertyField>
        </>
      ) : null}

      {selectedNode.type === 'mqtt-publish' ? (
        <>
          <PropertyField label="Topic 模板" hint="支持 {{payload.id}} 这类占位符。">
            <input
              value={data.topic || ''}
              onChange={(event) => updateNodeData(selectedNode.id, { topic: event.target.value })}
            />
          </PropertyField>
          <PropertyField label="Payload 模板">
            <textarea
              rows={8}
              value={data.payloadTemplate || ''}
              onChange={(event) => updateNodeData(selectedNode.id, { payloadTemplate: event.target.value })}
            />
          </PropertyField>
          <PropertyField label="QoS">
            <select value={data.qos ?? 0} onChange={(event) => updateNodeData(selectedNode.id, { qos: Number(event.target.value) })}>
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </PropertyField>
          <PropertyField label="Retain">
            <select
              value={data.retain ? 'true' : 'false'}
              onChange={(event) => updateNodeData(selectedNode.id, { retain: event.target.value === 'true' })}
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          </PropertyField>
        </>
      ) : null}

      {selectedNode.type === 'inject' ? (
        <PropertyField label="Payload JSON">
          <textarea
            rows={10}
            value={data.payloadText || ''}
            onChange={(event) => updateNodeData(selectedNode.id, { payloadText: event.target.value })}
          />
        </PropertyField>
      ) : null}

      {selectedNode.type === 'filter' ? (
        <>
          <PropertyField label="字段路径" hint="例如 payload.temperature">
            <input
              value={data.fieldPath || ''}
              onChange={(event) => updateNodeData(selectedNode.id, { fieldPath: event.target.value })}
            />
          </PropertyField>
          <PropertyField label="操作符">
            <select
              value={data.operator || 'eq'}
              onChange={(event) => updateNodeData(selectedNode.id, { operator: event.target.value })}
            >
              {FILTER_OPERATORS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </PropertyField>
          <PropertyField label="比较值" hint="支持数字、布尔值或 JSON 文本。">
            <input
              value={data.compareValue || ''}
              onChange={(event) => updateNodeData(selectedNode.id, { compareValue: event.target.value })}
            />
          </PropertyField>
        </>
      ) : null}

      {selectedNode.type === 'map' ? (
        <PropertyField
          label="映射 JSON"
          hint='键为输出字段，值为路径字符串，例如 {"id":"payload.id","status":"payload.status"}'
        >
          <textarea
            rows={10}
            value={data.mappingsText || ''}
            onChange={(event) => updateNodeData(selectedNode.id, { mappingsText: event.target.value })}
          />
        </PropertyField>
      ) : null}

      {selectedNode.type === 'update-device' ? (
        <>
          <PropertyField label="设备">
            <select
              value={data.deviceId || selectedDeviceId || ''}
              onChange={(event) => updateNodeData(selectedNode.id, { deviceId: event.target.value })}
            >
              <option value="">使用当前选中设备</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.id})
                </option>
              ))}
            </select>
          </PropertyField>
          <PropertyField label="属性">
            <select
              value={data.property || 'status'}
              onChange={(event) => updateNodeData(selectedNode.id, { property: event.target.value })}
            >
              {DEVICE_PROPERTIES.map((prop) => (
                <option key={prop.value} value={prop.value}>
                  {prop.label}
                </option>
              ))}
            </select>
          </PropertyField>
          <PropertyField label="值路径" hint="例如 payload.status、payload.temperature、payload.color">
            <input
              value={data.valuePath || ''}
              onChange={(event) => updateNodeData(selectedNode.id, { valuePath: event.target.value })}
            />
          </PropertyField>
        </>
      ) : null}

      {selectedNode.type === 'logger' ? (
        <PropertyField label="标签">
          <input value={data.label || ''} onChange={(event) => updateNodeData(selectedNode.id, { label: event.target.value })} />
        </PropertyField>
      ) : null}

      {selectedNode.type === 'timer' ? (
        <>
          <PropertyField label="模式">
            <select
              value={data.mode || 'interval'}
              onChange={(event) => updateNodeData(selectedNode.id, { mode: event.target.value })}
            >
              <option value="interval">间隔触发 (Interval)</option>
              <option value="cron">表达式触发 (Cron)</option>
            </select>
          </PropertyField>
          {data.mode === 'cron' ? (
            <PropertyField label="Cron 表达式" hint="例如: 0 * * * * * (每分钟)">
              <input
                value={data.cron || ''}
                onChange={(event) => updateNodeData(selectedNode.id, { cron: event.target.value })}
              />
            </PropertyField>
          ) : (
            <PropertyField label="间隔时间 (ms)">
              <input
                type="number"
                value={data.interval || 5000}
                onChange={(event) => updateNodeData(selectedNode.id, { interval: Number(event.target.value) })}
              />
            </PropertyField>
          )}
        </>
      ) : null}

      {selectedNode.type === 'delay' ? (
        <PropertyField label="延迟毫秒">
          <input
            type="number"
            value={data.delayMs || 2000}
            onChange={(event) => updateNodeData(selectedNode.id, { delayMs: Number(event.target.value) })}
          />
        </PropertyField>
      ) : null}

      {selectedNode.type === 'switch' ? (
        <>
          <p className="inspector-hint">根据条件路由消息。第一个匹配的规则生效，无匹配则走最后一个端口。</p>
          {(data.rules || []).map((rule, index) => (
            <div key={index} className="inspector-rule-item">
              <header>
                <strong>规则 {index + 1}</strong>
                <button 
                  className="mini-danger" 
                  onClick={() => {
                    const nextRules = [...data.rules]
                    nextRules.splice(index, 1)
                    updateNodeData(selectedNode.id, { rules: nextRules })
                  }}
                >
                  删除
                </button>
              </header>
              <PropertyField label="字段路径">
                <input
                  value={rule.property || ''}
                  onChange={(e) => {
                    const nextRules = [...data.rules]
                    nextRules[index].property = e.target.value
                    updateNodeData(selectedNode.id, { rules: nextRules })
                  }}
                />
              </PropertyField>
              <PropertyField label="操作符">
                <select
                  value={rule.operator || 'eq'}
                  onChange={(e) => {
                    const nextRules = [...data.rules]
                    nextRules[index].operator = e.target.value
                    updateNodeData(selectedNode.id, { rules: nextRules })
                  }}
                >
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </PropertyField>
              <PropertyField label="比较值">
                <input
                  value={rule.value || ''}
                  onChange={(e) => {
                    const nextRules = [...data.rules]
                    nextRules[index].value = e.target.value
                    updateNodeData(selectedNode.id, { rules: nextRules })
                  }}
                />
              </PropertyField>
            </div>
          ))}
          <button
            className="ghost full-width"
            onClick={() => {
              const nextRules = [...(data.rules || []), { property: 'payload.status', operator: 'eq', value: '' }]
              updateNodeData(selectedNode.id, { rules: nextRules })
            }}
          >
            + 添加路由规则
          </button>
        </>
      ) : null}
    </aside>
  )
}

function LogsPanel() {
  const logs = useBlueprintStore((state) => state.logs)
  const validationErrors = useBlueprintStore((state) => state.validationErrors)

  return (
    <section className="blueprint-logs">
      <div className="blueprint-section-title">运行日志</div>
      {validationErrors.graph.length > 0 ? (
        <div className="graph-errors">
          {validationErrors.graph.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      ) : null}
      <div className="log-list">
        {logs.length === 0 ? <p className="empty-hint">运行后会在这里看到节点执行轨迹与错误日志。</p> : null}
        {logs.map((log) => (
          <article key={log.id} className={`log-item level-${log.level}`}>
            <header>
              <strong>{log.nodeId}</strong>
              <span>{new Date(log.ts).toLocaleTimeString()}</span>
            </header>
            {log.error ? <p className="log-error">{log.error}</p> : null}
            <pre>{JSON.stringify({ input: log.input, output: log.output }, null, 2)}</pre>
          </article>
        ))}
      </div>
    </section>
  )
}

function BlueprintCanvas() {
  const reactFlow = useReactFlow()
  const nodes = useBlueprintStore((state) => state.nodes)
  const edges = useBlueprintStore((state) => state.edges)
  const selectedNodeId = useBlueprintStore((state) => state.selectedNodeId)
  const nodeStatuses = useBlueprintStore((state) => state.nodeStatuses)
  const validationErrors = useBlueprintStore((state) => state.validationErrors)
  const onNodesChange = useBlueprintStore((state) => state.onNodesChange)
  const onEdgesChange = useBlueprintStore((state) => state.onEdgesChange)
  const onConnect = useBlueprintStore((state) => state.onConnect)
  const addNode = useBlueprintStore((state) => state.addNode)
  const setSelectedNode = useBlueprintStore((state) => state.setSelectedNode)
  const setViewport = useBlueprintStore((state) => state.setViewport)
  const storedViewport = useBlueprintStore((state) => state.viewport)

  useEffect(() => {
    reactFlow.setViewport(storedViewport)
  }, [reactFlow, storedViewport])

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
        data: {
          ...node.data,
          __status: nodeStatuses[node.id] || 'idle',
          __error: validationErrors.nodes[node.id]?.[0] || ''
        }
      })),
    [nodes, selectedNodeId, nodeStatuses, validationErrors]
  )

  return (
    <div
      className="blueprint-canvas"
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => {
        event.preventDefault()
        const type = event.dataTransfer.getData('application/reactflow')
        if (!type) {
          return
        }

        const position = reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        })
        addNode(type, position)
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onPaneClick={() => setSelectedNode(null)}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <MiniMap pannable zoomable />
        <Controls />
        <Background color="#a9bdd0" gap={22} />
      </ReactFlow>
    </div>
  )
}

function BlueprintWorkbench() {
  return (
    <div className="blueprint-panel">
      <Toolbar />
      <Palette />
      <BlueprintCanvas />
      <NodeInspector />
      <LogsPanel />
    </div>
  )
}

export function BlueprintPanel() {
  return (
    <ReactFlowProvider>
      <BlueprintWorkbench />
    </ReactFlowProvider>
  )
}
