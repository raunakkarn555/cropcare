// by Raunak
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const show = useCallback((m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2800)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastContext.Provider>
  )
}
