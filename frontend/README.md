# CropCare Frontend (React + Vite)
by Raunak

## Run karne ka tarika
```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:8000
npm install
npm run dev               # http://localhost:5173  (port fixed hai - backend CORS ke liye)
```
Backend alag chalao: `cd Backend && uvicorn app.main:app --reload` (port 8000).

## Pages (Figma ke hisaab se)
Login, Register, Home, My farms, Add crop (4 step), Crop detail, Tasks, Calendar, Market prices, Notifications.
Mobile par bottom tab bar, tablet/desktop par side menu.

## Folder
- `src/api/` - saari API calls (sirf existing backend endpoints)
- `src/pages/` - screens
- `src/components/` - Layout, Icons, reusable UI
- `src/utils/` - date helpers, crop schedule logic
- `src/context/` - login state, toast
