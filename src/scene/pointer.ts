import * as THREE from 'three'

/** Pointer state inside the WebGL scene. Written by CameraRig every frame. */
export const pointerState = {
  /** Smoothed pointer in NDC (-1..1). */
  ndc: new THREE.Vector2(),
  /** Pointer projected onto the focal plane (z = 0) in world space. */
  world: new THREE.Vector3(0, 2, 0),
}
