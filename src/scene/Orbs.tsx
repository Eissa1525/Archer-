import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { palette } from './palette'
import { Halo } from './Halo'
import { pointerState } from './pointer'

interface CoreProps {
  position: [number, number, number]
  low: boolean
  reducedMotion: boolean
}

/** The AETHER core: a thick glass sphere holding a breathing light, ringed by an orbital halo. */
export function Core({ position, low, reducedMotion }: CoreProps) {
  const group = useRef<THREE.Group>(null)
  const heart = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const [hovered, setHovered] = useState(false)
  const hover = useRef(0)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime * (reducedMotion ? 0.4 : 1)
    hover.current = THREE.MathUtils.lerp(hover.current, hovered ? 1 : 0, 1 - Math.exp(-dt * 4))
    const breath = 0.5 + 0.5 * Math.sin(t * 0.9)
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.5) * 0.18
      // lean slightly toward the pointer
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -pointerState.ndc.x * 0.12 - 0.32, 0.04)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointerState.ndc.y * 0.1 + 0.22, 0.04)
    }
    if (heart.current) {
      const s = 0.3 + breath * 0.05 + hover.current * 0.08
      heart.current.scale.setScalar(s)
    }
    if (light.current) light.current.intensity = 10 + breath * 5 + hover.current * 16
  })

  return (
    <group position={position}>
      <group ref={group}>
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = ''
          }}
        >
          <sphereGeometry args={[1.15, low ? 48 : 96, low ? 48 : 96]} />
          <MeshTransmissionMaterial
            transmissionSampler
            thickness={1.6}
            roughness={0.04}
            ior={1.35}
            chromaticAberration={low ? 0.15 : 0.45}
            anisotropicBlur={0.2}
            distortion={0.35}
            distortionScale={0.4}
            temporalDistortion={0.12}
            samples={low ? 4 : 8}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessMinimum={100}
            iridescenceThicknessMaximum={800}
            clearcoat={1}
            attenuationColor={palette.bioViolet}
            attenuationDistance={3.5}
            color="#f2ecff"
          />
        </mesh>
        <mesh ref={heart}>
          <icosahedronGeometry args={[1, 4]} />
          <meshBasicMaterial color={palette.sun.clone().multiplyScalar(3.2)} toneMapped={false} />
        </mesh>
        <pointLight ref={light} color={palette.sun} distance={14} decay={1.6} />
        <Halo count={low ? 2800 : 7000} />
      </group>
    </group>
  )
}

interface BubbleSpec {
  position: [number, number, number]
  radius: number
  speed: number
  phase: number
}

function Bubble({ spec, low }: { spec: BubbleSpec; low: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const scale = useRef(1)
  useFrame((state, dt) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime * spec.speed + spec.phase
    m.position.set(
      spec.position[0] + Math.sin(t * 0.7) * 0.25,
      spec.position[1] + Math.sin(t) * 0.35,
      spec.position[2] + Math.cos(t * 0.5) * 0.2,
    )
    scale.current = THREE.MathUtils.lerp(scale.current, hovered ? 1.18 : 1, 1 - Math.exp(-dt * 6))
    // wobble like a soap bubble
    const w = Math.sin(t * 2.3) * 0.03
    m.scale.set(spec.radius * scale.current * (1 + w), spec.radius * scale.current * (1 - w), spec.radius * scale.current)
  })
  return (
    <mesh
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[1, low ? 32 : 64, low ? 32 : 64]} />
      <MeshTransmissionMaterial
        transmissionSampler
        thickness={0.25}
        roughness={0}
        ior={1.2}
        chromaticAberration={low ? 0.08 : 0.25}
        samples={low ? 3 : 6}
        iridescence={1}
        iridescenceIOR={1.6}
        iridescenceThicknessMinimum={200}
        iridescenceThicknessMaximum={1000}
        clearcoat={1}
        color="#ffffff"
      />
    </mesh>
  )
}

export function Bubbles({ low, layout }: { low: boolean; layout: 'wide' | 'tall' }) {
  const specs = useMemo<BubbleSpec[]>(() => {
    const wide: BubbleSpec[] = [
      { position: [0.2, 1.0, 1.2], radius: 0.3, speed: 0.8, phase: 1.3 },
      { position: [4.6, 1.3, 0.6], radius: 0.42, speed: 0.6, phase: 2.2 },
      { position: [-1.6, 6.0, -6], radius: 0.6, speed: 0.4, phase: 3.1 },
      { position: [-9, 2.2, -10], radius: 0.9, speed: 0.35, phase: 4.0 },
      { position: [8.5, 5.0, -8], radius: 1.0, speed: 0.3, phase: 5.2 },
    ]
    const tall: BubbleSpec[] = [
      { position: [-1.8, 5.6, -2], radius: 0.38, speed: 0.5, phase: 0 },
      { position: [1.9, 1.4, 0.5], radius: 0.3, speed: 0.8, phase: 1.3 },
      { position: [-2.2, 1.6, -3], radius: 0.5, speed: 0.6, phase: 2.2 },
      { position: [2.6, 6.6, -6], radius: 0.7, speed: 0.4, phase: 3.1 },
    ]
    return layout === 'wide' ? wide : tall
  }, [layout])
  return (
    <>
      {specs.map((s, i) => (
        <Bubble key={i} spec={s} low={low} />
      ))}
    </>
  )
}
