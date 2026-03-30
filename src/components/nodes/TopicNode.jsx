import { Handle, Position } from 'reactflow'

export function TopicNode({ data }) {
  return (
    <div className="flow-node">
      <span className="flow-type">MQTT</span>
      <strong>订阅 Topic</strong>
      <p>{data.topic}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
