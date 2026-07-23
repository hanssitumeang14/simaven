# SIMAVEN

System Management Vendor untuk pengadaan RSJPD Harapan Kita. Backend FastAPI, frontend React + TypeScript, dengan generate PDF Surat Perintah Kerja di sisi server.

```
simaven/
├── backend/          FastAPI + SQLAlchemy + Alembic + WeasyPrint
├── frontend/         React 18 + TypeScript + Vite + TanStack Query
└── docker-compose.yml
```

## Menjalankan

### Docker (paling cepat)

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API docs: http://localhost:8000/docs

### Lokal

**Backend**

```bash
cd backend
cp .env.example .env
uv sync --extra dev
uv run alembic revision --autogenerate -m "initial schema"   # sekali di awal
uv run alembic upgrade head
make dev                                                      # port 8000
```

WeasyPrint butuh Pango dan Cairo di level sistem. Di macOS: `brew install pango cairo gdk-pixbuf libffi`. Di Ubuntu/Debian: `apt install libpango-1.0-0 libpangoft2-1.0-0 libcairo2`. Ini penyebab error paling umum saat naik ke production — Dockerfile backend sudah menanganinya.

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                                                   # port 5173
```

`VITE_API_BASE_URL` sengaja dikosongkan saat dev; request `/api` diteruskan ke `localhost:8000` lewat proxy Vite, jadi tidak ada urusan CORS.

## Type safety ujung ke ujung

Backend menerbitkan OpenAPI schema; frontend menghasilkan tipe TypeScript dari schema itu.

```bash
# backend jalan dulu, lalu:
cd frontend && npm run generate:api
```

Hasilnya masuk ke `src/types/api.generated.ts` (tidak di-commit). Kalau ada field Pydantic yang berubah, TypeScript langsung menyalak di frontend. Tipe yang ditulis tangan di `src/types/` tetap dipakai sebagai antarmuka yang lebih enak dibaca — bandingkan keduanya saat schema berubah.

## Arsitektur backend

```
src/app/
├── entrypoints/          Lapisan HTTP: routing, dependency, serialisasi
│   ├── controller/       vendor.py, project.py, spk.py, health.py
│   ├── deps.py           Annotated dependency (DbSession, service, pagination)
│   └── router.py
├── service_layer/        Aturan bisnis. Tidak tahu soal HTTP.
│   ├── schemas/          Model Pydantic (validasi masuk & keluar)
│   └── services/         VendorService, ProjectService, SpkService
├── adapters/             Perkakas luar
│   ├── db/               models/, repositories/, session.py
│   └── pdf/              renderer.py + templates/spk.html
├── lib/                  logging.py, exceptions.py
├── config.py
└── main.py
```

Controller tidak pernah menyentuh SQLAlchemy langsung, dan service tidak pernah mengembalikan `Response`. `DomainError` dari service dipetakan ke kode HTTP oleh exception handler di `main.py`, jadi aturan bisnis hanya ditulis di satu tempat.

## Alur SPK

1. Vendor didaftarkan, lalu digerakkan melalui verifikasi 8 langkah (`POST /vendors/{id}/verification`). Status `verified` baru boleh disetel setelah langkah 8.
2. Vendor pemenang ditetapkan pada paket pengadaan (`POST /projects/{id}/award`). Hanya vendor terverifikasi yang diterima.
3. SPK dibuat (`POST /spk`) dengan baris rincian pekerjaan. Total dihitung server, bukan dikirim frontend.
4. SPK diterbitkan (`POST /spk/{id}/issue`). Setelah ini isinya terkunci.
5. PDF diambil dari `GET /spk/{id}/pdf` — `?download=true` untuk unduh, tanpa parameter untuk pratinjau di browser.

### Nomor SPK

Format `001/SPK/VII/2026` — urutan per tahun, bulan angka Romawi. Nomor dibuat di server, tidak pernah dikirim dari frontend. Tabel `spk` punya `UniqueConstraint(sequence_no, year)`, jadi kalau dua permintaan datang bersamaan, yang kalah kena `IntegrityError` dan dikembalikan sebagai 409 — bukan diam-diam menghasilkan nomor kembar.

### Template PDF

`backend/src/app/adapters/pdf/templates/spk.html` adalah HTML + CSS biasa. Kop surat, tabel rincian, blok tanda tangan, dan nomor halaman semuanya diatur lewat CSS `@page`. Untuk menyetel tata letak, buka hasil `PdfRenderer.render_html()` di browser dulu — jauh lebih cepat daripada bolak-balik render PDF.

Filter Jinja yang tersedia: `rupiah`, `terbilang` (angka ke kata bahasa Indonesia, wajib ada di dokumen resmi), dan `tanggal_id`.

## Frontend

```
src/
├── api/                  Pembungkus endpoint (vendor, project, spk)
├── hooks/                Hook TanStack Query per domain
├── lib/                  api-client.ts, format.ts, query-client.ts
├── types/                Tipe domain yang ditulis tangan
├── components/
│   ├── ui/               shadcn/ui dari Figma Make
│   ├── layout/           Sidebar, TopBar dari desain Figma
│   └── spk/              SpkFormDialog — form dengan baris dinamis
├── pages/
│   └── _figma_reference/ View asli dari Figma (masih data mock)
└── App.tsx
```

`pages/_figma_reference/` berisi `DashboardView`, `VendorListView`, `MonitoringView`, dan modal detailnya persis seperti keluaran Figma Make. Folder ini dikecualikan dari typecheck karena masih memakai data mock — pakai sebagai acuan visual, pindahkan isinya ke `pages/` sambil mengganti mock dengan hook di `hooks/`.

Catatan: Figma Make menulis import dengan versi tersemat (`from "lucide-react@0.487.0"`). Semua sudah dibersihkan; kalau nanti menarik komponen baru dari Figma, ingat untuk membersihkan lagi.

### Validasi form

Skema Zod di `SpkFormDialog.tsx` mencerminkan model Pydantic di backend. Keduanya ditulis terpisah dengan sengaja: Zod memberi umpan balik langsung ke pengguna, Pydantic yang menentukan — frontend selalu bisa dilewati. Kalau salah satu berubah, ubah keduanya.

Baris rincian pekerjaan pakai `useFieldArray`; nilai uang dikirim sebagai string supaya presisi `Decimal` tidak hilang lewat `Number` JavaScript.

## Test

```bash
cd backend && make test
```

18 test mencakup: validasi NPWP ganda, aturan verifikasi 8 langkah, penomoran SPK berurutan, penguncian SPK setelah terbit, konversi terbilang, dan generate PDF sungguhan (memeriksa byte hasilnya benar-benar diawali `%PDF`). Test pakai SQLite in-memory, jadi tidak butuh Postgres jalan.

## Yang belum ada

Sengaja dikosongkan supaya bisa disesuaikan:

- Autentikasi dan otorisasi. Belum ada sama sekali — semua endpoint terbuka.
- Upload file dokumen vendor. Kolom `documents` sudah ada (JSONB) tapi baru menyimpan nama file; belum ada endpoint upload maupun object storage.
- Audit trail. Untuk dokumen resmi seperti SPK biasanya perlu catatan siapa mengubah apa dan kapan.
- Tanda tangan elektronik pada PDF.
- Migrasi Alembic awal. Jalankan `alembic revision --autogenerate` sekali setelah database siap.
