# Aplikasi Inventaris Toko

Aplikasi ini merupakan sistem manajemen inventaris toko berbasis mobile yang digunakan untuk mengelola data barang secara sederhana.

## Deskripsi

Aplikasi terdiri dari dua bagian:
- Backend menggunakan FastAPI
- Frontend menggunakan React Native (Expo)

Frontend berfungsi sebagai antarmuka pengguna untuk melakukan operasi CRUD terhadap data barang.

## Fitur Utama

- Menampilkan daftar barang
- Menambahkan barang baru
- Mengubah data barang
- Menghapus barang
- Menampilkan total stok dan jumlah barang

## Teknologi yang Digunakan

- FastAPI (Backend)
- MongoDB (Database)
- React Native + Expo (Frontend)

## Cara Menjalankan Aplikasi

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload

### Frontend

cd frontend
npm install
npx expo start

Scan QR code menggunakan aplikasi Expo Go di smartphone.

Catatan

Pastikan MongoDB sudah berjalan di localhost:27017 sebelum menjalankan backend.

Tujuan

Aplikasi ini dibuat untuk memenuhi tugas pembuatan aplikasi mobile sederhana dengan implementasi proses bisnis CRUD.
