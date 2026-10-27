// by Raunak
// App shell: mobile par neeche tab bar, tablet/desktop par side navigation
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from './Icons'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/farms', label: 'Farms', icon: 'leaf' },
  { to: '/tasks', label: 'Tasks', icon: 'check' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/prices', label: 'Prices', icon: 'trend' },
]

export default function Layout() {
  const { logout, user } = useAuth()
  const { pathname } = useLocation()

  // Figma me Add crop aur Crop detail par "Home" tab active dikhta hai
  const isActive = (to) => {
    if (to === '/') return pathname === '/' || pathname.startsWith('/add-crop') || pathname.startsWith('/crops') || pathname.startsWith('/notifications')
    return pathname.startsWith(to)
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-logo"><Icon name="leaf" /></span><b>Crop Care</b></div>
        <nav>
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} className={isActive(t.to) ? 'side-link active' : 'side-link'}>
              <Icon name={t.icon} /> {t.label}
            </NavLink>
          ))}
        </nav>
        <button className="side-link logout" onClick={logout}><Icon name="logout" /> Log out{user ? ` (${user.name.split(' ')[0]})` : ''}</button>
      </aside>

      <main className="content"><Outlet /></main>

      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={isActive(t.to) ? 'tab active' : 'tab'}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
            <i className="tab-line" />
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
