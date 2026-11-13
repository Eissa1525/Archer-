import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { pal } from '../palette'
import { pointer } from './pointer'
import { stage } from '../store'

const dustVertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uPointer;
  uniform float uEnergy;
  varying float vAlpha;
  varying float vWarm;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * (0.03 + aSeed.x * 0.06) + aSeed.y * 9.0, 9.0) - 1.0;
    p.x += sin(uTime * 0.2 + aSeed.z * 6.28) * 0.4;
    vec3 d = p - uPointer;
    float infl = smoothstep(2.2, 0.0, length(d));
    p += normalize(d + vec3(1e-4)) * infl * (0.4 + uEnergy);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.8 + aSeed.w * 1.8) * uPixelRatio * (10.0 / max(-mv.z, 0.5));
    vAlpha = (0.35 + 0.65 * sin(uTime * (0.6 + aSeed.x) + aSeed.y * 30.0) * 0.5 + 0.3) * smoothstep(40.0, 6.0, -mv.z);
    vWarm = step(0.55, aSeed.z);
  }
`
const dustFragment = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uGold;
  varying float vAlpha;
  varying float vWarm;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-d * d * 6.0);
    gl_FragColor = vec4(mix(uCyan, uGold, vWarm) * 0.9, a * vAlpha * 0.6);
  }
`

/** Fine motes catching the light around the gate. */
export function Dust({ count = 900 }: { count?: number }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22
      pos[i * 3 + 1] = Math.random() * 1.5
      pos[i * 3 + 2] = -14 + Math.random() * 20
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4, -4), 20)
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uPointer: { value: new THREE.Vector3() },
        uEnergy: { value: 0 },
        uCyan: { value: pal.cyan },
        uGold: { value: pal.gold },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: g, material: m }
  }, [count])
  useFrame((_, dt) => {
    const u = material.uniforms
    u.uTime.value += dt
    u.uPixelRatio.value = dpr
    u.uPointer.value.copy(pointer.world)
    u.uEnergy.value = stage.energy
  })
  return <points geometry={geometry} material={material} renderOrder={4} />
}

const bokehVertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uIntro;
  varying float vAlpha;
  varying float vWarm;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.11 + aSeed.x * 6.28) * 0.25;
    p.y += sin(uTime * 0.09 + aSeed.y * 6.28) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (40.0 + aSeed.z * 110.0) * uPixelRatio * (3.0 / max(-mv.z, 0.6));
    vAlpha = (0.03 + aSeed.w * 0.05) * uIntro;
    vWarm = step(0.25, aSeed.x);
  }
`
const bokehFragment = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uGold;
  varying float vAlpha;
  varying float vWarm;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float body = smoothstep(1.0, 0.35, d);
    gl_FragColor = vec4(mix(uCyan, uGold, vWarm), body * vAlpha);
  }
`

/** Out-of-focus foreground highlights very close to the lens: pure depth separation. */
export function Bokeh({ count = 26 }: { count?: number }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      // keep the centre clear: bias toward the frame edges
      const side = Math.random() < 0.5 ? -1 : 1
      pos[i * 3] = side * (1.2 + Math.random() * 3.2)
      pos[i * 3 + 1] = 0.3 + Math.random() * 4.5
      pos[i * 3 + 2] = 6.2 + Math.random() * 2.4
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.5, 7.5), 8)
    const m = new THREE.ShaderMaterial({
      vertexShader: bokehVertex,
      fragmentShader: bokehFragment,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uIntro: { value: 0 },
        uCyan: { value: pal.cyan },
        uGold: { value: pal.gold },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: g, material: m }
  }, [count])
  useFrame((_, dt) => {
    const u = material.uniforms
    u.uTime.value += dt
    u.uPixelRatio.value = dpr
    u.uIntro.value = THREE.MathUtils.smoothstep(stage.intro, 0.4, 1) * (1 - stage.scroll)
  })
  return <points geometry={geometry} material={material} renderOrder={20} />
}
