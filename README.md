# CropCare - Run locally
by Raunak

Chahiye: **Node.js 18+**, **Python 3.10+**, aur **PostgreSQL** (Docker ya local).

## 1. Ek baar setup
```bash
npm run setup
```
Ye venv banata hai, backend packages (missing 4 packages bhi) install karta hai, `Backend/.env` (random JWT secret ke saath) aur `frontend/.env` banata hai, aur frontend `npm install` karta hai.

## 2. PostgreSQL chalu karo (koi ek option)
**A) Docker hai:**
```bash
npm run db
```
**B) Local PostgreSQL hai (Docker nahi):** psql me ye chalao:
```sql
CREATE USER cropcare_user WITH PASSWORD 'password';
CREATE DATABASE cropcare_database_name OWNER cropcare_user;
```
Phir `Backend/.env` me `DATABASE_URL` ka port apne Postgres ke port (aam taur par `5432`) se badal do.
(Ya setup ke time hi: Mac/Linux `DB_PORT=5432 npm run setup`, Windows PowerShell `$env:DB_PORT=5432; npm run setup`)

## 3. App chalao
```bash
npm run dev
```
- App: http://localhost:5173
- API docs: http://localhost:8000/docs

Ye backend start karta hai, sample mandi prices import karta hai, aur frontend start karta hai. Rokne ke liye `Ctrl + C`.

## Pehli baar
Register karo -> Farms -> "Add farm or crop" se farm + crop add karo -> Home/Tasks/Calendar me data dikhega.

## Problems
- `Backend stopped` -> PostgreSQL nahi chal raha ya `DATABASE_URL` ka port galat hai.
- `Setup not done yet` -> pehle `npm run setup`.
- Mandi import me "Row 7 rejected: min_price cannot exceed max_price" -> `data/mandi_prices.csv` ki ek row me data galat hai (DB member ko bolo). Baaki rows import ho jaati hain.
- 30 min baad logout ho jana normal hai (token expiry).

Team ke liye notes: `frontend/TEAM_NOTES.md`
