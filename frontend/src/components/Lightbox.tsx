import { useEffect, useRef } from 'react'

export interface Zoom { src: string; caption: string; link?: string; opener?: HTMLElement | null }

/** Full-size view of a paper or project figure. */
export default function Lightbox({ zoom, onClose }: { zoom: Zoom; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = zoom.opener
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const items = [...document.querySelectorAll<HTMLElement>('.lightbox a, .lightbox button')]
        const first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key); opener?.focus() }
  }, [zoom, onClose])
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label={zoom.caption} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <button ref={close} type="button" className="lightbox__close" aria-label="Close figure" onClick={onClose}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
    <figure className="lightbox__figure">
      <img src={zoom.src} alt={zoom.caption} />
      <figcaption><span>{zoom.caption}</span>{zoom.link && <a href={zoom.link} target="_blank" rel="noopener noreferrer">Open paper ↗</a>}</figcaption>
    </figure>
  </div>
}
