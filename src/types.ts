export type UserRole = 'MUSYRIF' | 'KOORDINATOR' | 'KASIE_KEPESANTRENAN';
export type UnitPesantren = 'SMP' | 'MA' | 'SMA';
export type UnitFilter = 'ALL' | 'SMP' | 'MA' | 'SMA';

export interface UserAccount {
  id: string;
  nama: string;
  username: string;
  role: UserRole;
  unit: 'ALL' | UnitPesantren;
  is_active: boolean;
  email?: string;
  title?: string;
  password_hash?: string; // only stored locally or in DB, never exposed in public profile
  created_at?: string;
  updated_at?: string;
}

export interface Santri {
  id: string;
  nis: string; // alias kode_santri
  nama: string;
  kelas: string; // e.g. "7A", "8B", "10.1", "11.1", "12.3"
  unit: UnitPesantren;  // 'SMP' | 'MA' | 'SMA'
  totalPoin: number;
  musyrifId?: string;
  musyrifNama?: string;
  musyrif?: string;
  asrama?: string;
  keterangan?: string;
  kamar?: string;
  statusPembinaan?: string;
}

export type PelanggaranKategori = 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat' | 'Sangat Ringan';

export interface Pelanggaran {
  id: string;
  kode: string;
  jenis: string;
  kategori: PelanggaranKategori;
  poin: number;
  konsekuensi: string;
}

export interface MasterPembinaan {
  id: string;
  tingkat: number;
  nama_tingkat: string;
  min_poin: number;
  max_poin: number;
  jenis_pembinaan: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  minPoin?: number;
  maxPoin?: number;
  konsekuensi?: string;
  kategori?: string;
  rentangPoin?: string;
  pembina?: string;
}

export interface RiwayatPelanggaran {
  id: string;
  tanggal: string; // e.g. "25 Agu 2026, 16.38 WIB"
  timestamp: string; // ISO date for sorting
  santriId: string;
  santriNama: string;
  santriKelas: string;
  santriUnit: UnitPesantren;
  jenisPelanggaranId: string;
  jenisPelanggaranNama: string;
  poin: number;
  hukuman: string;
  pembinaanTingkat?: string;
  rekomendasiPembinaan?: string[];
  status: 'Selesai' | 'Belum Selesai';
  catatan?: string;
  pencatat: string;
  pencatatId?: string;
}

export interface PembinaanRecord {
  id: string;
  santriId: string;
  santriNama: string;
  santriKelas: string;
  santriUnit: UnitPesantren;
  pelanggaranTerkaitId?: string;
  pelanggaranTerkaitJenis?: string;
  jenisPembinaan: string; // 'Teguran/Nasihat' | 'Peringatan' | 'Tugas pembinaan' | 'Hafalan' | 'Kebersihan' | 'Konseling' | 'Surat Pernyataan' | 'Pemanggilan orang tua/wali' | 'Pembinaan khusus'
  tanggal: string;
  tanggalTargetSelesai?: string;
  pembina: string;
  pembinaId?: string;
  catatan: string;
  status: 'BELUM DIMULAI' | 'PROSES' | 'SELESAI';
  tanggalSelesai?: string;
  created_at: string;
}

export type ThemeMode = 'light' | 'dark';

export type PageRoute = 
  | 'login'
  | 'dashboard'
  | 'data-santri'
  | 'catat-pelanggaran'
  | 'rekap-pelanggaran'
  | 'data-pelanggaran'
  | 'kamus-pelanggaran'
  | 'input-mutabaah'
  | 'data-pembinaan'
  | 'riwayat-pembinaan'
  | 'laporan-pembinaan'
  | 'manajemen-user'
  | 'akun';

export interface ActivityItem {
  id: string;
  rawId: string;
  title: string;
  desc: string;
  timestamp: string;
  timeFormatted: string;
  type: 'pelanggaran' | 'pembinaan' | 'santri' | 'user';
  unit: UnitPesantren;
  santriId?: string;
  santriNama?: string;
  santriKelas?: string;
  poin?: number;
  hukuman?: string;
  status: 'Selesai' | 'Belum Selesai';
  pencatat?: string;
}

export interface UserProfile extends UserAccount {
  // Backwards compatibility alias for components
}


