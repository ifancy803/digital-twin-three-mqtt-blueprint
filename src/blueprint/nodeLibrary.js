const baseNodeStyle = {
  width: 240
}

export const NODE_LIBRARY = [
  {
    type: 'mqtt-subscribe',
    title: 'MQTT 订阅',
    group: 'MQTT',
    color: '#275efe',
    description: '订阅一个 MQTT Topic，并在消息到达时触发下游流程。',
    defaultData: {
      label: '订阅设备状态',
      topic: 'devices/+/status',
      qos: 0
    }
  },
  {
    type: 'mqtt-publish',
    title: 'MQTT 发布',
    group: 'MQTT',
    color: '#275efe',
    description: '根据上游消息发布新的 MQTT 消息。',
    defaultData: {
      label: '发布控制命令',
      topic: 'devices/{{payload.id}}/command',
      payloadTemplate: '{\n  "command": "ack",\n  "source": "blueprint"\n}',
      qos: 0,
      retain: false
    }
  },
  {
    type: 'inject',
    title: '手动注入',
    group: '输入',
    color: '#00a37a',
    description: '手动运行时注入测试消息。',
    defaultData: {
      label: '手动注入',
      payloadText: '{\n  "id": "pump-001",\n  "temperature": 88,\n  "status": "alarm",\n  "color": "#db4f54"\n}'
    }
  },
  {
    type: 'filter',
    title: '条件过滤',
    group: '逻辑',
    color: '#8b5cf6',
    description: '按字段路径和条件筛选消息。',
    defaultData: {
      label: '过滤高温消息',
      fieldPath: 'payload.temperature',
      operator: 'gte',
      compareValue: '80'
    }
  },
  {
    type: 'map',
    title: '数据映射',
    group: '逻辑',
    color: '#8b5cf6',
    description: '根据路径映射构造新的 payload 对象。',
    defaultData: {
      label: '映射设备补丁',
      mappingsText:
        '{\n  "id": "payload.id",\n  "temperature": "payload.temperature",\n  "status": "payload.status",\n  "color": "payload.color"\n}'
    }
  },
  {
    type: 'update-device',
    title: '更新 3D 设备',
    group: '动作',
    color: '#f59e0b',
    description: '更新受控设备属性并驱动 3D 场景。',
    defaultData: {
      label: '更新设备状态',
      deviceId: '',
      property: 'status',
      valuePath: 'payload.status'
    }
  },
  {
    type: 'logger',
    title: '日志输出',
    group: '调试',
    color: '#0f766e',
    description: '输出当前消息到日志面板。',
    defaultData: {
      label: '记录日志'
    }
  },
  {
    type: 'timer',
    title: '定时器',
    group: '输入',
    color: '#0ea5e9',
    description: '周期性触发流程，支持 Cron 表达式或简单间隔。',
    defaultData: {
      label: '定时触发',
      mode: 'interval', // interval | cron
      interval: 5000,
      cron: '0 * * * * *'
    }
  },
  {
    type: 'delay',
    title: '延迟',
    group: '高级',
    color: '#6366f1',
    description: '延迟指定时间后继续执行。',
    defaultData: {
      label: '延迟 2秒',
      delayMs: 2000
    }
  },
  {
    type: 'switch',
    title: '多路分支',
    group: '逻辑',
    color: '#8b5cf6',
    description: '根据条件将消息路由到不同的输出端口。',
    defaultData: {
      label: '路由分支',
      rules: [
        { operator: 'eq', property: 'payload.status', value: 'alarm' },
        { operator: 'eq', property: 'payload.status', value: 'running' }
      ]
    }
  }
]

export const NODE_LIBRARY_BY_TYPE = Object.fromEntries(NODE_LIBRARY.map((item) => [item.type, item]))

export function createBlueprintNode(type, position = { x: 0, y: 0 }) {
  const definition = NODE_LIBRARY_BY_TYPE[type]
  if (!definition) {
    throw new Error(`Unknown node type: ${type}`)
  }

  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    position,
    style: baseNodeStyle,
    data: {
      ...definition.defaultData
    }
  }
}

export function createDefaultBlueprintDocument() {
  return {
    nodes: [
      {
        id: 'inject-sample',
        type: 'inject',
        position: { x: 60, y: 60 },
        style: baseNodeStyle,
        data: {
          label: '注入测试数据',
          payloadText: '{\n  "id": "pump-001",\n  "temperature": 92,\n  "status": "alarm",\n  "color": "#db4f54"\n}'
        }
      },
      {
        id: 'map-sample',
        type: 'map',
        position: { x: 340, y: 60 },
        style: baseNodeStyle,
        data: {
          label: '构建设备补丁',
          mappingsText:
            '{\n  "id": "payload.id",\n  "temperature": "payload.temperature",\n  "status": "payload.status",\n  "color": "payload.color"\n}'
        }
      },
      {
        id: 'update-temp',
        type: 'update-device',
        position: { x: 640, y: 10 },
        style: baseNodeStyle,
        data: {
          label: '更新温度',
          deviceId: '',
          property: 'temperature',
          valuePath: 'payload.temperature'
        }
      },
      {
        id: 'update-status',
        type: 'update-device',
        position: { x: 640, y: 120 },
        style: baseNodeStyle,
        data: {
          label: '更新状态',
          deviceId: '',
          property: 'status',
          valuePath: 'payload.status'
        }
      },
      {
        id: 'logger-sample',
        type: 'logger',
        position: { x: 940, y: 60 },
        style: baseNodeStyle,
        data: {
          label: '查看输出'
        }
      },
      {
        id: 'subscribe-sample',
        type: 'mqtt-subscribe',
        position: { x: 60, y: 280 },
        style: baseNodeStyle,
        data: {
          label: '订阅设备状态',
          topic: 'devices/+/status',
          qos: 0
        }
      },
      {
        id: 'filter-sample',
        type: 'filter',
        position: { x: 340, y: 280 },
        style: baseNodeStyle,
        data: {
          label: '只处理高温',
          fieldPath: 'payload.temperature',
          operator: 'gte',
          compareValue: '80'
        }
      },
      {
        id: 'update-color',
        type: 'update-device',
        position: { x: 640, y: 280 },
        style: baseNodeStyle,
        data: {
          label: '更新颜色',
          deviceId: '',
          property: 'color',
          valuePath: 'payload.color'
        }
      },
      {
        id: 'publish-ack',
        type: 'mqtt-publish',
        position: { x: 640, y: 390 },
        style: baseNodeStyle,
        data: {
          label: '发布确认消息',
          topic: 'devices/{{payload.id}}/command',
          payloadTemplate: '{\n  "command": "ack",\n  "level": "{{payload.status}}"\n}',
          qos: 0,
          retain: false
        }
      }
    ],
    edges: [
      { id: 'edge-inject-map', source: 'inject-sample', target: 'map-sample', animated: true },
      { id: 'edge-map-temp', source: 'map-sample', target: 'update-temp', animated: true },
      { id: 'edge-temp-status', source: 'update-temp', target: 'update-status', animated: true },
      { id: 'edge-status-logger', source: 'update-status', target: 'logger-sample', animated: true },
      { id: 'edge-subscribe-filter', source: 'subscribe-sample', target: 'filter-sample', animated: true },
      { id: 'edge-filter-color', source: 'filter-sample', target: 'update-color', animated: true },
      { id: 'edge-filter-publish', source: 'filter-sample', target: 'publish-ack', animated: true }
    ],
    viewport: { x: 0, y: 0, zoom: 0.8 },
    metadata: {
      name: '默认数字孪生蓝图',
      version: '1.0.0',
      updatedAt: new Date().toISOString()
    }
  }
}
