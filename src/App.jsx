import { useEffect } from 'react'
import { BlueprintPanel } from './components/BlueprintPanel'
import { ControlPanel } from './components/ControlPanel'
import { SceneView } from './components/SceneView'
import { useBlueprintStore } from './store/blueprintStore'
import { useTwinStore } from './store/twinStore'

export default function App() {
  const initializeBlueprint = useBlueprintStore((state) => state.initialize)
  const runGraph = useBlueprintStore((state) => state.runGraph)
  const feed = useTwinStore((state) => state.feed)
  const selectedDeviceId = useTwinStore((state) => state.selectedDeviceId)

  useEffect(() => {
    initializeBlueprint()
  }, [initializeBlueprint])

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Three.js Digital Twin</p>
          <h1>数字孪生 + MQTT + 蓝图式编排原型</h1>
          <p className="hero-copy">
            左侧是 three.js 设备场景，右侧是类似蓝图的节点编排。MQTT 消息与模拟数据都经过同一套流程图，再驱动 3D 设备状态。
          </p>
        </div>
        <div className="hero-status">
          <span className="status-dot" />
          <span>当前选中设备: {selectedDeviceId}</span>
        </div>
      </header>

      <main className="workspace">
        <section className="panel scene-panel">
          <div className="panel-header">
            <h2>3D 场景预览</h2>
            <p>设备状态会随 MQTT 数据或模拟注入即时变化</p>
          </div>
          <SceneView />
        </section>

        <section className="sidebar">
          <ControlPanel onSimulate={feed} onRunGraph={runGraph} />
          <BlueprintPanel />
        </section>
      </main>
    </div>
  )
}
