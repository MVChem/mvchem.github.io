import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ExperienceGame = 'pong' | 'brick'
export interface ExperienceBadge {
  game: ExperienceGame
  label: 'Pong' | 'Brick'
  level: number
  bonusRate: number
}

interface GameProgress { started: boolean; level: number }
interface PlayerProgress {
  level: number
  currentXp: number
  games: Record<ExperienceGame, GameProgress>
}

const games: ExperienceGame[] = ['pong', 'brick']
export const experienceThreshold = (level: number) => Math.floor(10 * 1.5 ** level)

function readStorage(key: string, session = false): string | null {
  try { return (session ? sessionStorage : localStorage).getItem(key) } catch { return null }
}

function writeStorage(key: string, value: number | boolean, session = false) {
  try { (session ? sessionStorage : localStorage).setItem(key, String(value)) } catch { /* Storage is optional. */ }
}

function nonnegativeInteger(value: string | null, fallback = 0) {
  const number = value === null ? fallback : Number.parseInt(value, 10)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

function initialProgress(): PlayerProgress {
  const progress = {} as Record<ExperienceGame, GameProgress>
  for (const game of games) {
    progress[game] = {
      started: readStorage(`${game}HasStarted`) === 'true' || readStorage(`${game}HasStarted`, true) === 'true',
      level: Math.max(1, nonnegativeInteger(readStorage(`${game}Level`) ?? readStorage(`${game}Level`, true), 1)),
    }
  }
  return {
    level: nonnegativeInteger(readStorage('idle_playerLevel')),
    currentXp: nonnegativeInteger(readStorage('idle_playerExp')),
    games: progress,
  }
}

/** The reference's idle progression: +1 EXP/s, plus each started game's level (capped at 6). */
export function useExperience() {
  const [progress, setProgress] = useState<PlayerProgress>(initialProgress)
  const badges = useMemo<ExperienceBadge[]>(() => games.flatMap(game => {
    const state = progress.games[game]
    if (!state.started) return []
    const level = Math.min(state.level, 6)
    return [{ game, label: game === 'pong' ? 'Pong' : 'Brick', level, bonusRate: level }]
  }), [progress.games])
  const rate = 1 + badges.reduce((total, badge) => total + badge.bonusRate, 0)
  const rateRef = useRef(rate)
  rateRef.current = rate

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return
      setProgress(previous => {
        let { level, currentXp } = previous
        currentXp += rateRef.current
        while (currentXp >= experienceThreshold(level)) {
          currentXp -= experienceThreshold(level)
          level += 1
        }
        return { ...previous, level, currentXp }
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    writeStorage('idle_playerLevel', progress.level)
    writeStorage('idle_playerExp', progress.currentXp)
  }, [progress.level, progress.currentXp])

  const onProgress = useCallback((game: ExperienceGame, level: number) => {
    if (!Number.isFinite(level) || level < 1) return
    const nextLevel = Math.floor(level)
    for (const session of [false, true]) {
      writeStorage(`${game}HasStarted`, true, session)
      writeStorage(`${game}Level`, nextLevel, session)
    }
    setProgress(previous => {
      if (previous.games[game].started && previous.games[game].level === nextLevel) return previous
      return { ...previous, games: { ...previous.games, [game]: { started: true, level: nextLevel } } }
    })
  }, [])

  return {
    level: progress.level,
    currentXp: progress.currentXp,
    nextLevelXp: experienceThreshold(progress.level),
    rate,
    badges,
    onProgress,
  }
}

export type ExperienceState = ReturnType<typeof useExperience>
