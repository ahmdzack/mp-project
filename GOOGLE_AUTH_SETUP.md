# Setup Google Sign-In - Panduan Lengkap

## ✅ Yang Sudah Dikerjakan

1. ✅ Dependencies terinstall (passport, @react-oauth/google, google-auth-library)
2. ✅ User model sudah diupdate dengan field `google_id`, `provider`, dan `avatar`
3. ✅ Backend controller dan route untuk Google auth sudah dibuat
4. ✅ Frontend Login dan Register page sudah ada Google Sign-In button
5. ✅ GoogleOAuthProvider sudah di-wrap di main.jsx

## 📋 Langkah Setup (Yang Perlu Anda Lakukan)

### 1. Dapatkan Google OAuth Credentials

#### a) Buka Google Cloud Console
- Kunjungi: https://console.cloud.google.com/

#### b) Buat/Pilih Project
1. Klik dropdown project di bagian atas
2. Klik "New Project"
3. Nama project: **Kost App** (atau nama lain)
4. Klik "Create"

#### c) Enable APIs
1. Menu: "APIs & Services" > "Library"
2. Cari dan enable:
   - **Google+ API** atau
   - **Google People API**

#### d) Setup OAuth Consent Screen
1. Menu: "APIs & Services" > "OAuth consent screen"
2. Pilih **External** > Klik "Create"
3. Isi form:
   - App name: **Kost App**
   - User support email: email Anda
   - Developer contact: email Anda
4. Klik "Save and Continue" sampai selesai
5. Status biarkan **Testing** (tidak perlu publish)

#### e) Buat Credentials
1. Menu: "Credentials" > "Create Credentials" > "OAuth client ID"
2. Application type: **Web application**
3. Name: **Kost Web Client**
4. **Authorized JavaScript origins** - tambahkan:
   ```
   http://localhost:5173
   http://localhost:5174
   ```
5. **Authorized redirect URIs** - tambahkan:
   ```
   http://localhost:3000/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   ```
6. Klik "Create"
7. **SIMPAN** Client ID dan Client Secret yang muncul

### 2. Setup Backend Environment Variables

#### a) Buat file `.env` di folder `backend/`
```bash
cd backend
cp .env.example .env
```

#### b) Edit `backend/.env` dan tambahkan:
```env
# Google OAuth (GANTI dengan credentials Anda)
GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

**PENTING:** Ganti nilai di atas dengan Client ID dan Secret yang Anda dapat dari Google Cloud Console!

### 3. Setup Frontend Environment Variables

#### a) Buat file `.env` di folder `frontend/`
```bash
cd frontend
cp .env.example .env
```

#### b) Edit `frontend/.env` dan tambahkan:
```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Google OAuth Client ID (GANTI dengan Client ID Anda)
VITE_GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# Midtrans (opsional, jika belum ada)
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
```

**PENTING:** Ganti `VITE_GOOGLE_CLIENT_ID` dengan Client ID yang sama dari Google Cloud Console!

### 4. Update Database (Migration)

Karena kita menambahkan field baru ke model User, perlu update database:

```sql
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) UNIQUE NULL,
ADD COLUMN provider ENUM('local', 'google') DEFAULT 'local',
ADD COLUMN avatar VARCHAR(500) NULL,
MODIFY COLUMN password VARCHAR(255) NULL;
```

Atau drop dan recreate database (hanya untuk development):
```bash
# Di MySQL
DROP DATABASE IF EXISTS kost_reservation;
CREATE DATABASE kost_reservation;
```

Kemudian restart backend agar Sequelize sync ulang:
```bash
cd backend
npm start
```

### 5. Testing

#### a) Jalankan Backend
```bash
cd backend
npm run dev
```

#### b) Jalankan Frontend
```bash
cd frontend
npm run dev
```

#### c) Test Google Sign-In
1. Buka browser: http://localhost:5173/login
2. Klik tombol "Sign in with Google"
3. Pilih akun Google Anda
4. Seharusnya login berhasil dan redirect ke homepage

## 🔧 Troubleshooting

### Error: "Invalid Client ID"
- Pastikan `VITE_GOOGLE_CLIENT_ID` di frontend sama dengan yang di Google Cloud Console
- Pastikan tidak ada spasi di awal/akhir Client ID

### Error: "redirect_uri_mismatch"
- Pastikan URL di Authorized redirect URIs sudah benar
- Cek port backend (default: 3000 atau 5000)

### Error: "Access blocked: This app's request is invalid"
- Pastikan OAuth consent screen sudah disetup
- Tambahkan email Anda sebagai test user di OAuth consent screen

### Google button tidak muncul
- Cek console browser untuk error
- Pastikan `VITE_GOOGLE_CLIENT_ID` ada di `.env`
- Restart frontend dev server setelah update .env

## 📝 Catatan Penting

1. **Jangan commit file .env** - sudah ada di .gitignore
2. **Untuk production**, tambahkan domain production Anda ke:
   - Authorized JavaScript origins
   - Authorized redirect URIs
3. **Google emails otomatis terverifikasi** - tidak perlu verifikasi email manual
4. **User bisa login dengan Google atau email/password** - sistem support keduanya

## 🎉 Selesai!

Setelah semua langkah di atas, Google Sign-In sudah ready untuk digunakan!
