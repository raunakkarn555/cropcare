// by Raunak
import { useParams, useNavigate } from 'react-router-dom'
import { BackButton, ErrorBox, Loader } from '../components/UI'
import Icon from '../components/Icons'
import useAsync from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { cropsApi, tasksApi } from '../api'
import { growthInfo, parsePlot } from '../utils/crops'
import { fmtShort } from '../utils/dates'

export default function CropDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()

  const { data, loading, error, reload } = useAsync(async () => {
    const [crop, tasks] = await Promise.all([cropsApi.get(id), tasksApi.list({ crop_id: id })])
    return { crop, tasks }
  }, [id])

  if (loading) return <div className="page"><Loader /></div>
  if (error) return <div className="page"><ErrorBox message={error} onRetry={reload} /></div>

  const { crop, tasks } = data
  const g = growthInfo(crop)

  const toggle = async (t) => {
    try {
      t.status === 'completed' ? await tasksApi.reopen(t.id) : await tasksApi.complete(t.id)
      reload(true)
    } catch (e) { toast(e.message) }
  }

  return (
    <div className="page narrow">
      <div className="row gap"><BackButton to="/farms" /><h1 className="h2">{crop.name} · {parsePlot(crop.notes)}</h1></div>

      <div className="card">
        <p className="row-sub">Growth stage</p>
        <p className="row-title big">{g.stage}</p>
        <p className="row-sub">Day {g.day} of {g.total}</p>
        <div className="bar"><i style={{ width: `${Math.max(g.pct, 2)}%` }} /></div>
      </div>

      <h2 className="h3">Timeline</h2>
      <div className="card">
        <ul className="list">
          {/* Sowing ek task nahi hai, crop ki sowing_date se aata hai */}
          <li className="task-row">
            <span className="circle on" aria-hidden="true" />
            <p className="row-title grow">Sowing</p>
            <span className="pill pill-today">{fmtShort(crop.sowing_date)}</span>
          </li>
          {tasks.map((t) => {
            const done = t.status === 'completed'
            const isHarvest = t.task_type === 'harvesting'
            return (
              <li key={t.id} className="task-row">
                <button className={`circle ${done ? 'on' : ''}`} aria-label={done ? 'Mark as pending' : 'Mark as done'} onClick={() => toggle(t)}>
                  {done && <Icon name="check" size={18} />}
                </button>
                <p className={`row-title grow ${done ? 'struck' : ''}`}>{t.title}</p>
                <span className="pill pill-today">{isHarvest ? 'From ' : ''}{fmtShort(t.due_date)}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <button className="btn btn-soft" onClick={() => nav(`/prices?q=${encodeURIComponent(crop.name)}`)}>Check market price</button>
    </div>
  )
}
