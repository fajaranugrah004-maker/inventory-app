# Aplikasi Manajemen Stok Barang (Inventory Management App)

## Overview
A simple mobile inventory management application for small shops to manage their product stock. Built with React Native (Expo) using AsyncStorage for local data persistence — no backend required.

## Tech Stack
- **Framework**: React Native with Expo SDK 54
- **Routing**: expo-router (file-based)
- **Storage**: @react-native-async-storage/async-storage (local device storage)
- **Language**: TypeScript
- **UI**: Plain React Native components (no UI library)
- **UI Language**: Bahasa Indonesia

## Data Model
```typescript
type Item = {
  id: string;        // unique identifier (timestamp + random)
  name: string;      // Nama Barang
  category: string;  // Kategori (free text)
  price: string;     // Harga in Rupiah (numeric string)
  stock: string;     // Jumlah Stok (numeric string)
}
```

## Features Implemented (CRUD)

### 1. Create (Tambah Barang)
- Floating action button (+) opens modal form
- Fields: Nama Barang, Kategori, Harga (Rp), Jumlah Stok
- Inline validation (red border + error message)
- Numeric-only filtering for price/stock inputs
- Live Rupiah preview while typing price

### 2. Read (Lihat Data Barang)
- FlatList displays all items as cards
- Each card shows: name, category badge, price (formatted Rupiah), stock
- Empty state with package icon when no items
- Stats header: Total Barang & Total Stok
- Low stock indicator (≤5 displays red, >5 green)

### 3. Update (Edit Barang)
- "Edit" button on each card opens pre-filled modal
- All fields editable
- Same validation as Create

### 4. Delete (Hapus Barang)
- "Hapus" button with confirmation dialog
- Cross-platform: window.confirm on web, Alert.alert on native
- Cancellable

## Business Process Solved
Aplikasi membantu toko kecil dalam:
- Pencatatan barang masuk
- Update harga dan stok
- Monitoring stok tersedia (dengan indikator stok rendah)
- Penghapusan barang yang sudah tidak dijual

## File Structure
```
/app/frontend/app/index.tsx    # Main app (single file, all logic)
/app/frontend/.env             # Environment variables
/app/frontend/package.json     # Dependencies
```

## Storage
- Key: `@inventory_items`
- Format: JSON-serialized array of Item objects
- Storage: AsyncStorage (localStorage on web, native storage on iOS/Android)

## Testing Status
- ✅ All 16 frontend tests passed (iteration 2)
- ✅ Cross-platform delete confirmation working
- ✅ Inline validation working
- ✅ AsyncStorage persistence verified

## Future Enhancements (not implemented)
- Search/filter functionality
- Sort by name/price/stock
- Categories dropdown with predefined options
- Export to CSV
- Item images (base64)
- Barcode scanning
