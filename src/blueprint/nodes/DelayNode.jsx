import { NodeShell } from './NodeShell'

export function DelayNode({ data }) {
  return (
    <NodeShell
      badge="PROCESS"
      title={data.label || 'Delay'}
      subtitle="延迟消息向下游传递"
      color="#6366f1"
      status={data.__status}
      errorText={data.__error}
      fields={[
        { label: 'Delay', value: `${data.delayMs || 0}ms` }
      ]}
    />
  )
}
