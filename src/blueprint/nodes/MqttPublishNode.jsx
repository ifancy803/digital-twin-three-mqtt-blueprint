import { NodeShell } from './NodeShell'

export function MqttPublishNode({ data }) {
  return (
    <NodeShell
      badge="MQTT"
      title={data.label || 'MQTT Publish'}
      subtitle="发布一条新的 MQTT 消息"
      color="#275efe"
      status={data.__status}
      errorText={data.__error}
      fields={[
        { label: 'Topic', value: data.topic || '-' },
        { label: 'Retain', value: data.retain ? 'Yes' : 'No' }
      ]}
    />
  )
}
