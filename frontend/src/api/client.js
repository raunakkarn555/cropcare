// by Raunak
// Saari API calls yahin se jaati hain. Token localStorage me rehta hai.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'cropcare_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// AuthContext isko set karta hai taaki 401 aate hi user logout ho jaye
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

// FastAPI error 2 shapes me aata hai: string ya 422 ka array - dono ko readable text banate hain
function readError(data, status) {
  const d = data && data.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((e) => `${(e.loc || []).slice(1).join('.')}: ${e.msg}`).join(', ')
  return `Request failed (${status})`
}

export async function api(path, { method = 'GET', body, params, auth = true } = {}) {
  let url = BASE + path
  if (params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v)
    })
    const s = qs.toString()
    if (s) url += '?' + s
  }

  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`

  let res
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach server. Check your internet or backend.')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    // login/register par 401 ka matlab galat password hai, session expiry nahi
    if (res.status === 401 && auth) onUnauthorized()
    throw new Error(readError(data, res.status))
  }
  return data
}
