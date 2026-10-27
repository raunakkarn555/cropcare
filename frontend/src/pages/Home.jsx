// by Raunak
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { ErrorBox, Loader, TaskRow, Empty } from '../components/UI'
import useAsync from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cropsApi, tasksApi } from '../api'
import { enrichTasks } from '../utils/crops'
import { todayISO, fmtLong, greeting, diffDays } from '../utils/dates'

export default function Home() {
  const { user } = useAuth()
  const toast = useToast()
  const nav = useNavigate()

  const { data, loading, error, reload } = useAsync(async () => {
    const [tasks, crops] = await Promise.all([tasksApi.list(), cropsApi.list()])
    return enrichTasks(tasks, crops)
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const today = todayISO()
  // "Today's tasks" me aaj ke + overdue pending tasks aate hain (Figma jaisa)
  const todays = data.filter((t) => t.due_date === today || (t.status === 'pending' && t.due_date < today))
  const doneCount = todays.filter((t) => t.status === 'completed').length
  const upcoming = data.filter((t) => t.status === 'pending' && t.due_date > today).slice(0, 3)
  const alerts = data.filter((t) => t.status === 'pending' && t.due_date <= today).length

  // "Do this first" = sabse purana overdue, nahi to aaj ka pehla pending task
  const first = data.filter((t) => t.status === 'pending' && t.due_date <= today)[0]

  const toggle = async (t) => {
    try {
      t.status === 'completed' ? await tasksApi.reopen(t.id) : await tasksApi.complete(t.id)
      reload(true)
    } catch (e) { toast(e.message) }
  }

  return (
    <div className="page">
      <div className="topbar">
        <span className="brand-logo"><Icon name="leaf" /></span>
        <button className="icon-btn bell" aria-label="Notifications" onClick={() => nav('/notifications')}>
          <Icon name="bell" />
          {alerts > 0 && <i className="dot-red" />}
        </button>
      </div>

      <h1 className="h1">{greeting()}, {user.name.split(' ')[0]}</h1>
      <p className="muted">{fmtLong(today)}</p>

      {first && (
        <div className="hero">
          <p className="hero-kicker">Do this first</p>
          <p className="hero-title">{first.title} to {first.cropName.toLowerCase()}</p>
          <p className="hero-sub">
            {first.plot}{first.due_date < today ? ` · ${diffDays(today, first.due_date)} days overdue` : ' · due today'}
          </p>
        </div>
      )}

      <div className="two-col">
        <section>
          <div className="section-head"><h2>Today's tasks</h2><Link to="/tasks">See all</Link></div>
          <div className="card">
            <p className="row-sub">{doneCount} of {todays.length} completed</p>
            <div className="bar"><i style={{ width: todays.length ? `${(doneCount / todays.length) * 100}%` : 0 }} /></div>
            {todays.length ? <ul className="list">{todays.map((t) => <TaskRow key={t.id} task={t} onToggle={toggle} />)}</ul> : <Empty text="No tasks for today 🎉" />}
          </div>
        </section>

        <section>
          <div className="section-head"><h2>Upcoming tasks</h2><Link to="/tasks?tab=upcoming">View all</Link></div>
          <div className="card">
            {upcoming.length ? <ul className="list">{upcoming.map((t) => <TaskRow key={t.id} task={t} showCheck={false} />)}</ul> : <Empty text="Nothing upcoming. Add a crop to get a schedule." />}
          </div>
        </section>
      </div>
    </div>
  )
}
