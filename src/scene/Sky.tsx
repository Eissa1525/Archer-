import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { palette } from './palette'

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    // True view ray (not the facet normal) so the horizon gradient is perfectly smooth.
    vDir = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uZenith; uniform vec3 uUpper; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uSun;
  uniform vec3 uSunDir; uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    // Layered dusk gradient
    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.16, h));
    col = mix(col, uUpper, smoothstep(0.12, 0.42, h));
    col = mix(col, uZenith, smoothstep(0.38, 0.95, h));
    // Below the horizon: dim continuation (mostly hidden by the water plane)
    col = mix(col, uHorizon * 0.35, smoothstep(0.0, -0.08, h));

    // Sun glow
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSun * (pow(s, 900.0) * 2.4 + pow(s, 60.0) * 0.4 + pow(s, 8.0) * 0.1);

    // Slow-moving stratus bands near the horizon
    vec2 uv = d.xz / max(h + 0.18, 0.05);
    float c = fbm(uv * 0.55 + vec2(uTime * 0.008, 0.0));
    float band = smoothstep(0.02, 0.12, h) * (1.0 - smoothstep(0.18, 0.45, h));
    col = mix(col, col * 1.25 + uHorizon * 0.08, band * smoothstep(0.45, 0.8, c) * 0.8);

    // Faint stars up high
    vec2 sp = d.xz / (h + 1.0) * 220.0;
    float star = step(0.9965, hash(floor(sp))) * smoothstep(0.35, 0.8, h);
    star *= 0.6 + 0.4 * sin(uTime * 1.7 + hash(floor(sp)) * 40.0);
    col += vec3(star) * 0.9;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

export const SUN_DIR = new THREE.Vector3(0.42, 0.05, -1).normalize()

export function Sky() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uZenith: { value: palette.zenith },
      uUpper: { value: palette.upper },
      uMid: { value: palette.mid },
      uHorizon: { value: palette.horizon },
      uSun: { value: palette.sun },
      uSunDir: { value: SUN_DIR },
      uTime: { value: 0 },
    }),
    [],
  )
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })
  return (
    <mesh scale={400} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}

const mistVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`
const mistFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vWorld;
  void main() {
    vec3 ray = vWorld - cameraPosition;
    float elev = ray.y / length(ray.xz);            // tangent of elevation angle
    // asymmetric band: soft above the horizon, tight below (where the sea is)
    float above = exp(-pow(max(elev, 0.0) / 0.05, 2.0));
    float below = exp(-pow(min(elev, 0.0) / 0.016, 2.0));
    float band = elev > 0.0 ? above : below;
    vec3 dir = normalize(vec3(ray.x, 0.0, ray.z));
    float toSun = pow(max(dot(dir, normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0), 6.0);
    float drift = 0.85 + 0.15 * sin(atan(ray.z, ray.x) * 9.0 + uTime * 0.05);
    vec3 col = mix(uColor, uSun, toSun * 0.7);
    gl_FragColor = vec4(col * (0.9 + toSun * 0.8), band * 0.82 * drift);
  }
`

/** A luminous haze ring that dissolves the sea/sky seam into a soft cinematic horizon. */
export function HorizonMist() {
  const ref = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(
    () => ({
      uColor: { value: palette.horizon.clone().lerp(palette.mid, 0.35) },
      uSun: { value: palette.sun },
      uSunDir: { value: SUN_DIR },
      uTime: { value: 0 },
    }),
    [],
  )
  useFrame((state, dt) => {
    uniforms.uTime.value += dt
    // keep the ring centred on the viewer so the horizon always sits at eye level
    ref.current?.position.set(state.camera.position.x, 0, state.camera.position.z)
  })
  return (
    <mesh ref={ref} renderOrder={1} frustumCulled={false}>
      <cylinderGeometry args={[60, 60, 120, 96, 1, true]} />
      <shaderMaterial
        vertexShader={mistVertex}
        fragmentShader={mistFragment}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
