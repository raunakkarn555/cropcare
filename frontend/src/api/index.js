// by Raunak
// Endpoints exactly waise hi hain jaise Backend/app/routes me defined hain.
import { api } from './client'

export const authApi = {
  login: (email, password) => api('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (name, email, password) => api('/api/auth/register', { method: 'POST', body: { name, email, password }, auth: false }),
  me: () => api('/api/auth/me'),
}

export const farmsApi = {
  list: () => api('/api/farms'),
  create: (data) => api('/api/farms', { method: 'POST', body: data }),
}

export const cropsApi = {
  list: (farm_id) => api('/api/crops', { params: { farm_id } }),
  get: (id) => api(`/api/crops/${id}`),
  create: (data) => api('/api/crops', { method: 'POST', body: data }),
}

export const tasksApi = {
  list: (params) => api('/api/tasks', { params }),
  create: (data) => api('/api/tasks', { method: 'POST', body: data }),
  complete: (id) => api(`/api/tasks/${id}/complete`, { method: 'PATCH' }),
  // task ko wapas pending karne ke liye (Done tab se undo)
  reopen: (id) => api(`/api/tasks/${id}`, { method: 'PATCH', body: { status: 'pending' } }),
}

export const calendarApi = {
  month: (year, month) => api('/api/calendar/month', { params: { year, month } }),
}

export const remindersApi = {
  list: (days_ahead = 7) => api('/api/reminders', { params: { days_ahead } }),
}

// Mandi endpoints public hain (backend me auth nahi lagi)
export const mandiApi = {
  latest: (state = 'Bihar', district) => api('/api/mandi/latest', { params: { state, district }, auth: false }),
  districts: (state = 'Bihar') => api('/api/mandi/districts', { params: { state }, auth: false }),
}
