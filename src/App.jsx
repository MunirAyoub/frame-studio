import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, ContactShadows, OrbitControls, Float } from '@react-three/drei'
import { animate, createTimeline, stagger, svg, utils } from 'animejs'
import Glasses from './components/Glasses.jsx'
import './App.css'

/* --- Catalogue ----------------------------------------------------------- */
const FRAME_COLORS = [
  { id: 'gold', name: 'Gold', hex: '#c79a4b', metalness: 0.95 },
  { id: 'gunmetal', name: 'Gunmetal', hex: '#484b50', metalness: 0.9 },
  { id: 'silver', name: 'Silver', hex: '#c7cace', metalness: 0.95 },
  { id: 'black', name: 'Black', hex: '#1b1c1e', metalness: 0.3 },
  { id: 'tortoise', name: 'Tortoise', hex: '#6a4322', metalness: 0.35 },
]

const FINISHES = [
  { id: 'polished', name: 'Polished', roughness: 0.14 },
  { id: 'satin', name: 'Satin', roughness: 0.36 },
  { id: 'matte', name: 'Matte', roughness: 0.64 },
]

const LENS_TINTS = [
  { id: 'clear', name: 'Clear', color: '#dbe3ea', opacity: 0.16, mirror: false },
  { id: 'g15', name: 'G-15', color: '#22392e', opacity: 0.62, mirror: false },
  { id: 'amber', name: 'Amber', color: '#6b3d13', opacity: 0.6, mirror: false },
  { id: 'blue', name: 'Blue', color: '#1c3452', opacity: 0.6, mirror: false },
  { id: 'rose', name: 'Rose', color: '#5a2436', opacity: 0.55, mirror: false },
  { id: 'goldmirror', name: 'Gold Mirror', color: '#c79a4b', opacity: 1, mirror: true },
  { id: 'silvermirror', name: 'Silver Mirror', color: '#cfd2d7', opacity: 1, mirror: true },
]

/* --- 3D stage ------------------------------------------------------------ */
function Scene({ frame, finish, tint, autoRotate, onInteract, glRef }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.02, 4.2], fov: 32 }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => (glRef.current = gl)}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 3]} intensity={1.1} />
      <directionalLight position={[-4, 1, -2]} intensity={0.4} color="#8fb3ff" />

      <Suspense fallback={null}>
        <Float speed={1.1} rotationIntensity={0} floatIntensity={0.35} floatingRange={[-0.03, 0.03]}>
          <Glasses
            frameColor={frame.hex}
            metalness={frame.metalness}
            roughness={finish.roughness}
            lensColor={tint.color}
            lensOpacity={tint.opacity}
            lensMirror={tint.mirror}
            autoRotate={autoRotate}
          />
        </Float>

        {/* Self-contained studio IBL — no external HDR fetch. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.4} position={[0, 3, 2]} scale={[7, 3, 1]} color="#ffffff" />
          <Lightformer intensity={1.4} position={[-4, 1, 2]} scale={[3, 4, 1]} color="#e6c48a" />
          <Lightformer intensity={1.1} position={[4, 0, 2]} scale={[3, 4, 1]} color="#9db8ff" />
          <Lightformer intensity={1.6} position={[0, -3, -2]} scale={[7, 3, 1]} color="#ffffff" />
        </Environment>
      </Suspense>

      <ContactShadows position={[0, -0.62, 0]} opacity={0.42} scale={4} blur={2.8} far={1.4} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={1.7}
        maxDistance={4.6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        onStart={onInteract}
      />
    </Canvas>
  )
}

/* --- Measurement overlay (the signature) --------------------------------- */
function Overlay({ hidden }) {
  return (
    <svg className={`overlay ${hidden ? 'hidden' : ''}`} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
      {/* lens-width caliper (left lens) */}
      <line className="draw cap" x1="108" y1="205" x2="192" y2="205" />
      <line className="draw tick" x1="108" y1="198" x2="108" y2="212" />
      <line className="draw tick" x1="192" y1="198" x2="192" y2="212" />
      <text className="mtext" x="150" y="224" textAnchor="middle">58</text>

      {/* bridge caliper */}
      <line className="draw cap" x1="188" y1="96" x2="212" y2="96" />
      <line className="draw tick" x1="188" y1="90" x2="188" y2="102" />
      <line className="draw tick" x1="212" y1="90" x2="212" y2="102" />
      <text className="mtext" x="200" y="84" textAnchor="middle">14</text>

      {/* temple length */}
      <line className="draw cap" x1="286" y1="120" x2="360" y2="140" />
      <line className="draw tick" x1="286" y1="113" x2="286" y2="127" />
      <text className="mtext" x="352" y="132" textAnchor="start">140</text>
    </svg>
  )
}

/* --- UI bits -------------------------------------------------------------- */
function Swatch({ active, color, label, mirror, onClick }) {
  return (
    <button
      className={`swatch ${active ? 'active' : ''} ${mirror ? 'mirror' : ''}`}
      style={{ '--sw': color }}
      data-tip={label}
      aria-label={label}
      onClick={onClick}
    />
  )
}

export default function App() {
  const [frameId, setFrameId] = useState('gold')
  const [finishId, setFinishId] = useState('polished')
  const [tintId, setTintId] = useState('g15')
  const [autoRotate, setAutoRotate] = useState(false)
  const [measured, setMeasured] = useState(false) // overlay fades after first interaction
  const glRef = useRef(null)
  const touchedRef = useRef(false) // has the user taken control of the spin yet?

  const frame = FRAME_COLORS.find((f) => f.id === frameId)
  const finish = FINISHES.find((f) => f.id === finishId)
  const tint = LENS_TINTS.find((t) => t.id === tintId)

  const interact = () => {
    touchedRef.current = true
    setAutoRotate(false)
    setMeasured(true)
  }

  const toggleSpin = () => {
    touchedRef.current = true
    setMeasured(true)
    setAutoRotate((v) => !v)
  }

  const snapshot = () => {
    const gl = glRef.current
    if (!gl) return
    const a = document.createElement('a')
    a.href = gl.domElement.toDataURL('image/png')
    a.download = `mira-aviator-${frame.id}-${tint.id}.png`
    a.click()
  }

  /* --- Anime.js: cinematic intro + scroll reveals ------------------------ */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return // CSS keeps everything visible unless .anim-ready is armed

    document.body.classList.add('anim-ready')

    const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 850 } })
    tl.add('.nav-inner', { opacity: [0, 1], translateY: [-14, 0], duration: 600 })
      .add('[data-hero="eyebrow"]', { opacity: [0, 1], translateY: [12, 0] }, '-=250')
      .add(
        '.hero h1 .row span',
        { opacity: [0, 1], translateY: ['110%', '0%'], duration: 950, delay: stagger(55) },
        '-=350',
      )
      .add('[data-hero="lead"]', { opacity: [0, 1], translateY: [14, 0] }, '-=550')
      .add('[data-hero="spec"]', { opacity: [0, 1], translateY: [14, 0], delay: stagger(70) }, '-=450')
      .add('[data-hero="cue"]', { opacity: [0, 1], duration: 500 }, '-=350')
      .add('.stage-card', { opacity: [0, 1], scale: [0.965, 1], duration: 1100 }, '-=1050')

    // Measurement lines draw themselves in, like a technical drawing.
    animate(svg.createDrawable('.overlay .draw'), {
      draw: ['0 0', '0 1'],
      duration: 900,
      delay: stagger(90, { start: 900 }),
      ease: 'inOutQuad',
    })
    animate('.overlay .mtext', {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 600,
      delay: stagger(90, { start: 1500 }),
      ease: 'outQuad',
    })

    // Let the frame sit still for its measurement moment, then drift into a spin.
    const spinTimer = setTimeout(() => {
      if (!window.__FREEZE && !touchedRef.current) setAutoRotate(true)
    }, 2800)

    // Scroll-triggered section reveals — IntersectionObserver so it always
    // fires (including for anything already in view on load).
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          animate(e.target, {
            opacity: [0, 1],
            translateY: [28, 0],
            duration: 800,
            ease: 'outCubic',
          })
          io.unobserve(e.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    utils.$('.reveal').forEach((el) => io.observe(el))

    return () => {
      clearTimeout(spinTimer)
      io.disconnect()
      document.body.classList.remove('anim-ready')
    }
  }, [])

  return (
    <div className="page">
      <nav className="nav">
        <div className="wrap nav-inner">
          <div className="wordmark">
            MIR<b>A</b>
          </div>
          <div className="nav-links">
            <a href="#viewer">Viewer</a>
            <a href="#specs">Specs</a>
            <a href="#brands">For brands</a>
          </div>
          <a className="nav-cta" href="#enquire">
            Enquire
          </a>
        </div>
      </nav>

      {/* HERO ------------------------------------------------------------- */}
      <header className="wrap hero" id="viewer">
        <div className="hero-copy">
          <div className="eyebrow" data-hero="eyebrow">
            Aviator No.001 · Live 3D
          </div>
          <h1>
            <span className="row">
              <span>See the</span>
            </span>
            <span className="row">
              <span>frame</span> <em><span>up close</span></em>
            </span>
            <span className="row">
              <span>before</span> <span>you buy.</span>
            </span>
          </h1>
          <p className="hero-lead" data-hero="lead">
            Every curve is modelled in the browser — no photos, no guesswork. Spin it, light it,
            recolor the metal and the lens, and see exactly what lands in the box.
          </p>

          <div className="spec-row">
            {[
              ['58', 'Lens · mm'],
              ['14', 'Bridge · mm'],
              ['140', 'Temple · mm'],
              ['6', 'Base curve'],
            ].map(([v, k]) => (
              <div className="spec" data-hero="spec" key={k}>
                <span className="v">{v}</span>
                <span className="k">{k}</span>
              </div>
            ))}
          </div>

          <div className="scroll-cue" data-hero="cue">
            <span className="dot" /> Drag the frame · pick a finish
          </div>
        </div>

        {/* The embeddable widget ---------------------------------------- */}
        <div className="stage-card">
          <div className="stage-canvas">
            <Scene
              frame={frame}
              finish={finish}
              tint={tint}
              autoRotate={autoRotate}
              onInteract={interact}
              glRef={glRef}
            />
          </div>

          <span className="stage-corner tl">Aviator · 001</span>
          <span className="stage-corner tr">● Live</span>

          <Overlay hidden={measured} />

          <div className="stage-controls">
            <div className="cgroup">
              <span className="clabel">Frame</span>
              <div className="swatches">
                {FRAME_COLORS.map((f) => (
                  <Swatch
                    key={f.id}
                    active={frameId === f.id}
                    color={f.hex}
                    label={f.name}
                    onClick={() => setFrameId(f.id)}
                  />
                ))}
              </div>
            </div>

            <div className="cgroup">
              <span className="clabel">Lens</span>
              <div className="swatches">
                {LENS_TINTS.map((t) => (
                  <Swatch
                    key={t.id}
                    active={tintId === t.id}
                    color={t.color}
                    label={t.name}
                    mirror={t.mirror}
                    onClick={() => setTintId(t.id)}
                  />
                ))}
              </div>
            </div>

            <div className="cgroup">
              <span className="clabel">Finish</span>
              <div className="pills">
                {FINISHES.map((f) => (
                  <button
                    key={f.id}
                    className={`pill ${finishId === f.id ? 'active' : ''}`}
                    onClick={() => setFinishId(f.id)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="stage-actions">
              <button className="pill" onClick={toggleSpin}>
                {autoRotate ? '❚❚ Spin' : '▶ Spin'}
              </button>
              <button className="pill gold" onClick={snapshot}>
                Snapshot
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SPEC SHEET ------------------------------------------------------- */}
      <section className="wrap section" id="specs">
        <div className="section-head">
          <h2 className="reveal">
            Cut, measured,
            <br />
            and true to size.
          </h2>
          <span className="section-num reveal">SPEC / 02</span>
        </div>
        <div className="sheet">
          {[
            ['Front', '58 □ 14', 'Teardrop aviator, wrapped 8° to the face.'],
            ['Temple', '140 mm', 'Straight metal arm with a comfort bend at the ear.'],
            ['Bridge', 'Double bar', 'Adjustable silicone nose pads, saddle-mounted.'],
            ['Weight', '24 g', 'Modelled to the real hardware, not a stand-in.'],
            ['Metal', '5 colors', 'Gold, gunmetal, silver, black, tortoise.'],
            ['Lens', '7 tints', 'From clear Rx to gold mirror, swapped live.'],
            ['Finish', '3 grades', 'Polished, satin, and matte on the same body.'],
            ['Build', 'Real-time', 'WebGL — runs on the phone in your pocket.'],
          ].map(([k, v, sub]) => (
            <div className="cell reveal" key={k}>
              <div className="k">{k}</div>
              <div className="v">{v}</div>
              <div className="sub">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOR BRANDS (the offer) ------------------------------------------ */}
      <section className="wrap section" id="brands">
        <div className="offer reveal">
          <div>
            <span className="mono" style={{ color: 'var(--gold)' }}>For eyewear brands</span>
            <h2 style={{ marginTop: 14 }}>Put this on your product page.</h2>
            <p className="lead">
              Send me photos and measurements of one frame. I model it, wire the color and lens
              options to your existing product page, and hand back a viewer your customers can spin
              and recolor — the kind that cuts returns and makes the buy feel certain.
            </p>
            <ul>
              <li>One frame, modelled from your photos — no 3D files needed on your end.</li>
              <li>Frame color, finish, and lens tint wired to your product options.</li>
              <li>Spin, zoom, studio lighting, and a snapshot button, mobile included.</li>
              <li>I handle the store-page embed. Fixed price, two weeks.</li>
            </ul>
          </div>
          <div className="price-card">
            <div className="k">Standard</div>
            <div className="amt">$2,400</div>
            <div className="note">One frame · modelling included · up to 3 option types.</div>
            <div className="terms">
              <div>
                <span>Premium (+ try-on)</span>
                <span>$3,000+</span>
              </div>
              <div>
                <span>Timeline</span>
                <span>~2 weeks</span>
              </div>
              <div>
                <span>Terms</span>
                <span>50 / 50</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT ---------------------------------------------------------- */}
      <footer className="wrap foot" id="enquire">
        <span className="mono reveal">Enquire / 04</span>
        <h2 className="reveal" style={{ marginTop: 18 }}>
          Let's build your frame in 3D.
        </h2>
        <div className="contact reveal">
          <a className="btn solid" href="mailto:munirjmayoub@gmail.com?subject=3D%20eyewear%20viewer">
            munirjmayoub@gmail.com
          </a>
          <a className="btn line" href="#viewer">
            Back to the viewer
          </a>
        </div>
        <div className="foot-base">
          <span className="mono">MIRA · 3D eyewear viewer</span>
          <span className="mono">Built with Three.js · WebGL</span>
        </div>
      </footer>
    </div>
  )
}
