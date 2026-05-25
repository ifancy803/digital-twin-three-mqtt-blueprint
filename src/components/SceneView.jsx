import { Canvas } from '@react-three/fiber'
import { Environment, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { useTwinStore } from '../store/twinStore'
import { Suspense } from 'react'

function DeviceModel({ url, color }) {
  const { scene } = useGLTF(url)
  
  // 使用 useMemo 避免每次渲染都克隆和遍历
  const clonedScene = useMemo(() => {
    if (!scene) return null
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (color) {
          child.material = child.material.clone()
          child.material.color.set(color)
        }
      }
    })
    return clone
  }, [scene, color])

  if (!clonedScene) return null
  return <primitive object={clonedScene} />
}

function DeviceNode({ device }) {
  const selectDevice = useTwinStore((state) => state.selectDevice)
  const selectedDeviceId = useTwinStore((state) => state.selectedDeviceId)
  const isSelected = selectedDeviceId === device.id

  return (
    <group 
      position={device.position} 
      rotation={device.rotation} 
      scale={device.scale}
      onClick={(e) => {
        e.stopPropagation()
        selectDevice(device.id)
      }}
    >
      <Suspense fallback={
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color={device.color} metalness={0.35} roughness={0.45} />
        </mesh>
      }>
        {device.modelUrl ? (
          <DeviceModel url={device.modelUrl} color={device.color} />
        ) : (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.4, 1.4, 1.4]} />
            <meshStandardMaterial 
              color={device.color} 
              metalness={0.35} 
              roughness={0.45} 
              emissive={isSelected ? device.color : '#000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
        )}
      </Suspense>
      <Html position={[0, 1.2 * device.scale[1], 0]} center distanceFactor={8}>
        <div className={`device-label ${isSelected ? 'selected' : ''}`}>
          <strong>{device.name}</strong>
          <span>{device.temperature.toFixed(1)}°C</span>
          <small>{device.id}</small>
        </div>
      </Html>
    </group>
  )
}

function FactoryFloor() {
  const devices = useTwinStore((state) => state.devices)

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#c8d1d9" />
      </mesh>
      <gridHelper args={[50, 50, '#abbbc9', '#d1d9e0']} position={[0, 0, 0]} />
      {devices.map((device) => (
        <DeviceNode key={device.id} device={device} />
      ))}
    </group>
  )
}

export function SceneView() {
  const selectedDeviceId = useTwinStore((state) => state.selectedDeviceId)

  return (
    <div className="scene-canvas">
      <div className="scene-overlay">
        <span>选定: {selectedDeviceId}</span>
      </div>
      <Canvas shadows camera={{ position: [8, 8, 12], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#f0f4f7']} />
        <ambientLight intensity={0.8} />
        <spotLight
          position={[10, 15, 10]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
        />
        <directionalLight
          castShadow
          position={[-10, 10, -5]}
          intensity={0.5}
        />
        <Suspense fallback={null}>
          <FactoryFloor />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  )
}
