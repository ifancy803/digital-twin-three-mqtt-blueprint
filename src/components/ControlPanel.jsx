import { useMemo, useState } from 'react'
import { useTwinStore } from '../store/twinStore'

const samplePayloads = [
  {
    id: 'pump-001',
    temperature: 62,
    status: 'running'
  },
  {
    id: 'pump-001',
    temperature: 91,
    status: 'alarm'
  },
  {
    id: 'fan-002',
    temperature: 38,
    status: 'idle'
  }
]

export function ControlPanel({ onSimulate, onRunGraph }) {
  const [payloadIndex, setPayloadIndex] = useState(0)
  const mqttConnected = useTwinStore((state) => state.mqtt.connected)
  const mqttUrl = useTwinStore((state) => state.mqtt.url)
  const mqttTopic = useTwinStore((state) => state.mqtt.topic)
  const lastMessage = useTwinStore((state) => state.lastMessage)
  const setMqttConfig = useTwinStore((state) => state.setMqttConfig)
  const connectMqtt = useTwinStore((state) => state.connectMqtt)
  const disconnectMqtt = useTwinStore((state) => state.disconnectMqtt)

  const currentPayload = useMemo(() => samplePayloads[payloadIndex], [payloadIndex])

  return (
    <section className="panel control-panel">
      <div className="panel-header">
        <h2>运行控制</h2>
        <p>先跑通模拟数据，再接入真实 MQTT Broker</p>
      </div>

      <div className="field-grid">
        <label>
          MQTT WS 地址
          <input value={mqttUrl} onChange={(event) => setMqttConfig({ url: event.target.value })} />
        </label>
        <label>
          Topic
          <input value={mqttTopic} onChange={(event) => setMqttConfig({ topic: event.target.value })} />
        </label>
      </div>

      <div className="button-row">
        <button onClick={connectMqtt} className="primary">
          {mqttConnected ? '重新连接' : '连接 MQTT'}
        </button>
        <button onClick={disconnectMqtt} className="ghost">
          断开
        </button>
        <button onClick={onRunGraph} className="ghost">
          运行蓝图
        </button>
      </div>

      <div className="simulator">
        <div>
          <p className="section-title">模拟消息</p>
          <select value={payloadIndex} onChange={(event) => setPayloadIndex(Number(event.target.value))}>
            {samplePayloads.map((payload, index) => (
              <option key={`${payload.id}-${index}`} value={index}>
                {payload.id} / {payload.status} / {payload.temperature}°C
              </option>
            ))}
          </select>
        </div>
        <button
          className="primary"
          onClick={() => {
            onSimulate(currentPayload)
          }}
        >
          注入场景
        </button>
      </div>

      <div className="message-box">
        <p className="section-title">最近消息</p>
        <pre>{lastMessage ? JSON.stringify(lastMessage, null, 2) : '暂无消息'}</pre>
      </div>
    </section>
  )
}
