import { Handle, Position } from 'reactflow'

const STATUS_LABELS = {
  idle: '待命',
  running: '运行中',
  success: '成功',
  error: '错误'
}

export function NodeShell({
  title,
  subtitle,
  badge,
  color,
  status,
  errorText,
  fields = [],
  sourceHandles = 1,
  targetHandles = 1
}) {
  return (
    <div className={`blueprint-node status-${status || 'idle'} ${errorText ? 'has-error' : ''}`}>
      {targetHandles > 0 ? <Handle type="target" position={Position.Left} /> : null}
      <div className="blueprint-node-header" style={{ '--node-accent': color }}>
        <span className="blueprint-node-badge">{badge}</span>
        <strong>{title}</strong>
        <span className="blueprint-node-status">{STATUS_LABELS[status || 'idle'] || '待命'}</span>
      </div>
      <p className="blueprint-node-subtitle">{subtitle}</p>
      <div className="blueprint-node-fields">
        {fields.map((field) => (
          <span key={field.label}>
            <b>{field.label}:</b> {field.value}
          </span>
        ))}
      </div>
      {errorText ? <p className="blueprint-node-error">{errorText}</p> : null}
      {sourceHandles > 0 ? (
        Array.from({ length: sourceHandles }).map((_, i) => (
          <Handle
            key={`source-${i}`}
            type="source"
            position={Position.Right}
            id={`source-${i}`}
            style={{ 
              top: sourceHandles > 1 ? `${(i + 1) * (100 / (sourceHandles + 1))}%` : '50%' 
            }}
          />
        ))
      ) : null}
    </div>
  )
}
