import { NodeShell } from './NodeShell'

export function InjectNode({ data }) {
  return (
    <NodeShell
      badge="INPUT"
      title={data.label || 'Inject'}
      subtitle="点击 Run 时从这里开始注入测试消息"
      color="#00a37a"
      status={data.__status}
      errorText={data.__error}
      targetHandles={0}
      fields={[{ label: 'Payload', value: 'JSON 消息' }]}
    />
  )
}
