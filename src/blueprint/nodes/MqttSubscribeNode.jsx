import { NodeShell } from './NodeShell'

export function MqttSubscribeNode({ data }) {
  return (
    <NodeShell
      badge="MQTT"
      title={data.label || 'MQTT Subscribe'}
      subtitle="收到消息后触发下游节点"
      color="#275efe"
      status={data.__status}
      errorText={data.__error}
      targetHandles={0}
      fields={[
        { label: 'Topic', value: data.topic || '-' },
        { label: 'QoS', value: String(data.qos ?? 0) }
      ]}
    />
  )
}
