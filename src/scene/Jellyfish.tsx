import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './store'
import { pointerState } from './pointer'

/*
 * Fully procedural, shader-driven jellyfish.
 *  - Bell: lathe geometry, fresnel-lit, contracts on a pulse cycle.
 *  - Fine tentacles: line segments swaying in a travelling wave.
 *  - Oral arms: thin tubes with a frilled, slower sway.
 * Every part shares one set of uniforms so the whole animal pulses in sync.
 */

const PULSE_GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uPhase;
  float contraction() { return 0.5 + 0.5 * sin(uTime * uPulse + uPhase); }
`

const bellVertex = /* glsl */ `
  ${PULSE_GLSL}
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vH;
  void main() {
    vec3 p = position;
    float k = contraction();
    float h = clamp(p.y / 0.9, 0.0, 1.0);        // 0 at the rim, 1 at the apex
    float rimW = 1.0 - smoothstep(0.0, 1.0, h);
    p.xz *= 1.0 - 0.17 * k * rimW;                 // rim squeezes more than the apex
    p.y *= 1.0 + 0.10 * k;
    float ang = atan(p.z, p.x);
    p.xz *= 1.0 + 0.03 * sin(ang * 8.0 + uTime * 1.4) * rimW; // scalloped edge
    vH = h;
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewDir = normalize(-mv.xyz);
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`

const bellFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uRim;
  uniform float uIntensity;
  uniform float uTime;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vH;
  void main() {
    float f = 1.0 - abs(dot(normalize(vNormalV), normalize(vViewDir)));
    float fres = pow(f, 2.4);
    // radial canals running from apex to rim
    float canals = pow(abs(sin(vUv.x * 3.14159265 * 8.0)), 24.0) * smoothstep(0.05, 0.6, vH) * (1.0 - smoothstep(0.85, 1.0, vH));
    float rimBand = 1.0 - smoothstep(0.0, 0.1, vH);
    float shimmer = 0.85 + 0.15 * sin(vUv.x * 60.0 + uTime * 2.0 + vH * 10.0);
    vec3 col = uColor * (0.12 + canals * 0.9) + uRim * (fres * 1.7 * shimmer + rimBand * 1.4);
    float a = clamp(0.06 + fres * 0.85 + canals * 0.35 + rimBand * 0.5, 0.0, 1.0);
    gl_FragColor = vec4(col * uIntensity, a);
  }
`

const tentacleVertex = /* glsl */ `
  ${PULSE_GLSL}
  uniform float uLength;
  attribute float aT;
  attribute float aSeed;
  varying float vT;
  void main() {
    float k = contraction();
    vec3 p = position;
    p.xz *= (1.0 - 0.17 * k) * (1.0 + aT * 0.35);
    p.y = -aT * uLength * (1.0 - 0.08 * k);
    float w1 = sin(uTime * 1.1 - aT * 5.0 + aSeed * 6.2831);
    float w2 = sin(uTime * 0.63 - aT * 9.0 + aSeed * 14.0);
    float w3 = cos(uTime * 0.9 - aT * 4.0 + aSeed * 9.0);
    p.x += (w1 * 0.32 + w2 * 0.1) * aT * aT;
    p.z += (w3 * 0.3) * aT * aT;
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const tentacleFragment = /* glsl */ `
  uniform vec3 uRim;
  uniform float uIntensity;
  varying float vT;
  void main() {
    float a = pow(1.0 - vT, 1.6) * 0.75;
    gl_FragColor = vec4(uRim * uIntensity * (1.2 - vT * 0.6), a);
  }
`

const armVertex = /* glsl */ `
  ${PULSE_GLSL}
  uniform float uLength;
  uniform float uSeed;
  varying float vT;
  varying float vRad;
  void main() {
    float k = contraction();
    float t = uv.x;                // TubeGeometry: u runs along the path
    vec3 p = position;
    // frill: the tube wobbles around its own axis
    float frill = sin(t * 34.0 - uTime * 2.2 + uSeed * 5.0) * 0.045 * t;
    p.x += frill;
    p.z += cos(t * 29.0 - uTime * 1.9 + uSeed * 3.0) * 0.035 * t;
    p.y *= (1.0 - 0.06 * k);
    p.x += sin(uTime * 0.55 - t * 3.0 + uSeed * 6.2831) * 0.28 * t * t;
    p.z += cos(uTime * 0.45 - t * 2.5 + uSeed * 4.0) * 0.22 * t * t;
    vT = t;
    vRad = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const armFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uRim;
  uniform float uIntensity;
  varying float vT;
  varying float vRad;
  void main() {
    float edge = pow(abs(sin(vRad * 3.14159265)), 0.6);
    vec3 col = mix(uRim, uColor, vT) * (0.9 + edge * 0.6);
    float a = (1.0 - smoothstep(0.55, 1.0, vT)) * 0.45;
    gl_FragColor = vec4(col * uIntensity, a);
  }
`

function useBellGeometry() {
  return useMemo(() => {
    const pts: THREE.Vector2[] = []
    // inward-curling lip
    pts.push(new THREE.Vector2(0.86, -0.07))
    pts.push(new THREE.Vector2(0.95, -0.02))
    const N = 26
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const th = (t * Math.PI) / 2
      const r = Math.cos(th) * (1 - 0.06 * Math.sin(t * Math.PI))
      const y = 0.9 * Math.pow(Math.sin(th), 0.75)
      pts.push(new THREE.Vector2(Math.max(r, 0.0001), y))
    }
    return new THREE.LatheGeometry(pts, 64)
  }, [])
}

function useTentacleGeometry(count: number, segments: number) {
  return useMemo(() => {
    const positions: number[] = []
    const ts: number[] = []
    const seeds: number[] = []
    const index: number[] = []
    let v = 0
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.2
      const r = 0.82 + Math.random() * 0.08
      const seed = Math.random()
      for (let j = 0; j <= segments; j++) {
        positions.push(Math.cos(a) * r, 0, Math.sin(a) * r)
        ts.push(j / segments)
        seeds.push(seed)
        if (j < segments) index.push(v + j, v + j + 1)
      }
      v += segments + 1
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    g.setIndex(index)
    // Geometry is displaced in the shader, so give it a generous bound.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -2, 0), 5)
    return g
  }, [count, segments])
}

function useArmGeometry(length: number) {
  return useMemo(() => {
    const path = new THREE.LineCurve3(new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0, 0.15 - length, 0))
    const g = new THREE.TubeGeometry(path, 64, 0.04, 6, false)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -length / 2, 0), length)
    return g
  }, [length])
}

export interface JellyfishProps {
  position: [number, number, number]
  scale?: number
  color: THREE.Color
  rim: THREE.Color
  pulse?: number
  phase?: number
  intensity?: number
  tentacles?: number
  tentacleLength?: number
  reducedMotion?: boolean
}

export function Jellyfish({
  position,
  scale = 1,
  color,
  rim,
  pulse = 1.4,
  phase = 0,
  intensity = 1.4,
  tentacles = 18,
  tentacleLength = 3.2,
  reducedMotion = false,
}: JellyfishProps) {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const avoid = useRef(new THREE.Vector3())
  const bell = useBellGeometry()
  const lines = useTentacleGeometry(tentacles, 40)
  const armLen = tentacleLength * 0.55
  const arm = useArmGeometry(armLen)

  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: pulse },
      uPhase: { value: phase },
      uColor: { value: color },
      uRim: { value: rim },
      uIntensity: { value: intensity },
    }),
    [pulse, phase, color, rim, intensity],
  )

  const materials = useMemo(() => {
    const common = {
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }
    const bellMat = new THREE.ShaderMaterial({
      ...common,
      uniforms: shared,
      vertexShader: bellVertex,
      fragmentShader: bellFragment,
      side: THREE.DoubleSide,
    })
    const tentMat = new THREE.ShaderMaterial({
      ...common,
      uniforms: { ...shared, uLength: { value: tentacleLength } },
      vertexShader: tentacleVertex,
      fragmentShader: tentacleFragment,
    })
    const arms = [0, 1, 2, 3].map(
      (i) =>
        new THREE.ShaderMaterial({
          ...common,
          uniforms: { ...shared, uLength: { value: armLen }, uSeed: { value: i * 0.27 + phase } },
          vertexShader: armVertex,
          fragmentShader: armFragment,
          side: THREE.DoubleSide,
        }),
    )
    return { bellMat, tentMat, arms }
  }, [shared, tentacleLength, armLen, phase])

  const base = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame((_, dt) => {
    const speed = reducedMotion ? 0.35 : 1
    shared.uTime.value += dt * speed
    const t = shared.uTime.value
    const g = group.current
    if (!g) return

    // Rise on contraction, sink gently while relaxing, plus a slow lateral wander.
    const k = 0.5 + 0.5 * Math.sin(t * pulse + phase)
    const bob = Math.sin(t * 0.22 + phase) * 0.55 + k * 0.12
    const wander = Math.sin(t * 0.13 + phase * 2.0) * 0.6

    // Drift away from the pointer when it comes close.
    const target = new THREE.Vector3(base.x + wander, base.y + bob, base.z)
    const d = target.clone().sub(pointerState.world)
    d.z = 0
    const dist = d.length()
    const push = Math.max(0, 1 - dist / (2.4 * scale)) * (0.9 + sceneState.pointerEnergy)
    avoid.current.lerp(d.normalize().multiplyScalar(push * 1.2), 1 - Math.exp(-dt * 2))
    target.add(avoid.current)

    g.position.lerp(target, 1 - Math.exp(-dt * 3))
    g.rotation.z = Math.sin(t * 0.3 + phase) * 0.12 - avoid.current.x * 0.15
    g.rotation.x = Math.cos(t * 0.27 + phase) * 0.1
    g.rotation.y += dt * 0.08 * speed

    if (core.current) {
      const s = 1 + k * 0.12
      core.current.scale.set(s, 0.55 * s, s)
    }
  })

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={bell} material={materials.bellMat} renderOrder={2} />
      {/* luminous gonad ring inside the bell */}
      <mesh ref={core} position-y={0.42} rotation-x={Math.PI / 2} renderOrder={3}>
        <torusGeometry args={[0.32, 0.07, 12, 48]} />
        <meshBasicMaterial
          color={rim.clone().multiplyScalar(2.2)}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <lineSegments geometry={lines} material={materials.tentMat} renderOrder={1} />
      {materials.arms.map((m, i) => (
        <mesh
          key={i}
          geometry={arm}
          material={m}
          position={[Math.cos(i * 1.57) * 0.12, 0, Math.sin(i * 1.57) * 0.12]}
          renderOrder={1}
        />
      ))}
    </group>
  )
}
