import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from './palette'
import { sceneState } from './store'

const vertex = /* glsl */ `
  attribute vec4 aOrbit; // radius, angle, height, seed
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uEnergy;
  varying float vMix;
  varying float vSeed;
  varying float vFade;
  void main() {
    float r = aOrbit.x;
    // differential rotation: inner particles orbit faster (Kepler-ish)
    float ang = aOrbit.y + uTime * (0.55 / pow(r, 1.2)) * (1.0 + uEnergy * 1.4);
    float y = aOrbit.z + sin(ang * 3.0 + aOrbit.w * 6.2831) * 0.06;
    float rr = r * (1.0 + 0.04 * sin(uTime * 0.6 + aOrbit.w * 20.0));
    vec3 p = vec3(cos(ang) * rr, y, sin(ang) * rr);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.6 + aOrbit.w * 1.8) * uPixelRatio * (9.0 / max(-mv.z, 0.5));
    vMix = smoothstep(1.4, 3.6, r);
    vSeed = aOrbit.w;
    // particles behind the core dim slightly for depth
    vFade = 0.55 + 0.45 * smoothstep(-1.0, 1.0, sin(ang));
  }
`

const fragment = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uOuter;
  varying float vMix;
  varying float vSeed;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    vec3 col = mix(uInner, uOuter, vMix) * (1.2 + vSeed * 1.6);
    gl_FragColor = vec4(col, a * vFade * 0.85);
  }
`

/** A luminous orbital swirl of particles around the AETHER core. */
export function Halo({ count = 6000 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const dpr = useThree((s) => s.viewport.dpr)

  const geometry = useMemo(() => {
    const orbit = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      // two arms plus a diffuse disc, gaussian-ish spread
      const g = (Math.random() + Math.random() + Math.random()) / 3 - 0.5
      const band = Math.random() < 0.7 ? 2.15 : 3.1
      const r = band + g * (band > 3 ? 1.4 : 0.9)
      orbit[i * 4] = Math.max(1.3, r)
      orbit[i * 4 + 1] = Math.random() * Math.PI * 2
      orbit[i * 4 + 2] = ((Math.random() + Math.random()) / 2 - 0.5) * 0.22
      orbit[i * 4 + 3] = Math.pow(Math.random(), 2.5)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    g.setAttribute('aOrbit', new THREE.BufferAttribute(orbit, 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5)
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uEnergy: { value: 0 },
      uInner: { value: palette.bioCyan.clone().multiplyScalar(1.1) },
      uOuter: { value: palette.horizon.clone().lerp(palette.bioViolet, 0.35) },
    }),
    [],
  )

  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
    m.uniforms.uPixelRatio.value = dpr
    m.uniforms.uEnergy.value = THREE.MathUtils.lerp(m.uniforms.uEnergy.value, sceneState.pointerEnergy, 0.05)
  })

  return (
    <points geometry={geometry} renderOrder={5}>
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
