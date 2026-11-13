import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './store'
import { pointerState } from './pointer'
import { palette } from './palette'

const vertex = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uPointer;
  uniform float uEnergy;
  uniform vec3 uBoxMin;
  uniform vec3 uBoxSize;
  varying float vAlpha;
  varying float vTwinkle;
  varying float vHue;
  void main() {
    vec3 p = position;
    p.y += uTime * (0.04 + aSeed.x * 0.1);
    p.x += sin(uTime * 0.21 + aSeed.y * 6.2831) * 0.5;
    p.z += cos(uTime * 0.17 + aSeed.z * 6.2831) * 0.5;
    p = uBoxMin + mod(p - uBoxMin, uBoxSize);

    // pointer stirs the particles: radial push + a little swirl
    vec3 d = p - uPointer;
    float dist = length(d);
    float infl = smoothstep(2.6, 0.0, dist);
    vec3 dir = normalize(d + vec3(1e-4));
    vec3 swirl = normalize(cross(dir, vec3(0.0, 0.0, 1.0)) + vec3(1e-4));
    p += (dir * 0.55 + swirl * 0.35) * infl * (0.5 + uEnergy * 1.5);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.35 + aSeed.z * aSeed.z * 1.6);
    gl_PointSize = size * uPixelRatio * (12.0 / max(-mv.z, 0.5));
    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed.x * 2.5) + aSeed.y * 40.0);
    vAlpha = smoothstep(46.0, 8.0, -mv.z) * smoothstep(0.4, 2.0, -mv.z) * (0.45 + infl * 0.9);
    vHue = aSeed.y;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vTwinkle;
  varying float vHue;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    vec3 col = mix(uColorA, uColorB, step(0.78, vHue)) * (0.8 + vTwinkle * 1.4);
    gl_FragColor = vec4(col, a * vAlpha * vTwinkle);
  }
`

/** Bioluminescent "marine snow" drifting through the whole scene; stirred by the pointer. */
export function Plankton({ count = 1800 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const dpr = useThree((s) => s.viewport.dpr)
  const boxMin = useMemo(() => new THREE.Vector3(-18, 0.05, -24), [])
  const boxSize = useMemo(() => new THREE.Vector3(36, 11, 34), [])

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = boxMin.x + Math.random() * boxSize.x
      pos[i * 3 + 1] = boxMin.y + Math.random() * boxSize.y
      pos[i * 3 + 2] = boxMin.z + Math.random() * boxSize.z
      seed[i * 3] = Math.random()
      seed[i * 3 + 1] = Math.random()
      seed[i * 3 + 2] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 5, -7), 40)
    return g
  }, [count, boxMin, boxSize])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 2.4 },
      uPixelRatio: { value: 1 },
      uPointer: { value: new THREE.Vector3() },
      uEnergy: { value: 0 },
      uBoxMin: { value: boxMin },
      uBoxSize: { value: boxSize },
      uColorA: { value: palette.bioCyan.clone().multiplyScalar(0.9) },
      uColorB: { value: palette.bioCoral.clone() },
    }),
    [boxMin, boxSize],
  )

  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
    m.uniforms.uPixelRatio.value = dpr
    m.uniforms.uPointer.value.copy(pointerState.world)
    m.uniforms.uEnergy.value = sceneState.pointerEnergy
  })

  return (
    <points geometry={geometry} renderOrder={4}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
