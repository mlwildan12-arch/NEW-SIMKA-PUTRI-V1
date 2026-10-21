import { Santri, Pelanggaran, RiwayatPelanggaran, UserAccount, MasterPembinaan, UnitPesantren, UnitFilter } from '../types';
import { hashPasswordSync } from '../lib/auth';

export const initialUsers: UserAccount[] = [
  // 1. KASIE / KABID (SUPERADMIN) - GLOBAL ACCESS
  {
    id: '36dfde51-3760-4569-88b9-5f756593f5ce',
    nama: 'Ust. Abdul Fattah Ismail Farros, Lc. M.IRKH.',
    username: 'kabid',
    role: 'KASIE_KEPESANTRENAN',
    unit: 'ALL',
    is_active: true,
    email: 'kabid@simka.id',
    title: 'Kepala Bidang Kepesantrenan',
    password_hash: hashPasswordSync('admin123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ae535507-b4e7-43ad-847f-8abe1010fb7f',
    nama: 'Kasie Kepesantrenan',
    username: 'kasie',
    role: 'KASIE_KEPESANTRENAN',
    unit: 'ALL',
    is_active: true,
    email: 'kasie@simka.id',
    title: 'Kepala Seksi Kepesantrenan & Kedisiplinan',
    password_hash: hashPasswordSync('admin123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'd9fd8eaa-e21d-474f-b022-596b2f777e4a',
    nama: 'Ust. Admin',
    username: 'admin',
    role: 'KASIE_KEPESANTRENAN',
    unit: 'ALL',
    is_active: true,
    email: 'admin@simka.id',
    title: 'Administrator SIMKA.ID',
    password_hash: hashPasswordSync('admin123'),
    created_at: '2026-01-01T00:00:00Z'
  },

  // 2. UNIT SMP
  {
    id: 'c64640cf-e84d-42aa-a0a2-53e08403bfea',
    nama: 'Ustzh. Lubna Nadiyatuz Zulfa, S.Pd',
    username: 'lubna',
    role: 'KOORDINATOR',
    unit: 'SMP',
    is_active: true,
    email: 'lubna@simka.id',
    title: 'Koordinator Kedisiplinan Unit SMP',
    password_hash: hashPasswordSync('smp123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '757b66ff-c156-4bbb-aecc-b7eb04448c77',
    nama: 'Ustzh. Nursofingatun',
    username: 'sofi',
    role: 'MUSYRIF',
    unit: 'SMP',
    is_active: true,
    email: 'sofi@simka.id',
    title: 'Musyrifah Asrama SMP',
    password_hash: hashPasswordSync('smp123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '05964fc9-6ec6-45dc-815c-a7bb1b73ecd1',
    nama: 'Ustzh. Fitri Kholipah',
    username: 'fitri',
    role: 'MUSYRIF',
    unit: 'SMP',
    is_active: true,
    email: 'fitri@simka.id',
    title: 'Musyrifah Asrama SMP',
    password_hash: hashPasswordSync('smp123'),
    created_at: '2026-01-01T00:00:00Z'
  },

  // 3. UNIT MA
  {
    id: '82af4287-f102-460c-a693-b222b84d2afa',
    nama: 'Ustzh. Siti Muawanah, S.Pd.I',
    username: 'ana',
    role: 'KOORDINATOR',
    unit: 'MA',
    is_active: true,
    email: 'ana@simka.id',
    title: 'Koordinator Kedisiplinan Unit MA',
    password_hash: hashPasswordSync('ma123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '43653ae7-cd5a-4829-8d65-d099d2a8ef02',
    nama: 'Ustzh. Nazwa Sabila Manurung',
    username: 'nazwa',
    role: 'MUSYRIF',
    unit: 'MA',
    is_active: true,
    email: 'nazwa@simka.id',
    title: 'Musyrifah Asrama MA',
    password_hash: hashPasswordSync('ma123'),
    created_at: '2026-01-01T00:00:00Z'
  },

  // 4. UNIT SMA
  {
    id: '91b7cfa2-66c4-4059-9b00-8eb981c64a6f',
    nama: 'Ustzh. Hajar Nur Rohmah, S.Ag',
    username: 'hajar',
    role: 'KOORDINATOR',
    unit: 'SMA',
    is_active: true,
    email: 'hajar@simka.id',
    title: 'Koordinator Kedisiplinan Unit SMA',
    password_hash: hashPasswordSync('sma123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '8b2d906e-ec3f-4ff1-93a0-10dc785d87c0',
    nama: 'Ustzh. Sumitra Dewi Hasibuan',
    username: 'dewi',
    role: 'MUSYRIF',
    unit: 'SMA',
    is_active: true,
    email: 'dewi@simka.id',
    title: 'Musyrifah Asrama SMA',
    password_hash: hashPasswordSync('sma123'),
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '341f6d36-5470-49c2-b70a-343c6ae63f47',
    nama: 'Ustzh. Syarifah Musfirotun',
    username: 'syarifah',
    role: 'MUSYRIF',
    unit: 'SMA',
    is_active: true,
    email: 'syarifah@simka.id',
    title: 'Musyrifah Asrama SMA',
    password_hash: hashPasswordSync('sma123'),
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const initialUser = initialUsers[0];

export const initialPelanggaranList: Pelanggaran[] = [
  {
    id: 'p-001',
    kode: 'P001',
    jenis: 'Masbuk / Terlambat Shalat Jamaah',
    kategori: 'Ringan',
    poin: 10,
    konsekuensi: 'Teguran lisan & istighfar'
  },
  {
    id: 'p-002',
    kode: 'P002',
    jenis: 'Membawa Smartphone/Elektronik',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: 'Penyitaan barang & Surat Peringatan'
  },
  {
    id: 'p-003',
    kode: 'P003',
    jenis: 'Merokok',
    kategori: 'Berat',
    poin: 85,
    konsekuensi: 'Disita dan SP3'
  },
  {
    id: 'p-004',
    kode: 'P004',
    jenis: 'Tidak Sholat Berjamaah di Masjid',
    kategori: 'Ringan',
    poin: 20,
    konsekuensi: 'Push up 40x dan Tilawah 1 Juz'
  },
  {
    id: 'p-005',
    kode: 'P005',
    jenis: 'Ghosob',
    kategori: 'Sedang',
    poin: 35,
    konsekuensi: 'Push up 40x dan Tilawah 1 Juz'
  },
  {
    id: 'p-006',
    kode: 'P006',
    jenis: 'Berkata Kotor',
    kategori: 'Ringan',
    poin: 20,
    konsekuensi: 'Push up 40x'
  },
  {
    id: 'p-007',
    kode: 'P007',
    jenis: 'Pakaian tidak lengkap saat sholat (peci, sarung, koko)',
    kategori: 'Ringan',
    poin: 5,
    konsekuensi: 'Sit up 30 + tilawah 30 menit'
  },
  {
    id: 'p-008',
    kode: 'P008',
    jenis: 'Tidak Mengikuti dzikir/al-ma\'tsurat (bercanda / keluar / mainan)',
    kategori: 'Ringan',
    poin: 5,
    konsekuensi: 'Sit up 45 + tilawah 30 menit'
  },
  {
    id: 'p-009',
    kode: 'P009',
    jenis: 'Membawa, memiliki, menyimpan, dan/atau menyalakan bahan peledak/petasan',
    kategori: 'Berat',
    poin: 100,
    konsekuensi: 'Barang disita dan dimusnahkan'
  },
  {
    id: 'p-010',
    kode: 'P010',
    jenis: 'Berkomunikasi dengan lawan jenis yang bukan mahram',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: '-'
  },
  {
    id: 'p-011',
    kode: 'P011',
    jenis: 'Menggunakan laptop untuk menonton, chatting, dan browsing terlarang',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: '-'
  },
  {
    id: 'p-012',
    kode: 'P012',
    jenis: 'Membawa, memiliki, menyimpan, menggunakan senjata tajam',
    kategori: 'Berat',
    poin: 70,
    konsekuensi: 'Barang menjadi sitaan tetap'
  },
  {
    id: 'p-013',
    kode: 'P013',
    jenis: 'Melakukan perbuatan zina, pelecehan seksual atau asusila',
    kategori: 'Berat',
    poin: 100,
    konsekuensi: 'Dikeluarkan'
  },
  {
    id: 'p-014',
    kode: 'P014',
    jenis: 'Bermain benda berbahaya',
    kategori: 'Sedang',
    poin: 50,
    konsekuensi: '-'
  },
  {
    id: 'p-015',
    kode: 'P015',
    jenis: 'Keluar area pesantren tanpa izin/kabur',
    kategori: 'Berat',
    poin: 75,
    konsekuensi: 'Skorsing 1 minggu & SP2'
  },
  {
    id: 'p-016',
    kode: 'P016',
    jenis: 'Terlambat masuk asrama / melanggar jam malam',
    kategori: 'Ringan',
    poin: 15,
    konsekuensi: 'Pembersihan aula & asrama santri'
  }
];

// Seluruh data santri menggunakan data aktual dari database Supabase (SIMKA.ID PUTRI)
export const initialSantriList: Santri[] = [];

export const initialRiwayatPelanggaran: RiwayatPelanggaran[] = [];

export const initialMasterPembinaanList: MasterPembinaan[] = [
  {
    id: 'pb-001',
    tingkat: 1,
    nama_tingkat: 'Level 1',
    min_poin: 5,
    max_poin: 10,
    rentangPoin: '5–10 Poin',
    kategori: 'Pelanggaran Sangat Ringan (Level 1)',
    konsekuensi: 'Membaca istighfar 33 kali, menyiram tanaman, menghafal mufradat / tugas tertulis, tidak mengulangi kesalahan selama minimal 3 hari.',
    pembina: 'Musyrif Asrama / Wali Kelas',
    jenis_pembinaan: [
      'Membaca istighfar 33 kali',
      'Menyiram tanaman di sekitar sekolah/pesantren',
      'Menghafal mufradat dan menyetorkannya atau mengerjakan tugas tertulis terkait pelanggaran',
      'Tidak mengulangi kesalahan yang sama selama minimal 3 hari',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-002',
    tingkat: 2,
    nama_tingkat: 'Level 2',
    min_poin: 11,
    max_poin: 20,
    rentangPoin: '11–20 Poin',
    kategori: 'Pelanggaran Sangat Ringan (Level 2)',
    konsekuensi: 'Membaca istighfar 33 kali, menyiram tanaman, menghafal mufradat / tugas tertulis, tidak mengulangi kesalahan selama minimal 3 hari.',
    pembina: 'Musyrif Asrama / Wali Kelas',
    jenis_pembinaan: [
      'Membaca istighfar 33 kali',
      'Menyiram tanaman di sekitar sekolah/pesantren',
      'Menghafal mufradat dan menyetorkannya atau mengerjakan tugas tertulis terkait pelanggaran',
      'Tidak mengulangi kesalahan yang sama selama minimal 3 hari',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-003',
    tingkat: 3,
    nama_tingkat: 'Level 3',
    min_poin: 21,
    max_poin: 30,
    rentangPoin: '21–30 Poin',
    kategori: 'Pelanggaran Sangat Ringan (Level 3)',
    konsekuensi: 'Membaca istighfar sehari 100 kali, menyapu dan mengepel lantai 1 hari, menghafal ayat/hadits atau tugas tertulis, evaluasi minimal 1 pekan.',
    pembina: 'Musyrif Asrama / Koordinator Unit',
    jenis_pembinaan: [
      'Membaca istighfar sehari 100 kali',
      'Menyapu dan mengepel lantai selama 1 hari',
      'Menghafal ayat/hadits atau tugas tertulis terkait pelanggaran',
      'Tidak mengulangi kesalahan serupa selama minimal 1 pekan',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-004',
    tingkat: 4,
    nama_tingkat: 'Level 4',
    min_poin: 31,
    max_poin: 34,
    rentangPoin: '31–34 Poin',
    kategori: 'Pelanggaran Sangat Ringan (Level 4)',
    konsekuensi: 'Membaca istighfar 300 kali sehari (3 hari), membersihkan kamar mandi 1 hari, menulis/hafal ayat atau tugas praktik/tertulis, meminta nasihat & tanda tangan, evaluasi 4 pekan.',
    pembina: 'Musyrif & Koordinator Kedisiplinan',
    jenis_pembinaan: [
      'Membaca istighfar 300 kali sehari selama 3 hari',
      'Membersihkan kamar mandi selama 1 hari',
      'Menulis ulang dan menghafal ayat/hadits atau mengerjakan tugas praktik/tertulis terkait pelanggaran',
      'Meminta nasihat dan tanda tangan pihak yang ditentukan',
      'Tidak mengulangi kesalahan serupa selama minimal 4 pekan',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-005',
    tingkat: 5,
    nama_tingkat: 'Level 5',
    min_poin: 35,
    max_poin: 49,
    rentangPoin: '35–49 Poin',
    kategori: 'Pelanggaran Sangat Ringan (Level 5)',
    konsekuensi: 'Membaca istighfar 500 kali sehari (3 hari), membersihkan kamar mandi 3–7 hari, skorsing bersyarat, qiyamullail 3 malam, surat pernyataan & SP, absen 3 hari, meminta nasihat & tanda tangan.',
    pembina: 'Koordinator Unit & Kasie Kepesantrenan',
    jenis_pembinaan: [
      'Membaca istighfar 500 kali sehari selama 3 hari',
      'Membersihkan kamar mandi selama 3–7 hari',
      'Skorsing dengan syarat',
      'Qiyamullail tiga malam yang harus terkonfirmasi',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin minimal 3 hari kepada pihak yang ditentukan',
      'Meminta nasihat dan tanda tangan',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-006',
    tingkat: 6,
    nama_tingkat: 'Level 6',
    min_poin: 50,
    max_poin: 69,
    rentangPoin: '50–69 Poin',
    kategori: 'Pelanggaran Ringan (Level 6)',
    konsekuensi: 'Membaca istighfar 500 kali sehari (7 hari), membersihkan kamar mandi 5–9 hari, skorsing bersyarat, qiyamullail 1 pekan, surat pernyataan & SP, absen 5 hari, larangan keluar 1x, gundul / pakaian pelanggaran.',
    pembina: 'Koordinator Unit & Kasie Kepesantrenan',
    jenis_pembinaan: [
      'Membaca istighfar 500 kali sehari selama 7 hari',
      'Membersihkan kamar mandi selama 5–9 hari',
      'Skorsing dengan syarat',
      'Qiyamullail satu pekan yang harus terkonfirmasi',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin minimal 5 hari kepada pihak yang ditentukan',
      'Meminta nasihat dan tanda tangan',
      'Larangan keluar area pondok sebanyak 1 kali sesuai ketentuan',
      'Gundul atau memakai pakaian pelanggaran',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-007',
    tingkat: 7,
    nama_tingkat: 'Level 7',
    min_poin: 70,
    max_poin: 89,
    rentangPoin: '70–89 Poin',
    kategori: 'Pelanggaran Sedang (Level 7)',
    konsekuensi: 'Membaca istighfar 300 kali/hari (10 hari), membersihkan kamar mandi 10–14 hari, skorsing bersyarat, qiyamullail 1 pekan, surat pernyataan & SP, absen 10 hari, larangan keluar 2x, digundul / pakaian khusus pelanggaran.',
    pembina: 'Kasie Kepesantrenan & Mudir Pesantren',
    jenis_pembinaan: [
      'Membaca istighfar 300 kali per hari selama 10 hari',
      'Membersihkan kamar mandi selama 10–14 hari',
      'Skorsing dengan syarat',
      'Qiyamullail satu pekan yang harus terkonfirmasi',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin minimal 10 hari kepada pihak yang ditentukan',
      'Meminta nasihat dan tanda tangan',
      'Larangan keluar area pondok sebanyak 2 kali sesuai ketentuan',
      'Digundul atau memakai pakaian khusus pelanggaran',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  },
  {
    id: 'pb-008',
    tingkat: 8,
    nama_tingkat: 'Level 8',
    min_poin: 90,
    max_poin: 99,
    rentangPoin: '90–99 Poin',
    kategori: 'Pelanggaran Berat (Level 8)',
    konsekuensi: 'Membaca istighfar 300 kali/hari (14 hari), membersihkan kamar mandi 14 hari, skorsing tanpa syarat, qiyamullail 1 pekan, surat pernyataan & SP, absen 14 hari, larangan keluar 3x, digundul & pakaian khusus pelanggaran.',
    pembina: 'Mudir Pesantren & Dewan Kehormatan',
    jenis_pembinaan: [
      'Membaca istighfar 300 kali per hari selama 14 hari',
      'Membersihkan kamar mandi selama 14 hari',
      'Skorsing tanpa syarat',
      'Qiyamullail satu pekan yang harus terkonfirmasi',
      'Membuat surat pernyataan',
      'Mendapatkan surat peringatan',
      'Absen rutin minimal 14 hari kepada pihak yang ditentukan',
      'Meminta nasihat dan tanda tangan',
      'Larangan keluar area pondok sebanyak 3 kali sesuai ketentuan',
      'Digundul dan memakai pakaian khusus pelanggaran',
      'Dan/atau pembinaan lainnya sesuai keputusan pihak terkait'
    ],
    is_active: true
  }
];

export const initialPembinaanRecords: any[] = [];

