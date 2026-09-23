import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL belum diatur.");

const rows = [
  ["SYR-1001", "https://omnichannel.example.com/conversations/SYR-1001", "Aisyah", "+62 811 0000 1001", "2026-09-23T07:45:00.000Z", "2026-09-23T08:30:00.000Z", "customer", "Sudah memahami program dan meminta nomor rekening untuk segera membayar.", "ready_to_pay", "payment_method", "urgent", "Kirim metode pembayaran dan minta konfirmasi setelah transfer.", "pending", "2026-09-23T08:32:00.000Z"],
  ["SYR-1002", "https://omnichannel.example.com/conversations/SYR-1002", "Fatimah", "+62 811 0000 1002", "2026-09-22T12:00:00.000Z", "2026-09-23T07:45:00.000Z", "customer", "Sudah mengirim bukti transfer dan menunggu verifikasi.", "ready_to_pay", "none", "urgent", "Verifikasi bukti pembayaran lalu konfirmasi pendaftaran.", "actioned", "2026-09-23T07:47:00.000Z"],
  ["SYR-1003", "https://omnichannel.example.com/conversations/SYR-1003", "Nadia", "+62 811 0000 1003", "2026-09-20T09:00:00.000Z", "2026-09-22T15:20:00.000Z", "customer", "Tertarik ikut tetapi ingin memastikan jadwal kelas tidak bentrok.", "considering", "schedule", "high", "Kirim pilihan jadwal dan tanyakan slot yang paling sesuai.", "pending", "2026-09-22T15:22:00.000Z"],
  ["SYR-1004", "https://omnichannel.example.com/conversations/SYR-1004", "Rizki", "+62 811 0000 1004", "2026-09-21T08:30:00.000Z", "2026-09-22T13:10:00.000Z", "cs", "Sudah menerima penjelasan biaya dan sedang meminta persetujuan keluarga.", "considering", "needs_approval", "medium", "Follow-up besok dan tawarkan ringkasan program untuk keluarga.", "actioned", "2026-09-22T13:12:00.000Z"],
  ["SYR-1005", "https://omnichannel.example.com/conversations/SYR-1005", "Hana", "+62 811 0000 1005", "2026-09-19T11:00:00.000Z", "2026-09-21T10:05:00.000Z", "customer", "Pembayaran sudah diverifikasi dan pendaftaran dinyatakan selesai.", "ready_to_pay", "none", "high", "Tidak ada tindak lanjut akuisisi; arahkan ke onboarding.", "converted", "2026-09-21T10:07:00.000Z"],
  ["SYR-1006", "https://omnichannel.example.com/conversations/SYR-1006", "Salma", "+62 811 0000 1006", "2026-09-18T10:00:00.000Z", "2026-09-20T09:00:00.000Z", "cs", "Memutuskan belum dapat mengikuti program karena keterbatasan biaya.", "considering", "price", "low", "Tutup conversation dan catat hambatan harga.", "closed", "2026-09-20T09:03:00.000Z"],
  ["SYR-1007", "https://omnichannel.example.com/conversations/SYR-1007", null, "+62 811 0000 1007", "2026-09-23T05:50:00.000Z", "2026-09-23T06:15:00.000Z", "customer", "Baru bertanya program apa saja yang tersedia.", "new", "needs_more_information", "low", "Kirim pilihan program dan tanyakan kebutuhan utamanya.", "pending", "2026-09-23T06:17:00.000Z"],
  ["SYR-1008", "https://omnichannel.example.com/conversations/SYR-1008", "Maya", "+62 811 0000 1008", "2026-09-20T14:00:00.000Z", "2026-09-22T11:40:00.000Z", "system", "Sudah melihat detail program tetapi belum memberi respons lanjutan.", "interested", "unresponsive", "medium", "Lakukan follow-up personal dengan pertanyaan singkat.", "actioned", "2026-09-22T11:42:00.000Z"],
  ["SYR-1009", "https://omnichannel.example.com/conversations/SYR-1009", "Ilham", "+62 811 0000 1009", "2026-09-17T09:30:00.000Z", "2026-09-19T14:25:00.000Z", "customer", "Pembayaran lunas dan telah dikonfirmasi oleh tim.", "ready_to_pay", "none", "high", "Arahkan user ke proses onboarding program.", "converted", "2026-09-19T14:27:00.000Z"],
  ["SYR-1010", "https://omnichannel.example.com/conversations/SYR-1010", "Dina", "+62 811 0000 1010", "2026-09-18T14:00:00.000Z", "2026-09-18T16:50:00.000Z", "cs", "Tidak melanjutkan karena memilih program lain.", "interested", "other", "low", "Tidak perlu follow-up tambahan.", "closed", "2026-09-18T16:52:00.000Z"],
  ["SYR-1011", "https://omnichannel.example.com/conversations/SYR-1011", "Nurul", "+62 811 0000 1011", "2026-09-22T07:30:00.000Z", "2026-09-23T05:30:00.000Z", "customer", "Tertarik kuat tetapi masih mempertanyakan kredibilitas mentor.", "considering", "trust", "medium", "Kirim profil mentor dan testimoni yang relevan.", "pending", "2026-09-23T05:32:00.000Z"],
  ["SYR-1012", "https://omnichannel.example.com/conversations/SYR-1012", "Bagas", "+62 811 0000 1012", "2026-09-21T13:00:00.000Z", "2026-09-22T08:20:00.000Z", "cs", "Sudah meminta invoice dan menyatakan akan membayar sore ini.", "ready_to_pay", "payment_method", "high", "Follow-up konfirmasi pembayaran sebelum akhir hari.", "actioned", "2026-09-22T08:22:00.000Z"],
];

const sql = postgres(databaseUrl, { max: 1 });
try {
  await sql.begin(async (tx) => {
    for (const row of rows) {
      await tx`INSERT INTO conversations (conversation_id, conversation_url, contact_name, contact_phone, created_at, last_message_at, last_message_sender, summary, stage, blocker, priority, next_action, status, analyzed_at)
        VALUES (${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, ${row[6]}, ${row[7]}, ${row[8]}, ${row[9]}, ${row[10]}, ${row[11]}, ${row[12]}, ${row[13]})
        ON CONFLICT (conversation_id) DO UPDATE SET conversation_url = EXCLUDED.conversation_url, contact_name = EXCLUDED.contact_name, contact_phone = EXCLUDED.contact_phone, created_at = LEAST(conversations.created_at, EXCLUDED.created_at), last_message_at = EXCLUDED.last_message_at, last_message_sender = EXCLUDED.last_message_sender, summary = EXCLUDED.summary, stage = EXCLUDED.stage, blocker = EXCLUDED.blocker, priority = EXCLUDED.priority, next_action = EXCLUDED.next_action, status = EXCLUDED.status, analyzed_at = EXCLUDED.analyzed_at`;
    }
  });
  console.log(`Seeded ${rows.length} synthetic conversations.`);
} finally { await sql.end(); }
