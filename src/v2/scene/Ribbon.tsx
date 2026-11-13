import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { pal } from '../palette'
import { stage } from '../store'
import { pointer } from './pointer'

/*
 * The luminous energy ribbon: three intertwined elliptical bands orbiting the gate.
 * Each band = thousands of sparks (Points) + one smooth glowing strip (Mesh).
 * Both share one vertex transform so sparks and strip stay perfectly aligned.
 */

interface Band {
  rx: number
  rz: number
  tiltX: number
  tiltZ: number
  speed: number
  spiral: number
  width: number
  share: number
}

const BANDS: Band[] = [
  { rx: 3.05, rz: 2.15, tiltX: 0.42, tiltZ: -0.24, speed: 0.32, spiral: 0.09, width: 0.1, share: 0.42 },
  { rx: 3.6, rz: 2.5, tiltX: 0.5, tiltZ: -0.12, speed: 0.24, spiral: 0.11, width: 0.14, share: 0.36 },
  { rx: 2.5, rz: 1.85, tiltX: 0.34, tiltZ: -0.36, speed: 0.44, spiral: 0.07, width: 0.07, share: 0.22 },
]

export const RIBBON_CENTER = new THREE.Vector3(0, 3.6, 0)

const SHARED_GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform float uScroll;
  uniform float uEnergy;
  uniform vec3 uCenter;
  uniform vec3 uPointer;
  uniform vec4 uBand[3];      // rx, rz, speed, spiral
  uniform mat3 uRot[3];

  // position on band b at angle theta, with radial offset (in band plane) and thickness offset
  vec3 bandPoint(int b, float theta, float radial, float thick, float introK) {
    vec4 band = uBand[b];
    float spiral = 1.0 + band.w * sin(theta * 2.0 + float(b) * 1.7 + uTime * 0.25);
    float r = spiral * mix(0.12, 1.0, introK) * (1.0 - uScroll * 0.22);
    vec3 local = vec3(cos(theta) * (band.x * r + radial), thick, sin(theta) * (band.y * r + radial));
    return uRot[b] * local + uCenter;
  }
  float bandTheta(int b, float theta0) {
    return theta0 + uTime * uBand[b].z * (1.0 + uEnergy * 0.9 + uScroll * 2.0);
  }
`

const sparkVertex = /* glsl */ `
  ${SHARED_GLSL}
  attribute vec4 aSeed;   // theta0, radial, thick, rand
  attribute float aBand;
  attribute float aGold;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uCyan;
  uniform vec3 uElectric;
  uniform vec3 uGold;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    int b = int(aBand + 0.5);
    // the ribbon unfurls from the gate centre, particles staggered by their seed
    float k = clamp(uIntro * 1.35 - aSeed.w * 0.35, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    float theta = bandTheta(b, aSeed.x);
    // the ribbon swells and pinches along its length, like a nebular current
    float swell = 0.55 + 0.9 * (0.5 + 0.5 * sin(aSeed.x * 3.0 + float(b) * 1.3)) * (0.6 + 0.4 * sin(aSeed.x * 7.0 + uTime * 0.35));
    vec3 p = bandPoint(b, theta, aSeed.y * swell, aSeed.z * swell, k);

    // pointer: sparks part around the cursor and flare
    vec3 d = p - uPointer;
    float dist = length(d);
    float infl = smoothstep(1.7, 0.0, dist);
    p += normalize(d + vec3(1e-4)) * infl * (0.3 + uEnergy * 0.7);

    // energy pulses travelling along each band
    float pulse = pow(0.5 + 0.5 * sin(theta - uTime * 1.5 + float(b) * 2.1), 12.0);
    float core = exp(-pow(aSeed.y / 0.09, 2.0));
    vec3 base = mix(uElectric, uCyan, core);
    vColor = mix(base, uGold, aGold) * (0.5 + pulse * 2.6 + infl * 1.8 + core * 0.4);
    vAlpha = k * (0.35 + 0.65 * (0.6 + 0.4 * sin(uTime * (1.5 + aSeed.w * 4.0) + aSeed.w * 50.0)));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float s = uSize * (0.45 + pow(aSeed.w, 6.0) * 3.2 + aGold * 0.5);
    gl_PointSize = s * uPixelRatio * (12.0 / max(-mv.z, 0.5));
  }
`
const sparkFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-d * d * 5.0) + exp(-d * d * 40.0) * 0.8;   // soft glow + hot core
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`

const stripVertex = /* glsl */ `
  ${SHARED_GLSL}
  attribute float aTheta;
  attribute float aSide;
  uniform float uBandIndex;
  uniform float uWidth;
  varying float vSide;
  varying float vTheta;
  varying float vK;
  void main() {
    int b = int(uBandIndex + 0.5);
    float k = smoothstep(0.0, 1.0, clamp(uIntro * 1.2 - 0.15, 0.0, 1.0));
    float theta = bandTheta(b, aTheta);
    vec3 p = bandPoint(b, theta, aSide * uWidth, 0.0, k);
    vSide = aSide;
    vTheta = theta;
    vK = k;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const stripFragment = /* glsl */ `
  uniform float uTime;
  uniform float uBandIndex;
  uniform float uStrength;
  uniform vec3 uCyan;
  uniform vec3 uGold;
  varying float vSide;
  varying float vTheta;
  varying float vK;
  void main() {
    float across = exp(-vSide * vSide * 5.0);
    float hot = exp(-vSide * vSide * 60.0);
    float streak = 0.6 + 0.4 * sin(vTheta * 9.0 - uTime * 2.2 + uBandIndex * 3.0);
    float pulse = pow(0.5 + 0.5 * sin(vTheta - uTime * 1.5 + uBandIndex * 2.1), 12.0);
    vec3 col = uCyan * across * streak + mix(uCyan, vec3(1.0), 0.6) * hot * (0.6 + pulse * 2.0) + uGold * pulse * across * 0.6;
    gl_FragColor = vec4(col * uStrength * vK, 1.0);
  }
`

function bandRotations() {
  return BANDS.map((b) => {
    const m4 = new THREE.Matrix4().makeRotationZ(b.tiltZ).multiply(new THREE.Matrix4().makeRotationX(b.tiltX))
    return new THREE.Matrix3().setFromMatrix4(m4)
  })
}

function gauss() {
  return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2 // ~N(0, 0.41)
}

export function Ribbon({ count = 24000 }: { count?: number }) {
  const dpr = useThree((s) => s.viewport.dpr)

  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntro: { value: 0 },
      uScroll: { value: 0 },
      uEnergy: { value: 0 },
      uCenter: { value: RIBBON_CENTER },
      uPointer: { value: new THREE.Vector3(0, 2.8, 0) },
      uBand: { value: BANDS.map((b) => new THREE.Vector4(b.rx, b.rz, b.speed, b.spiral)) },
      uRot: { value: bandRotations() },
      uCyan: { value: pal.cyan },
      uElectric: { value: pal.electric },
      uGold: { value: pal.gold },
    }),
    [],
  )

  const sparks = useMemo(() => {
    const seed = new Float32Array(count * 4)
    const band = new Float32Array(count)
    const gold = new Float32Array(count)
    let i = 0
    BANDS.forEach((b, bi) => {
      const n = Math.round(count * b.share)
      for (let j = 0; j < n && i < count; j++, i++) {
        const halo = Math.random() < 0.22
        seed[i * 4] = Math.random() * Math.PI * 2
        seed[i * 4 + 1] = gauss() * (halo ? b.width * 4.5 : b.width)
        seed[i * 4 + 2] = gauss() * (halo ? 0.22 : 0.035)
        seed[i * 4 + 3] = Math.random()
        band[i] = bi
        gold[i] = Math.random() < 0.27 ? 1 : 0
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4))
    g.setAttribute('aBand', new THREE.BufferAttribute(band, 1))
    g.setAttribute('aGold', new THREE.BufferAttribute(gold, 1))
    g.boundingSphere = new THREE.Sphere(RIBBON_CENTER, 6)
    const m = new THREE.ShaderMaterial({
      vertexShader: sparkVertex,
      fragmentShader: sparkFragment,
      uniforms: { ...shared, uSize: { value: 1.6 }, uPixelRatio: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { g, m }
  }, [count, shared])

  const strips = useMemo(
    () =>
      BANDS.map((b, bi) => {
        const N = 720
        const theta = new Float32Array((N + 1) * 2)
        const side = new Float32Array((N + 1) * 2)
        const index: number[] = []
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * Math.PI * 2
          theta[i * 2] = theta[i * 2 + 1] = t
          side[i * 2] = -1
          side[i * 2 + 1] = 1
          if (i < N) {
            const a = i * 2
            index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
          }
        }
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3))
        g.setAttribute('aTheta', new THREE.BufferAttribute(theta, 1))
        g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
        g.setIndex(index)
        g.boundingSphere = new THREE.Sphere(RIBBON_CENTER, 6)
        const m = new THREE.ShaderMaterial({
          vertexShader: stripVertex,
          fragmentShader: stripFragment,
          uniforms: {
            ...shared,
            uBandIndex: { value: bi },
            uWidth: { value: b.width * 1.6 },
            uStrength: { value: bi === 1 ? 0.22 : 0.32 },
          },
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
        return { g, m }
      }),
    [shared],
  )

  useFrame((_, dt) => {
    shared.uTime.value += dt
    shared.uIntro.value = stage.intro
    shared.uScroll.value = stage.scroll
    shared.uEnergy.value = THREE.MathUtils.lerp(shared.uEnergy.value, stage.energy, 0.08)
    shared.uPointer.value.copy(pointer.world)
    sparks.m.uniforms.uPixelRatio.value = dpr
  })

  return (
    <group>
      {strips.map((s, i) => (
        <mesh key={i} geometry={s.g} material={s.m} renderOrder={5} />
      ))}
      <points geometry={sparks.g} material={sparks.m} renderOrder={6} />
    </group>
  )
}
