import { useMemo, useState } from 'react'
import { useBlueprintStore } from '../store/blueprintStore'
import { useTwinStore } from '../store/twinStore'

const samplePayloads = [
  {
    id: 'pump-001',
    temperature: 62,
    status: 'running',
    color: '#f6a04d'
  },
  {
    id: 'pump-001',
    temperature: 91,
    status: 'alarm',
    color: '#db4f54'
  },
  {
    id: 'fan-002',
    temperature: 38,
    status: 'idle',
    color: '#5b8def'
  }
]

export function ControlPanel() {
  const [payloadIndex, setPayloadIndex] = useState(0)
  const mqttConnected = useTwinStore((state) => state.mqtt.connected)
  const mqttUrl = useTwinStore((state) => state.mqtt.url)
  const simulationTopic = useTwinStore((state) => state.mqtt.simulationTopic)
  const mqttError = useTwinStore((state) => state.mqtt.error)
  const lastMessage = useTwinStore((state) => state.lastMessage)
  const setMqttConfig = useTwinStore((state) => state.setMqttConfig)
  const connectMqtt = useTwinStore((state) => state.connectMqtt)
  const disconnectMqtt = useTwinStore((state) => state.disconnectMqtt)
  const simulateMqttMessage = useBlueprintStore((state) => state.simulateMqttMessage)
  const runBlueprint = useBlueprintStore((state) => state.runBlueprint)
  const stopBlueprint = useBlueprintStore((state) => state.stopBlueprint)
  const isRunning = useBlueprintStore((state) => state.isRunning)

  const currentPayload = useMemo(() => samplePayloads[payloadIndex], [payloadIndex])

  return (
    <section className="panel control-panel">
      <div className="panel-header">
        <h2>运行控制</h2>
        <p>MQTT 连接只负责链路，真正的订阅列表由蓝图中的 Subscribe 节点动态决定。</p>
      </div>

      <div className="field-grid">
        <label>
          MQTT WebSocket 地址
          <input value={mqttUrl} onChange={(event) => setMqttConfig({ url: event.target.value })} />
        </label>
        <label>
          模拟注入 Topic
          <input
            value={simulationTopic}
            onChange={(event) => setMqttConfig({ simulationTopic: event.target.value })}
          />
        </label>
      </div>

      <div className="button-row">
        <button onClick={connectMqtt} className="primary">
          {mqttConnected ? '重新连接 MQTT' : '连接 MQTT'}
        </button>
        <button onClick={disconnectMqtt} className="ghost">
          断开 MQTT
        </button>
        <button onClick={() => runBlueprint()} className="ghost">
          {isRunning ? '重新运行蓝图' : '运行蓝图'}
        </button>
        <button onClick={() => stopBlueprint()} className="ghost">
          停止蓝图
        </button>
      </div>

      <div className="mqtt-status">
        <span className={`pill ${mqttConnected ? 'online' : 'offline'}`}>{mqttConnected ? 'Connected' : 'Offline'}</span>
        <span className={`pill ${isRunning ? 'running' : 'idle'}`}>{isRunning ? 'Blueprint Running' : 'Blueprint Idle'}</span>
      </div>

      {mqttError ? <p className="inline-error">{mqttError}</p> : null}

      <div className="simulator">
        <div>
          <p className="section-title">模拟 MQTT 消息</p>
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
            simulateMqttMessage(simulationTopic, currentPayload)
          }}
        >
          注入到蓝图
        </button>
      </div>

      <div className="message-box">
        <p className="section-title">最近消息</p>
        <pre>{lastMessage ? JSON.stringify(lastMessage, null, 2) : '暂无消息'}</pre>
      </div>
    </section>
  )
}
