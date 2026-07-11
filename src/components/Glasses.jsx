import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A procedurally-modelled aviator frame — no GLB, every curve is code.
 *
 * The whole frame is built from one authored teardrop outline:
 *   • the lens is that outline extruded thin,
 *   • the rim is a tube swept along the *same* outline (so it always fits),
 *   • bridge, brow bar, temples and nose pads are placed relative to it.
 *
 * All of it is driven by a handful of props so the configurator can recolor
 * the metal, change the finish, and tint the lenses in real time.
 */

// --- One authored aviator lens outline (right lens; bridge side = -x) -------
// Flatter brow across the top, straighter outer edge, and a soft teardrop point
// near the centre-bottom — a classic aviator, not a round bug-eye.
function lensShape() {
  const s = new THREE.Shape()
  s.moveTo(-0.38, 0.28) // inner-top (bridge side)
  s.bezierCurveTo(-0.14, 0.36, 0.16, 0.36, 0.4, 0.27) // flat brow across the top
  s.bezierCurveTo(0.49, 0.13, 0.47, -0.12, 0.34, -0.28) // outer edge, gently rounding in
  s.bezierCurveTo(0.22, -0.4, 0.04, -0.44, -0.08, -0.42) // full, rounded bottom (low point ~centre)
  s.bezierCurveTo(-0.26, -0.39, -0.4, -0.24, -0.43, -0.05) // up the nose-side edge
  s.bezierCurveTo(-0.44, 0.1, -0.42, 0.2, -0.38, 0.28) // close back to the top
  return s
}

const RIM_R = 0.022 // rim tube radius
const ARM_R = 0.02 // temple tube radius
const LENS_X = 0.5 // half the distance between the two lens centres
const TOE_IN = 0.1 // radians each lens wraps toward the face

export default function Glasses({
  frameColor = '#caa955',
  metalness = 0.9,
  roughness = 0.28,
  lensColor = '#20344a',
  lensOpacity = 0.55,
  lensMirror = false,
  autoRotate = true,
  spinSpeed = 0.22,
}) {
  const root = useRef(null)

  // --- Geometry (built once) ------------------------------------------------
  const { lensGeo, rimGeo, armGeo, padArmGeo } = useMemo(() => {
    const shape = lensShape()

    // Lens: the outline extruded to a thin, bevelled disc.
    const lens = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 48,
    })
    lens.center()

    // Rim: a tube swept along the very same outline, so it hugs the lens.
    const pts2d = shape.getPoints(160)
    if (pts2d.length > 1 && pts2d[0].distanceTo(pts2d[pts2d.length - 1]) < 1e-4) {
      pts2d.pop() // drop the duplicate closing point for a clean closed curve
    }
    const pts3d = pts2d.map((p) => new THREE.Vector3(p.x, p.y, 0))
    const rimCurve = new THREE.CatmullRomCurve3(pts3d, true, 'catmullrom', 0.0)
    const rim = new THREE.TubeGeometry(rimCurve, 220, RIM_R, 12, true)

    // Temple arm: hinged at the lens's outer-top corner (root space), running
    // straight back, then bending down at the ear.
    const armCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.9, 0.26, 0.05),
        new THREE.Vector3(0.97, 0.25, -0.12),
        new THREE.Vector3(0.99, 0.24, -0.7),
        new THREE.Vector3(0.98, 0.22, -1.15),
        new THREE.Vector3(0.95, 0.1, -1.4),
        new THREE.Vector3(0.9, -0.02, -1.5),
      ],
      false,
      'catmullrom',
      0.5,
    )
    const arm = new THREE.TubeGeometry(armCurve, 90, ARM_R, 10, false)

    // Nose-pad arm: a thin wire off the lower-inner rim, reaching down and
    // *back* toward the face (–z), where the pad rests against the nose.
    const padArm = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0.145, -0.12, 0.02), // on the inner rim, near the front
          new THREE.Vector3(0.1, -0.18, -0.03),
          new THREE.Vector3(0.065, -0.23, -0.07), // down and back to the pad
        ],
        false,
        'catmullrom',
        0.4,
      ),
      28,
      0.007,
      8,
      false,
    )

    return { lensGeo: lens, rimGeo: rim, armGeo: arm, padArmGeo: padArm }
  }, [])

  // --- Materials (props reconciled by R3F on every render) ------------------
  const lensMat = useMemo(() => new THREE.MeshPhysicalMaterial(), [])
  lensMat.color = new THREE.Color(lensColor)
  lensMat.roughness = lensMirror ? 0.06 : 0.12
  lensMat.metalness = lensMirror ? 1.0 : 0.0
  lensMat.transmission = lensMirror ? 0.0 : 0.9
  lensMat.thickness = 0.5
  lensMat.ior = 1.5
  lensMat.transparent = true
  lensMat.opacity = lensMirror ? 1.0 : lensOpacity
  lensMat.clearcoat = 1
  lensMat.clearcoatRoughness = 0.08
  lensMat.envMapIntensity = lensMirror ? 1.6 : 0.8
  lensMat.side = THREE.DoubleSide
  lensMat.needsUpdate = true

  useFrame((_, dt) => {
    if (root.current && autoRotate) root.current.rotation.y += dt * spinSpeed
  })

  const metal = (extra) => (
    <meshStandardMaterial
      color={frameColor}
      metalness={metalness}
      roughness={roughness}
      envMapIntensity={1.1}
      {...extra}
    />
  )

  // One lens assembly (rim + glass), toed-in toward the face.
  const LensUnit = ({ side }) => (
    <group position={[side * LENS_X, 0, 0]} rotation={[0, side * TOE_IN, 0]}>
      <mesh geometry={rimGeo} castShadow>{metal()}</mesh>
      <mesh geometry={lensGeo} material={lensMat} />
    </group>
  )

  return (
    <group ref={root} rotation={[0.04, 0, 0]}>
      {/* mirror the authored right lens to make the left one */}
      <LensUnit side={1} />
      <group scale={[-1, 1, 1]}>
        <LensUnit side={1} />
      </group>

      {/* double bridge: two straight bars connecting the rims across the nose */}
      {[
        { y: 0.28, len: 0.62, r: 0.013 }, // top bar (brow)
        { y: 0.09, len: 0.26, r: 0.014 }, // lower nose bar
      ].map((b) => (
        <mesh key={b.y} position={[0, b.y, 0.035]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[b.r, b.r, b.len, 16]} />
          {metal()}
        </mesh>
      ))}

      {/* nose pads — a wire pad-arm off each rim ending in a silicone pad */}
      {[-1, 1].map((s) => (
        <group key={s} scale={[s, 1, 1]}>
          <mesh geometry={padArmGeo} castShadow>{metal()}</mesh>
          {/* silicone pad: long axis runs down the nose, flat face turned inward,
              leaning inward at the bottom — resting behind the frame plane */}
          <mesh
            position={[0.06, -0.245, -0.075]}
            rotation={[0.1, 0.5, -0.32]}
            scale={[1, 1, 0.45]}
          >
            <capsuleGeometry args={[0.019, 0.032, 6, 16]} />
            <meshPhysicalMaterial
              color="#eceae6"
              roughness={0.25}
              transmission={0.55}
              thickness={0.15}
              ior={1.4}
              transparent
              opacity={0.75}
            />
          </mesh>
        </group>
      ))}

      {/* temple arms + a small hinge nub where they meet the rim */}
      {[-1, 1].map((s) => (
        <group key={s} scale={[s, 1, 1]}>
          <mesh geometry={armGeo} castShadow>{metal()}</mesh>
          <mesh position={[0.9, 0.26, 0.05]}>
            <boxGeometry args={[0.05, 0.05, 0.06]} />
            {metal()}
          </mesh>
        </group>
      ))}
    </group>
  )
}
