import { Handle, Position } from 'reactflow'

export function TransformNode({ data }) {
  return (
    <div className="flow-node">
      <Handle type="target" position={Position.Left} />
      <span className="flow-type">Logic</span>
      <strong>{data.label}</strong>
      <p>{data.description}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
