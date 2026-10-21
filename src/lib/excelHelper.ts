import { utils, write, read } from 'xlsx';
import { UnitPesantren, UserRole, UserAccount, Pelanggaran, RiwayatPelanggaran } from '../types';
import { getKategoriFromPoin, KategoriPelanggaranType } from '../components/common/PointBadge';

/**
 * Safely sanitize and truncate Excel sheet names (max 31 characters, remove invalid chars \ / ? * : [ ])
 */
export function sanitizeSheetName(name: string, fallback = 'Sheet1'): string {
  if (!name || typeof name !== 'string') return fallback;
  const sanitized = name.replace(/[\\/?*:[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!sanitized) return fallback;
  return sanitized.slice(0, 31);
}

export interface SantriImportRow {
  rowNumber: number;
  nis: string;
  nama: string;
  unit: UnitPesantren;
  kelas: string;
  musyrif: string;
  asrama?: string;
  kamar?: string;
  keterangan?: string;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
  resolvedMusyrifId?: string;
  resolvedMusyrifNama?: string;
}

export interface PelanggaranImportRow {
  rowNumber: number;
  no?: string;
  kode: string;
  jenis: string;
  poin: number;
  kategoriAsli?: string;
  kategoriDihitung: KategoriPelanggaranType;
  kategoriWarning?: string;
  konsekuensi: string;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

export interface UserImportRow {
  rowNumber: number;
  id?: string;
  nama: string;
  username: string;
  passwordRaw: string;
  password?: string;
  jabatan: string;
  role: UserRole;
  unit: 'ALL' | UnitPesantren;
  isActive: boolean;
  email?: string;
  status: 'valid' | 'duplicate' | 'error';
  warningMessage?: string;
  errorMessage?: string;
}

// ============================================================================
// DATA PELANGGARAN EXCEL HELPERS
// ============================================================================

/**
 * Generate and download template Excel for Master Pelanggaran Import
 * Columns: | No | Item Pelanggaran | Poin | Kategori Pelanggaran | Hukuman / Konsekuensi |
 */
export function generatePelanggaranExcelTemplate(): void {
  const headers = [
    'No',
    'Item Pelanggaran',
    'Poin',
    'Kategori Pelanggaran',
    'Hukuman / Konsekuensi'
  ];

  const sampleRows = [
    [
      57,
      'Vandalisme (coret-coret / merusak fasilitas / lainnya)',
      15,
      'Ringan',
      'teguran lisan + tilawah 30 menit'
    ],
    [
      58,
      'Bermain diluar jam dan tempat yang ditentukan',
      15,
      'Ringan',
      'teguran lisan + tilawah 30 menit'
    ],
    [
      59,
      'Mengotori lingkungan pesantren sengaja atau tidak disengaja (sampah, sepatu)',
      15,
      'Ringan',
      '-'
    ],
    [
      60,
      'Pulang/keluar tanpa konfirmasi wali kamar',
      15,
      'Ringan',
      'Teguran lisan'
    ],
    [
      61,
      "Tidak hadir halaqoh tanpa udzur syar'i",
      15,
      'Ringan',
      'teguran lisan + tilawah 30 menit'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },  // No
    { wch: 65 }, // Item Pelanggaran
    { wch: 10 }, // Poin
    { wch: 22 }, // Kategori Pelanggaran
    { wch: 45 }  // Hukuman / Konsekuensi
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Master Pelanggaran');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Pelanggaran_SIMKA.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Master Pelanggaran to Excel (Restricted to Kasie)
 */
export function exportPelanggaranToExcel(
  pelanggaranList: Pelanggaran[],
  filenamePrefix = 'Master_Data_Pelanggaran',
  userRole?: UserRole
): void {
  if (userRole && userRole !== 'KASIE_KEPESANTRENAN') {
    throw new Error('Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengekspor data master.');
  }

  const headers = [
    'No',
    'Kode',
    'Item Pelanggaran',
    'Poin',
    'Kategori Pelanggaran',
    'Hukuman / Konsekuensi'
  ];

  const dataRows = pelanggaranList.map((item, idx) => {
    const calculatedKategori = getKategoriFromPoin(item.poin).kategori;
    return [
      idx + 1,
      item.kode || `P${String(idx + 1).padStart(3, '0')}`,
      item.jenis,
      item.poin,
      calculatedKategori,
      item.konsekuensi || '-'
    ];
  });

  const wsData = [headers, ...dataRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 10 },
    { wch: 65 },
    { wch: 10 },
    { wch: 22 },
    { wch: 45 }
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Kamus Pelanggaran');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate Excel file for Master Pelanggaran with Auto-Category calculation and anti-duplication
 */
export async function parsePelanggaranExcel(
  file: File,
  existingList: Pelanggaran[]
): Promise<{
  rows: PelanggaranImportRow[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson: any[][] = utils.sheet_to_json(worksheet, { header: 1 });

  if (rawJson.length < 2) {
    throw new Error('File Excel kosong atau tidak memiliki baris data.');
  }

  // Find column indices with precision to prevent mixing 'No' / 'Kategori' with 'Item Pelanggaran'
  const headerRow = rawJson[0].map((h: any) => String(h || '').trim().toLowerCase());
  
  // 1. Column No
  let colNo = headerRow.findIndex((h) => /^no(\.|\s|$)|nomor|^#$/i.test(h) && !h.includes('item') && !h.includes('jenis') && !h.includes('kategori'));
  
  // 2. Column Kode (if present)
  let colKode = headerRow.findIndex((h) => /^(kode|kd)(\.|\s|_|$)/i.test(h) && !h.includes('item'));

  // 3. Column Kategori
  let colKategori = headerRow.findIndex((h) => h.includes('kategori') || h.includes('tingkat'));

  // 4. Column Poin / Skor
  let colPoin = headerRow.findIndex((h) => h.includes('poin') || h.includes('bobot') || h.includes('skor') || h.includes('nilai'));

  // 5. Column Hukuman / Konsekuensi / Sanksi
  let colHukuman = headerRow.findIndex((h) => h.includes('hukuman') || h.includes('konsekuensi') || h.includes('sanksi') || h.includes('tindakan'));

  // 6. Column Item / Jenis Pelanggaran (must NOT be No, Kode, Kategori, Poin, or Hukuman)
  let colJenis = headerRow.findIndex((h, idx) => {
    if (idx === colNo || idx === colKode || idx === colKategori || idx === colPoin || idx === colHukuman) return false;
    return (
      h.includes('item pelanggaran') ||
      h.includes('jenis pelanggaran') ||
      h.includes('nama pelanggaran') ||
      h.includes('deskripsi') ||
      h.includes('pelanggaran') ||
      h.includes('item') ||
      h.includes('jenis') ||
      h.includes('nama')
    );
  });

  // Fallback positional indexing if headers are not clear
  if (colJenis === -1) {
    // Pick first column that is not No/Poin/Hukuman/Kategori
    const available = headerRow.map((_, i) => i).filter(i => i !== colNo && i !== colPoin && i !== colKategori && i !== colHukuman && i !== colKode);
    colJenis = available.length > 0 ? available[0] : (colNo === 0 ? 1 : 0);
  }
  if (colPoin === -1) {
    colPoin = headerRow.length > 2 ? 2 : (headerRow.length > 1 ? 1 : 0);
  }
  if (colKategori === -1) {
    colKategori = headerRow.length > 3 ? 3 : -1;
  }
  if (colHukuman === -1) {
    colHukuman = headerRow.length > 4 ? 4 : (headerRow.length > 3 ? 3 : -1);
  }

  const existingJenisSet = new Set(
    existingList.map((p) => p.jenis.trim().toLowerCase().replace(/\s+/g, ' '))
  );
  const existingKodeSet = new Set(
    existingList.map((p) => (p.kode || '').trim().toLowerCase())
  );

  const seenInCurrentBatch = new Set<string>();
  const parsedRows: PelanggaranImportRow[] = [];

  for (let i = 1; i < rawJson.length; i++) {
    const row = rawJson[i];
    if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
      continue; // Skip empty rows
    }

    const rawNo = colNo !== -1 && row[colNo] !== undefined ? String(row[colNo]).trim() : String(i);
    const rawJenis = row[colJenis] !== undefined ? String(row[colJenis]).trim() : '';
    const rawPoin = row[colPoin] !== undefined ? Number(row[colPoin]) : NaN;
    const rawKategori = row[colKategori] !== undefined ? String(row[colKategori]).trim() : '';
    const rawHukuman = row[colHukuman] !== undefined ? String(row[colHukuman]).trim() : '-';

    // Validation
    if (!rawJenis) {
      parsedRows.push({
        rowNumber: i + 1,
        no: rawNo,
        kode: `P${String(i).padStart(3, '0')}`,
        jenis: '(Kosong)',
        poin: 0,
        kategoriAsli: rawKategori,
        kategoriDihitung: 'Ringan',
        konsekuensi: rawHukuman,
        status: 'error',
        errorMessage: 'Item Pelanggaran wajib diisi.'
      });
      continue;
    }

    if (isNaN(rawPoin) || rawPoin < 1) {
      parsedRows.push({
        rowNumber: i + 1,
        no: rawNo,
        kode: `P${String(i).padStart(3, '0')}`,
        jenis: rawJenis,
        poin: 0,
        kategoriAsli: rawKategori,
        kategoriDihitung: 'Ringan',
        konsekuensi: rawHukuman,
        status: 'error',
        errorMessage: 'Poin harus berupa angka positif (minimal 1).'
      });
      continue;
    }

    // Auto-calculate Category based strictly on Points
    const calculatedKategori = getKategoriFromPoin(rawPoin).kategori;
    let kategoriWarning: string | undefined = undefined;

    if (rawKategori && rawKategori.toLowerCase() !== calculatedKategori.toLowerCase()) {
      kategoriWarning = `Kategori di file ("${rawKategori}") disesuaikan otomatis menjadi "${calculatedKategori}" berdasarkan bobot ${rawPoin} poin.`;
    }

    // Anti-duplication check
    const normalizedKey = rawJenis.toLowerCase().replace(/\s+/g, ' ');
    if (existingJenisSet.has(normalizedKey) || seenInCurrentBatch.has(normalizedKey)) {
      parsedRows.push({
        rowNumber: i + 1,
        no: rawNo,
        kode: `P${String(i).padStart(3, '0')}`,
        jenis: rawJenis,
        poin: rawPoin,
        kategoriAsli: rawKategori,
        kategoriDihitung: calculatedKategori,
        kategoriWarning,
        konsekuensi: rawHukuman || '-',
        status: 'duplicate',
        errorMessage: 'Duplikat — Item pelanggaran sudah ada di sistem.'
      });
      continue;
    }

    seenInCurrentBatch.add(normalizedKey);

    parsedRows.push({
      rowNumber: i + 1,
      no: rawNo,
      kode: `P${String(existingList.length + parsedRows.length + 1).padStart(3, '0')}`,
      jenis: rawJenis,
      poin: rawPoin,
      kategoriAsli: rawKategori,
      kategoriDihitung: calculatedKategori,
      kategoriWarning,
      konsekuensi: rawHukuman || '-',
      status: 'valid'
    });
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'duplicate').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;

  return { rows: parsedRows, validCount, duplicateCount, errorCount };
}

// ============================================================================
// DATA PENGGUNA EXCEL HELPERS
// ============================================================================

/**
 * Helper to test if a string is a valid UUID
 */
export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  const clean = str.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(clean);
}

/**
 * Normalizes user jabatan from Excel into standard SIMKA role & database value
 */
export function normalizeUserJabatan(rawJabatan?: string | null): { jabatan: string; role: UserRole; warning?: string } {
  if (!rawJabatan || !rawJabatan.trim()) {
    return { jabatan: '', role: 'MUSYRIF' };
  }
  const clean = rawJabatan.toUpperCase().trim();
  if (
    clean.includes('KASIE') ||
    clean.includes('KABID') ||
    clean.includes('SUPERADMIN') ||
    clean.includes('SUPER ADMIN') ||
    clean.includes('KEPESANTRENAN') ||
    clean === 'ADMIN'
  ) {
    return { jabatan: 'KASIE_KEPESANTRENAN', role: 'KASIE_KEPESANTRENAN' };
  }
  if (clean.includes('KOORDINATOR') || clean.includes('KOOR')) {
    return { jabatan: 'KOORDINATOR', role: 'KOORDINATOR' };
  }
  if (
    clean.includes('MUSYRIF') ||
    clean.includes('PEMBINA') ||
    clean.includes('PENGASUH') ||
    clean.includes('USTADZ') ||
    clean.includes('USTAD')
  ) {
    return { jabatan: 'MUSYRIF', role: 'MUSYRIF' };
  }
  return {
    jabatan: clean,
    role: 'MUSYRIF',
    warning: `Jabatan "${rawJabatan}" tidak standar (disimpan sebagai ${clean})`
  };
}

/**
 * Normalizes user unit from Excel into standard SIMKA unit
 */
export function normalizeUserUnit(
  rawUnit?: string | null,
  roleOrJabatan?: string
): 'ALL' | UnitPesantren | null {
  const cleanJabatan = (roleOrJabatan || '').toUpperCase().trim();
  if (
    cleanJabatan === 'KASIE_KEPESANTRENAN' ||
    cleanJabatan.includes('KASIE') ||
    cleanJabatan.includes('KABID') ||
    cleanJabatan.includes('SUPERADMIN')
  ) {
    return 'ALL';
  }
  if (!rawUnit || !rawUnit.trim()) {
    return null;
  }
  const clean = rawUnit.toUpperCase().trim();
  if (
    clean === 'ALL' ||
    clean === 'SEMUA' ||
    clean.includes('SEMUA UNIT') ||
    clean.includes('SELURUH UNIT') ||
    clean === 'PUSAT' ||
    clean === 'YAYASAN'
  ) {
    return 'ALL';
  }
  if (clean === 'SMP' || clean.includes('SMP')) return 'SMP';
  if (clean === 'MA' || clean.includes('MA') || clean.includes('ALIYAH')) return 'MA';
  if (clean === 'SMA' || clean.includes('SMA')) return 'SMA';
  return null;
}

/**
 * Normalizes active status boolean
 */
export function normalizeUserIsActive(rawStatus?: string | null): boolean {
  if (rawStatus === undefined || rawStatus === null || rawStatus === '') return true;
  const clean = String(rawStatus).toUpperCase().trim();
  if (
    clean === 'NONAKTIF' ||
    clean === 'NON-AKTIF' ||
    clean === 'NON AKTIF' ||
    clean === 'FALSE' ||
    clean === '0' ||
    clean === 'TIDAK' ||
    clean === 'INACTIVE' ||
    clean === 'N' ||
    clean === 'OFF'
  ) {
    return false;
  }
  return true;
}

/**
 * Generate and download template Excel for Users Import
 * Columns: | No | ID (Opsional) | Nama Lengkap | Username | Password | Jabatan / Role | Unit | Status |
 */
export function generateUserExcelTemplate(): void {
  const headers = [
    'No',
    'ID (Kosongkan jika baru)',
    'Nama Lengkap',
    'Username',
    'Password',
    'Jabatan',
    'Unit',
    'Status'
  ];

  const sampleRows = [
    [
      1,
      '',
      'Ust. Ahmad Al-Haddad, S.Pd',
      'ahmad.musy',
      'ahmad123',
      'Musyrif',
      'MA',
      'Aktif'
    ],
    [
      2,
      '',
      'Ustzh. Fatimah Az-Zahra, S.Ag',
      'fatimah.musy',
      'fatimah123',
      'Musyrif',
      'SMP',
      'Aktif'
    ],
    [
      3,
      '',
      'Ust. Hasan Basri, M.Pd',
      'hasan.koor',
      'hasan123',
      'Koordinator',
      'SMP',
      'Aktif'
    ],
    [
      4,
      '',
      'Ust. Fathurrahman, Lc',
      'fathur.sma',
      'sma123',
      'Musyrif',
      'SMA',
      'Aktif'
    ],
    [
      5,
      '',
      'Drs. H. M. Wildan, M.Ag',
      'wildan.kasie',
      'kasie123',
      'Kasie Kepesantrenan',
      'ALL',
      'Aktif'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 28 }, // ID (UUID)
    { wch: 32 }, // Nama Lengkap
    { wch: 20 }, // Username
    { wch: 18 }, // Password
    { wch: 24 }, // Jabatan
    { wch: 12 }, // Unit
    { wch: 12 }  // Status
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Pengguna');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Pengguna_SIMKA.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Users list to Excel (NEVER exports password or password_hash!)
 */
export function exportUsersToExcel(
  usersList: UserAccount[],
  filenamePrefix = 'Data_Pengguna_SIMKA'
): void {
  const headers = [
    'ID',
    'Nama Lengkap',
    'Username',
    'Jabatan / Role',
    'Unit',
    'Status'
  ];

  const dataRows = usersList.map((u) => [
    u.id,
    u.nama,
    u.username,
    u.role,
    u.unit,
    u.is_active ? 'Aktif' : 'Nonaktif'
  ]);

  const wsData = [headers, ...dataRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 38 },
    { wch: 34 },
    { wch: 20 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 }
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Daftar Pengguna');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate Excel/CSV file for Users Import
 */
export async function parseUsersExcel(
  file: File,
  existingUsers: UserAccount[]
): Promise<{
  rows: UserImportRow[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array', raw: false });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson: any[][] = utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawJson.length < 2) {
    throw new Error('File Excel/CSV kosong atau tidak memiliki baris data.');
  }

  // Find the header row (support leading title banner rows)
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rawJson.length, 6); r++) {
    const rowStr = (rawJson[r] || [])
      .map((c: any) => String(c || '').toLowerCase().trim())
      .join(' ');
    if (
      rowStr.includes('nama') ||
      rowStr.includes('username') ||
      rowStr.includes('jabatan') ||
      rowStr.includes('role') ||
      rowStr.includes('password') ||
      rowStr.includes('unit')
    ) {
      headerRowIndex = r;
      break;
    }
  }

  const rawHeaders = rawJson[headerRowIndex] || [];
  const normalizedHeaders = rawHeaders.map((h: any) =>
    String(h || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_\-]+/g, ' ')
  );

  const findCol = (keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = normalizedHeaders.findIndex((h: string) => h === kw || h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  let colId = findCol(['id pengguna', 'id user', 'kode', 'user id', 'id']);
  let colNama = findCol(['nama lengkap', 'nama & gelar', 'nama gelar', 'full name', 'nama']);
  let colUsername = findCol(['username', 'nama user', 'id akun', 'akun', 'login', 'user']);
  let colPassword = findCol(['password', 'kata sandi', 'sandi', 'pass', 'pwd']);
  let colJabatan = findCol(['jabatan', 'role', 'peran', 'posisi', 'tingkat']);
  let colUnit = findCol(['unit pesantren', 'jenjang', 'unit', 'lembaga', 'sekolah']);
  let colStatus = findCol(['status akun', 'status', 'aktif', 'is active', 'active']);
  let colEmail = findCol(['email', 'mail']);

  // Position-based fallbacks if headers couldn't be detected
  if (colNama === -1 && colUsername === -1) {
    colId = 1;
    colNama = 2;
    colUsername = 3;
    colPassword = 4;
    colJabatan = 5;
    colUnit = 6;
  }

  const existingUsernameSet = new Set(
    existingUsers.map((u) => u.username.trim().toLowerCase())
  );
  const seenUsernameBatch = new Set<string>();

  const parsedRows: UserImportRow[] = [];

  for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
    const row = rawJson[i];
    if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }

    const rawId = colId !== -1 && row[colId] ? String(row[colId]).trim() : '';
    const rawNama = colNama !== -1 && row[colNama] !== undefined ? String(row[colNama]).trim() : '';
    const rawUsername = colUsername !== -1 && row[colUsername] !== undefined ? String(row[colUsername]).trim().toLowerCase() : '';
    const rawPassword = colPassword !== -1 && row[colPassword] !== undefined ? String(row[colPassword]).trim() : '';
    const rawJabatan = colJabatan !== -1 && row[colJabatan] !== undefined ? String(row[colJabatan]).trim() : '';
    const rawUnit = colUnit !== -1 && row[colUnit] !== undefined ? String(row[colUnit]).trim() : '';
    const rawStatus = colStatus !== -1 && row[colStatus] !== undefined ? String(row[colStatus]).trim() : '';
    const rawEmail = colEmail !== -1 && row[colEmail] !== undefined ? String(row[colEmail]).trim() : '';

    const isActive = normalizeUserIsActive(rawStatus);

    // 1. Required: Nama
    if (!rawNama) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId || undefined,
        nama: '(Kosong)',
        username: rawUsername || '-',
        passwordRaw: rawPassword || '',
        password: rawPassword || '',
        jabatan: rawJabatan || 'MUSYRIF',
        role: 'MUSYRIF',
        unit: 'SMP',
        isActive,
        email: rawEmail,
        status: 'error',
        errorMessage: 'Nama lengkap pengguna wajib diisi.'
      });
      continue;
    }

    // 2. Required: Username
    if (!rawUsername) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId || undefined,
        nama: rawNama,
        username: '(Kosong)',
        passwordRaw: rawPassword || '',
        password: rawPassword || '',
        jabatan: rawJabatan || 'MUSYRIF',
        role: 'MUSYRIF',
        unit: 'SMP',
        isActive,
        email: rawEmail,
        status: 'error',
        errorMessage: 'Username wajib diisi.'
      });
      continue;
    }

    // 3. Required: Password
    if (!rawPassword) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId || undefined,
        nama: rawNama,
        username: rawUsername,
        passwordRaw: '',
        password: '',
        jabatan: rawJabatan || 'MUSYRIF',
        role: 'MUSYRIF',
        unit: 'SMP',
        isActive,
        email: rawEmail,
        status: 'error',
        errorMessage: 'Password wajib diisi.'
      });
      continue;
    }

    // 4. Required: Jabatan
    if (!rawJabatan) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId || undefined,
        nama: rawNama,
        username: rawUsername,
        passwordRaw: rawPassword,
        password: rawPassword,
        jabatan: '',
        role: 'MUSYRIF',
        unit: 'SMP',
        isActive,
        email: rawEmail,
        status: 'error',
        errorMessage: 'Jabatan / Role wajib diisi (Pilih Musyrif, Koordinator, atau Kasie Kepesantrenan).'
      });
      continue;
    }

    // Resolve Role & Jabatan mapping
    const { jabatan: resolvedJabatan, role: resolvedRole, warning: jabatanWarning } = normalizeUserJabatan(rawJabatan);

    // Resolve Unit
    const resolvedUnit = normalizeUserUnit(rawUnit, resolvedJabatan);
    if (!resolvedUnit) {
      parsedRows.push({
        rowNumber: i + 1,
        id: rawId || undefined,
        nama: rawNama,
        username: rawUsername,
        passwordRaw: rawPassword,
        password: rawPassword,
        jabatan: resolvedJabatan,
        role: resolvedRole,
        unit: 'SMP',
        isActive,
        email: rawEmail,
        status: 'error',
        errorMessage: `Unit wajib diisi untuk ${resolvedJabatan} (Pilih SMP, MA, atau SMA, terisi: "${rawUnit || '-'}").`
      });
      continue;
    }

    // 5. Check Duplicate Username
    if (existingUsernameSet.has(rawUsername) || seenUsernameBatch.has(rawUsername)) {
      parsedRows.push({
        rowNumber: i + 1,
        id: isValidUUID(rawId) ? rawId : undefined,
        nama: rawNama,
        username: rawUsername,
        passwordRaw: rawPassword,
        password: rawPassword,
        jabatan: resolvedJabatan,
        role: resolvedRole,
        unit: resolvedUnit,
        isActive,
        email: rawEmail,
        status: 'duplicate',
        errorMessage: `Username "@${rawUsername}" sudah terdaftar di sistem.`
      });
      continue;
    }

    seenUsernameBatch.add(rawUsername);

    parsedRows.push({
      rowNumber: i + 1,
      id: isValidUUID(rawId) ? rawId : undefined,
      nama: rawNama,
      username: rawUsername,
      passwordRaw: rawPassword,
      password: rawPassword,
      jabatan: resolvedJabatan,
      role: resolvedRole,
      unit: resolvedUnit,
      isActive,
      email: rawEmail || `${rawUsername}@simka.id`,
      status: 'valid',
      warningMessage: jabatanWarning
    });
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'duplicate').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;

  return { rows: parsedRows, validCount, duplicateCount, errorCount };
}

/**
 * Normalizes unit string to standard SMP, MA, SMA for Santri
 */
export function normalizeSantriUnit(rawUnit?: string, fallback: UnitPesantren = 'SMP'): UnitPesantren {
  if (!rawUnit) return fallback;
  const clean = String(rawUnit).trim().toUpperCase();
  if (clean === 'SMP' || clean.includes('SMP') || clean.includes('MTS')) return 'SMP';
  if (clean === 'MA' || clean === 'UNIT MA' || clean.includes('ALIYAH') || clean === 'MA') return 'MA';
  if (clean === 'SMA' || clean.includes('SMA')) return 'SMA';
  return fallback;
}

/**
 * Robust Santri Excel Parser supporting flexible header formats, duplicate detection, and unit validation
 */
export function parseSantriExcel(
  fileBuffer: ArrayBuffer,
  existingSantriList: Array<{ nis?: string; kode_santri?: string; nama?: string; unit?: string }>,
  selectedUnit: UnitPesantren,
  musyrifUsers: UserAccount[] = [],
  isSuperadmin: boolean = true,
  userUnit?: string
): {
  rows: SantriImportRow[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
} {
  const workbook = read(new Uint8Array(fileBuffer), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson = utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

  if (!rawJson || rawJson.length === 0) {
    throw new Error('File Excel kosong atau tidak terbaca.');
  }

  // Find Header Row Index
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
    const row = rawJson[i];
    if (Array.isArray(row)) {
      const rowStr = row.map((c) => String(c || '').toLowerCase()).join(' ');
      if (
        rowStr.includes('nama') ||
        rowStr.includes('nis') ||
        rowStr.includes('kode') ||
        rowStr.includes('santri')
      ) {
        headerRowIndex = i;
        break;
      }
    }
  }

  const headers = (rawJson[headerRowIndex] || []).map((h: any) =>
    String(h || '').trim().toLowerCase()
  );

  const findCol = (keywords: string[]): number => {
    return headers.findIndex((h: string) =>
      keywords.some((k) => h === k || h.includes(k))
    );
  };

  // Header column mapping with multiple synonyms
  let colNis = findCol(['nis santri', 'kode santri', 'id santri', 'nis', 'kode', 'nomor induk', 'no induk']);
  let colNama = findCol(['nama lengkap santri', 'nama santri', 'nama lengkap', 'nama']);
  let colUnit = findCol(['unit pesantren', 'unit santri', 'unit', 'jenjang']);
  let colKelas = findCol(['kelas santri', 'kelas', 'tingkat']);
  let colMusyrif = findCol(['musyrif pembina', 'musyrif asrama', 'musyrif', 'pembina', 'ustadz']);
  let colAsramaKamar = findCol(['asrama/kamar', 'asrama & kamar', 'asrama / kamar']);
  let colAsrama = findCol(['gedung asrama', 'asrama santri', 'asrama', 'gedung']);
  let colKamar = findCol(['nomor kamar', 'no kamar', 'kamar']);
  let colStatus = findCol(['status pembinaan', 'status santri', 'status']);
  let colKeterangan = findCol(['keterangan', 'catatan', 'keterangan tambahan']);

  // Position fallback if no matching headers found
  if (colNis === -1 && colNama === -1) {
    colNis = 0;
    colNama = 1;
    colUnit = 2;
    colKelas = 3;
    colMusyrif = 4;
    colAsramaKamar = 5;
    colStatus = 6;
    colKeterangan = 7;
  }

  // Pre-index existing santri by NIS (case-insensitive)
  const existingNisMap = new Map<string, { nama?: string; unit?: string }>();
  (existingSantriList || []).forEach((s) => {
    const rawNis = s?.nis || s?.kode_santri;
    if (rawNis) {
      const clean = String(rawNis).trim().toLowerCase();
      if (clean) existingNisMap.set(clean, { nama: s.nama, unit: s.unit });
    }
  });

  const seenNisInBatch = new Set<string>();
  const parsedRows: SantriImportRow[] = [];

  for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
    const row = rawJson[i];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    // Check if entire row is empty
    if (row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }

    const firstCell = String(row[0] || '').trim();
    if (firstCell.startsWith('#')) {
      // Ignore comment/instruction row
      continue;
    }

    const rawNis = colNis !== -1 && row[colNis] !== undefined ? String(row[colNis]).trim() : '';
    const rawNama = colNama !== -1 && row[colNama] !== undefined ? String(row[colNama]).trim() : '';
    const rawUnit = colUnit !== -1 && row[colUnit] !== undefined ? String(row[colUnit]).trim() : '';
    const rawKelas = colKelas !== -1 && row[colKelas] !== undefined ? String(row[colKelas]).trim() : '';
    const rawMusyrif = colMusyrif !== -1 && row[colMusyrif] !== undefined ? String(row[colMusyrif]).trim() : '';
    let rawAsrama = colAsrama !== -1 && row[colAsrama] !== undefined ? String(row[colAsrama]).trim() : '';
    let rawKamar = colKamar !== -1 && row[colKamar] !== undefined ? String(row[colKamar]).trim() : '';
    const rawStatus = colStatus !== -1 && row[colStatus] !== undefined ? String(row[colStatus]).trim() : '';
    const rawKeterangan = colKeterangan !== -1 && row[colKeterangan] !== undefined ? String(row[colKeterangan]).trim() : '';

    // If combined Asrama/Kamar column was provided
    if (colAsramaKamar !== -1 && row[colAsramaKamar] !== undefined) {
      const combined = String(row[colAsramaKamar]).trim();
      if (combined) {
        if (combined.includes('/')) {
          const parts = combined.split('/');
          rawAsrama = rawAsrama || parts[0]?.trim() || '';
          rawKamar = rawKamar || parts[1]?.trim() || '';
        } else {
          rawAsrama = rawAsrama || combined;
        }
      }
    }

    const rowNum = i + 1;

    // 1. Mandatory Validation: NIS
    if (!rawNis) {
      parsedRows.push({
        rowNumber: rowNum,
        nis: '(Kosong)',
        nama: rawNama || '-',
        unit: normalizeSantriUnit(rawUnit, selectedUnit),
        kelas: rawKelas || '-',
        musyrif: rawMusyrif || '-',
        asrama: rawAsrama,
        kamar: rawKamar,
        status: 'error',
        errorMessage: 'NIS / Kode Santri wajib diisi.'
      });
      continue;
    }

    // 2. Mandatory Validation: Nama
    if (!rawNama) {
      parsedRows.push({
        rowNumber: rowNum,
        nis: rawNis,
        nama: '(Kosong)',
        unit: normalizeSantriUnit(rawUnit, selectedUnit),
        kelas: rawKelas || '-',
        musyrif: rawMusyrif || '-',
        asrama: rawAsrama,
        kamar: rawKamar,
        status: 'error',
        errorMessage: 'Nama Santri wajib diisi.'
      });
      continue;
    }

    // 3. Mandatory Validation: Kelas
    if (!rawKelas) {
      parsedRows.push({
        rowNumber: rowNum,
        nis: rawNis,
        nama: rawNama.toUpperCase(),
        unit: normalizeSantriUnit(rawUnit, selectedUnit),
        kelas: '(Kosong)',
        musyrif: rawMusyrif || '-',
        asrama: rawAsrama,
        kamar: rawKamar,
        status: 'error',
        errorMessage: 'Kelas Santri wajib diisi.'
      });
      continue;
    }

    // Resolve Unit
    const resolvedUnit = normalizeSantriUnit(rawUnit, selectedUnit);

    // Enforce role-based unit access if non-superadmin
    if (!isSuperadmin && userUnit && resolvedUnit !== userUnit) {
      parsedRows.push({
        rowNumber: rowNum,
        nis: rawNis,
        nama: rawNama.toUpperCase(),
        unit: resolvedUnit,
        kelas: rawKelas,
        musyrif: rawMusyrif || '-',
        asrama: rawAsrama,
        kamar: rawKamar,
        status: 'error',
        errorMessage: `Unit ${resolvedUnit} di luar wewenang Anda (${userUnit}).`
      });
      continue;
    }

    // 4. Duplicate Check: Against DB and batch
    const nisKey = rawNis.toLowerCase();
    if (existingNisMap.has(nisKey)) {
      const existInfo = existingNisMap.get(nisKey);
      parsedRows.push({
        rowNumber: rowNum,
        nis: rawNis,
        nama: rawNama.toUpperCase(),
        unit: resolvedUnit,
        kelas: rawKelas,
        musyrif: rawMusyrif || '-',
        asrama: rawAsrama || `Asrama ${resolvedUnit}`,
        kamar: rawKamar || '-',
        keterangan: rawKeterangan,
        status: 'duplicate',
        errorMessage: `NIS sudah terdaftar (${existInfo?.nama || 'Santri'} - ${existInfo?.unit || resolvedUnit}).`
      });
      continue;
    }

    if (seenNisInBatch.has(nisKey)) {
      parsedRows.push({
        rowNumber: rowNum,
        nis: rawNis,
        nama: rawNama.toUpperCase(),
        unit: resolvedUnit,
        kelas: rawKelas,
        musyrif: rawMusyrif || '-',
        asrama: rawAsrama || `Asrama ${resolvedUnit}`,
        kamar: rawKamar || '-',
        keterangan: rawKeterangan,
        status: 'duplicate',
        errorMessage: 'NIS duplikat di dalam file Excel ini.'
      });
      continue;
    }

    seenNisInBatch.add(nisKey);

    // Resolve Musyrif name match if available
    let resolvedMusyNama: string | undefined = rawMusyrif;
    if (rawMusyrif && musyrifUsers.length > 0) {
      const cleanM = rawMusyrif.toLowerCase().replace(/ust\.|ustadz\.|s\.pd|lc|s\.pd\.i/g, '').trim();
      const matched = musyrifUsers.find((m) => {
        if (!m || !m.nama) return false;
        const mNama = m.nama.toLowerCase();
        return mNama.includes(cleanM) || cleanM.includes(mNama);
      });
      if (matched && matched.nama) {
        resolvedMusyNama = matched.nama;
      }
    }

    parsedRows.push({
      rowNumber: rowNum,
      nis: rawNis,
      nama: rawNama.toUpperCase(),
      unit: resolvedUnit,
      kelas: rawKelas,
      musyrif: rawMusyrif || undefined,
      resolvedMusyrifNama: resolvedMusyNama,
      asrama: rawAsrama || `Asrama ${resolvedUnit}`,
      kamar: rawKamar || undefined,
      keterangan: rawKeterangan || undefined,
      status: 'valid'
    });
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'duplicate').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;

  return { rows: parsedRows, validCount, duplicateCount, errorCount };
}

// ============================================================================
// SANTRI EXCEL HELPERS (PRESERVED)
// ============================================================================

/**
 * Generate and download template Excel for Santri Import
 */
export function generateSantriExcelTemplate(): void {
  const headers = [
    'Kode/NIS',
    'Nama Santri',
    'Unit',
    'Kelas',
    'Musyrif',
    'Asrama/Kamar',
    'Keterangan'
  ];

  const instructionRow = [
    '#CONTOH: 20261050',
    '#CONTOH: AHMAD FAUZI',
    '#PILIH: SMP / MA / SMA',
    '#CONTOH: 7A / 10.1 / X-A',
    '#NAMA MUSYRIF SESUAI UNIT',
    '#CONTOH: Asrama Abu Bakar / 01',
    '#OPSIONAL'
  ];

  const wsData = [headers, instructionRow];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 10 },
    { wch: 12 },
    { wch: 28 },
    { wch: 26 },
    { wch: 24 }
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Template Santri');

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Santri_SIMKA.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to format date into DD/MM/YYYY
 */
function formatViolationDateForExcel(dateStr?: string): string {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).trim();
  // If format is YYYY-MM-DD or starts with YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    const parts = cleanStr.slice(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  // If format is already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
    return cleanStr.slice(0, 10);
  }
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}/${mon}/${yr}`;
  }
  return cleanStr;
}

/**
 * Export Santri list to Excel (Restricted to Kasie)
 * Includes full violation history per santri in 'Riwayat Pelanggaran' column with Pelapor details.
 */
export function exportSantriToExcel(
  santriList: Array<{
    id?: string;
    nis: string;
    nama: string;
    unit: string;
    kelas: string;
    musyrifNama?: string;
    asrama?: string;
    kamar?: string;
    totalPoin: number;
    statusPembinaan?: string;
    keterangan?: string;
  }>,
  unitLabel: string,
  userRole?: UserRole,
  riwayatList?: RiwayatPelanggaran[]
): void {
  if (userRole && userRole !== 'KASIE_KEPESANTRENAN') {
    throw new Error('Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengekspor data santri.');
  }

  const headers = [
    'No',
    'Kode / NIS',
    'Nama Santri',
    'Unit',
    'Kelas',
    'Musyrif Pembina',
    'Gedung Asrama',
    'Kamar',
    'Total Poin',
    'Riwayat Pelanggaran',
    'Keterangan'
  ];

  const dataRows = santriList.map((s, index) => {
    // Collect and format violation history for this santri
    let riwayatText = 'Belum ada pelanggaran';
    if (riwayatList && riwayatList.length > 0) {
      const santriLogs = riwayatList.filter((r) => {
        if (s.id && r.santriId && r.santriId === s.id) return true;
        if (s.nama && r.santriNama && r.santriNama.trim().toLowerCase() === s.nama.trim().toLowerCase()) return true;
        return false;
      });

      if (santriLogs.length > 0) {
        // Sort newest to oldest
        const sortedLogs = [...santriLogs].sort((a, b) => {
          const timeA = new Date(a.tanggal).getTime() || 0;
          const timeB = new Date(b.tanggal).getTime() || 0;
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        });

        riwayatText = sortedLogs
          .map((r) => {
            const tgl = formatViolationDateForExcel(r.tanggal);
            const jenis = r.jenisPelanggaranNama || 'Pelanggaran';
            const poin = r.poin ?? 0;
            const pelapor = (r.pencatat && r.pencatat.trim()) ? r.pencatat.trim() : 'Petugas';
            return `${tgl} — ${jenis} — ${poin} poin — Pelapor: ${pelapor}`;
          })
          .join('\r\n');
      }
    }

    return [
      index + 1,
      s.nis || '-',
      s.nama || '-',
      s.unit || '-',
      s.kelas || '-',
      s.musyrifNama || '-',
      s.asrama || '-',
      s.kamar || '-',
      s.totalPoin ?? 0,
      riwayatText,
      s.keterangan || '-'
    ];
  });

  const wsData = [headers, ...dataRows];
  const ws = utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 16 },  // Kode / NIS
    { wch: 34 },  // Nama Santri
    { wch: 8 },   // Unit
    { wch: 10 },  // Kelas
    { wch: 28 },  // Musyrif Pembina
    { wch: 22 },  // Gedung Asrama
    { wch: 12 },  // Kamar
    { wch: 12 },  // Total Poin
    { wch: 70 },  // Riwayat Pelanggaran
    { wch: 26 }   // Keterangan
  ];

  const wb = utils.book_new();
  const safeSheetName = sanitizeSheetName(`Santri ${unitLabel}`, 'Data Santri');
  utils.book_append_sheet(wb, ws, safeSheetName);

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanLabel = (unitLabel || 'Semua').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Data_Santri_${cleanLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
