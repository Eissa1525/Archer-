import { useMemo } from 'react'
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { GradeEffect } from './Grade'

const caOffset = new THREE.Vector2(0.0006, 0.0008)

export function Effects({ low }: { low: boolean }) {
  const grade = useMemo(() => new GradeEffect(), [])
  if (low) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.42} luminanceSmoothing={0.3} intensity={1.15} radius={0.72} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <primitive object={grade} />
        <Vignette offset={0.22} darkness={0.85} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.38} luminanceSmoothing={0.3} intensity={1.35} radius={0.8} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <primitive object={grade} />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.3} />
      <Vignette offset={0.2} darkness={0.9} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.4} />
    </EffectComposer>
  )
}
