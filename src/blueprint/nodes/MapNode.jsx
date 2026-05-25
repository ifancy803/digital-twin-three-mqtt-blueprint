import { NodeShell } from './NodeShell'

export function MapNode({ data }) {
  return (
    <NodeShell
      badge="LOGIC"
      title={data.label || 'Map'}
      subtitle="把输入消息映射成新的 payload 对象"
      color="#8b5cf6"
      status={data.__status}
      errorText={data.__error}
      fields={[{ label: 'Mappings', value: 'JSON 路径映射' }]}
    />
  )
}
