import { NodeShell } from './NodeShell'

export function UpdateDeviceNode({ data }) {
  return (
    <NodeShell
      badge="ACTION"
      title={data.label || 'Update 3D Device'}
      subtitle="更新设备受控属性并驱动 three.js 场景"
      color="#f59e0b"
      status={data.__status}
      errorText={data.__error}
      fields={[
        { label: 'Device', value: data.deviceId || '当前选中设备' },
        { label: 'Property', value: data.property || '-' },
        { label: 'Value', value: data.valuePath || '-' }
      ]}
    />
  )
}
