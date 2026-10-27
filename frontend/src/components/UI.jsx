// by Raunak
// Chote reusable pieces: loader, error box, empty state, pill, back button, task row
import { useNavigate } from 'react-router-dom'
import Icon from './Icons'
import { fmtWithDay } from '../utils/dates'
import { taskKind } from '../utils/crops'

export const Loader = ({ full }) => (
  <div className={full ? 'loader full' : 'loader'}><span className="spinner" aria-label="Loading" /></div>
)

export const ErrorBox = ({ message, onRetry }) => (
  <div className="errorbox" role="alert">
    <p>{message}</p>
    {onRetry && <button className="btn btn-soft small" onClick={() => onRetry()}>Try again</button>}
  </div>
)

export const Empty = ({ text }) => <p className="empty">{text}</p>

export const Pill = ({ kind = 'plain', children }) => <span className={`pill pill-${kind}`}>{children}</span>

export function BackButton({ to }) {
  const nav = useNavigate()
  return (
    <button className="icon-btn" aria-label="Go back" onClick={() => (to ? nav(to) : nav(-1))}>
      <Icon name="back" />
    </button>
  )
}

// Task ki row - Home, Tasks aur Calendar teeno me yahi use hoti hai
export function TaskRow({ task, onToggle, showCheck = true }) {
  const kind = taskKind(task)
  return (
    <li className="task-row">
      {showCheck && (
        <button
          className={`circle ${kind === 'done' ? 'on' : ''}`}
          aria-label={kind === 'done' ? 'Mark as pending' : 'Mark as done'}
          onClick={() => onToggle && onToggle(task)}
        >
          {kind === 'done' && <Icon name="check" size={18} />}
        </button>
      )}
      <div className="grow">
        <p className={`row-title ${kind === 'done' ? 'struck' : ''}`}>{task.title}</p>
        <p className="row-sub">{task.cropName}{task.plot ? ` · ${task.plot}` : ''}</p>
      </div>
      {kind === 'overdue' && <Pill kind="overdue">Overdue</Pill>}
      {kind === 'today' && <Pill kind="today">Today</Pill>}
      {kind === 'upcoming' && <Pill kind="today">{fmtWithDay(task.due_date)}</Pill>}
      {kind === 'done' && <Pill kind="today">Done</Pill>}
    </li>
  )
}
