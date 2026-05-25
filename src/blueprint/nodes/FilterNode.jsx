import { NodeShell } from './NodeShell'

export function FilterNode({ data }) {
  return (
    <NodeShell
      badge="LOGIC"
      title={data.label || 'Filter'}
      subtitle="条件不通过时中断当前分支"
      color="#8b5cf6"
      status={data.__status}
      errorText={data.__error}
      fields={[
        { label: 'Field', value: data.fieldPath || '-' },
        { label: 'Rule', value: `${data.operator || 'eq'} ${data.compareValue || ''}` }
      ]}
    />
  )
}
