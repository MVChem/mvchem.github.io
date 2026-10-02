import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { MoveHorizontal, MoveVertical } from 'lucide-react'
import './mini-games.css'

type Lang = 'zh' | 'en' | 'ja' | 'ko'
type GameName = 'pong' | 'brick'
type GameProps = { lang: Lang; onProgress: (game: GameName, level: number) => void; onThemeAdvance: () => void }
export type GameSkill = { name: string; proficient: boolean; icon?: ReactNode }
type Phase = 'idle' | 'playing' | 'paused' | 'next' | 'retry'
type Colors = { ink: string; paper: string }
type Point = { x: number; y: number }
type Particle = Point & { vx: number; vy: number; life: number; size: number }
type Ring = Point & { radius: number; target: number; life: number; width: number }
type Effects = { particles: Particle[]; rings: Ring[]; shake: number }
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(n, high))
const words = {
  zh: { start: '开始游戏', try: '立即体验', resume: '继续游戏', ws: '按下 WS 键', ad: '按下 AD 键', touch: '滑动屏幕', level: '关卡', next: '下一关', retry: '再试一次', resize: '调整乒乓球场高度' },
  en: { start: 'Start Game', try: 'Try now', resume: 'Resume Game', ws: 'Press WS', ad: 'Press AD', touch: 'Swipe Screen', level: 'LV', next: 'Next Level', retry: 'Try Again', resize: 'Resize Pong court height' },
  ja: { start: 'ゲーム開始', try: '今すぐ体験', resume: 'ゲーム再開', ws: 'WS キーを押す', ad: 'AD キーを押す', touch: '画面をスワイプ', level: 'レベル', next: '次のレベル', retry: 'もう一度', resize: 'ポンのコートの高さを調整' },
  ko: { start: '게임 시작', try: '지금 체험', resume: '게임 계속', ws: 'WS 키 누르기', ad: 'AD 키 누르기', touch: '화면 스와이프', level: '레벨', next: '다음 레벨', retry: '다시 시도', resize: '퐁 게임 높이 조절' },
}
const faces = ['( ^ω^)', '( ºΔº )', '(≧∀≦)ゞ', '(っ´ω`c)', '(๑´ڡ`๑)', '=ᗜωᗜ=', '( ˘ω˘ )', '( •̀ω•́ )✧', '(・∀・)', 'ヽ(*⌒▽⌒*)ﾉ', '(*ﾉ∀`*)', '( ๑>ᴗ<๑ )']
function readLevel(game: GameName) {
  try { return Math.max(1, Number(sessionStorage.getItem(`${game}Level`) || (game === 'brick' ? localStorage.getItem('brickLevel') : null)) || 1) } catch { return 1 }
}
function saveProgress(game: GameName, level: number) {
  for (const key of ['sessionStorage', 'localStorage'] as const) {
    try { const storage = window[key]; storage.setItem(`${game}Level`, String(level)); storage.setItem(`${game}HasStarted`, 'true') } catch { /* Private browsing can disable persistence. */ }
  }
}
function theme(canvas: HTMLCanvasElement): Colors {
  const style = getComputedStyle(canvas)
  return { ink: style.getPropertyValue('--ink').trim() || '#0058c0', paper: style.getPropertyValue('--paper').trim() || '#cfe1ef' }
}
function usePreferences() {
  const [touch, setTouch] = useState(false)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const coarse = matchMedia('(pointer: coarse)')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { setTouch(coarse.matches); setReduced(motion.matches) }
    update(); coarse.addEventListener('change', update); motion.addEventListener('change', update)
    return () => { coarse.removeEventListener('change', update); motion.removeEventListener('change', update) }
  }, [])
  return { touch, reduced }
}

// Fixed 60 Hz simulation with no idle animation loop and no hidden-tab catch-up.
function useGameCanvas(phase: Phase, frame: (ctx: CanvasRenderingContext2D, width: number, height: number, steps: number) => void) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(frame)
  frameRef.current = frame
  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    let animation = 0, resizeFrame = 0, previous = 0, remainder = 0
    const paint = (time = 0, animate = false) => {
      const width = element.clientWidth, height = element.clientHeight
      if (!width || !height) return
      const ratio = Math.min(devicePixelRatio || 1, 2)
      if (element.width !== Math.round(width * ratio) || element.height !== Math.round(height * ratio)) {
        element.width = Math.round(width * ratio); element.height = Math.round(height * ratio)
      }
      let steps = 0
      if (animate && previous) { remainder += Math.min(time - previous, 50) * .06; steps = Math.floor(remainder); remainder -= steps }
      previous = time
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      frameRef.current(context, width, height, steps)
    }
    const tick = (time: number) => {
      if (document.hidden) { previous = 0; remainder = 0 } else paint(time, true)
      animation = requestAnimationFrame(tick)
    }
    const redraw = () => { if (phase !== 'playing') paint() }
    const resize = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => paint()) })
    resize.observe(element)
    const site = element.closest('.site')
    const mutations = new MutationObserver(redraw)
    const transition = (event: Event) => { if (event.target === site) redraw() }
    if (site) { mutations.observe(site, { attributes: true, attributeFilter: ['style'] }); site.addEventListener('transitionend', transition); site.addEventListener('transitioncancel', transition) }
    paint()
    if (phase === 'playing') animation = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(animation); cancelAnimationFrame(resizeFrame); resize.disconnect(); mutations.disconnect(); site?.removeEventListener('transitionend', transition); site?.removeEventListener('transitioncancel', transition) }
  }, [phase])
  return canvas
}

function useControls(root: React.RefObject<HTMLDivElement | null>, letters: string[], start: () => void, pause: () => void, keys: React.RefObject<Set<string>>) {
  const callbacks = useRef({ start, pause })
  callbacks.current = { start, pause }
  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('input,textarea,select,[contenteditable="true"]')
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.ctrlKey || event.metaKey || event.altKey) return
      if (!letters.includes(event.code)) return
      const rect = root.current?.getBoundingClientRect()
      if (!rect || rect.bottom < 0 || rect.top > innerHeight) return
      keys.current.add(event.code)
      callbacks.current.start()
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    const suspend = () => { keys.current.clear(); callbacks.current.pause() }
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) suspend() }
    const visibility = () => { if (document.hidden) suspend() }
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) suspend() })
    if (root.current) observer.observe(root.current)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', suspend)
    document.addEventListener('click', outside); document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', suspend); document.removeEventListener('click', outside); document.removeEventListener('visibilitychange', visibility) }
  }, [root, keys, letters.join(',')])
}

function burst(fx: Effects, x: number, y: number, count = 18, strength = 8) {
  for (let i = 0; i < count; i++) fx.particles.push({ x, y, vx: (Math.random() - .5) * strength, vy: (Math.random() - .5) * strength, life: 1, size: 1 + Math.random() * 3 })
}
function ring(fx: Effects, x: number, y: number, radius = 40, width = 3) { fx.rings.push({ x, y, radius: 4, target: radius, life: 1, width }) }
function updateEffects(fx: Effects) {
  for (const p of fx.particles) { p.x += p.vx; p.y += p.vy; p.vx *= .97; p.vy *= .97; p.life -= .025 }
  for (const r of fx.rings) { r.radius += (r.target - r.radius) * .14; r.life -= .045 }
  fx.particles = fx.particles.filter(p => p.life > 0); fx.rings = fx.rings.filter(r => r.life > 0); fx.shake *= .85
}
function drawEffects(ctx: CanvasRenderingContext2D, fx: Effects, ink: string) {
  ctx.fillStyle = ink; ctx.strokeStyle = ink
  for (const p of fx.particles) { ctx.globalAlpha = p.life; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill() }
  for (const r of fx.rings) { ctx.globalAlpha = r.life * .7; ctx.lineWidth = Math.max(.5, r.width * r.life); ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2); ctx.stroke() }
  ctx.globalAlpha = 1
}
function StartCard({ title, subtitle, axis, touch, onStart }: { title: string; subtitle: string; axis: 'vertical' | 'horizontal'; touch: boolean; onStart: () => void }) {
  return <button className="game-start-card" type="button" onClick={onStart}>
    <span className={`game-keys game-keys-${axis}`} aria-hidden="true">{touch ? axis === 'vertical' ? <MoveVertical size={28} strokeWidth={2.5} /> : <MoveHorizontal size={28} strokeWidth={2.5} /> : (axis === 'vertical' ? ['W', 'S'] : ['A', 'D']).map(key => <kbd key={key}>{key}</kbd>)}</span>
    <span className="game-start-copy"><strong>{title}</strong><small>{subtitle}</small></span>
  </button>
}

type PongBall = Point & { vx: number; vy: number; speed: number; spin: number; trail: Point[]; playerHit: boolean }
type Paddle = { y: number; height: number; base: number; target: number; timer: number; vy: number; previous: number; flash: number; squash: number }
type PongPower = Point & { kind: 'grow' | 'shrink' | 'multi'; age: number }
type PongState = { width: number; height: number; level: number; balls: PongBall[]; player: Paddle; ai: Paddle; serve: number; rally: number; aiError: number; aiPlanned: boolean; power: PongPower | null; powerTimer: number; wave: number; previousColors: Colors | null; fx: Effects; started: boolean }
const paddle = (height: number): Paddle => ({ y: height / 2 - 30, height: 60, base: 60, target: 60, timer: 0, vy: 0, previous: height / 2 - 30, flash: 0, squash: 0 })
const pongBall = (width: number, height: number): PongBall => ({ x: width / 2, y: height / 2, vx: 0, vy: 0, speed: 7.5, spin: 0, trail: [], playerHit: false })
function createPong(level: number): PongState { return { width: 900, height: 260, level, balls: [], player: paddle(260), ai: paddle(260), serve: 0, rally: 0, aiError: 0, aiPlanned: false, power: null, powerTimer: 360, wave: 0, previousColors: null, fx: { particles: [], rings: [], shake: 0 }, started: false } }

export function PongGame({ lang, onProgress, onThemeAdvance }: GameProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [courtHeight, setCourtHeight] = useState(260)
  const [face, setFace] = useState(0)
  const [faceVisible, setFaceVisible] = useState(true)
  const root = useRef<HTMLDivElement>(null)
  const keys = useRef(new Set<string>())
  const game = useRef(createPong(readLevel('pong')))
  const phaseRef = useRef(phase); phaseRef.current = phase
  const drag = useRef<{ y: number; height: number } | null>(null)
  const { touch, reduced } = usePreferences()
  const text = words[lang]
  const start = () => {
    if (phaseRef.current === 'playing') return
    const state = game.current
    if (!state.started) {
      state.started = true; state.balls = [pongBall(state.width, state.height)]; state.serve = 80
      saveProgress('pong', state.level); onProgress('pong', state.level)
    }
    phaseRef.current = 'playing'; setPhase('playing'); root.current?.focus({ preventScroll: true })
  }
  const pause = useCallback(() => { if (phaseRef.current === 'playing') { phaseRef.current = 'paused'; setPhase('paused') } }, [])
  useControls(root, ['KeyW', 'KeyS'], start, pause, keys)
  useEffect(() => {
    if (reduced || phase === 'playing') return
    let timeout = 0
    const timer = window.setInterval(() => {
      setFaceVisible(false)
      timeout = window.setTimeout(() => { setFace(current => (current + 1 + Math.floor(Math.random() * (faces.length - 1))) % faces.length); setFaceVisible(true) }, 200)
    }, 2000)
    return () => { clearInterval(timer); clearTimeout(timeout) }
  }, [phase, reduced])
  useEffect(() => {
    const resized = () => { pause(); setCourtHeight(height => clamp(height, 260, Math.max(260, innerHeight * .8))) }
    window.addEventListener('resize', resized)
    return () => window.removeEventListener('resize', resized)
  }, [pause])

  const frame = (ctx: CanvasRenderingContext2D, width: number, height: number, steps: number) => {
    const s = game.current, colors = theme(ctx.canvas)
    if (s.width !== width || s.height !== height) {
      for (const ball of s.balls) { ball.x *= width / s.width; ball.y *= height / s.height }
      s.player.y *= height / s.height; s.ai.y *= height / s.height; s.width = width; s.height = height
    }
    const resetBall = () => { s.balls = [pongBall(width, height)]; s.serve = 80; s.rally = 0 }
    const updatePaddle = (p: Paddle) => {
      if (p.timer > 0 && --p.timer === 0) p.target = p.base
      const center = p.y + p.height / 2; p.height += (p.target - p.height) * .15; p.y = clamp(center - p.height / 2, 0, height - p.height)
      p.vy = p.y - p.previous; p.previous = p.y; p.flash *= .88; p.squash *= .8
    }
    const normalize = (b: PongBall, speed: number) => { const current = Math.hypot(b.vx, b.vy) || 1; b.vx = b.vx / current * speed; b.vy = b.vy / current * speed; b.speed = speed }
    const collide = (b: PongBall, p: Paddle, direction: number) => {
      const angle = clamp((b.y - p.y - p.height / 2) / (p.height / 2 + 8), -1, 1) * Math.PI * .3
      const movingHit = direction === 1 && Math.abs(p.vy) > 7 * (height / 250) * .7
      b.speed = Math.min(Math.max(b.speed, Math.min(10.5 + s.level - 1, 18) + Math.min(s.rally * .15, 3)) + .35 + (movingHit ? 1.8 : 0), Math.min(19 + (s.level - 1) * .7, 24) + (movingHit ? 2 : 0))
      b.vx = direction * b.speed * Math.cos(angle); b.vy = b.speed * Math.sin(angle); b.spin = clamp(p.vy * .018, -.22, .22)
      b.x = direction === 1 ? 38 : width - 38; b.playerHit = direction === 1; s.rally++; p.flash = p.squash = 1
      ring(s.fx, b.x, b.y, movingHit ? 64 : 34); burst(s.fx, b.x, b.y, 10, 7); s.fx.shake = movingHit ? 7 : 3
      if (direction === 1) { s.player.base = Math.max(60, s.player.base - 5); if (!s.player.timer) s.player.target = s.player.base; s.aiError = (Math.random() - .5) * Math.max(.2, 1 - .1 * (s.level - 1)) * s.ai.height; s.aiPlanned = false }
    }
    for (let step = 0; step < steps && phaseRef.current === 'playing'; step++) {
      updateEffects(s.fx)
      if (keys.current.has('KeyW')) s.player.y -= 7 * height / 250
      if (keys.current.has('KeyS')) s.player.y += 7 * height / 250
      updatePaddle(s.player); updatePaddle(s.ai)
      if (s.wave) { s.wave += Math.hypot(width / 2, height / 2) / 45; if (s.wave > Math.hypot(width / 2, height / 2) + 50) { s.wave = 0; s.previousColors = null; resetBall() }; continue }
      if (s.serve > 0) {
        s.serve--; s.ai.y += (height / 2 - s.ai.height / 2 - s.ai.y) * .05
        if (!s.serve) { const angle = Math.random() * Math.PI / 4 - Math.PI / 8; s.balls[0].vx = (Math.random() > .5 ? 1 : -1) * 7.5 * Math.cos(angle); s.balls[0].vy = 7.5 * Math.sin(angle); ring(s.fx, width / 2, height / 2) }
        continue
      }
      const incoming = s.balls.filter(b => b.vx > 0).sort((a, b) => (width - a.x) / a.vx - (width - b.x) / b.vx)[0]
      let target = height / 2 + ((s.balls[0]?.y || height / 2) - height / 2) * .3
      if (incoming) {
        const range = height - 16, distance = (width - 38 - incoming.x) / incoming.vx
        let predicted = (incoming.y + incoming.vy * distance - 8) % (range * 2); if (predicted < 0) predicted += range * 2
        predicted = 8 + (predicted > range ? 2 * range - predicted : predicted)
        if (!s.aiPlanned && s.level >= 3 && incoming.x > width * .6) { s.aiPlanned = true; s.aiError += (s.player.y + s.player.height / 2 < height / 2 ? 1 : -1) * s.ai.height * .25 * Math.min(1, (s.level - 2) * .3) }
        target = incoming.y + (predicted - incoming.y) * Math.min(1, .4 + .12 * (s.level - 1)) - s.aiError
      }
      const aiSpeed = Math.min(5.2 + .6 * (s.level - 1), 11) * height / 250
      s.ai.y = clamp(s.ai.y + clamp((target - s.ai.y - s.ai.height / 2) * .2, -aiSpeed, aiSpeed), 0, height - s.ai.height)
      if (s.power) s.power.age++
      else if (--s.powerTimer <= 0) { const kinds: PongPower['kind'][] = s.balls.length < 3 ? ['grow', 'shrink', 'multi'] : ['grow', 'shrink']; s.power = { x: width * (.36 + Math.random() * .28), y: height * (.2 + Math.random() * .6), kind: kinds[Math.floor(Math.random() * kinds.length)], age: 0 } }
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i], minimum = Math.min(10.5 + s.level - 1, 18) + Math.min(s.rally * .15, 3)
        if (b.speed < minimum) normalize(b, b.speed + .08)
        if (Math.abs(b.spin) > .005) { b.vy += b.spin; b.spin *= .985; normalize(b, b.speed); if (Math.abs(b.vx) < b.speed * .55) { b.vx = Math.sign(b.vx || 1) * b.speed * .55; b.vy = Math.sign(b.vy || 1) * Math.sqrt(b.speed ** 2 - b.vx ** 2) } }
        b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 14) b.trail.shift()
        const subdivisions = Math.max(1, Math.ceil(b.speed / 5))
        for (let j = 0; j < subdivisions; j++) {
          b.x += b.vx / subdivisions; b.y += b.vy / subdivisions
          if (b.y < 8 || b.y > height - 8) { b.y = clamp(b.y, 8, height - 8); b.vy *= -1; b.spin *= -.6; ring(s.fx, b.x, b.y, 18, 2) }
          if (b.vx < 0 && b.x - 8 < 30 && b.x + 8 > 20 && b.y + 8 > s.player.y && b.y - 8 < s.player.y + s.player.height) collide(b, s.player, 1)
          else if (b.vx > 0 && b.x + 8 > width - 30 && b.x - 8 < width - 20 && b.y + 8 > s.ai.y && b.y - 8 < s.ai.y + s.ai.height) collide(b, s.ai, -1)
        }
        if (s.power && b.playerHit && Math.hypot(b.x - s.power.x, b.y - s.power.y) < 24) {
          if (s.power.kind === 'grow') { s.player.target = Math.min(s.player.base * 1.6, height * .55); s.player.timer = 540 }
          else if (s.power.kind === 'shrink') { s.ai.target = s.ai.base * .6; s.ai.timer = 540 }
          else if (s.balls.length < 3) { const extra = { ...b, vy: Math.abs(b.vy) > 1 ? -b.vy : b.speed * .45, trail: [] }; normalize(extra, b.speed); s.balls.push(extra) }
          burst(s.fx, s.power.x, s.power.y, 20, 10); ring(s.fx, s.power.x, s.power.y, 70); s.power = null; s.powerTimer = 420 + Math.random() * 300
        }
        if (b.x > width) {
          burst(s.fx, width, b.y, 60, 18); ring(s.fx, width, b.y, 160, 5); s.fx.shake = 14
          s.previousColors = colors; s.level++; s.wave = 1; s.balls = []; s.player.base = s.player.target = s.ai.base = s.ai.target = 60; s.player.timer = s.ai.timer = 0
          saveProgress('pong', s.level); onProgress('pong', s.level); onThemeAdvance(); break
        }
        if (b.x < 0) {
          s.balls.splice(i, 1); s.player.base = Math.min(120, s.player.base + 10); if (!s.player.timer) s.player.target = s.player.base
          burst(s.fx, 0, b.y, 25, 12); ring(s.fx, 0, b.y, 90, 4); s.fx.shake = 8
          if (!s.balls.length) { resetBall(); break }
        }
      }
    }
    if (!s.started) return
    const draw = (palette: Colors, level: number) => {
      ctx.fillStyle = palette.paper; ctx.fillRect(-20, -20, width + 40, height + 40)
      ctx.fillStyle = palette.ink; ctx.globalAlpha = .1
      for (let y = 0; y < height; y += 20) ctx.fillRect(width / 2 - 1, y, 2, 10)
      ctx.globalAlpha = .15; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${text.level} ${level}`, width / 2, height / 2); ctx.globalAlpha = 1
      for (const [p, x] of [[s.player, 20], [s.ai, width - 30]] as const) {
        const w = 10 * (1 + p.squash * .5), h = p.height * (1 - p.squash * .08), left = x + 5 - w / 2, top = p.y + p.height / 2 - h / 2
        ctx.fillStyle = palette.ink; ctx.fillRect(left, top, w, h)
        if (p.flash > .05) { ctx.globalAlpha = p.flash * .8; ctx.fillStyle = palette.paper; ctx.fillRect(left + 2, top + 2, w - 4, h - 4); ctx.globalAlpha = 1 }
      }
      ctx.fillStyle = palette.ink
      for (const b of s.balls) {
        let radius = 8
        if (s.serve > 25) radius = 0
        else if (s.serve) { const progress = 1 - s.serve / 25; radius *= Math.max(0, 1 + 2.70158 * (progress - 1) ** 3 + 1.70158 * (progress - 1) ** 2) }
        b.trail.forEach((p, index) => { const amount = (index + 1) / b.trail.length; ctx.globalAlpha = amount * .28; ctx.beginPath(); ctx.arc(p.x, p.y, radius * (.3 + .7 * amount), 0, Math.PI * 2); ctx.fill() })
        ctx.globalAlpha = 1; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx)); const stretch = 1 + Math.min(b.speed / 45, .3); ctx.beginPath(); ctx.ellipse(0, 0, radius * stretch, radius / stretch, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }
      if (s.power) { const p = s.power, radius = 14 * Math.min(1, p.age / 15) * (1 + Math.sin(p.age * .12) * .08); ctx.strokeStyle = palette.ink; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.lineDashOffset = -p.age * .5; ctx.beginPath(); ctx.arc(p.x, p.y, radius + 7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = palette.paper; ctx.font = 'bold 15px sans-serif'; ctx.fillText(p.kind === 'grow' ? '+' : p.kind === 'shrink' ? '−' : '×2', p.x, p.y + 1) }
      drawEffects(ctx, s.fx, palette.ink)
    }
    ctx.save()
    if (!reduced) ctx.translate((Math.random() - .5) * s.fx.shake * 2, (Math.random() - .5) * s.fx.shake * 2)
    if (s.wave && s.previousColors) { draw(s.previousColors, s.level - 1); ctx.save(); ctx.beginPath(); ctx.arc(width / 2, height / 2, s.wave, 0, Math.PI * 2); ctx.clip(); draw(colors, s.level); ctx.restore() } else draw(colors, s.level)
    ctx.restore()
  }
  const canvas = useGameCanvas(phase, frame)
  const touchMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || (event.target as HTMLElement).closest('.game-resize-handle')) return
    if (event.type === 'pointerdown') { start(); event.currentTarget.setPointerCapture(event.pointerId) }
    if (phaseRef.current === 'playing' && event.buttons) { const box = root.current!.getBoundingClientRect(); game.current.player.y = clamp(event.clientY - box.top - game.current.player.height / 2, 0, box.height - game.current.player.height) }
  }
  return <div ref={root} className="game-pong game-surface" data-phase={phase} style={{ height: courtHeight }} tabIndex={0} onPointerDown={touchMove} onPointerMove={touchMove} aria-label={`Pong · ${text.ws}`}>
    <canvas className="game-canvas" ref={canvas} aria-hidden="true" />
    {phase !== 'playing' && <div className="game-overlay game-pong-overlay"><div className={`game-face ${faceVisible ? '' : 'game-face-hidden'}`} aria-hidden="true">{faces[face]}</div><StartCard title={phase === 'idle' ? text.start : text.resume} subtitle={phase === 'idle' ? text.try : touch ? text.touch : text.ws} axis="vertical" touch={touch} onStart={start} /></div>}
    <div className="game-resize-handle" role="separator" tabIndex={0} aria-label={text.resize} aria-orientation="horizontal" aria-valuemin={260} aria-valuemax={Math.max(260, typeof window === 'undefined' ? 800 : innerHeight * .8)} aria-valuenow={courtHeight}
      onPointerDown={event => { event.stopPropagation(); event.preventDefault(); drag.current = { y: event.clientY, height: courtHeight }; event.currentTarget.setPointerCapture(event.pointerId) }}
      onPointerMove={event => { if (drag.current) setCourtHeight(clamp(drag.current.height + event.clientY - drag.current.y, 260, Math.max(260, innerHeight * .8))) }}
      onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
      onKeyDown={event => { if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); setCourtHeight(height => event.key === 'Home' ? 260 : event.key === 'End' ? Math.max(260, innerHeight * .8) : clamp(height + (event.key === 'ArrowDown' ? 20 : -20), 260, Math.max(260, innerHeight * .8))) } }}><span /></div>
  </div>
}

type BrickSpec = GameSkill & { id: number; hp: number; alive: boolean; x: number; y: number; width: number; height: number }
type BrickBall = Point & { vx: number; vy: number; trail: Point[] }
type Drop = Point & { kind: 'wide' | 'multi' | 'fire' | 'life'; age: number }
type BrickState = { level: number; width: number; height: number; bricks: BrickSpec[]; balls: BrickBall[]; drops: Drop[]; paddle: number; paddleWidth: number; previousPaddle: number; lives: number; speed: number; wide: number; fire: number; combo: number; fx: Effects; started: boolean; seed: number }
const defaultSkills: GameSkill[] = [
  ['Unity', true], ['Unreal Engine', true], ['Godot', true], ['Python', true], ['Java', true], ['C#', true], ['SQL', true], ['C++', false], ['Kotlin', false], ['TypeScript', false], ['HLSL', false], ['Vue', true], ['Astro', true], ['HTML', true], ['CSS', true], ['JavaScript', true], ['Three.js', true], ['Express', true], ['Springboot', true], ['Android', true], ['WordPress', false], ['React', false], ['Node.js', false], ['Oracle SQL', false], ['Raspberry Pi', false], ['MATLAB', false], ['Processing', false], ['游戏开发', true], ['机器学习', true], ['数据科学', true], ['计算机图形学', true], ['软件工程', true], ['Web 开发', true], ['信号处理', false], ['计算机视觉', false], ['移动端开发', false], ['数据库管理', false], ['战斗设计', true], ['系统设计', true], ['UI/UX 设计', true], ['关卡设计', false], ['Blender', true], ['Figma', true], ['Photoshop', true], ['AE', true], ['PR', true], ['Aseprite', true], ['Nuke', false], ['Houdini', false], ['WorldCreator', false],
].map(([name, proficient]) => ({ name: String(name), proficient: Boolean(proficient) }))
function brickSeed() {
  try { const previous = Number(sessionStorage.getItem('brickSessionSeed')); if (previous) return previous; const seed = Math.floor(Math.random() * 100000) || 1; sessionStorage.setItem('brickSessionSeed', String(seed)); return seed } catch { return 1987 }
}
function shuffled<T>(items: T[], seed: number): T[] {
  const next = () => { seed |= 0; seed = seed + 1831565813 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296 }
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) { const index = Math.floor(next() * (i + 1)); [copy[i], copy[index]] = [copy[index], copy[i]] }
  return copy
}
function createBrick(level: number): BrickState {
  return { level, width: 600, height: 700, bricks: [], balls: [], drops: [], paddle: 236, paddleWidth: 128, previousPaddle: 236, lives: 3, speed: Math.min(4.5 + level * .5, 12), wide: 0, fire: 0, combo: 0, fx: { particles: [], rings: [], shake: 0 }, started: false, seed: brickSeed() }
}

export function BrickGame({ lang, onProgress, onThemeAdvance, skills = defaultSkills }: GameProps & { skills?: GameSkill[] }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [level, setLevel] = useState(() => readLevel('brick'))
  const [lives, setLives] = useState(3)
  const [brickView, setBrickView] = useState<BrickSpec[]>([])
  const root = useRef<HTMLDivElement>(null), field = useRef<HTMLDivElement>(null)
  const ballLayer = useRef<HTMLDivElement>(null), paddleElement = useRef<HTMLDivElement>(null)
  const brickElements = useRef(new Map<number, HTMLDivElement>())
  const keys = useRef(new Set<string>()), game = useRef(createBrick(level))
  const phaseRef = useRef(phase); phaseRef.current = phase
  const { touch, reduced } = usePreferences(), text = words[lang]
  const source = useRef(skills); source.current = skills
  const launchBall = (ball: BrickBall) => { const angle = Math.random() * Math.PI / 3 - Math.PI / 6; ball.vx = game.current.speed * Math.sin(angle); ball.vy = -game.current.speed * Math.cos(angle) }
  const resetBall = () => { const s = game.current; s.balls = [{ x: s.paddle + s.paddleWidth / 2, y: s.height - 56, vx: 0, vy: 0, trail: [] }] }
  const prepareLevel = useCallback((next: number, restoreLives = true) => {
    const s = game.current
    s.level = next; s.width = root.current?.clientWidth || 600; s.height = root.current?.clientHeight || 700
    s.paddleWidth = 128; s.paddle = s.width / 2 - 64; s.previousPaddle = s.paddle; s.wide = s.fire = s.combo = 0; s.drops = []
    s.speed = Math.min(4.5 + next * .5, 12)
    if (restoreLives) { s.lives = 3; setLives(3) }
    const pool = shuffled(source.current.length ? source.current : defaultSkills, s.seed * 100 + next)
    s.bricks = Array.from({ length: Math.min(4 + (next - 1) * 2, 16) }, (_, i) => { const skill = pool[i % pool.length]; return { ...skill, id: i, hp: skill.proficient ? 2 : 1, alive: true, x: 0, y: 0, width: 0, height: 0 } })
    s.balls = [{ x: s.width / 2, y: s.height - 56, vx: 0, vy: 0, trail: [] }]
    setBrickView(s.bricks.map(brick => ({ ...brick })))
  }, [])
  useLayoutEffect(() => { prepareLevel(level) }, [level, prepareLevel])
  useLayoutEffect(() => {
    const measure = () => {
      const box = root.current
      if (!box || !field.current) return
      const s = game.current
      s.width = box.clientWidth; s.height = box.clientHeight
      s.paddle = phaseRef.current === 'idle' || phaseRef.current === 'next' || phaseRef.current === 'retry' ? (s.width - s.paddleWidth) / 2 : clamp(s.paddle, 0, s.width - s.paddleWidth)
      s.previousPaddle = s.paddle
      for (const brick of s.bricks) { const element = brickElements.current.get(brick.id); if (element) { brick.x = element.offsetLeft + field.current.offsetLeft; brick.y = element.offsetTop + field.current.offsetTop; brick.width = element.offsetWidth; brick.height = element.offsetHeight } }
      if (phaseRef.current !== 'playing') s.balls = [{ x: s.paddle + s.paddleWidth / 2, y: s.height - 56, vx: 0, vy: 0, trail: [] }]
    }
    measure(); const observer = new ResizeObserver(measure)
    if (root.current) observer.observe(root.current)
    return () => observer.disconnect()
  }, [brickView, level])
  const start = () => {
    if (phaseRef.current === 'playing') return
    const s = game.current
    if (!s.started) { s.started = true; saveProgress('brick', s.level); onProgress('brick', s.level) }
    if (phaseRef.current !== 'paused') { s.speed = Math.min(4.5 + s.level * .5, 12); s.balls.forEach(launchBall) }
    else if (s.balls.every(ball => !ball.vx && !ball.vy)) s.balls.forEach(launchBall)
    phaseRef.current = 'playing'; setPhase('playing'); root.current?.focus({ preventScroll: true })
  }
  const pause = useCallback(() => { if (phaseRef.current === 'playing') { phaseRef.current = 'paused'; setPhase('paused') } }, [])
  useControls(root, ['KeyA', 'KeyD'], start, pause, keys)
  const frame = (ctx: CanvasRenderingContext2D, width: number, height: number, steps: number) => {
    const s = game.current, colors = theme(ctx.canvas), paddleY = height - 44
    s.width = width; s.height = height
    const normalize = (ball: BrickBall) => {
      const speed = Math.hypot(ball.vx, ball.vy) || 1
      ball.vx = ball.vx / speed * s.speed; ball.vy = ball.vy / speed * s.speed
      if (Math.abs(ball.vy) < s.speed * .3) { ball.vy = Math.sign(ball.vy || -1) * s.speed * .3; ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(s.speed ** 2 - ball.vy ** 2) }
    }
    const clearLevel = () => {
      if (!s.bricks.length || !s.bricks.every(brick => !brick.alive)) return
      for (let i = 0; i < 5; i++) burst(s.fx, width * (.15 + i * .175), height * (.25 + Math.random() * .3), 22, 9)
      ring(s.fx, width / 2, height / 2, Math.max(width, height), 5)
      s.level++; saveProgress('brick', s.level); onProgress('brick', s.level); onThemeAdvance()
      phaseRef.current = 'next'; setPhase('next'); setLevel(s.level)
    }
    const hit = (ball: BrickBall, brick: BrickSpec) => {
      if (!s.fire) {
        const overlapX = Math.min(ball.x + 10 - brick.x, brick.x + brick.width - ball.x + 10), overlapY = Math.min(ball.y + 10 - brick.y, brick.y + brick.height - ball.y + 10)
        if (overlapX < overlapY) { ball.x += ball.x < brick.x + brick.width / 2 ? -overlapX : overlapX; ball.vx *= -1 }
        else { ball.y += ball.y < brick.y + brick.height / 2 ? -overlapY : overlapY; ball.vy *= -1 }
      }
      brick.hp = s.fire ? 0 : brick.hp - 1; s.combo++
      const x = brick.x + brick.width / 2, y = brick.y + brick.height / 2
      if (brick.hp > 0) { burst(s.fx, x, y, 6, 5); ring(s.fx, x, y, 30, 2); s.fx.shake = 2 }
      else {
        brick.alive = false; burst(s.fx, x, y, 14 + Math.min(s.combo, 8) * 2, 7); ring(s.fx, x, y, 40 + Math.min(s.combo, 6) * 8); s.fx.shake = 3 + Math.min(s.combo, 5)
        if (Math.random() <= .18) { const kinds: Drop['kind'][] = ['wide', 'multi', 'fire', 'wide', 'multi']; if (s.lives < 3) kinds.push('life'); s.drops.push({ x, y, age: 0, kind: kinds[Math.floor(Math.random() * kinds.length)] }) }
      }
      setBrickView(s.bricks.map(b => ({ ...b })))
      s.speed = Math.min(s.speed + .08, Math.min(4.5 + s.level * .5, 12) + 3); s.balls.forEach(normalize); clearLevel()
    }
    for (let step = 0; step < steps && phaseRef.current === 'playing'; step++) {
      updateEffects(s.fx)
      if (s.wide > 0) s.wide--; if (s.fire > 0) s.fire--
      const center = s.paddle + s.paddleWidth / 2
      s.paddleWidth += ((s.wide ? 128 * 1.6 : 128) - s.paddleWidth) * .2; s.paddle = center - s.paddleWidth / 2
      if (keys.current.has('KeyA')) s.paddle -= 11
      if (keys.current.has('KeyD')) s.paddle += 11
      s.paddle = clamp(s.paddle, 0, width - s.paddleWidth)
      const paddleVelocity = s.paddle - s.previousPaddle; s.previousPaddle = s.paddle
      for (let i = s.balls.length - 1; i >= 0 && phaseRef.current === 'playing'; i--) {
        const ball = s.balls[i]
        ball.trail.push({ x: ball.x, y: ball.y }); if (ball.trail.length > 12) ball.trail.shift()
        const subdivisions = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) / 6))
        for (let j = 0; j < subdivisions; j++) {
          ball.x += ball.vx / subdivisions; ball.y += ball.vy / subdivisions
          if (ball.x < 10 || ball.x > width - 10) { ball.x = clamp(ball.x, 10, width - 10); ball.vx *= -1; ring(s.fx, ball.x, ball.y, 16, 2) }
          if (ball.y < 10) { ball.y = 10; ball.vy = Math.abs(ball.vy); ring(s.fx, ball.x, ball.y, 16, 2) }
          if (ball.vy > 0 && ball.y + 10 > paddleY && ball.y - 10 < paddleY + 20 && ball.x + 10 > s.paddle && ball.x - 10 < s.paddle + s.paddleWidth) {
            const angle = clamp((ball.x - s.paddle - s.paddleWidth / 2) / (s.paddleWidth / 2), -1, 1) * Math.PI / 3 + clamp(paddleVelocity * .02, -.25, .25), speed = Math.hypot(ball.vx, ball.vy) || s.speed
            ball.vx = Math.sin(angle) * speed; ball.vy = -Math.abs(Math.cos(angle) * speed); ball.y = paddleY - 10; s.combo = 0; ring(s.fx, ball.x, paddleY, 26, 2); burst(s.fx, ball.x, paddleY, 5, 4)
          }
          let collided = false
          for (const brick of s.bricks) if (brick.alive && brick.width && ball.x + 10 > brick.x && ball.x - 10 < brick.x + brick.width && ball.y + 10 > brick.y && ball.y - 10 < brick.y + brick.height) { hit(ball, brick); collided = true; if (phaseRef.current !== 'playing' || !s.fire) break }
          if (phaseRef.current !== 'playing' || collided && !s.fire) break
        }
        if (ball.y - 10 > height) { s.balls.splice(i, 1); burst(s.fx, ball.x, height - 4, 18, 6); ring(s.fx, ball.x, height, 60) }
      }
      if (phaseRef.current !== 'playing') break
      if (!s.balls.length) {
        s.lives--; setLives(s.lives); s.fx.shake = 10; s.combo = 0
        if (!s.lives) { phaseRef.current = 'retry'; setPhase('retry'); prepareLevel(s.level); break }
        s.wide = s.fire = 0; s.drops = []; resetBall(); s.balls.forEach(launchBall)
      }
      for (let i = s.drops.length - 1; i >= 0; i--) {
        const drop = s.drops[i]; drop.y += 1.6; drop.age++
        if (drop.y + 12 > paddleY && drop.y - 12 < paddleY + 20 && drop.x > s.paddle - 8 && drop.x < s.paddle + s.paddleWidth + 8) {
          if (drop.kind === 'wide') s.wide = 600
          else if (drop.kind === 'fire') s.fire = 420
          else if (drop.kind === 'life') { s.lives = Math.min(3, s.lives + 1); setLives(s.lives) }
          else if (s.balls[0]) { const original = s.balls[0], speed = Math.hypot(original.vx, original.vy) || s.speed; for (const offset of [-.5, .5]) { const angle = Math.atan2(original.vy, original.vx) + offset; s.balls.push({ x: original.x, y: original.y, vx: Math.cos(angle) * speed, vy: -Math.abs(Math.sin(angle) * speed), trail: [] }) } }
          ring(s.fx, drop.x, drop.y, 60); burst(s.fx, drop.x, drop.y, 16, 6); s.drops.splice(i, 1)
        } else if (drop.y > height + 20) s.drops.splice(i, 1)
      }
    }
    ctx.save()
    if (!reduced && phaseRef.current === 'playing') ctx.translate((Math.random() - .5) * s.fx.shake * 2, (Math.random() - .5) * s.fx.shake * 2)
    ctx.fillStyle = colors.ink
    for (const ball of s.balls) {
      ball.trail.forEach((point, index) => { const fraction = (index + 1) / ball.trail.length; ctx.globalAlpha = fraction * (s.fire ? .5 : .25); ctx.beginPath(); ctx.arc(point.x, point.y, 10 * (.3 + .7 * fraction), 0, Math.PI * 2); ctx.fill() })
      ctx.globalAlpha = 1
    }
    if (ballLayer.current) {
      const layer = ballLayer.current
      while (layer.childElementCount > s.balls.length) layer.lastElementChild?.remove()
      s.balls.forEach((ball, index) => {
        let element = layer.children[index] as HTMLDivElement | undefined
        if (!element) { element = document.createElement('div'); element.className = 'game-brick-ball'; layer.appendChild(element) }
        element.style.left = `${ball.x - 10}px`; element.style.top = `${ball.y - 10}px`; element.style.scale = s.fire ? '1.2' : '1'; element.style.boxShadow = s.fire ? `0 0 14px 4px ${colors.ink}` : ''
      })
    }
    if (paddleElement.current) { paddleElement.current.style.left = `${s.paddle}px`; paddleElement.current.style.width = `${s.paddleWidth}px` }
    drawEffects(ctx, s.fx, colors.ink)
    for (const drop of s.drops) {
      ctx.fillStyle = colors.ink; ctx.beginPath(); ctx.arc(drop.x, drop.y, 12 * (1 + Math.sin(drop.age * .2) * .08), 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
      if (drop.kind === 'multi') { for (const [x, y] of [[0, -4], [-4, 3], [4, 3]]) { ctx.beginPath(); ctx.arc(drop.x + x, drop.y + y, 2.2, 0, Math.PI * 2); ctx.fill() } }
      else if (drop.kind === 'fire') { ctx.beginPath(); ctx.moveTo(drop.x, drop.y - 6); ctx.lineTo(drop.x + 5, drop.y); ctx.lineTo(drop.x, drop.y + 6); ctx.lineTo(drop.x - 5, drop.y); ctx.closePath(); ctx.fill() }
      else { ctx.beginPath(); ctx.moveTo(drop.x - 5, drop.y); ctx.lineTo(drop.x + 5, drop.y); if (drop.kind === 'life') { ctx.moveTo(drop.x, drop.y - 5); ctx.lineTo(drop.x, drop.y + 5) } else { ctx.moveTo(drop.x - 3, drop.y - 3); ctx.lineTo(drop.x - 6, drop.y); ctx.lineTo(drop.x - 3, drop.y + 3); ctx.moveTo(drop.x + 3, drop.y - 3); ctx.lineTo(drop.x + 6, drop.y); ctx.lineTo(drop.x + 3, drop.y + 3) }; ctx.stroke() }
    }
    ctx.restore()
  }
  const canvas = useGameCanvas(phase, frame)
  const pointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return
    if (event.type === 'pointerdown') { start(); event.currentTarget.setPointerCapture(event.pointerId) }
    if (phaseRef.current === 'playing' && event.buttons) { const bounds = event.currentTarget.getBoundingClientRect(), s = game.current; s.paddle = clamp((event.clientX - bounds.left) * event.currentTarget.clientWidth / bounds.width - s.paddleWidth / 2, 0, s.width - s.paddleWidth) }
  }
  const title = phase === 'next' ? text.next : phase === 'retry' ? text.retry : phase === 'paused' ? text.resume : text.start
  return <div ref={root} className="game-bricks game-surface" data-phase={phase} tabIndex={0} onPointerDown={pointer} onPointerMove={pointer} aria-label={`Brick breaker · ${text.ad}`}>
    <div ref={field} className="game-brick-field" aria-hidden="true">{brickView.map(brick => <div key={`${level}-${brick.id}`} ref={element => { if (element) brickElements.current.set(brick.id, element); else brickElements.current.delete(brick.id) }} className={`game-skill-brick ${brick.hp > 1 ? 'game-skill-proficient' : 'game-skill-experienced'} ${brick.alive ? '' : 'game-skill-broken'}`}>{brick.icon && <span className="game-skill-icon">{brick.icon}</span>}<span>{brick.name}</span></div>)}</div>
    <canvas className="game-canvas" ref={canvas} aria-hidden="true" />
    <div ref={ballLayer} className="game-brick-balls" aria-hidden="true" />
    <div ref={paddleElement} className="game-brick-paddle" aria-hidden="true" />
    <div className="game-lives" aria-label={`${lives} / 3`} role="status">{[0, 1, 2].map(index => <span className={index < lives ? 'game-life-full' : ''} key={index} />)}</div>
    {phase !== 'playing' && <div className="game-overlay game-brick-overlay"><h3>{text.level} <span>{level}</span></h3><StartCard title={title} subtitle={touch ? text.touch : text.ad} axis="horizontal" touch={touch} onStart={start} /></div>}
  </div>
}
