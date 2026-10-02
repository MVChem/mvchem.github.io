import { useEffect } from 'react'

/** Replay section entrances on scroll; the hero is revealed only once. */
export function useReveal(key: string) {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const groups = [...document.querySelectorAll<HTMLElement>('[data-reveal-group]')]
    for (const group of groups) {
      const stagger = Number(group.dataset.revealGroup) || 70
      ;[...group.children].forEach((child, index) => {
        if (!(child instanceof HTMLElement)) return
        child.dataset.reveal = child.dataset.reveal || 'up'
        child.style.setProperty('--reveal-delay', `${Math.min(index, 8) * stagger}ms`)
      })
    }
    const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]')]
    const entered = new WeakSet<Element>()
    const enter = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const el = entry.target as HTMLElement
      el.classList.remove('is-exited'); el.classList.add('is-revealed'); entered.add(el)
      if (el.closest('[data-reveal-once]')) { enter.unobserve(el); leave.unobserve(el) }
    }), { rootMargin: '-6% 0px -6% 0px' })
    const leave = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting || !entered.has(entry.target)) return
      const el = entry.target as HTMLElement
      el.style.setProperty('--exit-y', entry.boundingClientRect.top < 0 ? '-10px' : '10px')
      el.classList.remove('is-revealed'); el.classList.add('is-exited')
    }))
    elements.forEach(el => { el.classList.add('reveal-ready'); enter.observe(el); leave.observe(el) })
    return () => { enter.disconnect(); leave.disconnect(); elements.forEach(el => el.classList.remove('reveal-ready', 'is-revealed', 'is-exited')) }
  }, [key])
}
