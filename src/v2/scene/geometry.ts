import * as THREE from 'three'

export const GATE = {
  outerW: 3.4,
  outerH: 5.7,
  innerW: 2.3,
  innerH: 5.0,
  depth: 0.62,
}

/** A single "∩" contour: outer arch, down the right leg, back up the inner opening. */
export function gateFrameShape(g = GATE) {
  const s = new THREE.Shape()
  const ro = g.outerW / 2
  const ri = g.innerW / 2
  s.moveTo(-ro, 0)
  s.lineTo(-ro, g.outerH - ro)
  s.absarc(0, g.outerH - ro, ro, Math.PI, 0, true)
  s.lineTo(ro, 0)
  s.lineTo(ri, 0)
  s.lineTo(ri, g.innerH - ri)
  s.absarc(0, g.innerH - ri, ri, 0, Math.PI, false)
  s.lineTo(-ri, 0)
  s.closePath()
  return s
}

export function innerArchShape(g = GATE) {
  const s = new THREE.Shape()
  const ri = g.innerW / 2
  s.moveTo(-ri, 0)
  s.lineTo(ri, 0)
  s.lineTo(ri, g.innerH - ri)
  s.absarc(0, g.innerH - ri, ri, 0, Math.PI, false)
  s.closePath()
  return s
}

/** Points along the inner opening (left foot → apex → right foot), for the gold inlay. */
export function innerEdgePoints(g = GATE, inset = 0.0, segments = 160) {
  const ri = g.innerW / 2 + inset
  const legH = g.innerH - g.innerW / 2
  const pts: THREE.Vector3[] = []
  const legN = Math.round(segments * 0.3)
  const arcN = segments - legN * 2
  for (let i = 0; i <= legN; i++) pts.push(new THREE.Vector3(-ri, (i / legN) * legH, 0))
  for (let i = 1; i < arcN; i++) {
    const a = Math.PI - (i / arcN) * Math.PI
    pts.push(new THREE.Vector3(Math.cos(a) * ri, legH + Math.sin(a) * ri, 0))
  }
  for (let i = legN; i >= 0; i--) pts.push(new THREE.Vector3(ri, (i / legN) * legH, 0))
  return pts
}
