import { useCallback, useEffect, useState } from 'react'
import snapshotUrl from '../assets/visitor-map.png'
import snapshot from '../assets/visitor-map.json'
import config from './visitor-map-config.json'
import './visitor-map.css'

export const VISITOR_STATS_URL = config.statisticsUrl
const snapshotDate = new Date(snapshot.updatedAt).toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
})

export default function VisitorMap() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt(value => value + 1)
  }, [])

  useEffect(() => {
    if (status === 'ready') return
    // Bound both a stalled request and automatic retries. Keep the live image
    // mounted so a late successful response can still replace the saved map.
    if (status === 'loading') {
      const timeout = window.setTimeout(() => setStatus('error'), 8000)
      return () => window.clearTimeout(timeout)
    }
    if (attempt < 2) {
      const timeout = window.setTimeout(retry, 2500 * (attempt + 1))
      return () => window.clearTimeout(timeout)
    }
  }, [status, attempt, retry])

  useEffect(() => {
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [retry])

  return <section className="section site-visitors" aria-labelledby="visitor-heading">
    <h2 id="visitor-heading" className="section-title">Website Visitors</h2>
    <a className="site-visitors__map" href={VISITOR_STATS_URL} target="_blank" rel="noopener noreferrer" aria-label="View homepage visitor statistics on MapMyVisitors">
      <img src={snapshotUrl} width={snapshot.width} height={snapshot.height} alt={`Saved world map of homepage visits and total pageviews, ${snapshotDate}`} hidden={status === 'ready'} loading="eager" decoding="async" />
      <img key={attempt} src={`${config.imageUrl}${attempt ? `&retry=${attempt}` : ''}`} width={snapshot.width} height={snapshot.height} alt="World map of homepage visits and total pageviews" hidden={status !== 'ready'} loading="eager" decoding="async" onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />
    </a>
    {status !== 'ready' && <p className="site-visitors__notice" role="status">
      Saved map · <time dateTime={snapshot.updatedAt}>{snapshotDate}</time><span aria-hidden="true"> · </span>
      {status === 'loading' ? <span>Connecting to live map…</span> : <button type="button" onClick={retry}>Retry live map</button>}
    </p>}
    <p className="site-visitors__caption"><a href={VISITOR_STATS_URL} target="_blank" rel="noopener noreferrer">View visitor statistics ↗</a><span aria-hidden="true"> · </span><span>Approximate locations</span></p>
  </section>
}
