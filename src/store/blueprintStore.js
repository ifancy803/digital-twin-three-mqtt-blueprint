import { create } from 'zustand'
import { addEdge, applyEdgeChanges, applyNodeChanges } from 'reactflow'
import { mqttService } from '../lib/mqttClient'
import { runBlueprintTrigger } from '../blueprint/executionEngine'
import {
  BLUEPRINT_STORAGE_KEY,
  collectSubscriptionTopics,
  matchMqttTopic,
  normalizeBlueprintDocument,
  validateBlueprint
} from '../blueprint/blueprintUtils'
import { createBlueprintNode, createDefaultBlueprintDocument } from '../blueprint/nodeLibrary'
import { useTwinStore } from './twinStore'

const MAX_LOGS = 200

function createMetadata(name) {
  return {
    name,
    version: '1.0.0',
    updatedAt: new Date().toISOString()
  }
}

function withUpdatedMetadata(state, patch) {
  return {
    ...state,
    ...patch,
    metadata: {
      ...(patch.metadata || state.metadata),
      updatedAt: new Date().toISOString()
    }
  }
}

export const useBlueprintStore = create((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  metadata: createMetadata('默认数字孪生蓝图'),
  selectedNodeId: null,
  isRunning: false,
  nodeStatuses: {},
  logs: [],
  validationErrors: {
    graph: [],
    nodes: {}
  },
  activeRunId: 0,
  cleanupFn: null,
  initialized: false,

  initialize: () => {
    if (get().initialized) {
      return
    }

    mqttService.setMessageHandler((event) => {
      get().handleIncomingMqttMessage(event)
    })

    const saved = window.localStorage.getItem(BLUEPRINT_STORAGE_KEY)
    const document = saved ? normalizeBlueprintDocument(JSON.parse(saved)) : createDefaultBlueprintDocument()

    set({
      ...document,
      validationErrors: validateBlueprint(document.nodes, document.edges).errors,
      initialized: true
    })

    get().syncMqttSubscriptions()
  },

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId ?? null }),

  addNode: (type, position) => {
    const node = createBlueprintNode(type, position)
    set((state) =>
      withUpdatedMetadata(state, {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id
      })
    )
    get().syncMqttSubscriptions()
    get().validateBlueprint()
  },

  updateNodeData: (id, patch) => {
    set((state) =>
      withUpdatedMetadata(state, {
        nodes: state.nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch
                }
              }
            : node
        )
      })
    )
    get().syncMqttSubscriptions()
    get().validateBlueprint()
  },

  onNodesChange: (changes) => {
    set((state) =>
      withUpdatedMetadata(state, {
        nodes: applyNodeChanges(changes, state.nodes)
      })
    )
    get().syncMqttSubscriptions()
    get().validateBlueprint()
  },

  onEdgesChange: (changes) => {
    set((state) =>
      withUpdatedMetadata(state, {
        edges: applyEdgeChanges(changes, state.edges)
      })
    )
    get().validateBlueprint()
  },

  onConnect: (connection) => {
    set((state) =>
      withUpdatedMetadata(state, {
        edges: addEdge(
          {
            ...connection,
            animated: true
          },
          state.edges
        )
      })
    )
    get().validateBlueprint()
  },

  setViewport: (viewport) => set({ viewport }),

  clearBlueprint: () => {
    const cleared = {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      metadata: createMetadata('空白蓝图')
    }
    set({
      ...cleared,
      selectedNodeId: null,
      nodeStatuses: {},
      validationErrors: validateBlueprint(cleared.nodes, cleared.edges).errors
    })
    get().syncMqttSubscriptions()
  },

  clearLogs: () => set({ logs: [] }),

  addLog: (entry) =>
    set((state) => ({
      logs: [entry, ...state.logs].slice(0, MAX_LOGS)
    })),

  setNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodeStatuses: {
        ...state.nodeStatuses,
        [nodeId]: status
      }
    })),

  resetNodeStatuses: () => {
    const nextStatuses = Object.fromEntries(get().nodes.map((node) => [node.id, 'idle']))
    set({ nodeStatuses: nextStatuses })
  },

  validateBlueprint: () => {
    const { nodes, edges } = get()
    const result = validateBlueprint(nodes, edges)
    set({ validationErrors: result.errors })
    return result
  },

  syncMqttSubscriptions: () => {
    const topics = collectSubscriptionTopics(get().nodes)
    mqttService.subscribeBlueprintTopics(topics)
  },

  stopBlueprint: () => {
    const { cleanupFn } = get()
    if (cleanupFn) {
      cleanupFn()
    }
    set((state) => ({
      isRunning: false,
      activeRunId: state.activeRunId + 1,
      cleanupFn: null
    }))
    get().resetNodeStatuses()
  },

  runBlueprint: async () => {
    const validation = get().validateBlueprint()
    if (!validation.isValid) {
      get().addLog({
        id: `validation-${Date.now()}`,
        ts: new Date().toISOString(),
        nodeId: 'graph',
        level: 'error',
        input: null,
        output: null,
        error: '蓝图校验未通过，运行已取消。'
      })
      return false
    }

    get().stopBlueprint()

    const sourceNodeIds = get()
      .nodes.filter((node) => node.type === 'inject' || node.type === 'timer')
      .map((node) => node.id)

    const nextRunId = get().activeRunId + 1

    set({
      isRunning: true,
      activeRunId: nextRunId
    })
    get().resetNodeStatuses()
    get().syncMqttSubscriptions()

    if (sourceNodeIds.length === 0) {
      get().addLog({
        id: `run-${Date.now()}`,
        ts: new Date().toISOString(),
        nodeId: 'graph',
        level: 'info',
        input: null,
        output: null,
        error: '蓝图已进入运行状态，等待 MQTT 触发。'
      })
      return true
    }

    const cleanup = await runBlueprintTrigger({
      sourceNodeIds,
      initialMessage: {
        payload: null,
        timestamp: Date.now(),
        meta: {
          trigger: 'inject'
        }
      },
      nodes: get().nodes,
      edges: get().edges,
      isRunActive: () => {
        const state = get()
        return state.isRunning && state.activeRunId === nextRunId
      },
      setNodeStatus: get().setNodeStatus,
      addLog: get().addLog,
      publishMessage: mqttService.publish.bind(mqttService),
      updateDevice: ({ id, property, value }) =>
        useTwinStore.getState().updateDeviceProperty({
          id,
          property,
          value
        }),
      getSelectedDeviceId: () => useTwinStore.getState().selectedDeviceId,
      shouldStartTimers: true // 只有主启动流程才开启定时器
    })

    set({ cleanupFn: cleanup })

    return true
  },

  handleIncomingMqttMessage: async (event) => {
    useTwinStore.getState().setLastMessage(event)

    if (!get().isRunning) {
      return
    }

    const matchingNodes = get().nodes.filter(
      (node) => node.type === 'mqtt-subscribe' && matchMqttTopic(node.data.topic, event.topic)
    )

    if (matchingNodes.length === 0) {
      return
    }

    const runId = get().activeRunId

    await runBlueprintTrigger({
      sourceNodeIds: matchingNodes.map((node) => node.id),
      initialMessage: {
        payload: event.payload,
        topic: event.topic,
        timestamp: event.timestamp,
        meta: {
          trigger: 'mqtt'
        }
      },
      nodes: get().nodes,
      edges: get().edges,
      isRunActive: () => {
        const state = get()
        return state.isRunning && state.activeRunId === runId
      },
      setNodeStatus: get().setNodeStatus,
      addLog: get().addLog,
      publishMessage: mqttService.publish.bind(mqttService),
      updateDevice: ({ id, property, value }) =>
        useTwinStore.getState().updateDeviceProperty({
          id,
          property,
          value
        }),
      getSelectedDeviceId: () => useTwinStore.getState().selectedDeviceId
    })
  },

  simulateMqttMessage: (topic, payload) => {
    const event = {
      topic,
      payload,
      rawPayload: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      timestamp: Date.now()
    }
    get().handleIncomingMqttMessage(event)
  },

  saveBlueprintToLocal: () => {
    const { nodes, edges, viewport, metadata } = get()
    const document = {
      nodes,
      edges,
      viewport,
      metadata: {
        ...metadata,
        updatedAt: new Date().toISOString()
      }
    }
    window.localStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify(document, null, 2))
    set({ metadata: document.metadata })
    return document
  },

  loadBlueprintFromLocal: () => {
    const saved = window.localStorage.getItem(BLUEPRINT_STORAGE_KEY)
    if (!saved) {
      return false
    }

    const document = normalizeBlueprintDocument(JSON.parse(saved))
    set({
      ...document,
      selectedNodeId: null
    })
    get().syncMqttSubscriptions()
    get().validateBlueprint()
    return true
  },

  exportBlueprint: () => {
    const { nodes, edges, viewport, metadata } = get()
    return JSON.stringify(
      {
        nodes,
        edges,
        viewport,
        metadata: {
          ...metadata,
          updatedAt: new Date().toISOString()
        }
      },
      null,
      2
    )
  },

  importBlueprint: (jsonText) => {
    const parsed = normalizeBlueprintDocument(JSON.parse(jsonText))
    set({
      ...parsed,
      selectedNodeId: null
    })
    get().syncMqttSubscriptions()
    get().validateBlueprint()
    return true
  }
}))
