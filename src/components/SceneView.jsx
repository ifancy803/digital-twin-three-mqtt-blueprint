import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Html } from '@react-three/drei'
import { useTwinStore } from '../store/twinStore'

function DeviceNode({ device }) {
  const selectDevice = useTwinStore((state) => state.selectDevice)

  return (
    <group position={device.position} onClick={() => selectDevice(device.id)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color={device.color} metalness={0.35} roughness={0.45} />
      </mesh>
      <Html position={[0, 1.15, 0]} center distanceFactor={8}>
        <div className="device-label">
          <strong>{device.name}</strong>
          <span>{device.temperature.toFixed(1)}°C</span>
          <span>{device.status}</span>
        </div>
      </Html>
    </group>
  )
}

function FactoryFloor() {
  const devices = useTwinStore((state) => state.devices)

  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#c8d1d9" />
      </mesh>
      {devices.map((device) => (
        <DeviceNode key={device.id} device={device} />
      ))}
    </>
  )
}

export function SceneView() {
  return (
    <div className="scene-canvas">
      <Canvas shadows camera={{ position: [6, 6, 8], fov: 48 }}>
        <color attach="background" args={['#dbe7ef']} />
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow
          position={[6, 8, 5]}
          intensity={1.4}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <FactoryFloor />
        <Environment preset="city" />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  )
}
