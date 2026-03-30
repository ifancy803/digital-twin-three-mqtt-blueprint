import { useMemo } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { DeviceNode } from './nodes/DeviceNode'
import { TopicNode } from './nodes/TopicNode'
import { TransformNode } from './nodes/TransformNode'
import { useBlueprintStore } from '../store/blueprintStore'

const nodeTypes = {
  topicNode: TopicNode,
  transformNode: TransformNode,
  deviceNode: DeviceNode
}

export function BlueprintPanel() {
  const nodes = useBlueprintStore((state) => state.nodes)
  const edges = useBlueprintStore((state) => state.edges)
  const onNodesChange = useBlueprintStore((state) => state.onNodesChange)
  const onEdgesChange = useBlueprintStore((state) => state.onEdgesChange)
  const onConnect = useBlueprintStore((state) => state.onConnect)

  const flowNodes = useMemo(() => nodes, [nodes])

  return (
    <section className="panel blueprint-panel">
      <div className="panel-header">
        <h2>蓝图流程</h2>
        <p>当前实现为最小节点图，可继续扩展条件、告警、发布等节点</p>
      </div>
      <div className="flow-wrapper">
        <ReactFlow
          nodes={flowNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#9fb0c0" gap={24} />
          <Controls />
        </ReactFlow>
      </div>
    </section>
  )
}
