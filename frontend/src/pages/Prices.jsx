// by Raunak
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { ErrorBox, Loader, Empty, Pill } from '../components/UI'
import useAsync from '../hooks/useAsync'
import { mandiApi } from '../api'
import { fmtShort } from '../utils/dates'

const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function Prices() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '') // crop detail se "Check market price" yahan q bhejta hai
  const STATE = 'Bihar' // backend ka default state

  const { data, loading, error, reload } = useAsync(() => mandiApi.latest(STATE), [])

  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const q = query.trim().toLowerCase()
  const rows = data.filter((p) => !q || p.commodity.toLowerCase().includes(q))
  const latest = data.length ? data.map((p) => p.arrival_date).sort().pop() : null

  return (
    <div className="page">
      <h1 className="h1">Market prices</h1>
      <p className="muted row">
        <Pill kind="today">{STATE}</Pill>
        {latest ? <span>Mandi rates · updated {fmtShort(latest)}</span> : <span>No data yet</span>}
      </p>

      <div className="search">
        <Icon name="search" size={18} />
        <input placeholder="Search crop" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search crop" />
      </div>

      <div className="card">
        {rows.length ? (
          <ul className="list">
            {rows.map((p) => (
              <li key={p.id} className="price-row">
                <div className="grow">
                  <p className="row-title">{p.commodity}{p.variety && p.variety !== 'Other' ? ` (${p.variety})` : ''}</p>
                  <p className="row-sub">{p.market}, {p.district}</p>
                </div>
                <div className="price-right">
                  <p className="row-title">{rupee(p.modal_price)}</p>
                  <p className="row-sub">per quintal</p>
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty text={data.length ? 'No crop matches your search.' : 'No market prices available.'} />}
      </div>
    </div>
  )
}
