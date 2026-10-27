// by Raunak
// `npm run dev` - backend (8000) + mandi data import + frontend (5173) ek saath
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const isWin = process.platform === 'win32'
const root = process.cwd()
const backend = join(root, 'Backend')
const frontend = join(root, 'frontend')
const py = isWin ? join(backend, 'venv', 'Scripts', 'python.exe') : join(backend, 'venv', 'bin', 'python')

if (!existsSync(py) || !existsSync(join(backend, '.env')) || !existsSync(join(frontend, 'node_modules'))) {
  console.error('❌ Setup not done yet. Run:  npm run setup'); process.exit(1)
}

const children = []
const stopAll = () => children.forEach((c) => { try { c.kill() } catch {} })
process.on('SIGINT', () => { stopAll(); process.exit(0) })
process.on('SIGTERM', () => { stopAll(); process.exit(0) })

// 1) Backend. Tables yahin startup par bante hain (main.py ka create_all)
const api = spawn(py, ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], { cwd: backend, stdio: 'inherit' })
children.push(api)
api.on('exit', (code) => { if (code) { console.error('\n❌ Backend stopped. PostgreSQL chal raha hai? (npm run db) aur Backend/.env ka DATABASE_URL sahi hai?'); stopAll(); process.exit(1) } })

// 2) Backend ready hone ka wait
const ready = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://localhost:8000/api/health')).ok) return true } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}
if (!(await ready())) { console.error('❌ Backend did not start in 60s'); stopAll(); process.exit(1) }

// 3) Sample mandi prices import (dobara chalane par duplicate nahi banta - script upsert karti hai)
console.log('\n▶ Importing mandi prices...')
const imp = spawnSync(py, ['-m', 'scripts.import_mandi_prices'], { cwd: backend, stdio: 'inherit' })
if (imp.status !== 0) console.warn('⚠ Mandi import failed - Prices page khali ho sakta hai (baaki app chalega).')

// 4) Frontend
const ui = spawn('npm', ['run', 'dev'], { cwd: frontend, stdio: 'inherit', shell: isWin })
children.push(ui)
ui.on('exit', () => { stopAll(); process.exit(0) })
console.log('\n✅ App: http://localhost:5173   |   API docs: http://localhost:8000/docs\n')
