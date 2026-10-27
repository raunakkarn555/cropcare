# Team ke liye notes (Raunak - Frontend)

Backend ya DB ki koi file touch nahi ki gayi. Frontend ko jo kuch chahiye tha wo neeche likha hai.

## Backend wale member ke liye
Ye sab frontend me abhi workaround se chal raha hai. Agar backend me add ho jaye to bata dena, hum frontend simple kar denge.

1. **Plot ka concept nahi hai.** Figma me "North plot / South plot" hai, par `Crop` model me plot field nahi. Abhi hum `notes` me `Plot: North plot` likh rahe hain. Request: `Crop` me `plot_name` field (aur `CropCreate/CropResponse` schema me).
2. **Crop add karte time schedule/tasks auto-generate nahi hote.** Frontend crop banata hai aur phir `POST /api/tasks` se 4 tasks alag-alag bhejta hai. Request: `POST /api/crops` me schedule generate ho jaye (ya `POST /api/crops/{id}/schedule`).
3. **Task response me crop name nahi aata.** Hum `/api/crops` alag se bulake jodte hain. Request: `TaskResponse` me `crop_name` (reminders me already hai).
4. **Notifications API nahi hai.** Hum reminders + crops ke `created_at` se bana rahe hain. Reminder ka time nahi milta (Figma me "6:00 am" hai).
5. **Forgot password API nahi hai.** Button abhi sirf message dikhata hai.
6. **Token 30 min me expire hota hai, refresh token nahi.** 401 aane par frontend logout kar deta hai. Request: refresh token ya expiry badhana.
7. **Crop area check:** `create_crop` sirf check karta hai `crop.area <= farm.area`, same farm ke saare crops ka total area nahi jodta. Isse farm area se zyada total ho sakta hai.
8. **Mandi `/latest` me `DISTINCT ON` hai** - ye sirf PostgreSQL me chalega (SQLite par error). Dev ko PostgreSQL hi use karna hoga.
9. **`/api/auth/me`** apne andar token decode karta hai, jabki `dependencies.get_current_user` already ye kaam karta hai. Error nahi hai, bas duplicate code.
10. **CORS** me sirf `localhost:5173` / `127.0.0.1:5173` allowed hai. Deploy karte time frontend ka domain add karna padega.
11. `JWT_SECRET_KEY` `.env` me na ho to server import par hi crash hota hai (`services/auth.py`).

## Database wale member ke liye
1. Mandi table me data hona chahiye (`scripts/import_mandi_prices.py` + `data/mandi_prices.csv`), warna Prices page khali dikhega. Frontend Bihar state ke liye `/api/mandi/latest` bulata hai.
2. Agar backend wale `plot_name` field add karte hain to ek naya Alembic migration chahiye hoga.
3. Task ka `due_date` hi frontend "overdue" nikalne me use karta hai - isliye `due_date` hamesha sahi `Date` me save ho.
4. Testing ke liye kuch sample user, farm, crops aur tasks seed kar do taaki Home/Calendar me data dikhe.

## Frontend me jo Figma se alag hai
- Register page Figma me nahi tha, login jaisa banaya hai.
- Figma me "Sample data" badge hai; hum real API data dikhate hain, badge me state ka naam hai.
- Farm/crop delete aur edit ki screen Figma me nahi thi, isliye nahi banayi (API exist karti hai).
