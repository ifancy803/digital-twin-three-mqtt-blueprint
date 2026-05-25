import { NodeShell } from './NodeShell'

export function SwitchNode({ data }) {
  const rules = data.rules || []
  
  return (
    <NodeShell
      badge="LOGIC"
      title={data.label || 'Switch'}
      subtitle="多路条件分支路由"
      color="#8b5cf6"
      status={data.__status}
      errorText={data.__error}
      sourceHandles={rules.length + 1} // 最后一个是 default/else
      fields={rules.map((rule, index) => ({
        label: `Output ${index}`,
        value: `${rule.property} ${rule.operator} ${rule.value}`
      })).concat([{ label: 'Output Else', value: 'Default' }])}
    />
  )
}
