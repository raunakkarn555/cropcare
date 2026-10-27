// by Raunak
import { useState } from 'react'
import Icon from '../components/Icons'
import { ErrorBox, Loader, TaskRow, Empty } from '../components/UI'
import useAsync from '../hooks/useAsync'
import { calendarApi, cropsApi } from '../api'
import { enrichTasks } from '../utils/crops'
import { todayISO, toISO, monthName, fmtDayMonth } from '../utils/dates'

// Dot ka color: irrigation = light green, fertilizer = orange, baaki (sowing/harvest) = dark green
const dotClass = (type) => (type === 'fertilization' ? 'd-fert' : type === 'irrigation' || type === 'weeding' || type === 'pest_control' ? 'd-irr' : 'd-sow')

export default function CalendarPage() {
  const now = new Date()
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [selected, setSelected] = useState(todayISO())
  const today = todayISO()

  const { data, loading, error, reload } = useAsync(async () => {
    const [cal, crops] = await Promise.all([calendarApi.month(view.year, view.month), cropsApi.list()])
    return cal.days.map((d) => ({ date: d.date, tasks: enrichTasks(d.tasks, crops) }))
  }, [view.year, view.month])

  const shift = (n) => {
    let m = view.month + n, y = view.year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setView({ year: y, month: m })
    setSelected(toISO(new Date(y, m - 1, 1)))
  }

  // Calendar Monday se shuru hota hai (Figma jaisa)
  const offset = (new Date(view.year, view.month - 1, 1).getDay() + 6) % 7
  const days = data || []
  const dayTasks = days.find((d) => d.date === selected)?.tasks || []

  return (
    <div className="page">
      <div className="cal-head">
        <button className="icon-btn" aria-label="Previous month" onClick={() => shift(-1)}><Icon name="back" /></button>
        <h1 className="h2">{monthName(view.month)} {view.year}</h1>
        <button className="icon-btn" aria-label="Next month" onClick={() => shift(1)}><Icon name="next" /></button>
      </div>

      {error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="cal-wrap">
          <div>
            <div className="cal-grid">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
              {Array.from({ length: offset }).map((_, i) => <span key={'b' + i} />)}
              {days.map((d) => {
                const types = [...new Set(d.tasks.map((t) => dotClass(t.task_type)))]
                const cls = ['cal-day', d.date === selected ? 'sel' : '', d.date === today ? 'today' : ''].join(' ')
                return (
                  <button key={d.date} className={cls} onClick={() => setSelected(d.date)}>
                    {Number(d.date.slice(8))}
                    <span className="dots">{types.map((t) => <i key={t} className={t} />)}</span>
                  </button>
                )
              })}
            </div>
            {loading && <Loader />}
            <div className="legend">
              <span><i className="d-irr" /> Irrigation</span>
              <span><i className="d-fert" /> Fertilizer</span>
              <span><i className="d-sow" /> Sowing/harvest</span>
            </div>
          </div>

          <div>
            <h2 className="h3">{fmtDayMonth(selected)}</h2>
            <div className="card">
              {dayTasks.length ? <ul className="list">{dayTasks.map((t) => <TaskRow key={t.id} task={t} showCheck={false} />)}</ul> : <Empty text="No tasks on this day." />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
