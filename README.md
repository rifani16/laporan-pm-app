# Laporan PM

Aplikasi pencatatan Penerima Manfaat (PM) dan penyaluran program, dengan dua role: `super_admin` dan `admin_daerah`.

## Arsitektur

```
Browser (React + Vite)
   -> /api  (Vercel function: api/index.js)
   -> Google Apps Script Web App (gas/)
   -> Google Spreadsheet (MASTER_PM, SALUR, REF, Users)
```

- `src/` — frontend React 19, Tailwind, react-router.
- `api/index.js` — proxy: memeriksa origin, menyuntik `API_KEY` dan token sesi, menyembunyikan URL GAS.
- `gas/` — backend Apps Script: login, sesi, otorisasi role/daerah, CRUD. Folder ini sengaja di-`.gitignore` (tidak masuk repo); kode hanya ada di editor Apps Script dan salinan lokal.

Keamanan ditegakkan di server (GAS), bukan di browser. Login mengeluarkan token sesi (6 jam, disimpan di `CacheService`). Admin daerah hanya bisa membaca dan mengubah data daerahnya.

## Setup

1. **Spreadsheet.** Buat sheet `MASTER_PM`, `SALUR`, `REF`, `Users`. Kolom `Users`: `username`, `password`, `nama`, `role`, `daerah`, `status`. Isi `password` dengan `=HASH_PW("password-anda")` lalu salin sebagai nilai (paste values only).
2. **Apps Script.** Salin semua file di `gas/` ke project Apps Script yang terikat spreadsheet. Di Project Settings > Script Properties, tambah `API_KEY` (string acak panjang). Deploy sebagai Web App, lalu catat URL `/exec`.
3. **Env lokal.** Salin `.env.example` ke `.env`, isi `GAS_URL` dan `GAS_API_KEY` (sama dengan `API_KEY` di langkah 2).
4. **Jalankan.**
   ```
   npm install
   npm run dev
   ```

## Deploy (Vercel)

Set environment variable `GAS_URL` dan `GAS_API_KEY` (opsional `ALLOWED_ORIGINS`, dipisah koma). Setiap kali file `gas/` berubah, salin ke editor Apps Script lalu Deploy > Manage deployments > New version.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server dev (proxy API ikut berjalan) |
| `npm run build` | build produksi |
| `npm run lint` | ESLint |

## Catatan keamanan

- Jangan commit `.env`. Kunci API dan URL GAS bersifat server-only (tanpa prefix `VITE_`).
- Hash password saat ini SHA-256 bersalt. Password plain text di sheet `Users` otomatis di-hash saat login pertama.
- Login dikunci 15 menit setelah 5 kali gagal per username.
