-- SQL Script untuk membuat Admin Account di Railway MySQL
-- Jalankan script ini di Railway → MySQL Service → Query Tab

-- 1. Cek apakah admin sudah ada
SELECT * FROM users WHERE email = 'admin@kostku.com';

-- 2. Jika hasil query di atas kosong, jalankan INSERT berikut:
INSERT INTO users (
  name, 
  email, 
  password, 
  phone, 
  role, 
  email_verified, 
  phone_verified,
  created_at,
  updated_at
) VALUES (
  'Super Admin',
  'admin@kostku.com',
  '$2b$10$L3onVmd9qDVRe3vQMYzZIe82aKxER8Prhbd9ASU9cKI14XQQO5Si.',
  '081234567890',
  'admin',
  1,
  1,
  NOW(),
  NOW()
);

-- 3. Verifikasi admin berhasil dibuat
SELECT id, name, email, role, email_verified, phone_verified, created_at 
FROM users 
WHERE email = 'admin@kostku.com';

-- Login Credentials:
-- Email: admin@kostku.com
-- Password: admin123
-- Role: admin
