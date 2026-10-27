// by Raunak
import { BackButton, ErrorBox, Loader, Empty } from '../components/UI'
import Icon from '../components/Icons'
import useAsync from '../hooks/useAsync'
import { cropsApi, remindersApi } from '../api'
import { parsePlot } from '../utils/crops'
import { diffDays, fmtShort, fmtTime, todayISO, toISO } from '../utils/dates'

// NOTE: Backend me notifications ka alag API nahi hai. Isliye:
//  - reminders API (overdue/today) se task alerts
//  - crops ke created_at se "Crop added" entries
// banate hain. Time sirf "Crop added" ka real hai; reminders ka time backend nahi deta.
export default function Notifications() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [rem, crops] = await Promise.all([remindersApi.list(2), cropsApi.list()])
    return { rem: rem.reminders, crops }
  }, [])

  if (loading) return <div className="page"><Loader /></div>
  if (error) return <div className="page"><ErrorBox message={error} onRetry={reload} /></div>

  const today = todayISO()
  const yesterday = toISO(new Date(Date.now() - 86400000))

  const todayItems = data.rem.filter((r) => r.reminder_type !== 'upcoming').map((r) => ({
    id: 'r' + r.task_id,
    icon: r.reminder_type === 'overdue' ? 'alert' : 'drop',
    title: r.reminder_type === 'overdue' ? `${r.title} is overdue` : `${r.title} today`,
    sub: `${r.crop_name} · ${r.farm_name}${r.reminder_type === 'overdue' ? `, was due ${fmtShort(r.due_date)}` : ''}`,
    highlight: true,
  }))

  const cropItems = data.crops.map((c) => {
    const when = new Date(c.created_at)
    return { id: 'c' + c.id, day: toISO(when), time: fmtTime(c.created_at), icon: 'leaf', title: 'Crop added', sub: `${c.name} on ${parsePlot(c.notes)}. Schedule ready` }
  })

  const groups = [
    ['Today', [...todayItems, ...cropItems.filter((i) => i.day === today)]],
    ['Yesterday', cropItems.filter((i) => i.day === yesterday)],
    ['Earlier', cropItems.filter((i) => diffDays(today, i.day) > 1).slice(0, 5)],
  ].filter(([, items]) => items.length)

  return (
    <div className="page narrow">
      <div className="row gap"><BackButton to="/" /><h1 className="h2">Notifications</h1></div>
      {groups.length === 0 && <Empty text="You're all caught up." />}
      {groups.map(([label, items]) => (
        <section key={label}>
          <h2 className="h3">{label}</h2>
          <ul className="list notif">
            {items.map((n) => (
              <li key={n.id} className={n.highlight ? 'notif-item hl' : 'notif-item'}>
                <span className="notif-icon"><Icon name={n.icon} size={18} /></span>
                <div className="grow"><p className="row-title">{n.title}</p><p className="row-sub">{n.sub}</p></div>
                {n.time && <span className="row-sub">{n.time}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
