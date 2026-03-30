import { create } from 'zustand'
import { createMqttService } from '../lib/mqttClient'

const defaultDevices = [
  {
    id: 'pump-001',
    name: '主泵 A1',
    temperature: 48,
    status: 'idle',
    color: '#5b8def',
    position: [-3, 0, 0]
  },
  {
    id: 'fan-002',
    name: '风机 B2',
    temperature: 36,
    status: 'idle',
    color: '#5b8def',
    position: [0, 0, 0]
  },
  {
    id: 'boiler-003',
    name: '锅炉 C3',
    temperature: 72,
    status: 'running',
    color: '#f6a04d',
    position: [3, 0, 0]
  }
]

function colorByState(status, temperature) {
  if (status === 'alarm' || temperature >= 85) return '#db4f54'
  if (status === 'running' || temperature >= 55) return '#f6a04d'
  return '#5b8def'
}

let mqttService

export const useTwinStore = create((set, get) => ({
  devices: defaultDevices,
  selectedDeviceId: 'pump-001',
  lastMessage: null,
  mqtt: {
    url: 'ws://broker.emqx.io:8083/mqtt',
    topic: 'demo/digital-twin/device',
    connected: false,
    error: null
  },

  selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),

  setMqttConfig: (next) =>
    set((state) => ({
      mqtt: {
        ...state.mqtt,
        ...next
      }
    })),

  applyDeviceUpdate: ({ id, temperature, status }) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id
          ? {
              ...device,
              temperature: temperature ?? device.temperature,
              status: status ?? device.status,
              color: colorByState(status ?? device.status, temperature ?? device.temperature)
            }
          : device
      )
    })),

  feed: (payload) => {
    set({ lastMessage: payload })
    get().applyDeviceUpdate(payload)
  },

  connectMqtt: () => {
    mqttService?.disconnect()
    const { url, topic } = get().mqtt
    mqttService = createMqttService({
      url,
      topic,
      onMessage: (payload) => get().feed(payload),
      onStatus: (status) =>
        set((state) => ({
          mqtt: {
            ...state.mqtt,
            ...status
          }
        }))
    })
    mqttService.connect()
  },

  disconnectMqtt: () => {
    mqttService?.disconnect()
    set((state) => ({
      mqtt: {
        ...state.mqtt,
        connected: false
      }
    }))
  }
}))
