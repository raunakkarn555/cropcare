// by Raunak
// 4 step wizard: 1) Farm  2) Plot  3) Crop + schedule preview (Figma wali screen)  4) Done
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { BackButton, ErrorBox, Loader } from '../components/UI'
import useAsync from '../hooks/useAsync'
import { farmsApi, cropsApi, tasksApi } from '../api'
import { CROP_OPTIONS, PLOT_OPTIONS, buildSchedule, makePlotNotes } from '../utils/crops'
import { addDays, fmtShort, fmtFull, todayISO } from '../utils/dates'

function Select({ value, onChange, options, label }) {
  return (
    <div className="input-wrap">
      <select className="input select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="select-arrow"><Icon name="down" size={18} /></span>
    </div>
  )
}

export default function AddCrop() {
  const nav = useNavigate()
  const { data: farms, loading, error, reload } = useAsync(() => farmsApi.list(), [])

  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [created, setCreated] = useState(null)

  const [farmId, setFarmId] = useState('')
  const [newFarm, setNewFarm] = useState({ name: '', location: '', area: '', soil_type: '' })
  const [plot, setPlot] = useState(PLOT_OPTIONS[0])
  const [plotArea, setPlotArea] = useState('')
  const [cropName, setCropName] = useState('Wheat')
  const [sowing, setSowing] = useState(todayISO())

  if (loading) return <div className="page"><Loader /></div>
  if (error) return <div className="page"><ErrorBox message={error} onRetry={reload} /></div>

  const creatingFarm = farmId === 'new' || farms.length === 0
  const farm = farms.find((f) => String(f.id) === String(farmId))
  const schedule = buildSchedule(cropName, sowing || todayISO())

  const stepOne = async () => {
    setErr('')
    if (creatingFarm) {
      const { name, location, area, soil_type } = newFarm
      if (!name.trim() || !location.trim() || !(Number(area) > 0)) return setErr('Please fill farm name, location and area (acres).')
      setBusy(true)
      try {
        const f = await farmsApi.create({ name: name.trim(), location: location.trim(), area: Number(area), soil_type: soil_type.trim() || null })
        setFarmId(String(f.id))
        farms.push(f) // local list me bhi daal do taaki aage farm.area mil jaye
        setStep(2)
      } catch (e) { setErr(e.message) }
      setBusy(false)
    } else {
      if (!farmId) return setErr('Please select a farm.')
      setStep(2)
    }
  }

  const stepTwo = () => {
    setErr('')
    const a = Number(plotArea)
    if (!(a > 0)) return setErr('Enter plot area in acres.')
    // backend yehi check karta hai (crop area <= farm area) - pehle hi bata dete hain
    if (farm && a > farm.area) return setErr(`Plot area cannot be more than farm area (${farm.area} acres).`)
    setStep(3)
  }

  const confirm = async () => {
    setErr('')
    if (!sowing) return setErr('Please choose a sowing date.')
    setBusy(true)
    try {
      const crop = await cropsApi.create({
        farm_id: farm.id,
        name: cropName,
        area: Number(plotArea),
        sowing_date: sowing,
        expected_harvest_date: addDays(sowing, schedule.total),
        status: sowing <= todayISO() ? 'growing' : 'planned',
        notes: makePlotNotes(plot),
      })
      // schedule ke tasks backend me save karo
      await Promise.all(schedule.items.map((it) => tasksApi.create({
        crop_id: crop.id, title: it.title, task_type: it.task_type, due_date: it.due_date, priority: it.priority,
        description: `Day ${it.day} of ${cropName} schedule`,
      })))
      setCreated(crop)
      setStep(4)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  if (step === 4) {
    return (
      <div className="page narrow center">
        <div className="auth-logo"><Icon name="check" size={32} /></div>
        <h1 className="h2">Crop added</h1>
        <p className="muted">{cropName} on {plot}. Your schedule is ready.</p>
        <button className="btn btn-primary" onClick={() => nav(`/crops/${created.id}`)}>View crop</button>
        <button className="btn btn-soft" onClick={() => nav('/farms')}>Back to farms</button>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <div className="row gap"><BackButton /><h1 className="h2">Add crop</h1></div>
      <p className="row-sub">Step {step} of 4</p>
      <div className="bar thick"><i style={{ width: `${step * 25}%` }} /></div>

      {step === 1 && (
        <>
          <label className="label">Farm</label>
          {farms.length > 0 && (
            <ul className="radio-list">
              {farms.map((f) => (
                <li key={f.id}><button className={String(f.id) === farmId ? 'radio on' : 'radio'} onClick={() => setFarmId(String(f.id))}>{f.name} · {f.area} acres</button></li>
              ))}
              <li><button className={farmId === 'new' ? 'radio on' : 'radio'} onClick={() => setFarmId('new')}>+ Create new farm</button></li>
            </ul>
          )}
          {creatingFarm && (
            <div className="stack">
              <input className="input" placeholder="Farm name (e.g. Family farm)" value={newFarm.name} onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })} />
              <input className="input" placeholder="Location (village, district)" value={newFarm.location} onChange={(e) => setNewFarm({ ...newFarm, location: e.target.value })} />
              <input className="input" type="number" min="0" step="0.1" placeholder="Total area (acres)" value={newFarm.area} onChange={(e) => setNewFarm({ ...newFarm, area: e.target.value })} />
              <input className="input" placeholder="Soil type (optional)" value={newFarm.soil_type} onChange={(e) => setNewFarm({ ...newFarm, soil_type: e.target.value })} />
            </div>
          )}
          {err && <p className="form-error">{err}</p>}
          <button className="btn btn-primary" onClick={stepOne} disabled={busy}>{busy ? 'Saving…' : 'Next'}</button>
        </>
      )}

      {step === 2 && (
        <>
          <label className="label">Plot</label>
          <Select label="Plot" value={plot} onChange={setPlot} options={PLOT_OPTIONS} />
          <label className="label">Plot area (acres)</label>
          <input className="input" type="number" min="0" step="0.1" placeholder="e.g. 2.5" value={plotArea} onChange={(e) => setPlotArea(e.target.value)} />
          {err && <p className="form-error">{err}</p>}
          <button className="btn btn-primary" onClick={stepTwo}>Next</button>
        </>
      )}

      {step === 3 && (
        <>
          <label className="label">Plot</label>
          <Select label="Plot" value={plot} onChange={setPlot} options={PLOT_OPTIONS} />
          <label className="label">Crop</label>
          <Select label="Crop" value={cropName} onChange={setCropName} options={CROP_OPTIONS} />
          <label className="label">Sowing date</label>
          <input className="input" type="date" value={sowing} onChange={(e) => setSowing(e.target.value)} />
          {sowing && <p className="row-sub">Sowing on {fmtFull(sowing)}</p>}

          <h2 className="h3">Schedule preview</h2>
          <div className="card">
            <ul className="list">
              {schedule.items.map((it) => (
                <li key={it.title} className="task-row">
                  <div className="grow"><p className="row-title">{it.title}</p><p className="row-sub">Day {it.day}</p></div>
                  <span className="pill pill-today">{fmtShort(it.due_date)}</span>
                </li>
              ))}
            </ul>
          </div>
          {err && <p className="form-error">{err}</p>}
          <button className="btn btn-primary" onClick={confirm} disabled={busy}>{busy ? 'Adding…' : 'Confirm & add crop'}</button>
        </>
      )}
    </div>
  )
}
