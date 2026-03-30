import { Handle, Position } from 'reactflow'

export function DeviceNode({ data }) {
  return (
    <div className="flow-node output">
      <Handle type="target" position={Position.Left} />
      <span className="flow-type">Scene</span>
      <strong>更新设备</strong>
      <p>{data.deviceId}</p>
    </div>
  )
}
