import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { stage } from '../store'
import { pointer } from './pointer'
import { isCapture } from '../../scene/store'

const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.6) // z = 0.6, just in front of the gate
const ray = new THREE.Raycaster()
const hit = new THREE.Vector3()
const tmpV2 = new THREE.Vector2()

interface Props {
  layout: 'wide' | 'tall'
  reducedMotion: boolean
}

/**
 * Camera choreography
 *  intro  — low dolly from far away, rising to eye level as the ribbon ignites
 *  idle   — slow hand-held drift
 *  pointer— eased parallax + the "energy" the viewer puts into the scene
 *  scroll — flight through the gate and down the corridor of colossal arches
 */
export function Rig({ layout, reducedMotion }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const last = useRef(new THREE.Vector2())
  const idle = useRef(0)
  const look = useRef(new THREE.Vector3(0, 2.8, 0))

  const shot = useMemo(() => {
    const tall = layout === 'tall'
    const rest = tall ? new THREE.Vector3(0, 1.7, 17.5) : new THREE.Vector3(0, 2.9, 14.5)
    const lookRest = tall ? new THREE.Vector3(0, 3.3, 0) : new THREE.Vector3(0, 2.75, 0)
    const path = new THREE.CatmullRomCurve3(
      [
        rest,
        new THREE.Vector3(0, 2.0, 6.5),
        new THREE.Vector3(0, 2.3, 2.2),
        new THREE.Vector3(0, 2.4, -2.5),
        new THREE.Vector3(0.3, 2.9, -10),
        new THREE.Vector3(0, 3.6, -19),
        new THREE.Vector3(0, 4.4, -30),
      ],
      false,
      'centripetal',
    )
    return {
      start: tall ? new THREE.Vector3(0, 0.5, 32) : new THREE.Vector3(-1.2, 0.45, 27),
      lookStart: new THREE.Vector3(0, 3.8, -4),
      lookRest,
      path,
      fov: tall ? 52 : 39,
    }
  }, [layout])

  const target = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  const ahead = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, isCapture ? 0.5 : 0.05)
    const t = state.clock.elapsedTime
    const intro = stage.intro
    const s = stage.scroll
    const motion = reducedMotion ? 0.25 : 1

    if (Math.abs(camera.fov - shot.fov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, shot.fov, 1 - Math.exp(-dt * 4))
      camera.updateProjectionMatrix()
    }

    // ---- pointer & energy
    const p = state.pointer
    const moved = p.distanceTo(last.current)
    last.current.copy(p)
    stage.energy = Math.min(1, stage.energy * Math.exp(-dt * 1.4) + moved * 0.9)
    idle.current = moved > 0.0005 ? 0 : idle.current + dt
    const auto = THREE.MathUtils.clamp((idle.current - 3.5) / 3, 0, 1)
    tmpV2.set(
      THREE.MathUtils.lerp(p.x, Math.sin(t * 0.19) * 0.5, auto),
      THREE.MathUtils.lerp(p.y, Math.sin(t * 0.15 + 1.1) * 0.35, auto),
    )
    pointer.ndc.lerp(tmpV2, 1 - Math.exp(-dt * 3.5))
    ray.setFromCamera(pointer.ndc, camera)
    if (ray.ray.intersectPlane(plane, hit)) pointer.world.lerp(hit, 1 - Math.exp(-dt * 8))

    // ---- shot composition
    const sp = THREE.MathUtils.clamp(s, 0, 1)
    shot.path.getPointAt(sp, target)
    if (sp < 0.002) lookTarget.copy(shot.lookRest)
    else {
      shot.path.getPointAt(Math.min(1, sp + 0.08), ahead)
      lookTarget.lerpVectors(shot.lookRest, ahead.setY(ahead.y + 0.4), THREE.MathUtils.smoothstep(sp, 0, 0.18))
    }
    target.lerpVectors(shot.start, target, intro)
    lookTarget.lerpVectors(shot.lookStart, lookTarget, intro)

    const par = intro * (1 - THREE.MathUtils.smoothstep(sp, 0.05, 0.3)) * motion
    target.x += pointer.ndc.x * 0.75 * par + Math.sin(t * 0.13) * 0.12 * motion
    target.y += pointer.ndc.y * 0.35 * par + Math.sin(t * 0.21) * 0.06 * motion
    lookTarget.x += pointer.ndc.x * 0.25 * par

    camera.position.lerp(target, 1 - Math.exp(-dt * (sp > 0.01 ? 5 : intro < 1 ? 5 : 2.6)))
    look.current.lerp(lookTarget, 1 - Math.exp(-dt * 4))
    camera.lookAt(look.current)
    camera.rotation.z += (Math.sin(t * 0.11) * 0.005 - pointer.ndc.x * 0.012 * par) * motion

    // portal flare peaks as the lens crosses the gate's plane (z ≈ 0)
    stage.portal = Math.exp(-Math.pow(camera.position.z / 0.9, 2)) * THREE.MathUtils.smoothstep(sp, 0.05, 0.2)
  })

  return null
}
