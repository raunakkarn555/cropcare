// by Raunak
import { addDays, diffDays, todayISO } from './dates'

export const CROP_OPTIONS = ['Wheat', 'Mustard', 'Rice', 'Maize', 'Potato', 'Tomato']
export const PLOT_OPTIONS = ['North plot', 'South plot', 'East plot', 'West plot']

// NOTE: Backend me abhi schedule generate karne ka API nahi hai, isliye
// schedule yahan frontend me bana ke /api/tasks se save karte hain.
// Wheat ke numbers Figma wale hi hain (Day 21 / 30 / 40 / 120).
const SCHEDULES = {
  wheat:   { total: 120, steps: [[21, 'First irrigation', 'irrigation'], [30, 'Weed control', 'weeding'], [40, 'Top-dress fertilizer', 'fertilization']] },
  mustard: { total: 120, steps: [[25, 'First irrigation', 'irrigation'], [30, 'Weed control', 'weeding'], [45, 'Neem oil spray', 'pest_control']] },
  rice:    { total: 130, steps: [[7, 'First irrigation', 'irrigation'], [25, 'Weed control', 'weeding'], [40, 'Top-dress fertilizer', 'fertilization']] },
  maize:   { total: 100, steps: [[15, 'First irrigation', 'irrigation'], [25, 'Weed control', 'weeding'], [35, 'Top-dress fertilizer', 'fertilization']] },
  potato:  { total: 90,  steps: [[10, 'First irrigation', 'irrigation'], [25, 'Weed control', 'weeding'], [30, 'Top-dress fertilizer', 'fertilization']] },
  tomato:  { total: 110, steps: [[7, 'First irrigation', 'irrigation'], [20, 'Weed control', 'weeding'], [30, 'Top-dress fertilizer', 'fertilization']] },
}

export function buildSchedule(cropName, sowingISO) {
  const s = SCHEDULES[cropName.toLowerCase()] || SCHEDULES.wheat
  const items = s.steps.map(([day, title, type]) => ({ day, title, task_type: type, due_date: addDays(sowingISO, day), priority: 'medium' }))
  items.push({ day: s.total, title: 'Harvest window', task_type: 'harvesting', due_date: addDays(sowingISO, s.total), priority: 'high' })
  return { total: s.total, items }
}

// Backend ke Crop model me "plot" field nahi hai, isliye plot ka naam notes me "Plot: North plot" ki tarah rakhte hain
export const makePlotNotes = (plot) => `Plot: ${plot}`
export const parsePlot = (notes) => {
  const m = /^Plot:\s*(.+)$/m.exec(notes || '')
  return m ? m[1].trim() : 'Main plot'
}

const STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Grain filling', 'Maturity']

export function growthInfo(crop) {
  const total = Math.max(
    1,
    crop.expected_harvest_date ? diffDays(crop.expected_harvest_date, crop.sowing_date) : (SCHEDULES[crop.name.toLowerCase()] || SCHEDULES.wheat).total
  )
  const raw = diffDays(todayISO(), crop.sowing_date) + 1
  const day = Math.min(Math.max(raw, 0), total)
  const pct = Math.round((day / total) * 100)
  const stage = raw < 1 ? 'Not sown yet' : raw > total ? 'Ready to harvest' : STAGES[Math.min(Math.floor((day / total) * STAGES.length), STAGES.length - 1)]
  return { day, total, pct, stage }
}

// Task me crop ka naam/plot nahi aata, isliye crops list se jod dete hain
export function enrichTasks(tasks, crops) {
  const map = Object.fromEntries(crops.map((c) => [c.id, c]))
  return tasks.map((t) => {
    const c = map[t.crop_id]
    return { ...t, cropName: c ? c.name : 'Crop', plot: c ? parsePlot(c.notes) : '' }
  })
}

export const taskKind = (t, today = todayISO()) =>
  t.status === 'completed' ? 'done' : t.due_date < today ? 'overdue' : t.due_date === today ? 'today' : 'upcoming'
