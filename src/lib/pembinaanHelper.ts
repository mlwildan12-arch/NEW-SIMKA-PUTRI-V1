import { MasterPembinaan, Santri, Pelanggaran, UserAccount } from '../types';

export interface CategorizedPembinaan {
  administrasi: string[];
  spiritual: string[];
  fisik: string[];
  akademik: string[];
}

export interface LevelDuration {
  targetHari: number;
  toleransiHari: number;
  totalHari: number;
  keterangan: string;
}

export interface SeverityCategory {
  levelKey: 'sangat_berat' | 'berat' | 'sedang' | 'ringan' | 'sangat_ringan' | 'unknown';
  label: string;
  poinRange: string;
  colorHex: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  description: string;
}

/**
 * Mengelompokkan butir jenis_pembinaan resmi dari master_pembinaan ke 4 kategori UI:
 * 1. TINDAKAN ADMINISTRASI & ALUR
 * 2. PEMBINAAN SPIRITUAL
 * 3. TINDAKAN FISIK / SOSIAL MENDIDIK
 * 4. PENUGASAN AKADEMIK / NASIHAT
 */
export function categorizePembinaan(items: string[] = []): CategorizedPembinaan {
  const result: CategorizedPembinaan = {
    administrasi: [],
    spiritual: [],
    fisik: [],
    akademik: []
  };

  if (!items || items.length === 0) {
    return result;
  }

  items.forEach((rawItem) => {
    const item = rawItem.trim();
    const lower = item.toLowerCase();

    // 1. PEMBINAAN SPIRITUAL
    // Kata kunci: istighfar, qiyamullail, sholat, tahajud, dzikir, tilawah, ma'tsurat, tadarus, puasa
    if (
      lower.includes('istighfar') ||
      lower.includes('qiyamullail') ||
      lower.includes('tahajud') ||
      lower.includes('dzikir') ||
      lower.includes('tilawah') ||
      lower.includes('al-ma\'tsurat') ||
      lower.includes('matsurat') ||
      lower.includes('tadarus') ||
      lower.includes('puasa') ||
      lower.includes('sholat berjamaah')
    ) {
      result.spiritual.push(item);
    }
    // 2. TINDAKAN FISIK / SOSIAL MENDIDIK
    // Kata kunci: kamar mandi, menyikat, membersihkan, menyapu, mengepel, menyiram, tanaman, sampah, aula
    else if (
      lower.includes('kamar mandi') ||
      lower.includes('menyikat') ||
      lower.includes('membersihkan') ||
      lower.includes('menyapu') ||
      lower.includes('mengepel') ||
      lower.includes('menyiram') ||
      lower.includes('tanaman') ||
      lower.includes('sampah') ||
      lower.includes('aula') ||
      lower.includes('push up') ||
      lower.includes('sit up') ||
      lower.includes('lari') ||
      lower.includes('lingkungan')
    ) {
      result.fisik.push(item);
    }
    // 3. PENUGASAN AKADEMIK / NASIHAT
    // Kata kunci: absen rutin, meminta nasihat, nasihat dan tanda tangan, menulis ulang, menghafal, mufradat, penugasan, resume
    else if (
      lower.includes('absen rutin') ||
      lower.includes('meminta nasihat') ||
      lower.includes('nasihat dan tanda tangan') ||
      lower.includes('menulis ulang') ||
      lower.includes('menghafal') ||
      lower.includes('mufradat') ||
      lower.includes('penugasan') ||
      lower.includes('resume') ||
      lower.includes('ayat/hadits') ||
      lower.includes('hadits') ||
      lower.includes('makalah')
    ) {
      result.akademik.push(item);
    }
    // 4. TINDAKAN ADMINISTRASI & ALUR
    // Kata kunci: surat peringatan, surat pernyataan, pemanggilan, skorsing, digundul, gundul, pakaian khusus, atribut, keluar area pondok, izin, dll
    else {
      result.administrasi.push(item);
    }
  });

  return result;
}

/**
 * Durasi dan target waktu pembinaan resmi berdasarkan Level (1-8)
 * Sesuai dokumen resmi Fiks Pembinaan Santri:
 * Level 1 (5–10 poin): Target 3 hari (+ toleransi 1 hari)
 * Level 2 (11–20 poin): Target 3 hari (+ toleransi 1 hari)
 * Level 3 (21–30 poin): Target 7 hari (+ toleransi 2 hari)
 * Level 4 (31–34 poin): Target 7 hari (+ toleransi 2 hari)
 * Level 5 (35–49 poin): Target 7 hari (+ toleransi 2 hari)
 * Level 6 (50–69 poin): Target 9 hari (+ toleransi 2 hari)
 * Level 7 (70–89 poin): Target 14 hari (+ toleransi 2 hari)
 * Level 8 (90–99 poin): Target 14 hari (+ toleransi 2 hari)
 */
export function getLevelDuration(tingkat: number): LevelDuration {
  switch (tingkat) {
    case 1:
      return {
        targetHari: 3,
        toleransiHari: 1,
        totalHari: 4,
        keterangan: '3 hari (+ toleransi 1 hari)'
      };
    case 2:
      return {
        targetHari: 3,
        toleransiHari: 1,
        totalHari: 4,
        keterangan: '3 hari (+ toleransi 1 hari)'
      };
    case 3:
      return {
        targetHari: 7,
        toleransiHari: 2,
        totalHari: 9,
        keterangan: '7 hari (+ toleransi 2 hari)'
      };
    case 4:
      return {
        targetHari: 7,
        toleransiHari: 2,
        totalHari: 9,
        keterangan: '7 hari (+ toleransi 2 hari)'
      };
    case 5:
      return {
        targetHari: 7,
        toleransiHari: 2,
        totalHari: 9,
        keterangan: '7 hari (+ toleransi 2 hari)'
      };
    case 6:
      return {
        targetHari: 9,
        toleransiHari: 2,
        totalHari: 11,
        keterangan: '9 hari (+ toleransi 2 hari)'
      };
    case 7:
      return {
        targetHari: 14,
        toleransiHari: 2,
        totalHari: 16,
        keterangan: '14 hari (+ toleransi 2 hari)'
      };
    case 8:
      return {
        targetHari: 14,
        toleransiHari: 2,
        totalHari: 16,
        keterangan: '14 hari (+ toleransi 2 hari)'
      };
    default:
      return {
        targetHari: 7,
        toleransiHari: 2,
        totalHari: 9,
        keterangan: '7 hari (+ toleransi 2 hari)'
      };
  }
}

/**
 * Visual kategori poin pelanggaran (Sangat Berat, Berat, Sedang, Ringan, Sangat Ringan)
 */
export function getSeverityCategory(poin: number): SeverityCategory {
  if (poin >= 95) {
    return {
      levelKey: 'sangat_berat',
      label: 'Sangat Berat',
      poinRange: '95–100 Poin',
      colorHex: '#BE123C',
      badgeClass: 'bg-rose-950/80 text-rose-200 border-rose-500 ring-1 ring-rose-500/50',
      borderClass: 'border-rose-500',
      bgClass: 'bg-rose-950/40',
      textClass: 'text-rose-300',
      description: 'Level 8/Khusus: Skorsing / Sidang Dewan Asatiz / Tindakan Ekstrem'
    };
  }
  if (poin >= 80) {
    return {
      levelKey: 'berat',
      label: 'Berat',
      poinRange: '80–94 Poin',
      colorHex: '#DC2626',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/50',
      borderClass: 'border-red-500/50',
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-400',
      description: 'Level 8: Skorsing tanpa syarat & pembinaan intensif 14 hari'
    };
  }
  if (poin >= 50) {
    return {
      levelKey: 'sedang',
      label: 'Sedang',
      poinRange: '50–79 Poin',
      colorHex: '#F59E0B',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      borderClass: 'border-amber-500/50',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-300',
      description: 'Level 6–7: Skorsing bersyarat & pembinaan edukatif terukur'
    };
  }
  if (poin >= 5) {
    return {
      levelKey: 'ringan',
      label: 'Ringan',
      poinRange: '5–49 Poin',
      colorHex: '#3B82F6',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      borderClass: 'border-blue-500/50',
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      description: 'Level 1–5: Pembinaan edukatif terukur sesuai rentang poin'
    };
  }

  return {
    levelKey: 'unknown',
    label: 'Di Luar Ketentuan',
    poinRange: '< 5 Poin',
    colorHex: '#94A3B8',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    borderClass: 'border-slate-500/50',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    description: 'Belum ada ketentuan pembinaan untuk poin ini.'
  };
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatDateIndonesian(date: Date, short = false): string {
  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: short ? 'short' : 'long',
      year: 'numeric'
    });
    return formatter.format(date);
  } catch {
    const d = date.getDate();
    const m = short ? INDONESIAN_MONTHS_SHORT[date.getMonth()] : INDONESIAN_MONTHS[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  }
}

/**
 * Format timestamp into standard Indonesian WIB date-time string
 */
export function formatWIBDateTime(rawDate: string | Date | null | undefined): string {
  if (!rawDate) return '-';
  const d = typeof rawDate === 'string' ? new Date(rawDate) : rawDate;
  if (isNaN(d.getTime())) return String(rawDate);
  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${formatter.format(d)} WIB`.replace(/\./g, ':');
  } catch {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const utcMs = d.getTime();
    const wibDate = new Date(utcMs + 7 * 3600 * 1000);
    return `${wibDate.getUTCDate()} ${months[wibDate.getUTCMonth()]} ${wibDate.getUTCFullYear()}, ${String(wibDate.getUTCHours()).padStart(2, '0')}.${String(wibDate.getUTCMinutes()).padStart(2, '0')} WIB`;
  }
}

/**
 * Menghitung tanggal target dan toleransi pembinaan berdasarkan tanggal kejadian kasus
 */
export function calculatePembinaanDates(targetHari: number, toleransiHari = 2, baseDate: Date | string = new Date()) {
  const parsedDate = typeof baseDate === 'string' ? new Date(baseDate) : baseDate;
  const validBaseDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const startDate = new Date(validBaseDate);
  const targetEndDate = new Date(validBaseDate);
  targetEndDate.setDate(startDate.getDate() + (targetHari > 0 ? targetHari - 1 : 0));

  const graceEndDate = new Date(targetEndDate);
  graceEndDate.setDate(targetEndDate.getDate() + toleransiHari);

  return {
    startDate,
    targetEndDate,
    graceEndDate,
    formattedStartDate: formatDateIndonesian(startDate),
    formattedTargetEndDate: formatDateIndonesian(targetEndDate),
    formattedGraceEndDate: formatDateIndonesian(graceEndDate),
    periodeText: `${formatDateIndonesian(startDate)} s.d. ${formatDateIndonesian(targetEndDate)}`
  };
}

export interface PembinaanFormData {
  header: {
    title: string;
    institution: string;
    levelName: string;
    levelNumber: number;
    poinPelanggaran: number;
    rangePoin: string;
    durasiHari: number;
    toleransiHari: number;
    durasiText: string;
  };
  kasus?: {
    id: string;
    tanggalPelanggaran: string;
    poin: number;
  };
  santri: {
    nama: string;
    nis: string;
    kelas: string;
    kamar: string;
    asrama: string;
    unit: string;
    totalPoin: number;
  };
  pelanggaran: {
    kode: string;
    jenis: string;
    poin: number;
    konsekuensi: string;
    tanggal?: string;
  };
  pembinaan: {
    periodeText: string;
    tanggalMulai: string;
    tanggalTargetSelesai: string;
    tanggalToleransiSelesai: string;
    itemsWithCode: { code: string; uraian: string }[];
  };
  mutabaahRows: {
    no: number;
    hariLabel: string;
  }[];
  officers: {
    musyrifNama: string;
    koordinatorNama: string;
    unitName: string;
    kotaTanggal: string;
    tanggalCetak?: string;
  };
}

/**
 * Generator data form pembinaan resmi DINAMIS untuk Level 1 s.d 8
 * - Untuk kasus yang SUDAH TERCATAT di database (misal dari Rekap):
 *   santri.totalPoin adalah akumulasi riil, JANGAN ditambahkan poin lagi.
 * - Untuk draf pencatatan baru (sebelum simpan):
 *   isNewRecord = true dapat diaktifkan jika ingin memvisualisasikan akumulasi baru.
 */
export function generatePembinaanFormData(params: {
  santri: Santri;
  pelanggaran: Pelanggaran;
  pembinaan: MasterPembinaan;
  user: UserAccount | null;
  usersList?: UserAccount[];
  startDate?: Date | string;
  tanggalPelanggaran?: string;
  kasusId?: string;
  isNewRecord?: boolean;
}): PembinaanFormData {
  const {
    santri,
    pelanggaran,
    pembinaan,
    user,
    usersList = [],
    startDate = new Date(),
    tanggalPelanggaran,
    kasusId,
    isNewRecord = false
  } = params;

  const duration = getLevelDuration(pembinaan.tingkat);
  const dates = calculatePembinaanDates(duration.targetHari, duration.toleransiHari, startDate);

  // Buat kode P1, P2, P3, ... P11 untuk setiap jenis pembinaan
  const itemsWithCode = pembinaan.jenis_pembinaan.map((uraian, idx) => ({
    code: `P${idx + 1}`,
    uraian
  }));

  // Buat baris mutaba'ah sesuai durasi hari
  const mutabaahRows = Array.from({ length: duration.targetHari }, (_, i) => ({
    no: i + 1,
    hariLabel: `Hari ke-${i + 1}`
  }));

  // Cari nama Koordinator Unit dan Musyrif
  const koordinator = usersList.find(
    (u) => u.role === 'KOORDINATOR' && (u.unit === santri.unit || u.unit === 'ALL')
  ) || usersList.find((u) => u.role === 'KASIE_KEPESANTRENAN');

  const musyrifName = santri.musyrifNama || (user?.role === 'MUSYRIF' ? user.nama : 'Musyrif Asrama');
  const koordinatorName = koordinator ? koordinator.nama : 'Koordinator Kedisiplinan Unit';

  // Tanggal riil pelanggaran yang tercatat
  const displayTanggalPelanggaran = tanggalPelanggaran || (
    typeof startDate === 'string'
      ? formatWIBDateTime(startDate)
      : formatWIBDateTime(startDate)
  );

  // Poin akumulasi santri yang sebenarnya (TIDAK BOLEH digandakan/ditambah jika kasus sudah tersimpan)
  const finalTotalPoin = isNewRecord
    ? (Number(santri.totalPoin) || 0) + (Number(pelanggaran.poin) || 0)
    : (Number(santri.totalPoin) || Number(pelanggaran.poin) || 0);

  return {
    header: {
      title: "MUTABA'AH PEMBINAAN SANTRI",
      institution: 'Pesantren Nurul Islam Tengaran',
      levelName: pembinaan.nama_tingkat.toUpperCase(),
      levelNumber: pembinaan.tingkat,
      poinPelanggaran: pelanggaran.poin,
      rangePoin: `${pembinaan.min_poin}–${pembinaan.max_poin} Poin`,
      durasiHari: duration.targetHari,
      toleransiHari: duration.toleransiHari,
      durasiText: `${duration.targetHari} Hari (+ ${duration.toleransiHari} Hari Toleransi)`
    },
    kasus: {
      id: kasusId || '',
      tanggalPelanggaran: displayTanggalPelanggaran,
      poin: pelanggaran.poin
    },
    santri: {
      nama: santri.nama,
      nis: santri.nis,
      kelas: santri.kelas,
      kamar: santri.kamar || santri.asrama || '-',
      asrama: santri.asrama || '-',
      unit: santri.unit,
      totalPoin: finalTotalPoin
    },
    pelanggaran: {
      kode: pelanggaran.kode,
      jenis: pelanggaran.jenis,
      poin: pelanggaran.poin,
      konsekuensi: pelanggaran.konsekuensi,
      tanggal: displayTanggalPelanggaran
    },
    pembinaan: {
      periodeText: dates.periodeText,
      tanggalMulai: dates.formattedStartDate,
      tanggalTargetSelesai: dates.formattedTargetEndDate,
      tanggalToleransiSelesai: dates.formattedGraceEndDate,
      itemsWithCode
    },
    mutabaahRows,
    officers: {
      musyrifNama: musyrifName,
      koordinatorNama: koordinatorName,
      unitName: santri.unit,
      kotaTanggal: `Tengaran, ${dates.formattedStartDate}`,
      tanggalCetak: formatWIBDateTime(new Date())
    }
  };
}
