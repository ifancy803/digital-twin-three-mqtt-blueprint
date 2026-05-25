import { useEffect } from 'react'
import { BlueprintPanel } from './components/BlueprintPanel'
import { ControlPanel } from './components/ControlPanel'
import { SceneView } from './components/SceneView'
import { SceneDevicePanel } from './components/SceneDevicePanel'
import { useBlueprintStore } from './store/blueprintStore'
import { useTwinStore } from './store/twinStore'

export default function App() {
  const initializeBlueprint = useBlueprintStore((state) => state.initialize)
  const selectedDeviceId = useTwinStore((state) => state.selectedDeviceId)
  const currentView = useTwinStore((state) => state.currentView)
  const setView = useTwinStore((state) => state.setView)

  useEffect(() => {
    initializeBlueprint()
  }, [initializeBlueprint])

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-brand">
          <span className="brand-dot" />
          <h1>TwinStudio</h1>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-item ${currentView === 'scene' ? 'active' : ''}`}
            onClick={() => setView('scene')}
          >
            3D 场景
          </button>
          <button 
            className={`nav-item ${currentView === 'blueprint' ? 'active' : ''}`}
            onClick={() => setView('blueprint')}
          >
            蓝图工作台
          </button>
        </div>
        <div className="nav-status">
          <span className="status-dot" />
          <span>选中设备: {selectedDeviceId}</span>
        </div>
      </nav>

      <main className="workspace">
        {currentView === 'scene' ? (
          <section className="view-container scene-view-layout">
            <section className="panel scene-panel">
              <div className="panel-header">
                <h2>3D 场景预览</h2>
                <p>实时渲染设备状态与数字孪生数据。</p>
              </div>
              <SceneView />
            </section>

            <div className="side-panels">
              <ControlPanel />
              <SceneDevicePanel />
            </div>
          </section>
        ) : (
          <section className="view-container blueprint-view-layout">
            <BlueprintPanel />
            <div className="side-panels">
              <ControlPanel />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
