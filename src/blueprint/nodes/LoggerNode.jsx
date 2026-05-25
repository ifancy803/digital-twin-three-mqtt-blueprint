import { NodeShell } from './NodeShell'

export function LoggerNode({ data }) {
  return (
    <NodeShell
      badge="DEBUG"
      title={data.label || 'Logger'}
      subtitle="把消息输出到日志面板"
      color="#0f766e"
      status={data.__status}
      errorText={data.__error}
      fields={[{ label: 'Output', value: '输入 / 输出 / 错误' }]}
    />
  )
}
