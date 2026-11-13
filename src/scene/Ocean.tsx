import { useMemo } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { palette } from './palette'

/** Procedural tiling value-noise texture used to break up the mirror into soft ripples. */
function useRippleTexture(size = 256) {
  return useMemo(() => {
    const data = new Uint8Array(size * size * 4)
    const rand = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
      return s - Math.floor(s)
    }
    const smooth = (t: number) => t * t * (3 - 2 * t)
    // Periodic value noise: wraps every px / py cells so the texture tiles seamlessly.
    const noise = (x: number, y: number, px: number, py: number) => {
      const xi = Math.floor(x), yi = Math.floor(y)
      const xf = smooth(x - xi), yf = smooth(y - yi)
      const wx = (v: number) => ((v % px) + px) % px
      const wy = (v: number) => ((v % py) + py) % py
      const a = rand(wx(xi), wy(yi)), b = rand(wx(xi + 1), wy(yi))
      const c = rand(wx(xi), wy(yi + 1)), d = rand(wx(xi + 1), wy(yi + 1))
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let v = 0, amp = 0.5, f = 4
        for (let o = 0; o < 4; o++) {
          // 4x more cells vertically than horizontally → long, low swells
          v += amp * noise((x / size) * f, (y / size) * f * 4, f, f * 4)
          amp *= 0.5
          f *= 2
        }
        const i = (y * size + x) * 4
        const c = Math.round(v * 255)
        data[i] = data[i + 1] = data[i + 2] = c
        data[i + 3] = 255
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    // DataTexture defaults to Nearest filtering → blocky, stair-stepped reflections.
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.generateMipmaps = true
    tex.repeat.set(40, 40)
    tex.needsUpdate = true
    return tex
  }, [size])
}

export function Ocean({ low }: { low: boolean }) {
  const ripple = useRippleTexture()
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow={false}>
      <planeGeometry args={[2000, 2000]} />
      <MeshReflectorMaterial
        resolution={low ? 512 : 1024}
        blur={low ? [120, 30] : [220, 40]}
        mixBlur={0.55}
        mixStrength={low ? 7 : 9}
        mixContrast={1.1}
        mirror={1}
        depthScale={0}
        distortion={0.12}
        distortionMap={ripple}
        roughness={0.55}
        metalness={0.6}
        color={palette.water}
      />
    </mesh>
  )
}
