import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { isCapture, sceneState } from './store'
import { pointerState } from './pointer'

interface Props {
  layout: 'wide' | 'tall'
  reducedMotion: boolean
}

const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const ray = new THREE.Raycaster()
const hit = new THREE.Vector3()

/**
 * Cinematic camera:
 *  1. Intro — a long crane move from high above the sea down to eye level (driven by GSAP → sceneState.intro).
 *  2. Idle — slow "handheld" breathing drift.
 *  3. Pointer — eased parallax toward the cursor.
 *  4. Scroll — glides forward and down until it skims the mirror surface.
 */
export function CameraRig({ layout, reducedMotion }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const look = useRef(new THREE.Vector3(0, 2, 0))
  const lastPointer = useRef(new THREE.Vector2())
  const idle = useRef(0)

  const shots = useMemo(() => {
    const tall = layout === 'tall'
    return {
      from: new THREE.Vector3(tall ? 0 : -2, 9, 30),
      rest: tall ? new THREE.Vector3(0, 2.6, 13.5) : new THREE.Vector3(0, 2.0, 10.5),
      dive: tall ? new THREE.Vector3(0, 0.55, 4.5) : new THREE.Vector3(0.8, 0.45, 3.2),
      lookFrom: new THREE.Vector3(0, 4.5, -10),
      lookRest: tall ? new THREE.Vector3(0, 3.1, 0) : new THREE.Vector3(0.6, 2.25, 0),
      lookDive: tall ? new THREE.Vector3(0, 1.8, -8) : new THREE.Vector3(1.8, 1.6, -8),
      fov: tall ? 56 : 38,
    }
  }, [layout])

  const target = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    dt = Math.min(dt, isCapture ? 0.5 : 0.05)
    const t = state.clock.elapsedTime
    const intro = sceneState.intro
    const scroll = sceneState.scroll

    if (Math.abs(camera.fov - shots.fov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, shots.fov, 1 - Math.exp(-dt * 4))
      camera.updateProjectionMatrix()
    }

    // --- pointer smoothing + "energy" (how much the user is stirring the scene)
    const p = state.pointer
    const moved = p.distanceTo(lastPointer.current)
    lastPointer.current.copy(p)
    sceneState.pointerEnergy = Math.min(1, sceneState.pointerEnergy * Math.exp(-dt * 1.6) + moved * 0.9)
    idle.current = moved > 0.0005 ? 0 : idle.current + dt
    // When idle for a while (or on touch devices), let the "pointer" wander on its own.
    const auto = THREE.MathUtils.clamp((idle.current - 4) / 3, 0, 1)
    const wanderX = Math.sin(t * 0.21) * 0.55
    const wanderY = Math.sin(t * 0.17 + 1.3) * 0.3
    const px = THREE.MathUtils.lerp(p.x, wanderX, auto)
    const py = THREE.MathUtils.lerp(p.y, wanderY, auto)
    pointerState.ndc.lerp(new THREE.Vector2(px, py), 1 - Math.exp(-dt * 3.5))

    // --- project the pointer onto the focal plane for interactive effects
    ray.setFromCamera(pointerState.ndc, camera)
    if (ray.ray.intersectPlane(plane, hit)) pointerState.world.lerp(hit, 1 - Math.exp(-dt * 8))

    // --- compose the shot
    target.lerpVectors(shots.from, shots.rest, intro)
    lookTarget.lerpVectors(shots.lookFrom, shots.lookRest, intro)
    target.lerp(shots.dive, scroll)
    lookTarget.lerp(shots.lookDive, scroll)

    const motion = reducedMotion ? 0.25 : 1
    const par = (1 - scroll * 0.6) * intro * motion
    target.x += pointerState.ndc.x * 0.9 * par + Math.sin(t * 0.11) * 0.18 * motion
    target.y += pointerState.ndc.y * 0.45 * par + Math.sin(t * 0.23) * 0.08 * motion
    lookTarget.x += pointerState.ndc.x * 0.35 * par

    camera.position.lerp(target, 1 - Math.exp(-dt * (intro < 1 ? 6 : 2.4)))
    look.current.lerp(lookTarget, 1 - Math.exp(-dt * 3))
    camera.lookAt(look.current)
    // a whisper of roll for a hand-held, floating feel
    camera.rotation.z += Math.sin(t * 0.13) * 0.006 * motion - pointerState.ndc.x * 0.01 * par
  })

  return null
}
