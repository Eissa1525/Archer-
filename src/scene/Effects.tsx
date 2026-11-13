import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

const caOffset = new THREE.Vector2(0.0007, 0.0009)

export function Effects({ low }: { low: boolean }) {
  if (low) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.65} luminanceSmoothing={0.25} intensity={0.85} radius={0.7} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.28} darkness={0.7} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.25} intensity={0.95} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.35} />
      <Vignette offset={0.25} darkness={0.75} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
    </EffectComposer>
  )
}
