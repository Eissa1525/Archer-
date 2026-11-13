import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from './palette'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSeed;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float edge = pow(sin(vUv.x * 3.14159265), 2.5);
    float fall = smoothstep(0.0, 0.85, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
    float flicker = 0.65 + 0.35 * sin(uTime * 0.45 + uSeed * 10.0) * sin(uTime * 0.21 + uSeed * 3.0);
    float streak = 0.75 + 0.25 * sin(vUv.x * 18.0 + uSeed * 7.0 + uTime * 0.1);
    float a = edge * fall * flicker * streak * uStrength;
    gl_FragColor = vec4(uColor, a);
  }
`

/** Soft volumetric-looking god rays falling from the dusk sky. Cheap additive planes. */
export function LightShafts({ count = 6 }: { count?: number }) {
  const color = useMemo(() => palette.sun.clone().lerp(palette.bioCyan, 0.25), [])
  const time = useRef({ value: 0 })
  const shafts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = i / count + Math.random() * 0.1
        return {
          uniforms: {
            uColor: { value: color },
            uTime: time.current,
            uSeed: { value: seed },
            uStrength: { value: 0.1 + Math.random() * 0.1 },
          },
          x: -2 + (i / Math.max(count - 1, 1)) * 14 + (Math.random() - 0.5) * 2,
          z: -6 - Math.random() * 10,
          width: 1.2 + Math.random() * 2.6,
          rot: -0.32 + (Math.random() - 0.5) * 0.12,
        }
      }),
    [count, color],
  )

  useFrame((_, dt) => {
    time.current.value += dt
  })

  return (
    <group>
      {shafts.map((s, i) => (
        <mesh key={i} position={[s.x, 9, s.z]} rotation={[0, 0, s.rot]} renderOrder={0}>
          <planeGeometry args={[s.width, 22]} />
          <shaderMaterial
            vertexShader={vertex}
            fragmentShader={fragment}
            uniforms={s.uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}
