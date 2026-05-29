# Dokumentasi Fitur Marker (Custom & Delete)

## Ringkasan

Dokumentasi ini menjelaskan implementasi fitur **menambahkan marker custom** dan **menghapus marker** dalam aplikasi Strategic Dashboard. Kedua fitur ini memungkinkan operator untuk membuat, mengelola, dan menghapus marker tambahan pada peta secara dinamis.

---

## 1. Fitur Tambah Marker Custom

### Deskripsi
Memungkinkan operator untuk menambahkan marker kustom ke peta dengan informasi:
- **Judul** (title)
- **Kategori** (categoryId)
- **Deskripsi** (description)
- **Koordinat** (x, y)

### Lokasi File

#### File Utama: `src/strategic/StrategicDashboardPage.jsx`

**Line 1220-1335:** Modal dialog untuk input marker baru
```jsx
function AddMarkerModal({ draft, onChange, onClose, onSubmit, categories }) {
  // Form input untuk judul, kategori, deskripsi, dan koordinat
}
```

**Line 2604-2621:** Handler untuk membuka form tambah marker
```jsx
const handleCanvasRightClick = (event) => {
  // ... deteksi klik kanan pada peta
  setMarkerDraft({
    x: worldPoint.x,
    y: worldPoint.y,
    categoryId: null,
    title: "",
    description: "",
  });
};
```

**Line 3724-3756:** Render modal dan submit handler
```jsx
{markerDraft ? (
  <AddMarkerModal
    draft={markerDraft}
    onChange={(field, value) => setMarkerDraft(...)}
    onClose={() => setMarkerDraft(null)}
    onSubmit={() => {
      const newMarker = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        categoryId: markerDraft.categoryId,
        position: [markerDraft.x, markerDraft.y],
        popup: {
          title: markerDraft.title.trim() || "Custom Marker",
          description: markerDraft.description.trim(),
        },
      };
      // Simpan ke customMarkers
    }}
  />
) : null}
```

### Data Structure

Marker custom disimpan di `plannerResource.customMarkers` dengan struktur:
```javascript
{
  id: "custom-1234567890-abc123",  // ID unik dengan prefix "custom-"
  categoryId: "1",                  // Referensi ke kategori marker
  position: [1234, 5678],           // Koordinat [x, y] pada peta
  popup: {
    title: "Nama Marker",
    description: "Deskripsi marker"
  }
}
```

> Note: `popup.description` digunakan untuk `resolvedDescription` pada marker custom, sehingga teks deskripsi muncul di popup marker saat marker dipilih.

### Cara Kerja

1. **Klik Kanan** di atas peta → membuka form input marker
2. **Isi form** dengan judul, kategori, dan deskripsi
3. **Submit** → marker disimpan ke `customMarkers` array
4. Marker otomatis tampil di peta dengan warna kategori yang dipilih

### UI Components
- **AddMarkerModal** (`Line 1220`): Form input modal dengan animasi Framer Motion
- **Input Fields**:
  - Marker Title: `<input>` textarea untuk judul
  - Category Select: dropdown pilihan kategori
  - Description: `<textarea>` untuk deskripsi/catatan
  - Coordinates: display-only, otomatis dari klik lokasi

---

## 2. Fitur Hapus Marker

### Deskripsi
Memungkinkan operator untuk menghapus marker custom dengan konfirmasi sebelum aksi.
Fitur ini hanya tersedia untuk marker dengan prefix `"custom-"`.

### Lokasi File

#### File Utama: `src/strategic/StrategicDashboardPage.jsx`

**Line 2329-2350:** Handler untuk menghapus marker
```jsx
const handleDeleteCustomMarker = (markerId) => {
  const shouldDelete = window.confirm(
    "Hapus marker ini? Tindakan ini tidak dapat dibatalkan.",
  );

  if (!shouldDelete) {
    return;
  }

  setPlannerResource((currentPlannerResource) => {
    const currentMarkers = currentPlannerResource?.customMarkers ?? [];
    const nextMarkers = currentMarkers.filter((m) => m.id !== markerId);
    return {
      ...currentPlannerResource,
      customMarkers: nextMarkers,
    };
  });

  // Clear related UI state
  setSelectedMarkerId((currentSelected) =>
    currentSelected === markerId ? null : currentSelected,
  );
  setHoveredMarkerId((currentHovered) =>
    currentHovered === markerId ? null : currentHovered,
  );
  setIntelModalMarkerId((currentIntel) =>
    currentIntel === markerId ? null : currentIntel,
  );
};
```

### Tombol Delete - Lokasi

#### 1. Popup Info Marker (saat marker dipilih pada peta)
**Line 2981-2991:** Tombol di popup marker info
```jsx
{selectedMarker.id.startsWith("custom-") ? (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      handleDeleteCustomMarker(selectedMarker.id);
    }}
    className="mt-4 flex items-center gap-1.5 w-full justify-center rounded-[12px] border border-rose-500/30 bg-rose-500/10 py-2 font-public text-[9px] font-bold uppercase tracking-[0.18em] text-rose-300 transition hover:bg-rose-500/20"
  >
    <PlannerIcon name="trash" className="h-3 w-3" />
    Delete Marker
  </button>
) : null}
```

#### 2. Detail Panel Marker (side panel kanan)
**Line 3615-3622:** Tombol di marker detail panel
```jsx
{selectedMarker.id.startsWith("custom-") ? (
  <PlannerButton
    active={false}
    icon="trash"
    label="Delete Marker"
    onClick={() => handleDeleteCustomMarker(selectedMarker.id)}
  />
) : null}
```

#### 3. Quick Intel List
**Line 3640-3667:** Tombol delete pada daftar marker (hanya untuk custom)
```jsx
<div className="mt-4 grid gap-2 md:grid-cols-2">
  {pagedQuickIntelMarkers.map((marker) => (
    <div
      key={marker.id}
      className="rounded-[18px] border border-white/8 bg-[#151a1d]/90 px-4 py-3 backdrop-blur-xl transition hover:border-lime-300/20 hover:bg-lime-300/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setIntelModalMarkerId(null);
            setSelectedMarkerId(marker.id);
            focusMarkerOnMap(marker);
          }}
          className="flex-1 text-left"
        >
          {/* Marker info */}
        </button>
        <span className="inline-flex items-center gap-2">
          {marker.id.startsWith("custom-") ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteCustomMarker(marker.id);
              }}
              className="inline-flex h-9 items-center justify-center rounded-full border border-rose-400/25 bg-rose-500/10 px-3 text-[10px] uppercase tracking-[0.18em] text-rose-200 transition hover:bg-rose-500/20"
            >
              Delete
            </button>
          ) : null}
          <MarkerBadge category={marker.category} />
        </span>
      </div>
    </div>
  ))}
</div>

> Note: Klik item di Quick Intel List sekarang hanya memilih marker dan memfokuskan peta. Ini tidak otomatis menampilkan threat intel modal kecuali marker tersebut memang memerlukan mode intel khusus.
```

### Cara Kerja Delete

1. **Klik tombol Delete** pada salah satu lokasi di atas
2. **Konfirmasi dialog** muncul: "Hapus marker ini? Tindakan ini tidak dapat dibatalkan."
3. **Jika OK**:
   - Marker dihapus dari `customMarkers` array
   - UI state yang terkait dibersihkan:
     - `selectedMarkerId` → `null` (jika marker yg dihapus sedang dipilih)
     - `hoveredMarkerId` → `null` (jika sedang hover)
     - `intelModalMarkerId` → `null` (jika dialog intel sedang terbuka)
4. **Jika Cancel**: tidak ada perubahan

---

## 3. Integrasi Data

### State Management

#### Synced Resource: `plannerResource`
```javascript
{
  customMarkers: [
    {
      id: "custom-1234567890-abc123",
      categoryId: "1",
      position: [1234, 5678],
      popup: { title: "...", description: "..." }
    },
    // ... more custom markers
  ],
  // ... other planner state
}
```

State ini disinkronkan otomatis dengan backend melalui hook `useSyncedResource()` dengan delay 700ms.

#### Local State
```javascript
const [selectedMarkerId, setSelectedMarkerId] = useState(null);
const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
const [markerDraft, setMarkerDraft] = useState(null);
const [intelModalMarkerId, setIntelModalMarkerId] = useState(null);
```

### Kombinasi Marker

Pada render, marker statis (dari RONOGRAD_MAP_DATA) dan marker custom digabung:
```javascript
const allMarkers = useMemo(() => {
  const staticMarkers = RONOGRAD_MAP_DATA.markers || [];
  const dynamicMarkers = Array.isArray(plannerResource.customMarkers) 
    ? plannerResource.customMarkers 
    : [];
  return [...staticMarkers, ...dynamicMarkers];
}, [plannerResource.customMarkers]);
```

---

## 4. Validasi & Keamanan

### Identifier untuk Custom Marker
```javascript
// Generate ID yang unik
id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// Deteksi marker custom
marker.id.startsWith("custom-")
```

### Validasi Input
- **Title**: Dipotong whitespace, fallback ke "Custom Marker" jika kosong
- **CategoryId**: Wajib dipilih, validasi terhadap daftar kategori yang tersedia
- **Coordinates**: Otomatis dari lokasi klik, tidak bisa edit manual
- **Description**: Optional, dipotong whitespace saat submit

---

## 5. UI/UX Details

### Styling
- **Delete Button**: Rose/merah (`border-rose-400/25`, `bg-rose-500/10`, `text-rose-200`)
- **Hover State**: `hover:bg-rose-500/20`
- **Icon**: Trash icon (`PlannerIcon name="trash"`)

### Animasi
- **Modal Form**: Framer Motion dengan fade-in, scale, blur
- **Popup Marker**: Animasi entrance saat dipilih

### Accessibility
- Tombol delete dilindungi `event.stopPropagation()` agar tidak trigger marker selection
- Konfirmasi dialog mencegah hapus tidak sengaja

---

## 6. Alur Lengkap

### Menambah Marker
```
[User klik kanan di peta]
  ↓
[handleCanvasRightClick() dipicu]
  ↓
[setMarkerDraft() dengan koordinat lokasi]
  ↓
[AddMarkerModal render]
  ↓
[User isi form & submit]
  ↓
[newMarker dibuat dengan id "custom-*"]
  ↓
[setPlannerResource() update customMarkers]
  ↓
[Auto-sync ke backend (700ms delay)]
  ↓
[Marker tampil di peta dengan kategori warna]
```

### Menghapus Marker
```
[User klik tombol Delete]
  ↓
[handleDeleteCustomMarker() dipicu]
  ↓
[window.confirm() dialog]
  ↓
[Jika OK → setPlannerResource() update customMarkers]
  ↓
[Clear state: selectedMarkerId, hoveredMarkerId, intelModalMarkerId]
  ↓
[Auto-sync ke backend (700ms delay)]
  ↓
[Marker hilang dari peta & list]
```

---

## 7. Catatan Teknis

### Dependencies
- `framer-motion`: Animasi modal
- `react`: State management, hooks
- Backend API: Synced resource dengan debounce

### Browser APIs
- `window.confirm()`: Konfirmasi delete
- `window.Date.now()`: Timestamp untuk unique ID
- `Math.random()`: Random string untuk unique ID

### Performance
- Marker list di-memoize untuk mencegah re-render berlebihan
- Custom marker filter otomatis dalam `normalizedMarkers` dan `filteredMarkers`
- State update menggunakan functional updates untuk consistency

---

## 8. Testing Checklist

- [ ] Klik kanan di peta → form muncul
- [ ] Isi form & submit → marker tampil di peta
- [ ] Klik marker → detail panel muncul
- [ ] Klik delete → konfirmasi dialog muncul
- [ ] Konfirmasi OK → marker hilang
- [ ] Konfirmasi Cancel → marker tetap ada
- [ ] Marker muncul di Quick Intel List
- [ ] Delete button di Quick Intel List bekerja
- [ ] Refresh halaman → custom marker tetap ada (persisted)
- [ ] Multiple marker custom bisa ditambah & dihapus
- [ ] Delete marker juga clear selection jika sedang dipilih

---

**Last Updated:** May 28, 2026
**Status:** ✅ Implemented
