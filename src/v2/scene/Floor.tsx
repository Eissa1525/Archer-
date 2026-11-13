import { MeshReflectorMaterial } from '@react-three/drei'
import { pal } from '../palette'

/** Polished black stone: a soft mirror that doubles the gate and the ribbon. */
export function Floor({ low }: { low: boolean }) {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[400, 400]} />
      <MeshReflectorMaterial
        resolution={low ? 512 : 1024}
        blur={low ? [160, 60] : [300, 90]}
        mixBlur={0.9}
        mixStrength={low ? 5 : 7}
        mixContrast={1.15}
        mirror={0.85}
        depthScale={0}
        roughness={0.62}
        metalness={0.55}
        color={pal.black}
      />
    </mesh>
  )
}
