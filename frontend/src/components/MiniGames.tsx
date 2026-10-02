import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import './mini-games.css'

type GameProps = { lang: 'zh' | 'en'; onReward: (amount: number) => void }
type Phase = 'idle' | 'playing' | 'paused' | 'won' | 'lost'
type Frame = (context: CanvasRenderingContext2D, width: number, height: number, delta: number) => void
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max))

// Canvas pixels track the display density; game time never catches up after a suspended tab.
function useGameCanvas(phase: Phase, frame: Frame, suspend: () => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(frame)
  const suspendRef = useRef(suspend)
  frameRef.current = frame
  suspendRef.current = suspend

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let animation = 0
    let last = 0
    const paint = (time: number, animate: boolean) => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      const delta = animate && last ? Math.min((time - last) / 1000, 0.032) : 0
      last = time
      frameRef.current(context, width, height, delta)
    }
    const tick = (time: number) => {
      if (document.hidden) { last = 0; return }
      paint(time, true)
      animation = requestAnimationFrame(tick)
    }
    const resize = new ResizeObserver(() => paint(0, false))
    resize.observe(canvas)
    const themeRoot = canvas.closest('.site')
    const repaintTheme = () => { if (phase !== 'playing') paint(0, false) }
    const onThemeTransitionEnd = (event: Event) => {
      if (event.target === themeRoot) repaintTheme()
    }
    const themeObserver = new MutationObserver(repaintTheme)
    if (themeRoot) {
      themeObserver.observe(themeRoot, { attributes: true, attributeFilter: ['style'] })
      themeRoot.addEventListener('transitionend', onThemeTransitionEnd)
      themeRoot.addEventListener('transitioncancel', onThemeTransitionEnd)
    }
    paint(0, false)
    if (phase === 'playing') animation = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animation)
      resize.disconnect()
      themeObserver.disconnect()
      themeRoot?.removeEventListener('transitionend', onThemeTransitionEnd)
      themeRoot?.removeEventListener('transitioncancel', onThemeTransitionEnd)
    }
  }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onVisibility = () => { if (document.hidden) suspendRef.current() }
    const onWindowBlur = () => suspendRef.current()
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) suspendRef.current()
    }, { threshold: 0.05 })
    observer.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onWindowBlur)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onWindowBlur)
    }
  }, [])
  return canvasRef
}

function inkColor(canvas: HTMLCanvasElement | null) {
  return canvas ? getComputedStyle(canvas).getPropertyValue('--ink').trim() || '#0058c0' : '#0058c0'
}

function GameTools({ phase, lang, toggle, restart }: { phase: Phase; lang: GameProps['lang']; toggle: () => void; restart: () => void }) {
  if (phase === 'idle') return null
  return <div className="game-tools">
    {(phase === 'playing' || phase === 'paused') && <button type="button" className="game-icon-button" onClick={toggle} aria-label={lang === 'zh' ? phase === 'playing' ? '暂停游戏' : '继续游戏' : phase === 'playing' ? 'Pause game' : 'Resume game'}>{phase === 'playing' ? <Pause size={16} /> : <Play size={16} />}</button>}
    <button type="button" className="game-icon-button" onClick={restart} aria-label={lang === 'zh' ? '重新开始' : 'Restart game'}><RotateCcw size={16} /></button>
  </div>
}

type PongState = { width: number; height: number; x: number; y: number; vx: number; vy: number; py: number; ai: number; player: number; opponent: number }
const newPong = (width = 900, height = 260): PongState => ({ width, height, x: width / 2, y: height / 2, vx: -Math.max(290, width * 0.43), vy: 115, py: height / 2, ai: height / 2, player: 0, opponent: 0 })

export function PongGame({ lang, onReward }: GameProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState([0, 0])
  const root = useRef<HTMLDivElement>(null)
  const game = useRef(newPong())
  const keys = useRef(new Set<string>())
  const pointerY = useRef<number | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const suspend = useCallback(() => { keys.current.clear(); setPhase(current => current === 'playing' ? 'paused' : current) }, [])

  const frame: Frame = (ctx, width, height, dt) => {
    const state = game.current
    if (state.width !== width || state.height !== height) {
      state.x *= width / state.width
      state.y *= height / state.height
      state.py *= height / state.height
      state.ai *= height / state.height
      state.width = width
      state.height = height
    }
    const paddleHeight = 62
    const paddleWidth = 7
    const margin = width < 500 ? 14 : 28
    const ballRadius = 6
    if (dt && phaseRef.current === 'playing') {
      const up = keys.current.has('w') || keys.current.has('arrowup')
      const down = keys.current.has('s') || keys.current.has('arrowdown')
      if (up || down) { state.py += (Number(down) - Number(up)) * 360 * dt; pointerY.current = null }
      else if (pointerY.current !== null) state.py = pointerY.current
      state.py = clamp(state.py, paddleHeight / 2 + 8, height - paddleHeight / 2 - 8)
      const target = state.vx > 0 ? state.y : height / 2
      state.ai += clamp(target - state.ai, -180 * dt, 180 * dt)
      state.ai = clamp(state.ai, paddleHeight / 2 + 8, height - paddleHeight / 2 - 8)
      const previousX = state.x
      state.x += state.vx * dt
      state.y += state.vy * dt
      if (state.y < ballRadius || state.y > height - ballRadius) {
        state.y = clamp(state.y, ballRadius, height - ballRadius)
        state.vy *= -1
      }
      const left = margin + paddleWidth + ballRadius
      const right = width - margin - paddleWidth - ballRadius
      if (state.vx < 0 && previousX >= left && state.x <= left && Math.abs(state.y - state.py) < paddleHeight / 2 + ballRadius) {
        state.x = left
        const speed = Math.min(Math.hypot(state.vx, state.vy) * 1.045, Math.max(550, width * .7))
        const angle = clamp((state.y - state.py) / (paddleHeight / 2), -1, 1) * .95
        state.vx = speed * Math.cos(angle)
        state.vy = speed * Math.sin(angle)
      }
      if (state.vx > 0 && previousX <= right && state.x >= right && Math.abs(state.y - state.ai) < paddleHeight / 2 + ballRadius) {
        state.x = right
        const speed = Math.min(Math.hypot(state.vx, state.vy) * 1.025, Math.max(550, width * .7))
        const angle = clamp((state.y - state.ai) / (paddleHeight / 2), -1, 1) * .9
        state.vx = -speed * Math.cos(angle)
        state.vy = speed * Math.sin(angle)
      }
      if (state.x < -ballRadius || state.x > width + ballRadius) {
        const playerScored = state.x > width
        if (playerScored) state.player += 1
        else state.opponent += 1
        setScore([state.player, state.opponent])
        if (state.player === 5 || state.opponent === 5) {
          const next = state.player === 5 ? 'won' : 'lost'
          phaseRef.current = next
          setPhase(next)
          if (next === 'won') onReward(50)
        }
        state.x = width / 2
        state.y = height / 2
        state.vx = (playerScored ? -1 : 1) * Math.max(260, width * .38)
        state.vy = (Math.random() - .5) * 180
      }
    }
    ctx.fillStyle = inkColor(ctx.canvas)
    ctx.globalAlpha = .12
    for (let y = 10; y < height; y += 19) ctx.fillRect(width / 2 - 1, y, 2, 8)
    ctx.globalAlpha = phaseRef.current === 'idle' ? .65 : 1
    ctx.beginPath(); ctx.roundRect(margin, state.py - paddleHeight / 2, paddleWidth, paddleHeight, 4); ctx.fill()
    ctx.beginPath(); ctx.roundRect(width - margin - paddleWidth, state.ai - paddleHeight / 2, paddleWidth, paddleHeight, 4); ctx.fill()
    if (phaseRef.current !== 'idle') { ctx.beginPath(); ctx.arc(state.x, state.y, ballRadius, 0, Math.PI * 2); ctx.fill() }
    ctx.globalAlpha = 1
  }
  const canvas = useGameCanvas(phase, frame, suspend)
  const start = () => {
    const rect = canvas.current?.getBoundingClientRect()
    game.current = newPong(rect?.width, rect?.height)
    keys.current.clear(); pointerY.current = null
    setScore([0, 0]); phaseRef.current = 'playing'; setPhase('playing'); root.current?.focus({ preventScroll: true })
  }
  const toggle = () => { setPhase(current => current === 'playing' ? 'paused' : 'playing'); keys.current.clear(); root.current?.focus({ preventScroll: true }) }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const key = event.key.toLowerCase()
    if (['w', 's', 'arrowup', 'arrowdown', ' ', 'escape'].includes(key)) {
      event.preventDefault()
      if (key === ' ' && !event.repeat) { if (phase === 'idle' || phase === 'won' || phase === 'lost') start(); else toggle() }
      else if (key === 'escape') suspend()
      else keys.current.add(key)
    }
  }
  const pointer = (event: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing') return
    pointerY.current = event.clientY - event.currentTarget.getBoundingClientRect().top
    if (event.type === 'pointerdown') { event.currentTarget.setPointerCapture(event.pointerId); root.current?.focus({ preventScroll: true }) }
  }
  return <div className={`game-pong game-surface ${phase === 'playing' ? 'game-active' : ''}`} ref={root} tabIndex={0} onKeyDown={keyDown} onKeyUp={event => keys.current.delete(event.key.toLowerCase())} onBlur={() => keys.current.clear()} aria-label={lang === 'zh' ? '乒乓球游戏。W、S 或上下键移动，空格暂停。' : 'Pong. Move with W, S or arrow keys; space to pause.'}>
    <canvas className="game-canvas" ref={canvas} onPointerDown={pointer} onPointerMove={pointer} aria-hidden="true" />
    {phase !== 'idle' && <div className="game-pong-score" aria-live="polite"><span>{score[0]}</span><span className="game-score-divider">:</span><span>{score[1]}</span></div>}
    <GameTools phase={phase} lang={lang} toggle={toggle} restart={start} />
    {phase !== 'playing' && <div className="game-overlay">
      <div className="game-face" aria-hidden="true">{phase === 'won' ? '(^▽^)' : phase === 'lost' ? '(・ω・)' : '(^ω^)'}</div>
      {phase === 'idle' ? <button className="game-start-card game-pong-start" type="button" onClick={start}><span className="game-key-pair"><kbd>W</kbd><kbd>S</kbd></span><span>{lang === 'zh' ? '来打场乒乓？' : 'Fancy a game of Pong?'}<small>{lang === 'zh' ? '点击开始 · 先得 5 分获胜' : 'Click to play · First to 5 wins'}</small></span><Play size={18} fill="currentColor" /></button> : <button className="game-start-card" type="button" onClick={phase === 'paused' ? toggle : start}><Play size={17} fill="currentColor" /><span>{phase === 'paused' ? lang === 'zh' ? '继续游戏' : 'Resume game' : phase === 'won' ? lang === 'zh' ? '你赢啦！+50 XP · 再来一局' : 'You won! +50 XP · Play again' : lang === 'zh' ? '再来一局？' : 'One more round?'}</span></button>}
    </div>}
    <span className="game-pong-caption">{lang === 'zh' ? '休息一下，玩一会儿' : 'Take a break. Play a little.'}</span>
    <div className="game-pong-rail" aria-hidden="true"><span /></div>
  </div>
}

type Brick = { x: number; y: number; width: number; height: number; alive: boolean; shade: number }
type BrickState = { x: number; y: number; vx: number; vy: number; paddle: number; bricks: Brick[]; lives: number; score: number; serve: number }
const newBricks = (): BrickState => ({
  x: 300, y: 507, vx: 145, vy: -285, paddle: 300, lives: 3, score: 0, serve: .65,
  bricks: Array.from({ length: 48 }, (_, index) => ({ x: 29 + (index % 8) * 69, y: 85 + Math.floor(index / 8) * 35, width: 59, height: 25, alive: true, shade: .23 + ((index * 7 + Math.floor(index / 8)) % 5) * .15 })),
})

export function BrickGame({ lang, onReward }: GameProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [stats, setStats] = useState({ score: 0, lives: 3 })
  const root = useRef<HTMLDivElement>(null)
  const game = useRef(newBricks())
  const keys = useRef(new Set<string>())
  const pointerX = useRef<number | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const suspend = useCallback(() => { keys.current.clear(); setPhase(current => current === 'playing' ? 'paused' : current) }, [])
  const frame: Frame = (ctx, width, height, delta) => {
    const state = game.current
    const paddleWidth = 94
    const paddleY = 534
    const radius = 7
    ctx.save()
    ctx.scale(width / 600, height / 600)
    if (delta && phaseRef.current === 'playing') {
      const left = keys.current.has('a') || keys.current.has('arrowleft')
      const right = keys.current.has('d') || keys.current.has('arrowright')
      if (left || right) { state.paddle += (Number(right) - Number(left)) * 430 * delta; pointerX.current = null }
      else if (pointerX.current !== null) state.paddle = pointerX.current
      state.paddle = clamp(state.paddle, paddleWidth / 2 + 14, 600 - paddleWidth / 2 - 14)
      if (state.serve > 0) { state.serve -= delta; state.x = state.paddle; state.y = paddleY - radius - 3 }
      else {
        // Small physics steps avoid passing through a brick or paddle on slow frames.
        const steps = Math.max(1, Math.ceil(delta / .006))
        const dt = delta / steps
        for (let step = 0; step < steps; step += 1) {
          const previousY = state.y
          state.x += state.vx * dt
          state.y += state.vy * dt
          if (state.x < radius + 9 || state.x > 591 - radius) { state.x = clamp(state.x, radius + 9, 591 - radius); state.vx *= -1 }
          if (state.y < radius + 51) { state.y = radius + 51; state.vy = Math.abs(state.vy) }
          if (state.vy > 0 && previousY + radius <= paddleY && state.y + radius >= paddleY && state.x > state.paddle - paddleWidth / 2 - radius && state.x < state.paddle + paddleWidth / 2 + radius) {
            state.y = paddleY - radius
            const angle = clamp((state.x - state.paddle) / (paddleWidth / 2), -.96, .96) * 1.08
            const speed = Math.min(Math.hypot(state.vx, state.vy) + 4, 440)
            state.vx = speed * Math.sin(angle)
            state.vy = -speed * Math.cos(angle)
          }
          for (const brick of state.bricks) {
            if (!brick.alive) continue
            const closestX = clamp(state.x, brick.x, brick.x + brick.width)
            const closestY = clamp(state.y, brick.y, brick.y + brick.height)
            if ((state.x - closestX) ** 2 + (state.y - closestY) ** 2 >= radius ** 2) continue
            brick.alive = false
            state.score += 10
            const overlapX = Math.min(state.x + radius - brick.x, brick.x + brick.width - state.x + radius)
            const overlapY = Math.min(state.y + radius - brick.y, brick.y + brick.height - state.y + radius)
            if (overlapX < overlapY) { state.x += state.x < brick.x + brick.width / 2 ? -overlapX : overlapX; state.vx *= -1 }
            else { state.y += state.y < brick.y + brick.height / 2 ? -overlapY : overlapY; state.vy *= -1 }
            setStats({ score: state.score, lives: state.lives })
            break
          }
          if (state.bricks.every(brick => !brick.alive)) { phaseRef.current = 'won'; setPhase('won'); onReward(80); break }
          if (state.y > 610) {
            state.lives -= 1
            setStats({ score: state.score, lives: state.lives })
            if (!state.lives) { phaseRef.current = 'lost'; setPhase('lost') }
            else { state.serve = .85; state.x = state.paddle; state.y = paddleY - radius - 3; state.vx = 145 * (state.lives % 2 ? 1 : -1); state.vy = -285 }
            break
          }
        }
      }
    }
    ctx.fillStyle = inkColor(ctx.canvas)
    for (const brick of state.bricks) {
      if (!brick.alive) continue
      ctx.globalAlpha = brick.shade
      ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 5); ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.beginPath(); ctx.roundRect(state.paddle - paddleWidth / 2, paddleY, paddleWidth, 9, 5); ctx.fill()
    ctx.beginPath(); ctx.arc(state.x, state.y, radius, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }
  const canvas = useGameCanvas(phase, frame, suspend)
  const start = () => { game.current = newBricks(); pointerX.current = null; keys.current.clear(); setStats({ score: 0, lives: 3 }); phaseRef.current = 'playing'; setPhase('playing'); root.current?.focus({ preventScroll: true }) }
  const toggle = () => { keys.current.clear(); setPhase(current => current === 'playing' ? 'paused' : 'playing'); root.current?.focus({ preventScroll: true }) }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const key = event.key.toLowerCase()
    if (['a', 'd', 'arrowleft', 'arrowright', ' ', 'escape'].includes(key)) {
      event.preventDefault()
      if (key === ' ' && !event.repeat) { if (phase === 'idle' || phase === 'won' || phase === 'lost') start(); else toggle() }
      else if (key === 'escape') suspend()
      else keys.current.add(key)
    }
  }
  const pointer = (event: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing') return
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.current = (event.clientX - rect.left) / rect.width * 600
    if (event.type === 'pointerdown') { event.currentTarget.setPointerCapture(event.pointerId); root.current?.focus({ preventScroll: true }) }
  }
  return <div ref={root} className={`game-bricks game-surface ${phase === 'playing' ? 'game-active' : ''}`} tabIndex={0} onKeyDown={keyDown} onKeyUp={event => keys.current.delete(event.key.toLowerCase())} onBlur={() => keys.current.clear()} aria-label={lang === 'zh' ? '打砖块游戏。A、D 或左右键移动，空格暂停。' : 'Brick breaker. Move with A, D or arrow keys; space to pause.'}>
    <canvas className="game-canvas" ref={canvas} onPointerDown={pointer} onPointerMove={pointer} aria-hidden="true" />
    <div className="game-brick-stats" aria-live="polite"><span>{lang === 'zh' ? '得分' : 'SCORE'} <b>{String(stats.score).padStart(3, '0')}</b></span><span aria-label={lang === 'zh' ? `${stats.lives} 条生命` : `${stats.lives} lives`}>{'♥'.repeat(stats.lives)}<span className="game-lost-heart">{'♥'.repeat(3 - stats.lives)}</span></span></div>
    <GameTools phase={phase} lang={lang} toggle={toggle} restart={start} />
    {phase !== 'playing' && <div className="game-overlay game-brick-overlay">
      <div className="game-brick-title">{phase === 'idle' ? lang === 'zh' ? '打砖块' : 'BRICK BREAKER' : phase === 'paused' ? lang === 'zh' ? '休息一会儿' : 'TAKE A BREATHER' : phase === 'won' ? lang === 'zh' ? '全部击破！' : 'ALL CLEAR!' : lang === 'zh' ? '再试一次？' : 'ONE MORE TRY?'}</div>
      <button className="game-start-card" type="button" onClick={phase === 'paused' ? toggle : start}><Play size={17} fill="currentColor" /><span>{phase === 'paused' ? lang === 'zh' ? '继续游戏' : 'Resume game' : phase === 'won' ? lang === 'zh' ? '+80 XP · 再来一局' : '+80 XP · Play again' : phase === 'lost' ? lang === 'zh' ? '重新开始' : 'Try again' : lang === 'zh' ? '点击开始' : 'Click to play'}</span></button>
      {phase === 'idle' && <div className="game-brick-help"><kbd>A</kbd><kbd>D</kbd><span>{lang === 'zh' ? '或' : 'or'}</span><kbd><ArrowLeft size={12} /></kbd><kbd><ArrowRight size={12} /></kbd><span>{lang === 'zh' ? '移动挡板' : 'to move'}</span></div>}
    </div>}
    <div className="game-brick-caption">{lang === 'zh' ? '鼠标 / 触屏也可以玩' : 'Mouse & touch work, too.'}</div>
  </div>
}
