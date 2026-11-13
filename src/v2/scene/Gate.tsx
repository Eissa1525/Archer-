import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GATE, gateFrameShape, innerArchShape, innerEdgePoints } from './geometry'
import { pal } from '../palette'
import { stage } from '../store'

/* ------------------------------------------------------------------ */
/* Portal: a window into "another world" with layered parallax depth   */
/* ------------------------------------------------------------------ */

const portalVertex = /* glsl */ `
  varying vec2 vLocal;
  varying vec3 vViewLocal;
  void main() {
    vLocal = position.xy;
    // view direction expressed in the portal's local space → parallax layers
    vec3 camLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vViewLocal = position - camLocal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const portalFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform float uFlare;
  uniform vec2 uSize;
  uniform vec3 uIndigo;
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform vec3 uGold;
  varying vec2 vLocal;
  varying vec3 vViewLocal;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(3.1,1.7); a*=0.5; } return v; }

  void main() {
    vec2 uv = vec2(vLocal.x / uSize.x + 0.5, vLocal.y / uSize.y);
    vec3 V = normalize(vViewLocal);
    vec2 par = clamp(V.xy / max(abs(V.z), 0.2), vec2(-1.5), vec2(1.5));  // tame point-blank parallax

    // another world, seen through the gate: its horizon sits "far away" (strong parallax)
    float hzY = 0.34 + par.y * 0.26;
    float y = uv.y - hzY;
    vec3 col;
    if (y > 0.0) {
      // sky: violet glow at the horizon fading to deep indigo
      col = mix(uViolet * 0.55, uIndigo * 0.35, smoothstep(0.0, 0.55, y));
      // slow, low-contrast nebula drifting in two parallax layers
      for (int i = 0; i < 2; i++) {
        float d = 1.2 + float(i) * 1.6;
        vec2 p = vec2(uv.x * 1.4, y * 2.2) + par * d * 0.12 + vec2(uTime * (0.01 + 0.006 * float(i)), 0.0);
        float n = fbm(p * (1.5 + float(i)) + float(i) * 5.0);
        col += mix(uViolet, uCyan, 0.25 + 0.3 * float(i)) * smoothstep(0.45, 0.85, n) * (0.22 - float(i) * 0.08);
      }
      vec2 sp = (uv + par * 0.6) * vec2(70.0, 150.0);
      float st = step(0.988, hash(floor(sp))) * smoothstep(0.35, 0.0, length(fract(sp) - 0.5));
      col += vec3(0.85, 0.9, 1.0) * st * smoothstep(0.04, 0.2, y) * (0.5 + 0.5 * sin(uTime * 1.7 + hash(floor(sp)) * 30.0));
    } else {
      // a still, dark sea below the far horizon, with the glow mirrored as a soft streak
      float streak = exp(-pow((uv.x - 0.5) * 4.5, 2.0)) * exp(y * 9.0);
      float ripple = 0.85 + 0.15 * sin(y * 160.0 + uTime * 0.8 + fbm(uv * 8.0) * 4.0);
      col = uIndigo * 0.12 + mix(uGold, uCyan, 0.4) * streak * 0.55 * ripple;
    }
    // the far horizon: a gold-cyan line with a soft halo
    col += mix(uGold, uCyan, 0.3) * exp(-abs(y) * 120.0) * 1.5;
    col += uGold * exp(-abs(y) * 18.0) * exp(-pow((uv.x - 0.5) * 2.2, 2.0)) * 0.35;
    // depth at the frame edge
    float edge = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
    col *= mix(0.4, 1.0, edge);
    col *= uIntro;
    // crossing: the portal floods with saturated cyan-violet light (white would tone-map to grey)
    col = mix(col, mix(uViolet, uCyan, 0.55 + 0.25 * sin(uv.y * 6.0 + uTime)) * 1.8, uFlare);
    gl_FragColor = vec4(col, 1.0);
  }
`

/* ------------------------------------------------------------------ */
/* Gold inlay: thin luminous line drawn on during the intro            */
/* ------------------------------------------------------------------ */

const inlayVertex = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const inlayFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDraw;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying float vU;
  void main() {
    // draw outward from the apex (u = 0.5) toward both feet
    float fromApex = abs(vU - 0.5) * 2.0;
    float drawn = smoothstep(uDraw, uDraw - 0.04, fromApex);
    // energy pulses travelling down both legs
    float pulse = pow(0.5 + 0.5 * sin(fromApex * 22.0 - uTime * 2.4), 12.0);
    vec3 col = uColor * (1.4 + pulse * 2.2) * uIntensity;
    gl_FragColor = vec4(col * drawn, 1.0);
  }
`

function useInlayMaterial(intensity: number, color: THREE.Color = pal.gold) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: inlayVertex,
        fragmentShader: inlayFragment,
        uniforms: {
          uTime: { value: 0 },
          uDraw: { value: 0 },
          uIntensity: { value: intensity },
          uColor: { value: color },
        },
        toneMapped: false,
      }),
    [intensity, color],
  )
}

// Thin and shallow on purpose: nested in perspective, thick frames merge into a solid wall.
const ECHO = { ...GATE, outerW: 2.42, outerH: 5.06, depth: 0.08 }

function useFrameGeometry(spec = GATE) {
  return useMemo(() => {
    const g = new THREE.ExtrudeGeometry(gateFrameShape(spec), {
      depth: spec.depth,
      bevelEnabled: true,
      bevelThickness: spec === GATE ? 0.07 : 0.008,
      bevelSize: spec === GATE ? 0.06 : 0.008,
      bevelSegments: 5,
      curveSegments: 64,
    })
    g.translate(0, 0, -spec.depth / 2)
    g.computeVertexNormals()
    return g
  }, [spec])
}

function useInlayGeometry(inset: number, outer = false, radius = 0.016) {
  return useMemo(() => {
    const spec = outer ? { ...GATE, innerW: GATE.outerW, innerH: GATE.outerH } : GATE
    const curve = new THREE.CatmullRomCurve3(innerEdgePoints(spec, inset), false, 'centripetal')
    return new THREE.TubeGeometry(curve, 400, radius, 6, false)
  }, [inset, outer, radius])
}

const obsidian = {
  color: pal.obsidian,
  roughness: 0.16,
  metalness: 0.55,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.25,
}

export function Gate() {
  const frame = useFrameGeometry()
  const inlay = useInlayGeometry(-0.05)
  const inlayMat = useInlayMaterial(1)
  const rim = useInlayGeometry(-0.05, true, 0.009)
  const rimMat = useInlayMaterial(0.75, pal.cyan)
  const portalGeo = useMemo(() => new THREE.ShapeGeometry(innerArchShape(), 64), [])
  const portalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: portalVertex,
        fragmentShader: portalFragment,
        uniforms: {
          uTime: { value: 0 },
          uIntro: { value: 0 },
          uFlare: { value: 0 },
          uSize: { value: new THREE.Vector2(GATE.innerW, GATE.innerH) },
          uIndigo: { value: pal.indigo },
          uViolet: { value: pal.violet },
          uCyan: { value: pal.cyan },
          uGold: { value: pal.gold },
        },
      }),
    [],
  )
  const threshold = useRef<THREE.Mesh>(null)
  const thresholdAlpha = useThresholdAlpha()

  useFrame((_, dt) => {
    const intro = stage.intro
    portalMat.uniforms.uTime.value += dt
    portalMat.uniforms.uIntro.value = THREE.MathUtils.smoothstep(intro, 0.15, 0.85)
    portalMat.uniforms.uFlare.value = stage.portal
    inlayMat.uniforms.uTime.value += dt
    inlayMat.uniforms.uDraw.value = THREE.MathUtils.smoothstep(intro, 0.05, 0.7) * 1.05
    rimMat.uniforms.uTime.value += dt * 0.7
    rimMat.uniforms.uDraw.value = THREE.MathUtils.smoothstep(intro, 0.25, 0.95) * 1.05
    if (threshold.current) {
      const m = threshold.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.55 * THREE.MathUtils.smoothstep(intro, 0.3, 1)
    }
  })

  return (
    <group>
      <mesh geometry={frame} castShadow={false}>
        <meshPhysicalMaterial {...obsidian} />
      </mesh>
      <mesh geometry={inlay} material={inlayMat} position-z={GATE.depth / 2 + 0.04} />
      <mesh geometry={rim} material={rimMat} position-z={GATE.depth / 2 + 0.04} />
      <mesh geometry={portalGeo} material={portalMat} position-z={-0.02} />
      {/* plinth */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[5.4, 0.14, 2.2]} />
        <meshPhysicalMaterial {...obsidian} roughness={0.3} />
      </mesh>
      {/* light spilling over the threshold onto the plinth */}
      <mesh ref={threshold} position={[0, 0.145, 0.75]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.6, 1.3]} />
        <meshBasicMaterial
          color={pal.gold.clone().multiplyScalar(1.4)}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          alphaMap={thresholdAlpha}
        />
      </mesh>
    </group>
  )
}

function useThresholdAlpha() {
  return useMemo(() => {
    const s = 128
    const d = new Uint8Array(s * s * 4)
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const u = x / (s - 1) - 0.5
        const v = y / (s - 1)
        // bright at the doorway (v=1), fanning out and fading toward the viewer
        const a = Math.exp(-Math.pow(u / (0.18 + (1 - v) * 0.3), 2)) * Math.pow(v, 1.6)
        const i = (y * s + x) * 4
        d[i] = d[i + 1] = d[i + 2] = Math.round(a * 255)
        d[i + 3] = 255
      }
    const t = new THREE.DataTexture(d, s, s, THREE.RGBAFormat)
    t.magFilter = THREE.LinearFilter
    t.needsUpdate = true
    return t
  }, [])
}

/**
 * Echo arches: a receding series of ever-larger gates behind the main one.
 * Each grows faster than its distance, so its silhouette peeks around the
 * gate in front of it — a nested, monumental perspective.
 */
export function EchoArches({ count = 5, camZ = 11, growth = 1.13 }: { count?: number; camZ?: number; growth?: number }) {
  const frame = useFrameGeometry(ECHO)
  const inlay = useInlayGeometry(-0.05)
  const inlayMat = useInlayMaterial(0.55)
  const arches = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const z = -9 - i * 9
        const scale = ((camZ - z) / camZ) * Math.pow(growth, i + 1)
        return { z, scale }
      }),
    [count, camZ, growth],
  )
  useFrame((_, dt) => {
    inlayMat.uniforms.uTime.value += dt * 0.6
    inlayMat.uniforms.uDraw.value = THREE.MathUtils.smoothstep(stage.intro, 0.35, 1) * 1.05
  })
  return (
    <group>
      {arches.map((a, i) => (
        <group key={i} position-z={a.z} scale={a.scale}>
          <mesh geometry={frame}>
            <meshPhysicalMaterial {...obsidian} roughness={0.35} />
          </mesh>
          <mesh geometry={inlay} material={inlayMat} position-z={ECHO.depth / 2 + 0.04} />
        </group>
      ))}
    </group>
  )
}
