import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pal } from '../palette'

const skyVertex = /* glsl */ `
  varying vec3 vRay;
  void main() {
    vRay = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBlack;
  uniform vec3 uIndigo;
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform vec3 uGold;
  varying vec3 vRay;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
  void main() {
    vec3 d = normalize(vRay);
    float h = d.y;
    // a deep indigo dome of light behind the gates (looking down -z)
    float back = max(dot(d, normalize(vec3(0.0, 0.08, -1.0))), 0.0);
    vec3 col = uBlack;
    col += uIndigo * pow(back, 6.0) * 0.45;
    col += uViolet * pow(back, 30.0) * 0.25;
    // a thin luminous horizon: back-lights the arches into silhouettes
    float hz = exp(-abs(h - 0.004) * 75.0);
    col += mix(uViolet, uCyan, 0.35) * hz * pow(back, 2.5) * 0.55;
    col += uGold * exp(-abs(h - 0.004) * 260.0) * pow(back, 8.0) * 0.9;
    // the destination: a low sun at the end of the corridor
    col += mix(uGold, vec3(1.0), 0.3) * pow(back, 600.0) * 2.4;
    col += uGold * pow(back, 120.0) * 0.25;
    col += uIndigo * exp(-abs(h) * 10.0) * 0.12;
    // slow volumetric cloud wisps high up
    vec2 uv = d.xz / max(h + 0.25, 0.08);
    float c = fbm(uv * 0.35 + vec2(uTime * 0.006, 0.0));
    col += uViolet * smoothstep(0.55, 0.85, c) * smoothstep(0.05, 0.35, h) * 0.08;
    // sparse stars
    vec2 sp = d.xz / (h + 1.0) * 260.0;
    float cell = hash(floor(sp));
    float round_ = smoothstep(0.32, 0.0, length(fract(sp) - 0.5));   // round, not square
    float star = step(0.9975, cell) * round_ * smoothstep(0.15, 0.6, h);
    col += vec3(0.8, 0.85, 1.0) * star * (0.5 + 0.5 * sin(uTime * 1.3 + cell * 40.0));
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Backdrop() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBlack: { value: pal.black },
      uIndigo: { value: pal.indigo },
      uViolet: { value: pal.violet },
      uCyan: { value: pal.cyan },
      uGold: { value: pal.gold },
    }),
    [],
  )
  useFrame((_, dt) => {
    uniforms.uTime.value += dt
  })
  return (
    <mesh scale={500} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  )
}

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSeed;
  uniform float uStrength;
  uniform float uIntro;
  varying vec2 vUv;
  void main() {
    float edge = pow(sin(vUv.x * 3.14159265), 3.0);
    float fall = smoothstep(0.0, 0.7, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
    float drift = 0.7 + 0.3 * sin(uTime * 0.3 + uSeed * 9.0) * sin(uTime * 0.17 + uSeed * 4.0);
    float streak = 0.7 + 0.3 * sin(vUv.x * 14.0 + uSeed * 6.0 + uTime * 0.08);
    gl_FragColor = vec4(uColor, edge * fall * drift * streak * uStrength * uIntro);
  }
`

/** Faint shafts of light falling through the colossal arches. */
export function Beams({ intro }: { intro: { value: number } }) {
  const time = useMemo(() => ({ value: 0 }), [])
  const beams = useMemo(() => {
    const spec = [
      { x: -1.2, z: -6, w: 1.6, rot: 0.12, s: 0.07, c: pal.gold },
      { x: 1.6, z: -12, w: 2.6, rot: -0.1, s: 0.06, c: pal.cyan },
      { x: -3.5, z: -18, w: 3.2, rot: 0.18, s: 0.05, c: pal.violet },
      { x: 0.3, z: -26, w: 4.0, rot: -0.04, s: 0.06, c: pal.gold },
    ]
    return spec.map((b, i) => ({
      ...b,
      uniforms: {
        uColor: { value: b.c },
        uTime: time,
        uSeed: { value: i * 0.37 },
        uStrength: { value: b.s },
        uIntro: intro,
      },
    }))
  }, [time, intro])
  useFrame((_, dt) => {
    time.value += dt
  })
  return (
    <group>
      {beams.map((b, i) => (
        <mesh key={i} position={[b.x, 10, b.z]} rotation-z={b.rot}>
          <planeGeometry args={[b.w, 24]} />
          <shaderMaterial vertexShader={beamVertex} fragmentShader={beamFragment} uniforms={b.uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  )
}
