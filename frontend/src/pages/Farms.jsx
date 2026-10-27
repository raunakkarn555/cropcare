// by Raunak
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { ErrorBox, Loader, Empty } from '../components/UI'
import useAsync from '../hooks/useAsync'
import { farmsApi, cropsApi, tasksApi } from '../api'
import { growthInfo, parsePlot } from '../utils/crops'
import { fmtShort, todayISO } from '../utils/dates'

export default function Farms() {
  const nav = useNavigate()
  const [activeId, setActiveId] = useState(null)

  const { data, loading, error, reload } = useAsync(async () => {
    const [farms, crops, tasks] = await Promise.all([farmsApi.list(), cropsApi.list(), tasksApi.list({ task_status: 'pending' })])
    return { farms, crops, tasks }
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const { farms, crops, tasks } = data
  const farm = farms.find((f) => f.id === activeId) || farms[0]
  const farmCrops = farm ? crops.filter((c) => c.farm_id === farm.id) : []
  const plots = new Set(farmCrops.map((c) => parsePlot(c.notes)))

  // Card par jo crop dikhana hai: pehla growing crop, nahi to pehla crop
  const main = farmCrops.find((c) => c.status === 'growing') || farmCrops[0]
  const g = main && growthInfo(main)
  const next = main && tasks.filter((t) => t.crop_id === main.id && t.due_date >= todayISO()).sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
  const uniqueNames = [...new Set(farmCrops.map((c) => c.name))]

  return (
    <div className="page">
      <h1 className="h1">My farms</h1>

      {farms.length > 0 && (
        <div className="chips">
          {farms.map((f) => <button key={f.id} className={f.id === farm.id ? 'chip active' : 'chip'} onClick={() => setActiveId(f.id)}>{f.name}</button>)}
        </div>
      )}

      {!farm ? <div className="card"><Empty text="You have no farms yet." /></div> : (
        <div className="card farm-card">
          <div className="farm-banner"><Icon name="leaf" size={36} /></div>
          <div className="farm-body">
            <h2 className="h3 nomargin">{farm.name}</h2>
            <p className="row-sub">{plots.size} plot{plots.size === 1 ? '' : 's'} · {farm.area} acres{farm.location ? ` · ${farm.location}` : ''}</p>
            <div className="tags">{uniqueNames.map((n) => <span key={n} className="pill pill-today">{n}</span>)}</div>

            {main ? (
              <>
                <p className="row-title big">{main.name} · {parsePlot(main.notes)}</p>
                <p className="row-sub">Day {g.day} of {g.total} · {g.stage}</p>
                <div className="bar"><i style={{ width: `${Math.max(g.pct, 2)}%` }} /></div>
                <p className="row-sub">{next ? `Next: ${next.title.toLowerCase()} on ${fmtShort(next.due_date)}` : 'No upcoming tasks'}</p>
                <button className="btn btn-soft" onClick={() => nav(`/crops/${main.id}`)}>View full report</button>
              </>
            ) : <Empty text="No crops on this farm yet." />}
          </div>
        </div>
      )}

      <Link to="/add-crop" className="btn btn-primary">Add farm or crop</Link>
    </div>
  )
}
