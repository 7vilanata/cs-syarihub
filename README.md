# Syarihub CS Conversion Dashboard

Dashboard internal untuk memprioritaskan conversation akuisisi dari hasil analisis n8n dan mencatat hasil follow-up hingga pembayaran.

## Fitur MVP

- metrik total, pending, ditindaklanjuti, converted, closed, not a lead, dan conversion rate;
- daftar conversation dengan sorting prioritas lalu waktu pesan terbaru;
- pencarian nama/ID serta filter status, priority, stage, pengirim, dan rentang tanggal;
- update status dengan konfirmasi untuk `converted`, `closed`, dan `not_a_lead`;
- endpoint ingest n8n dengan Bearer token, validasi Zod, dan upsert idempoten;
- status manual tidak ditimpa sinkronisasi; `actioned` kembali ke `pending` hanya untuk pesan customer yang lebih baru;
- login internal berbasis environment variable dan signed HTTP-only cookie;
- 12 data contoh sintetis.

## Prasyarat

- Node.js 22.13 atau lebih baru
- PostgreSQL 16 (atau Docker)

## Menjalankan lokal

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:setup
npm run dev
```

Buka `http://localhost:3000`, lalu masuk memakai `DASHBOARD_USERNAME` dan `DASHBOARD_PASSWORD` dari `.env`.

Jika PostgreSQL sudah tersedia tanpa Docker, sesuaikan `DATABASE_URL`, lalu jalankan:

```bash
npm run db:migrate
npm run db:seed
```

`db:seed` aman dijalankan ulang untuk data sintetis yang sama. Perintah ini memang mengembalikan data seed ke kondisi awal, termasuk statusnya.

## Environment variable

| Key | Fungsi |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL |
| `DASHBOARD_USERNAME` | Username login internal |
| `DASHBOARD_PASSWORD` | Password login internal |
| `SESSION_SECRET` | Secret minimal 32 karakter untuk menandatangani cookie |
| `N8N_INGEST_TOKEN` | Token terpisah untuk request ingest n8n |

Jangan commit file `.env` atau memasukkan token ingest ke kode/browser.

## Endpoint n8n

`POST /api/conversations/upsert`

Header:

```http
Authorization: Bearer <N8N_INGEST_TOKEN>
Content-Type: application/json
```

Contoh request:

```bash
curl -X POST http://localhost:3000/api/conversations/upsert \
  -H "Authorization: Bearer $N8N_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "928391",
    "contact_name": "Aisyah",
    "contact_phone": "+62 811 0000 1001",
    "last_message_at": "2026-09-23T08:30:00.000Z",
    "last_message_sender": "customer",
    "summary": "Calon user sudah memahami program dan menanyakan cara pembayaran.",
    "stage": "ready_to_pay",
    "blocker": "payment_method",
    "priority": "high",
    "next_action": "Kirim metode pembayaran dan lakukan follow-up jika belum ada konfirmasi.",
    "analyzed_at": "2026-09-23T08:32:00.000Z"
  }'
```

Respons berhasil berisi `action: "created"` atau `action: "updated"`. Payload tidak menerima `status`; status hanya diubah CS melalui dashboard.

### Konfigurasi HTTP Request node n8n

1. Method: `POST`
2. URL: `https://<domain-aplikasi>/api/conversations/upsert`
3. Authentication: `Generic Credential Type` → `Header Auth`
4. Header name: `Authorization`
5. Header value: `Bearer <token-rahasia>`
6. Send Body: aktif, Content Type: `JSON`
7. Body: petakan field terstruktur dari node AI sesuai contoh di atas.

Simpan token sebagai credential n8n, bukan nilai literal di workflow yang dibagikan.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment ke Easypanel

Repository menyediakan `Dockerfile` production. Container menjalankan migration secara otomatis sebelum Next.js dimulai. Buat service PostgreSQL dan App dalam project Easypanel yang sama, lalu gunakan internal connection URL PostgreSQL sebagai `DATABASE_URL` App.

Konfigurasi App yang dibutuhkan:

- Source: GitHub, repository `7vilanata/cs-syarihub`, branch `main`, build path `/`;
- Builder: Dockerfile, path `Dockerfile`;
- Target port domain: `3000`;
- Environment: `DATABASE_URL`, `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`, `SESSION_SECRET`, dan `N8N_INGEST_TOKEN`;
- Health/runtime process: container menjalankan `node scripts/migrate.mjs && node server.js`.

Untuk memuat data contoh pertama kali, buka Shell App setelah deployment dan jalankan:

```bash
node scripts/seed.mjs
```

Jangan jalankan seed pada database produksi yang sudah berisi perubahan status CS karena seed akan mengembalikan 12 record contoh ke kondisi awal.

## Struktur penting

- `db/migrations/` — schema PostgreSQL dan perubahan enum status.
- `scripts/seed.mjs` — 12 conversation sintetis.
- `app/api/conversations/upsert/route.ts` — endpoint ingest n8n.
- `app/api/conversations/[id]/status/route.ts` — update status manual.
- `lib/conversations.ts` — validasi dan aturan sinkronisasi.
- `components/dashboard.tsx` — dashboard, filter, tabel responsif, dan perubahan status.

Integrasi API omnichannel dan pemrosesan AI sengaja tidak ada di aplikasi; keduanya tetap menjadi tanggung jawab workflow n8n.
