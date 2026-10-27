// by Raunak
// Ek baar chalao: `npm run setup`  (venv + packages + .env files + frontend install)
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'

const isWin = process.platform === 'win32'
const root = process.cwd()
const backend = join(root, 'Backend')
const frontend = join(root, 'frontend')
const venvPython = isWin ? join(backend, 'venv', 'Scripts', 'python.exe') : join(backend, 'venv', 'bin', 'python')

const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin })
  if (r.status !== 0) { console.error(`\n❌ Failed: ${cmd} ${args.join(' ')}`); process.exit(1) }
}

// 1) system python dhoondo
const candidates = isWin ? ['python', 'py'] : ['python3', 'python']
const py = candidates.find((c) => spawnSync(c, ['--version'], { shell: isWin }).status === 0)
if (!py) { console.error('❌ Python 3.10+ not found. Install it from python.org first.'); process.exit(1) }

// 2) venv + packages
if (!existsSync(venvPython)) { console.log('\n▶ Creating Python venv...'); run(py, ['-m', 'venv', 'venv'], backend) }
console.log('\n▶ Installing backend packages...')
run(venvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt'], backend)
run(venvPython, ['-m', 'pip', 'install', '-r', join(root, 'extra-requirements.txt')], backend)

// 3) Backend/.env (agar pehle se hai to chhedte nahi)
const envPath = join(backend, '.env')
if (!existsSync(envPath)) {
  const port = process.env.DB_PORT || '5433' // docker-compose wala port; local postgres ho to DB_PORT=5432 do
  writeFileSync(envPath, [
    `DATABASE_URL=postgresql+psycopg://cropcare_user:password@localhost:${port}/cropcare_database_name`,
    `JWT_SECRET_KEY=${randomBytes(32).toString('hex')}`,
    'JWT_ALGORITHM=HS256',
    'ACCESS_TOKEN_EXPIRE_MINUTES=30',
    '',
  ].join('\n'))
  console.log(`\n✔ Created Backend/.env (DB port ${port})`)
} else console.log('\n✔ Backend/.env already exists - left as is')

// 4) frontend/.env + npm install
const feEnv = join(frontend, '.env')
if (!existsSync(feEnv)) writeFileSync(feEnv, 'VITE_API_URL=http://localhost:8000\n')
console.log('\n▶ Installing frontend packages...')
run('npm', ['install', '--no-audit', '--no-fund'], frontend)

console.log('\n✅ Setup done.\n   1) Start PostgreSQL:  npm run db   (needs Docker)  - ya apna local PostgreSQL\n   2) Run the app:       npm run dev\n   3) Open:              http://localhost:5173\n')
