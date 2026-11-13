import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { HorizonMist, Sky, SUN_DIR } from './Sky'
import { Ocean } from './Ocean'
import { Jellyfish } from './Jellyfish'
import { Plankton } from './Plankton'
import { Core, Bubbles } from './Orbs'
import { LightShafts } from './LightShafts'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { palette } from './palette'
import type { Quality } from '../hooks/useQuality'

interface Props {
  quality: Quality
  layout: 'wide' | 'tall'
  onReady: () => void
}

/** Procedural studio environment for glass reflections — no HDR download needed. */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#0a0920']} />
      {/* horizon glow band */}
      <Lightformer form="rect" intensity={3} color={palette.horizon} position={[0, 0.5, -12]} scale={[40, 2.5, 1]} />
      {/* cool top light */}
      <Lightformer form="circle" intensity={2} color={palette.bioCyan} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={8} />
      {/* violet fill */}
      <Lightformer form="rect" intensity={1.5} color={palette.bioViolet} position={[-10, 3, 4]} rotation-y={Math.PI / 2} scale={[10, 6, 1]} />
      {/* key ring reflection for a crisp highlight on the glass */}
      <Lightformer form="ring" intensity={4} color="#ffffff" position={[6, 5, 6]} scale={2.5} target={[0, 0, 0]} />
    </Environment>
  )
}

export function Experience({ quality, layout, onReady }: Props) {
  const low = quality.tier === 'low'
  const [dpr, setDpr] = useState<number>(low ? 1.25 : 1.75)
  const wide = layout === 'wide'

  const corePos: [number, number, number] = wide ? [2.7, 3.0, 0] : [0, 6.0, -1.2]

  return (
    <Canvas
      className="webgl"
      dpr={[1, dpr]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ position: [0, 9, 30], fov: wide ? 38 : 56, near: 0.1, far: 1200 }}
      eventSource={document.getElementById('root') ?? undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        // wait two frames so shaders are compiled before revealing
        requestAnimationFrame(() => requestAnimationFrame(onReady))
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(low ? 1.5 : 2, d + 0.25))}
        flipflops={3}
      />
      <color attach="background" args={[palette.zenith]} />
      <fogExp2 attach="fog" args={[palette.fog.getHex(), 0.019]} />

      <ambientLight intensity={0.25} color={palette.bioViolet} />
      <directionalLight position={SUN_DIR.clone().multiplyScalar(30)} intensity={1.2} color={palette.sun} />

      <Suspense fallback={null}>
        <StudioEnvironment />
        <Sky />
        <Ocean low={low} />
        <HorizonMist />
        <LightShafts count={low ? 4 : 7} />

        <Core position={corePos} low={low} reducedMotion={quality.reducedMotion} />
        <Bubbles low={low} layout={layout} />

        {wide ? (
          <>
            <Jellyfish position={[5.6, 3.9, -1.2]} scale={0.85} color={palette.bioViolet} rim={palette.bioCyan} pulse={1.25} phase={0} reducedMotion={quality.reducedMotion} />
            <Jellyfish position={[0.4, 5.4, -4.5]} scale={0.6} color={palette.bioCoral} rim={palette.bioCoral} pulse={1.6} phase={2.1} tentacles={14} reducedMotion={quality.reducedMotion} />
            <Jellyfish position={[-7.5, 8.2, -13]} scale={1.1} color={palette.bioCyan} rim={palette.bioViolet} pulse={1.05} phase={4.2} intensity={1.0} reducedMotion={quality.reducedMotion} />
            <Jellyfish position={[10, 7.4, -12]} scale={1.0} color={palette.bioViolet} rim={palette.bioCyan} pulse={1.4} phase={1.1} tentacles={12} intensity={1.1} reducedMotion={quality.reducedMotion} />
          </>
        ) : (
          <>
            <Jellyfish position={[-1.6, 7.4, -3]} scale={0.7} color={palette.bioViolet} rim={palette.bioCyan} pulse={1.25} phase={0} tentacles={14} reducedMotion={quality.reducedMotion} />
            <Jellyfish position={[2.4, 9.2, -7]} scale={0.75} color={palette.bioCoral} rim={palette.bioCoral} pulse={1.6} phase={2.1} tentacles={12} reducedMotion={quality.reducedMotion} />
          </>
        )}

        <Plankton count={low ? 900 : 2200} />
      </Suspense>

      <CameraRig layout={layout} reducedMotion={quality.reducedMotion} />
      <Effects low={low} />
    </Canvas>
  )
}
