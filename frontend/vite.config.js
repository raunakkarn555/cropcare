// by Raunak
// Port 5173 fixed rakha hai kyunki backend ke CORS me sirf yahi port allowed hai (Backend/app/main.py)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
