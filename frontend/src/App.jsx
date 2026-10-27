// by Raunak
// Saare routes yahan hain. Login ke bina sirf /login aur /register khulenge.
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import { Loader } from './components/UI'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Farms from './pages/Farms'
import AddCrop from './pages/AddCrop'
import CropDetail from './pages/CropDetail'
import Tasks from './pages/Tasks'
import CalendarPage from './pages/CalendarPage'
import Prices from './pages/Prices'
import Notifications from './pages/Notifications'

function Protected({ children }) {
  const { user, booting } = useAuth()
  if (booting) return <Loader full />
  return user ? children : <Navigate to="/login" replace />
}

function GuestOnly({ children }) {
  const { user, booting } = useAuth()
  if (booting) return <Loader full />
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Home />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/add-crop" element={<AddCrop />} />
        <Route path="/crops/:id" element={<CropDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
