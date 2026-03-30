import mqtt from 'mqtt'

export function createMqttService({ url, topic, onMessage, onStatus }) {
  let client

  const connect = () => {
    if (!url) return

    client = mqtt.connect(url, {
      reconnectPeriod: 3000
    })

    client.on('connect', () => {
      onStatus({ connected: true, error: null })
      if (topic) {
        client.subscribe(topic)
      }
    })

    client.on('message', (_, payload) => {
      const text = payload.toString()
      try {
        onMessage(JSON.parse(text))
      } catch {
        onMessage({ raw: text })
      }
    })

    client.on('error', (error) => {
      onStatus({ connected: false, error: error.message })
    })

    client.on('close', () => {
      onStatus({ connected: false })
    })
  }

  const disconnect = () => {
    client?.end(true)
    client = undefined
  }

  return { connect, disconnect }
}
