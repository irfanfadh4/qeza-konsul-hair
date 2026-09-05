// Vercel Serverless Function
// Path di project: /api/consult.js
// Akan otomatis bisa diakses di: https://domainmu.com/api/consult
//
// API key TIDAK ditaruh di sini secara langsung. Diambil dari Environment Variable
// yang kamu set di dashboard Vercel (Settings > Environment Variables),
// namanya: ANTHROPIC_API_KEY

const PRODUCT_KNOWLEDGE = `
QEZA HAIR BOOSTER THERAPY + LIGHT HAIR GROWTH THERAPY (PDT)

Deskripsi: Treatment rambut menggunakan serum khusus (dari Korea) untuk revitalisasi rambut, diaplikasikan ke kulit kepala dengan teknik microneedling untuk membantu merangsang pertumbuhan rambut.

Manfaat:
- Memelihara dan melembabkan kulit kepala untuk meningkatkan kesehatan pertumbuhan dan penampilan rambut
- Merangsang pertumbuhan rambut sehat
- Meningkatkan mikrosirkulasi
- Mengoksigenasi folikel
- Memberikan nutrisi pada rambut
- Memberikan efek lembab pada kulit kepala
- Treatment ini paling cocok untuk kondisi rambut yang SUDAH ada pertumbuhan baby hair/rambut halus baru, namun batang rambutnya masih rapuh dan mudah patah/rontok — serum bekerja memperkuat rambut yang sudah tumbuh agar jadi rambut dewasa yang kuat.
- Untuk kondisi rambut yang benar-benar TIDAK ada pertumbuhan sama sekali di area tertentu, treatment yang lebih sesuai biasanya PRP Hair Therapy — kondisi ini perlu dikonfirmasi lewat hair analysis di klinik.

Harga normal: Rp 775.000
Lama proses treatment: ± 60 menit
Jarak minimal pengulangan: 3-4 minggu, dianjurkan total 3-4 sesi untuk hasil optimal
Metode: Microneedling
Anestesi: oles/topikal (sehingga relatif minim nyeri)
Efek samping: nyeri ringan, bengkak ringan dan kemerahan ringan di area yang di-treatment (biasanya reda dalam 1-3 hari / masa downtime)
Produk berasal dari: Korea

Edukasi setelah treatment:
- Tidak mencuci rambut selama 6-8 jam setelah treatment
- Hindari hair styling product, sauna, dan olahraga berat selama 24 jam
- Bisa pakai hair tonic/hair growth serum sesuai anjuran dokter
`;

// -----------------------------------------------------------------
// PENTING: teks ini HARUS SAMA dengan PROMO_DISPLAY_TEXT di
// public/index.html, supaya harga yang disebut AI konsisten dengan
// yang tertulis di layar. Edit di DUA tempat setiap ada promo baru.
// -----------------------------------------------------------------
const PROMO_TEXT = "Harga normal Hair Booster Therapy + PDT: Rp 775.000. Khusus untuk yang baru konsultasi hari ini, harganya jadi Rp 619.000.";

function buildSystemPrompt() {
  return `Kamu adalah konsultan edukasi treatment di Qeza Aesthetic Clinic. Tugasmu HANYA menjelaskan treatment "Hair Booster Therapy + PDT" berdasarkan data produk resmi di bawah, menjawab keraguan calon pasien, dan menyampaikan info harga/promo yang diberikan.

ATURAN KETAT (wajib dipatuhi):
1. Jangan pernah membuat klaim medis pasti seperti "pasti tumbuh", "pasti sembuh", "dijamin berhasil". Gunakan bahasa "membantu", "dapat", "umumnya".
2. Jangan mendiagnosis kondisi rambut pasien secara pasti. Kamu boleh memberi arahan awal tapi WAJIB selalu menutup dengan anjuran konfirmasi lewat hair analysis / konsultasi dokter di klinik sebelum treatment.
3. Jangan menyebut treatment lain (PRP dll) secara detail — cukup sebutkan sekilas jika relevan sebagai pembanding, arahkan ke hair analysis di klinik untuk kepastian.
4. Gunakan HANYA informasi harga dari bagian PROMO yang diberikan, jangan mengarang angka lain.
5. Jawab dengan bahasa Indonesia yang hangat, personal, singkat padat (maksimal sekitar 180-220 kata total), terstruktur dalam paragraf pendek.
6. Di bagian akhir, WAJIB sertakan kalimat ajakan untuk lanjut konsultasi/booking via WhatsApp ke CS Qeza.
7. Jika ada pertanyaan bebas dari pasien yang di luar cakupan treatment ini (misal soal treatment lain, kondisi medis serius, obat-obatan), jawab singkat bahwa itu sebaiknya ditanyakan langsung ke dokter saat konsultasi di klinik.

DATA PRODUK RESMI:
${PRODUCT_KNOWLEDGE}

PROMO YANG SEDANG BERLAKU:
${PROMO_TEXT}`;
}

export default async function handler(req, res) {
  // Hanya izinkan POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // CORS dasar — sesuaikan origin dengan domainmu sendiri untuk keamanan lebih baik
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { durasi, keluhan, riwayat, keraguan, waktu, pertanyaanBebas } = req.body || {};

    if (!durasi || !keluhan || !riwayat || !waktu) {
      res.status(400).json({ error: 'Data jawaban tidak lengkap.' });
      return;
    }

    // Batasi pertanyaan bebas maksimal 300 karakter, walau sudah dibatasi di form —
    // ini jaga-jaga kalau ada yang kirim request langsung ke endpoint ini.
    const safePertanyaanBebas = (pertanyaanBebas || "").toString().slice(0, 300);

    const userMessage = `Data dari calon pasien:
- Sudah berapa lama mengalami masalah rambut: ${durasi}
- Keluhan utama: ${keluhan}
- Riwayat treatment sebelumnya: ${riwayat}
- Hal yang membuat ragu: ${Array.isArray(keraguan) && keraguan.length ? keraguan.join(", ") : "Tidak ada"}
- Rencana waktu treatment: ${waktu}
- Pertanyaan tambahan dari pasien: ${safePertanyaanBebas || "Tidak ada"}

Tolong berikan penjelasan personal sesuai instruksi sistem.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server belum dikonfigurasi (API key tidak ditemukan).' });
      return;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      res.status(502).json({ error: 'Gagal menghubungi layanan AI.' });
      return;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((c) => c.type === 'text');
    const resultText = textBlock ? textBlock.text : 'Maaf, terjadi kendala saat menyiapkan penjelasan.';

    res.status(200).json({ result: resultText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
}
