// Vercel Serverless Function
// Path di project: /api/consult.js
// Akan otomatis bisa diakses di: https://domainmu.com/api/consult
//
// API key TIDAK ditaruh di sini secara langsung. Diambil dari Environment Variable
// yang kamu set di dashboard Vercel (Settings > Environment Variables),
// namanya: ANTHROPIC_API_KEY
//
// PENTING: treatment yang direkomendasikan ditentukan oleh RULE ENGINE di
// public/index.html (fungsi pickTreatment), BUKAN oleh AI di file ini.
// AI di sini hanya menjelaskan hasil yang sudah ditentukan. Ini sengaja
// dipisah supaya rekomendasi selalu konsisten dan tidak "mengarang".

const PRODUCT_KNOWLEDGE = `
QEZA PRP HAIR THERAPY + PDT
Treatment rambut menggunakan Platelet-Rich Plasma (PRP) dari plasma darah pasien sendiri, diaplikasikan ke kulit kepala dengan teknik microneedling.
Manfaat: mengurangi rambut rontok, merangsang pertumbuhan rambut baru, membuat rambut tampak lebih tebal dan kuat. Cocok untuk rambut tipis tahap awal-sedang, khususnya area yang benar-benar tidak ada pertumbuhan rambut.
Harga normal: Rp 795.000. Harga promo hari ini: Rp 669.000. Lama proses: ±60 menit. Jarak minimal pengulangan: 3-4 minggu, dianjurkan total 3-4 sesi. Metode: Microneedling. Anestesi: oles/topikal. Efek samping: nyeri ringan, bengkak/kemerahan ringan di area treatment. Produk: plasma darah pasien sendiri.

QEZA HAIR BOOSTER MESOTHERAPY + PDT
Treatment rambut menggunakan serum khusus (dari Korea) untuk revitalisasi rambut, diaplikasikan dengan teknik microneedling.
Manfaat: melembabkan kulit kepala, merangsang pertumbuhan rambut sehat, meningkatkan mikrosirkulasi, mengoksigenasi folikel, memberi nutrisi rambut. Paling cocok untuk kondisi yang SUDAH ada pertumbuhan baby hair/rambut halus baru namun batang rambutnya masih rapuh dan mudah patah — serum bekerja memperkuat rambut yang sudah tumbuh.
Harga normal: Rp 775.000. Harga promo hari ini: Rp 619.000. Lama proses: ±60 menit. Jarak minimal pengulangan: 3-4 minggu, dianjurkan total 3-4 sesi. Metode: Microneedling. Anestesi: oles/topikal. Efek samping: nyeri ringan, bengkak/kemerahan ringan. Produk: serum dari Korea.

QEZA SIGNATURE HAIR REBORN
Treatment rambut menggunakan PRP (plasma darah pasien sendiri), dengan rangkaian 5 tahap: Head Massage, Scalp Detox Jet Peel Ozon, PRP Hair Therapy, Sisir High Frequency, Light Hair Growth Therapy (PDT).
Manfaat: mengurangi rambut rontok, merangsang pertumbuhan rambut baru, rambut tampak lebih tebal dan kuat. Versi lengkap/signature dari PRP Hair Therapy, cocok untuk yang ingin pengalaman treatment lebih menyeluruh sekaligus relaksasi (head massage & scalp detox).
Harga normal: Rp 950.000. Harga promo hari ini: Rp 924.000. Lama proses: ±60-90 menit. Jarak minimal pengulangan: 3-4 minggu. Metode: Microneedling atau vital injector. Anestesi: oles/topikal. Efek samping: nyeri ringan, bengkak/kemerahan ringan. Produk: plasma darah pasien sendiri.

QEZA SIGNATURE ROOT RESCUE
Treatment rambut menggunakan serum khusus, dengan rangkaian 5 tahap: Head Massage, Scalp Detox Jet Peel Ozon, Hair Booster Mesotherapy, Sisir High Frequency, Light Hair Growth Therapy (PDT).
Manfaat: melembabkan kulit kepala, merangsang pertumbuhan rambut sehat, meningkatkan mikrosirkulasi. Versi lengkap/signature dari Hair Booster Mesotherapy, cocok untuk kondisi baby hair rapuh yang ingin pengalaman treatment lebih menyeluruh sekaligus relaksasi.
Harga normal: Rp 925.000. Harga promo hari ini: Rp 889.000. Lama proses: ±60-90 menit. Jarak minimal pengulangan: 3-4 minggu. Metode: Microneedling atau injeksi Vital Injector. Anestesi: oles/topikal. Efek samping: nyeri ringan, bengkak/kemerahan ringan. Produk: serum dari Korea.

Edukasi setelah treatment (berlaku untuk semua treatment di atas):
- Tidak mencuci rambut selama 6-8 jam setelah treatment
- Hindari hair styling product, sauna, dan olahraga berat selama 24 jam
- Bisa pakai hair tonic/hair growth serum sesuai anjuran dokter
- Untuk hasil optimal, dianjurkan diulang setiap 3-4 minggu dengan total 3-4 sesi
`;

function buildSystemPrompt() {
  return `Kamu adalah konsultan edukasi treatment di Qeza Aesthetic Clinic. PENTING: treatment yang direkomendasikan SUDAH DITENTUKAN oleh sistem rule-based di luar dirimu (bukan kamu yang memilih). Tugasmu HANYA menjelaskan mengapa treatment yang sudah ditentukan itu relevan dengan jawaban pasien, dan menjawab keraguan mereka — kamu TIDAK BOLEH mengganti atau menyarankan treatment lain di luar yang sudah ditentukan sistem.

ATURAN KETAT (wajib dipatuhi):
1. WAJIB gunakan nama treatment dan harga PERSIS seperti yang diberikan di data "TREATMENT YANG DIREKOMENDASIKAN SISTEM" di bawah — jangan mengganti dengan treatment lain.
2. Jangan pernah membuat klaim medis pasti seperti "pasti tumbuh", "pasti sembuh", "dijamin berhasil". Gunakan bahasa "membantu", "dapat", "umumnya".
3. Ini HANYA estimasi awal berdasarkan jawaban form, BUKAN keputusan medis final. WAJIB selalu tutup dengan kalimat bahwa treatment final akan dikonfirmasi oleh CS dan dokter Qeza berdasarkan hair analysis langsung di klinik — AI ini tidak menggantikan keputusan dokter.
4. Kalau data menunjukkan "kondisi rambut pasien tidak yakin/ambigu", tekankan lebih kuat pentingnya hair analysis untuk memastikan, karena estimasi ini kurang pasti.
5. Boleh sebutkan sekilas 1 kalimat kalau ada treatment versi signature/basic sebagai upgrade opsional, tapi jangan mendetailkan semua 4 treatment sekaligus — fokus ke treatment yang direkomendasikan.
6. Gunakan HANYA harga promo dan harga normal yang tertulis di data "TREATMENT YANG DIREKOMENDASIKAN SISTEM" di atas, jangan mengarang angka lain atau memakai harga treatment lain.
7. Jawab dengan bahasa Indonesia yang hangat, personal, singkat padat (maksimal sekitar 180-220 kata), terstruktur dalam paragraf pendek.
8. Jangan sertakan ajakan/link WhatsApp di jawabanmu — itu sudah disediakan terpisah oleh sistem sebagai tombol.
9. Jika ada pertanyaan bebas dari pasien di luar cakupan (misal kondisi medis serius, obat-obatan, treatment yang sama sekali tidak relevan), jawab singkat bahwa itu sebaiknya ditanyakan langsung ke dokter saat konsultasi di klinik.

DATA PRODUK RESMI (4 treatment Qeza Hair):
${PRODUCT_KNOWLEDGE}`;
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
    const {
      durasi, kondisi, keluhanUtama, tingkatKerontokan, preferensiMetode, preferensiTingkat,
      keraguan, waktu, pertanyaanBebas,
      recommendedTreatment, recommendedPrice, recommendedNormalPrice, bioConfident
    } = req.body || {};

    if (!durasi || !kondisi || !preferensiMetode || !preferensiTingkat || !waktu || !recommendedTreatment || !recommendedPrice) {
      res.status(400).json({ error: 'Data jawaban tidak lengkap.' });
      return;
    }

    // Batasi pertanyaan bebas maksimal 300 karakter, walau sudah dibatasi di form —
    // ini jaga-jaga kalau ada yang kirim request langsung ke endpoint ini.
    const safePertanyaanBebas = (pertanyaanBebas || "").toString().slice(0, 300);

    const userMessage = `TREATMENT YANG DIREKOMENDASIKAN SISTEM (WAJIB dipakai, jangan diganti):
- Nama: ${recommendedTreatment}
- Harga promo hari ini: ${recommendedPrice}
- Harga normal: ${recommendedNormalPrice || "(tidak ada info)"}
- Kondisi rambut pasien meyakinkan/jelas: ${bioConfident ? "Ya" : "Tidak, pasien tidak yakin dengan kondisinya sendiri"}

Data dari calon pasien:
- Sudah berapa lama mengalami masalah rambut: ${durasi}
- Keluhan utama: ${Array.isArray(keluhanUtama) && keluhanUtama.length ? keluhanUtama.join(", ") : "Tidak disebutkan"}
- Frekuensi rambut rontok: ${tingkatKerontokan || "Tidak disebutkan"}
- Kondisi rambut (perabaan sendiri): ${kondisi}
- Preferensi metode (darah/serum): ${preferensiMetode}
- Preferensi tingkat treatment: ${preferensiTingkat}
- Hal yang membuat ragu: ${Array.isArray(keraguan) && keraguan.length ? keraguan.join(", ") : "Tidak ada"}
- Rencana waktu treatment: ${waktu}
- Pertanyaan tambahan dari pasien: ${safePertanyaanBebas || "Tidak ada"}

Tolong berikan penjelasan personal kenapa treatment yang direkomendasikan sistem itu relevan, sesuai instruksi sistem.`;

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
