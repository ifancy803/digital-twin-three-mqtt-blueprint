import mqtt from 'mqtt'

class MqttBlueprintService {
  constructor() {
    this.client = null
    this.statusHandler = () => {}
    this.messageHandler = () => {}
    this.blueprintTopics = new Set()
    this.activeSubscriptions = new Set()
    this.currentConfig = null
  }

  connect(config = {}, onStatus) {
    this.disconnect()

    const url = config.url?.trim()
    if (!url) {
      throw new Error('MQTT WS 地址不能为空。')
    }

    this.currentConfig = { ...config, url }
    this.statusHandler = typeof onStatus === 'function' ? onStatus : this.statusHandler
    this.client = mqtt.connect(url, {
      reconnectPeriod: 3000
    })

    this.client.on('connect', () => {
      this.statusHandler({ connected: true, error: null })
      this.syncSubscriptions()
    })

    this.client.on('message', (topic, payload) => {
      const text = payload.toString()
      let parsedPayload

      try {
        parsedPayload = JSON.parse(text)
      } catch {
        parsedPayload = text
      }

      this.messageHandler({
        topic,
        payload: parsedPayload,
        rawPayload: text,
        timestamp: Date.now()
      })
    })

    this.client.on('error', (error) => {
      this.statusHandler({ connected: false, error: error.message })
    })

    this.client.on('close', () => {
      this.statusHandler({ connected: false })
      this.activeSubscriptions.clear()
    })
  }

  disconnect() {
    if (this.client) {
      this.client.end(true)
    }

    this.client = null
    this.activeSubscriptions.clear()
  }

  setMessageHandler(handler) {
    this.messageHandler = typeof handler === 'function' ? handler : () => {}
  }

  subscribeBlueprintTopics(topics = []) {
    this.blueprintTopics = new Set(topics.filter(Boolean))
    this.syncSubscriptions()
  }

  unsubscribeBlueprintTopics(topics) {
    if (Array.isArray(topics) && topics.length > 0) {
      topics.forEach((topic) => this.blueprintTopics.delete(topic))
    } else {
      this.blueprintTopics.clear()
    }

    this.syncSubscriptions()
  }

  async publish({ topic, payload, qos = 0, retain = false }) {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT 尚未连接，无法发布消息。')
    }

    const serialized =
      typeof payload === 'string' ? payload : payload == null ? '' : JSON.stringify(payload, null, 2)

    return new Promise((resolve, reject) => {
      this.client.publish(topic, serialized, { qos, retain }, (error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  syncSubscriptions() {
    if (!this.client || !this.client.connected) {
      return
    }

    const nextTopics = Array.from(this.blueprintTopics)
    const currentTopics = Array.from(this.activeSubscriptions)
    const removedTopics = currentTopics.filter((topic) => !this.blueprintTopics.has(topic))
    const addedTopics = nextTopics.filter((topic) => !this.activeSubscriptions.has(topic))

    removedTopics.forEach((topic) => {
      this.client.unsubscribe(topic)
      this.activeSubscriptions.delete(topic)
    })

    addedTopics.forEach((topic) => {
      this.client.subscribe(topic)
      this.activeSubscriptions.add(topic)
    })
  }
}

export const mqttService = new MqttBlueprintService()
