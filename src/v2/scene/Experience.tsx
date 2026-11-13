import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { pal } from '../palette'
import { stage } from '../store'
import { pointer } from './pointer'
import { Backdrop, Beams } from './Backdrop'
import { Floor } from './Floor'
import { EchoArches, Gate } from './Gate'
import { Ribbon } from './Ribbon'
import { Bokeh, Dust } from './Atmosphere'
import { Rig } from './Rig'
import { Effects } from './Effects'
import type { Quality } from '../../hooks/useQuality'

interface Props {
  quality: Quality
  layout: 'wide' | 'tall'
  onReady: () => void
}

/** Procedural studio lighting for the obsidian reflections — no HDR download. */
function Reflections() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#020206']} />
      <Lightformer form="rect" intensity={2.4} color={pal.gold} position={[-6, 4, 6]} rotation-y={Math.PI / 4} scale={[3, 8, 1]} />
      <Lightformer form="rect" intensity={1.6} color={pal.violet} position={[0, 9, -2]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
      <Lightformer form="rect" intensity={2.2} color={pal.cyan} position={[7, 3, 3]} rotation-y={-Math.PI / 3} scale={[1.2, 9, 1]} />
      <Lightformer form="ring" intensity={3} color="#ffffff" position={[2, 5, 8]} scale={1.6} target={[0, 2, 0]} />
      <Lightformer form="rect" intensity={0.9} color={pal.violet} position={[0, 7, 13]} scale={[14, 5, 1]} target={[0, 2, 0]} />
      <Lightformer form="rect" intensity={0.7} color={pal.gold} position={[0, -1.5, 12]} scale={[10, 1.2, 1]} target={[0, 2, 0]} />
    </Environment>
  )
}

/** Lights that move: a cyan light that follows the pointer, a breathing violet glow inside the gate. */
function LivingLights() {
  const follow = useRef<THREE.PointLight>(null)
  const inner = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (follow.current) {
      follow.current.position.set(pointer.world.x, pointer.world.y, 1.6)
      follow.current.intensity = (6 + stage.energy * 22) * stage.intro
    }
    if (inner.current) inner.current.intensity = (9 + Math.sin(t * 0.8) * 2.5) * stage.intro
  })
  return (
    <>
      <pointLight ref={follow} color={pal.cyan} distance={7} decay={1.7} />
      <pointLight ref={inner} position={[0, 2.2, -0.6]} color={pal.violet} distance={7} decay={1.5} />
    </>
  )
}

function IntroUniform({ target }: { target: { value: number } }) {
  useFrame(() => {
    target.value = THREE.MathUtils.smoothstep(stage.intro, 0.3, 1)
  })
  return null
}

export function Experience({ quality, layout, onReady }: Props) {
  const low = quality.tier === 'low'
  const [dpr, setDpr] = useState(low ? 1.3 : 1.75)
  const beamIntro = useMemo(() => ({ value: 0 }), [])

  return (
    <Canvas
      className="ax-webgl"
      dpr={[1, dpr]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ position: [0, 0.5, 30], fov: layout === 'tall' ? 52 : 39, near: 0.1, far: 1200 }}
      eventSource={document.getElementById('root') ?? undefined}
      eventPrefix="client"
      onCreated={() => requestAnimationFrame(() => requestAnimationFrame(onReady))}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(low ? 1.5 : 2, d + 0.25))}
        flipflops={3}
      />
      <color attach="background" args={[pal.black]} />
      <fogExp2 attach="fog" args={[pal.fog.getHex(), 0.028]} />
      <ambientLight intensity={0.12} color={pal.indigo} />
      <directionalLight position={[-6, 9, 9]} intensity={1.4} color={pal.gold} />
      <directionalLight position={[5, 4, -8]} intensity={0.35} color={pal.violet} />

      <Suspense fallback={null}>
        <Reflections />
        <Backdrop />
        <Beams intro={beamIntro} />
        <IntroUniform target={beamIntro} />
        <Floor low={low} />
        <EchoArches count={low ? 5 : 6} camZ={layout === 'tall' ? 17.5 : 14.5} growth={layout === 'tall' ? 1.13 : 1.115} />
        <Gate />
        <Ribbon count={low ? 14000 : 30000} />
        <Dust count={low ? 500 : 1000} />
        <Bokeh count={low ? 10 : 16} />
        <LivingLights />
      </Suspense>

      <Rig layout={layout} reducedMotion={quality.reducedMotion} />
      <Effects low={low} />
    </Canvas>
  )
}
