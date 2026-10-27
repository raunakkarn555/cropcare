// by Raunak
import { useSearchParams } from 'react-router-dom'
import { ErrorBox, Loader, TaskRow, Empty } from '../components/UI'
import useAsync from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { cropsApi, tasksApi } from '../api'
import { enrichTasks, taskKind } from '../utils/crops'

const TABS = [['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['done', 'Done']]

export default function Tasks() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'today'

  const { data, loading, error, reload } = useAsync(async () => {
    const [tasks, crops] = await Promise.all([tasksApi.list(), cropsApi.list()])
    return enrichTasks(tasks, crops)
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  // Backend me sirf pending/completed status hai, overdue/today/upcoming date se nikalte hain
  const shown = data.filter((t) => {
    const k = taskKind(t)
    // Figma ke "Today" tab me overdue task bhi dikhta hai
    return tab === 'today' ? k === 'today' || k === 'overdue' : k === tab
  })

  const toggle = async (t) => {
    try {
      t.status === 'completed' ? await tasksApi.reopen(t.id) : await tasksApi.complete(t.id)
      reload(true)
    } catch (e) { toast(e.message) }
  }

  return (
    <div className="page">
      <h1 className="h1">Tasks</h1>
      <div className="chips" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'chip active' : 'chip'} onClick={() => setParams({ tab: k })}>{label}</button>
        ))}
      </div>
      <div className="card">
        {shown.length ? <ul className="list">{shown.map((t) => <TaskRow key={t.id} task={t} onToggle={toggle} />)}</ul> : <Empty text="No tasks here." />}
      </div>
    </div>
  )
}
