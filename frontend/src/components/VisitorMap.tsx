import { useState } from 'react'
import './visitor-map.css'

export const VISITOR_STATS_URL = 'https://mapmyvisitors.com/web/1c8re'
// Public widget code generated for https://chuhongkang.com/ in the UCAS account.
const imageUrl = 'https://mapmyvisitors.com/map.png?cl=cbd1d8&w=420&t=tt&d=BdBrLVUsgxa89RpVD8ozvCxSfOMrMHhXHjAGGpLgCEs&co=f8f7f3&ct=62666d'

export default function VisitorMap() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  return <section className="section site-visitors" aria-labelledby="visitor-heading">
    <h2 id="visitor-heading" className="section-title">Website Visitors</h2>
    <a className="site-visitors__map" href={VISITOR_STATS_URL} target="_blank" rel="noopener noreferrer" aria-label="View homepage visitor statistics on MapMyVisitors">
      {status === 'loading' && <span className="site-visitors__status" role="status">Loading visitor map…</span>}
      {status === 'error'
        ? <span className="site-visitors__status">Visitor map is unavailable. View statistics ↗</span>
        : <img src={imageUrl} width={420} height={226} alt="World map of homepage visits and total pageviews" loading="eager" decoding="async" onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />}
    </a>
    <p className="site-visitors__caption"><a href={VISITOR_STATS_URL} target="_blank" rel="noopener noreferrer">View visitor statistics ↗</a><span aria-hidden="true"> · </span><span>Approximate locations</span></p>
  </section>
}
