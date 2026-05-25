import { create } from 'zustand'
import { mqttService } from '../lib/mqttClient'

const defaultDevices = [
  {
    id: 'pump-001',
    name: '主泵 A1',
    temperature: 48,
    status: 'idle',
    color: '#5b8def',
    position: [-3, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    modelUrl: null // null 表示使用默认方块
  },
  {
    id: 'fan-002',
    name: '风机 B2',
    temperature: 36,
    status: 'idle',
    color: '#5b8def',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    modelUrl: null
  },
  {
    id: 'boiler-003',
    name: '锅炉 C3',
    temperature: 72,
    status: 'running',
    color: '#f6a04d',
    position: [3, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    modelUrl: null
  }
]

function colorByState(status, temperature, currentColor) {
  if (typeof currentColor === 'string' && currentColor.trim()) {
    return currentColor
  }

  if (status === 'alarm' || Number(temperature) >= 85) return '#db4f54'
  if (status === 'running' || Number(temperature) >= 55) return '#f6a04d'
  return '#5b8def'
}

function normalizeDevice(device) {
  return {
    ...device,
    color: colorByState(device.status, device.temperature, device.color)
  }
}

export const useTwinStore = create((set, get) => ({
  devices: defaultDevices.map(normalizeDevice),
  selectedDeviceId: 'pump-001',
  currentView: 'scene', // 'scene' | 'blueprint'
  lastMessage: null,
  mqtt: {
    url: 'ws://broker.emqx.io:8083/mqtt',
    connected: false,
    error: null,
    simulationTopic: 'devices/pump-001/status'
  },

  setView: (view) => set({ currentView: view }),

  selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),

  setMqttConfig: (next) =>
    set((state) => ({
      mqtt: {
        ...state.mqtt,
        ...next
      }
    })),

  setLastMessage: (message) => set({ lastMessage: message }),

  applyDevicePatch: ({ id, patch }) =>
    set((state) => ({
      devices: state.devices.map((device) => {
        if (device.id !== id) {
          return device
        }

        const nextDevice = {
          ...device,
          ...patch
        }

        return {
          ...nextDevice,
          color: colorByState(nextDevice.status, nextDevice.temperature, nextDevice.color)
        }
      })
    })),

  updateDeviceProperty: ({ id, property, value }) => {
    if (!id || property == null) {
      return
    }

    const patch =
      property === 'position' && Array.isArray(value)
        ? { position: value }
        : {
            [property]: value
          }

    get().applyDevicePatch({ id, patch })
  },

  feed: (payload) => {
    if (!payload?.id) {
      return
    }

    set({
      lastMessage: {
        topic: 'manual/feed',
        payload,
        timestamp: Date.now()
      }
    })
    get().applyDevicePatch({ id: payload.id, patch: payload })
  },

  connectMqtt: () => {
    const { url } = get().mqtt

    if (!url || !url.trim()) {
      set((state) => ({
        mqtt: {
          ...state.mqtt,
          error: 'MQTT WebSocket URL 不能为空'
        }
      }))
      return
    }

    try {
      mqttService.connect({ url }, (status) => {
        set((state) => ({
          mqtt: {
            ...state.mqtt,
            ...status
          }
        }))
      })
    } catch (err) {
      set((state) => ({
        mqtt: {
          ...state.mqtt,
          connected: false,
          error: `连接失败: ${err.message}`
        }
      }))
    }
  },

  disconnectMqtt: () => {
    mqttService.disconnect()
    set((state) => ({
      mqtt: {
        ...state.mqtt,
        connected: false
      }
    }))
  }
}))
