import * as THREE from 'three'

/** Pointer inside the v2 scene (written by the camera rig every frame). */
export const pointer = {
  ndc: new THREE.Vector2(),
  world: new THREE.Vector3(0, 2.8, 0),
}
