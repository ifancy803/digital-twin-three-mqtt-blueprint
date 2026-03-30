import { create } from 'zustand'
import { addEdge, applyEdgeChanges, applyNodeChanges } from 'reactflow'
import { useTwinStore } from './twinStore'

const initialNodes = [
  {
    id: 'topic',
    type: 'topicNode',
    position: { x: 20, y: 80 },
    data: { topic: 'demo/digital-twin/device' }
  },
  {
    id: 'parse',
    type: 'transformNode',
    position: { x: 260, y: 80 },
    data: { label: 'JSON 解析', description: '把 MQTT 消息解析成设备对象' }
  },
  {
    id: 'map',
    type: 'transformNode',
    position: { x: 500, y: 80 },
    data: { label: '状态映射', description: '根据温度映射颜色与运行状态' }
  },
  {
    id: 'device',
    type: 'deviceNode',
    position: { x: 760, y: 80 },
    data: { deviceId: 'pump-001' }
  }
]

const initialEdges = [
  { id: 'e1', source: 'topic', target: 'parse', animated: true },
  { id: 'e2', source: 'parse', target: 'map', animated: true },
  { id: 'e3', source: 'map', target: 'device', animated: true }
]

export const useBlueprintStore = create((set, get) => ({
  nodes: [],
  edges: [],

  initialize: () => {
    set({
      nodes: initialNodes,
      edges: initialEdges
    })
  },

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes)
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges)
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge({ ...connection, animated: true }, state.edges)
    })),

  runGraph: () => {
    const selectedDeviceId = useTwinStore.getState().selectedDeviceId
    const payload = {
      id: selectedDeviceId,
      temperature: 88,
      status: 'alarm'
    }
    useTwinStore.getState().feed(payload)
    return get().edges.length
  }
}))
