import { useTwinStore } from '../store/twinStore'

export function SceneDevicePanel() {
  const devices = useTwinStore((state) => state.devices)
  const selectedDeviceId = useTwinStore((state) => state.selectedDeviceId)
  const updateDeviceProperty = useTwinStore((state) => state.updateDeviceProperty)

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  if (!selectedDevice) {
    return (
      <section className="panel device-config-panel">
        <div className="panel-header">
          <h2>设备配置</h2>
          <p>在左侧场景中点击设备进行配置</p>
        </div>
      </section>
    )
  }

  const handleChange = (property, value, index = -1) => {
    if (index !== -1) {
      const nextValue = [...selectedDevice[property]]
      nextValue[index] = parseFloat(value) || 0
      updateDeviceProperty({ id: selectedDeviceId, property, value: nextValue })
    } else {
      updateDeviceProperty({ id: selectedDeviceId, property, value })
    }
  }

  return (
    <section className="panel device-config-panel">
      <div className="panel-header">
        <h2>设备配置: {selectedDevice.name}</h2>
        <p>自定义设备模型及 3D 变换属性</p>
      </div>

      <div className="field-grid">
        <label className="full-width">
          模型 GLB URL
          <input 
            type="text" 
            value={selectedDevice.modelUrl || ''} 
            placeholder="输入 .glb 或 .gltf 链接"
            onChange={(e) => handleChange('modelUrl', e.target.value)} 
          />
          <small>提示: 可以使用公共模型库链接，或将模型放入 public 文件夹后引用</small>
        </label>

        <div className="transform-group">
          <p className="label">位置 (Position)</p>
          <div className="input-row">
            <input type="number" step="0.1" value={selectedDevice.position[0]} onChange={(e) => handleChange('position', e.target.value, 0)} />
            <input type="number" step="0.1" value={selectedDevice.position[1]} onChange={(e) => handleChange('position', e.target.value, 1)} />
            <input type="number" step="0.1" value={selectedDevice.position[2]} onChange={(e) => handleChange('position', e.target.value, 2)} />
          </div>
        </div>

        <div className="transform-group">
          <p className="label">旋转 (Rotation - 弧度)</p>
          <div className="input-row">
            <input type="number" step="0.1" value={selectedDevice.rotation[0]} onChange={(e) => handleChange('rotation', e.target.value, 0)} />
            <input type="number" step="0.1" value={selectedDevice.rotation[1]} onChange={(e) => handleChange('rotation', e.target.value, 1)} />
            <input type="number" step="0.1" value={selectedDevice.rotation[2]} onChange={(e) => handleChange('rotation', e.target.value, 2)} />
          </div>
        </div>

        <div className="transform-group">
          <p className="label">缩放 (Scale)</p>
          <div className="input-row">
            <input type="number" step="0.1" value={selectedDevice.scale[0]} onChange={(e) => handleChange('scale', e.target.value, 0)} />
            <input type="number" step="0.1" value={selectedDevice.scale[1]} onChange={(e) => handleChange('scale', e.target.value, 1)} />
            <input type="number" step="0.1" value={selectedDevice.scale[2]} onChange={(e) => handleChange('scale', e.target.value, 2)} />
          </div>
        </div>

        <label>
          设备颜色
          <input 
            type="color" 
            value={selectedDevice.color} 
            onChange={(e) => handleChange('color', e.target.value)} 
          />
        </label>
      </div>

      <div className="button-row" style={{ marginTop: '1rem' }}>
        <button className="ghost" onClick={() => {
           updateDeviceProperty({ id: selectedDeviceId, property: 'modelUrl', value: null })
           updateDeviceProperty({ id: selectedDeviceId, property: 'scale', value: [1, 1, 1] })
           updateDeviceProperty({ id: selectedDeviceId, property: 'rotation', value: [0, 0, 0] })
        }}>
          重置模型与变换
        </button>
      </div>
    </section>
  )
}
