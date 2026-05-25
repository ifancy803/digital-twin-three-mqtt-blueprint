import { NodeShell } from './NodeShell'

export function TimerNode({ data }) {
  const displayValue = data.mode === 'cron' ? data.cron : `${data.interval}ms`
  
  return (
    <NodeShell
      badge="INPUT"
      title={data.label || 'Timer'}
      subtitle="周期性或按 Cron 表达式触发"
      color="#0ea5e9"
      status={data.__status}
      errorText={data.__error}
      fields={[
        { label: 'Mode', value: data.mode === 'cron' ? 'Cron' : 'Interval' },
        { label: 'Schedule', value: displayValue }
      ]}
    />
  )
}
