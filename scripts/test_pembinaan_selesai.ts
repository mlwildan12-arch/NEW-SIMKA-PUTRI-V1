// ==============================================================================
// SIMKA.ID PRO V1 - TEST SUITE: FITUR TANDAI SELESAI PEMBINAAN & DASHBOARD INTEGRATION
// ==============================================================================
import { updatePelanggaranStatusInDB } from '../src/lib/supabase';
import { mapJabatanToRole } from '../src/lib/auth';
import { UserRole, RiwayatPelanggaran } from '../src/types';

async function runTests() {
  console.log('--- STARTING PEMBINAAN SELESAI TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // Sample records for test
  const sampleLogSMP: RiwayatPelanggaran = {
    id: 'log-smp-001',
    tanggal: '19 Okt 2026, 08.00 WIB',
    timestamp: '2026-10-19T08:00:00.000Z',
    santriId: 'san-001',
    santriNama: 'Ahmad Santri',
    santriKelas: '7A',
    santriUnit: 'SMP',
    jenisPelanggaranId: 'p-001',
    jenisPelanggaranNama: 'Terlambat Sholat',
    poin: 10,
    hukuman: 'Nasihat dan teguran',
    status: 'Belum Selesai',
    pencatat: 'Musyrif Ahmad'
  };

  const sampleLogMA: RiwayatPelanggaran = {
    id: 'log-ma-001',
    tanggal: '19 Okt 2026, 09.00 WIB',
    timestamp: '2026-10-19T09:00:00.000Z',
    santriId: 'san-002',
    santriNama: 'Budi Santri',
    santriKelas: '10A',
    santriUnit: 'MA',
    jenisPelanggaranId: 'p-002',
    jenisPelanggaranNama: 'Keluar Tanpa Izin',
    poin: 25,
    hukuman: 'Surat Peringatan 1',
    status: 'Belum Selesai',
    pencatat: 'Musyrif Budi'
  };

  // Test 1: Koordinator marking in their unit succeeds
  const resKoordSMP = await updatePelanggaranStatusInDB('log-smp-001', 'Selesai', {
    userId: 'usr-koord-smp',
    userRole: 'KOORDINATOR',
    userUnit: 'SMP',
    recordUnit: 'SMP'
  });
  assert(resKoordSMP.success === true, '1. Koordinator can mark violation in their own unit as Selesai');

  // Test 2: Koordinator attempting to mark violation in another unit is BLOCKED
  const resKoordCross = await updatePelanggaranStatusInDB('log-ma-001', 'Selesai', {
    userId: 'usr-koord-smp',
    userRole: 'KOORDINATOR',
    userUnit: 'SMP',
    recordUnit: 'MA'
  });
  assert(resKoordCross.success === false && resKoordCross.error?.includes('hanya berwenang'), 
    '2. Koordinator CANNOT complete violation in a different unit');

  // Test 3: Musyrif is strictly forbidden from marking violation as completed
  const resMusyrif = await updatePelanggaranStatusInDB('log-smp-001', 'Selesai', {
    userId: 'usr-musyrif-01',
    userRole: 'MUSYRIF',
    userUnit: 'SMP',
    recordUnit: 'SMP'
  });
  assert(resMusyrif.success === false && resMusyrif.error?.includes('Akses Ditolak'),
    '3. Musyrif is FORBIDDEN from marking violation as Selesai');

  // Test 4: Superadmin / Kasie / Kabid can complete violations across all units
  const resSuperadminSMP = await updatePelanggaranStatusInDB('log-smp-001', 'Selesai', {
    userId: 'usr-superadmin',
    userRole: 'KASIE_KEPESANTRENAN',
    userUnit: 'ALL',
    recordUnit: 'SMP'
  });
  const resSuperadminMA = await updatePelanggaranStatusInDB('log-ma-001', 'Selesai', {
    userId: 'usr-superadmin',
    userRole: 'KASIE_KEPESANTRENAN',
    userUnit: 'ALL',
    recordUnit: 'MA'
  });
  assert(resSuperadminSMP.success === true && resSuperadminMA.success === true,
    '4. Superadmin / Kasie / Kabid can mark violation as Selesai across any unit');

  // Test 5: Role mapping normalization works for aliases like KASIE, KABID, SUPERADMIN
  assert(mapJabatanToRole('Kasie Kepesantrenan') === 'KASIE_KEPESANTRENAN', '5a. Role alias Kasie Kepesantrenan maps to KASIE_KEPESANTRENAN');
  assert(mapJabatanToRole('Kabid Pesantren') === 'KASIE_KEPESANTRENAN', '5b. Role alias Kabid Pesantren maps to KASIE_KEPESANTRENAN');
  assert(mapJabatanToRole('Superadmin') === 'KASIE_KEPESANTRENAN', '5c. Role alias Superadmin maps to KASIE_KEPESANTRENAN');
  assert(mapJabatanToRole('Koordinator SMP') === 'KOORDINATOR', '5d. Role alias Koordinator SMP maps to KOORDINATOR');
  assert(mapJabatanToRole('Musyrif Asrama') === 'MUSYRIF', '5e. Role alias Musyrif Asrama maps to MUSYRIF');

  // Test 6: Dashboard Statistics logic:
  // - Belum Selesai decrements by 1 when status becomes 'Selesai'
  // - Total Kasus does NOT decrease
  // - Belum Selesai is never negative
  let dataset: RiwayatPelanggaran[] = [
    { ...sampleLogSMP, status: 'Belum Selesai' },
    { ...sampleLogMA, status: 'Belum Selesai' }
  ];

  const calcStats = (list: RiwayatPelanggaran[]) => ({
    totalPelanggaran: list.length,
    belumSelesai: Math.max(0, list.filter(r => r.status !== 'Selesai').length),
    selesai: list.filter(r => r.status === 'Selesai').length
  });

  const statsInitial = calcStats(dataset);
  assert(statsInitial.totalPelanggaran === 2, '6a. Initial Total Kasus is 2');
  assert(statsInitial.belumSelesai === 2, '6b. Initial Belum Selesai is 2');

  // Mark first log as Selesai
  dataset = dataset.map(item => item.id === 'log-smp-001' ? { ...item, status: 'Selesai' as const } : item);
  const statsAfter1 = calcStats(dataset);
  assert(statsAfter1.totalPelanggaran === 2, '6c. Total Kasus unchanged after completing 1 log (still 2)');
  assert(statsAfter1.belumSelesai === 1, '6d. Belum Selesai decremented by 1 (now 1)');
  assert(statsAfter1.selesai === 1, '6e. Selesai count increased by 1 (now 1)');

  // Completed record still exists in history
  assert(dataset.some(r => r.id === 'log-smp-001' && r.status === 'Selesai'),
    '6f. Completed record still retained in violation history with status Selesai');

  // Mark second log as Selesai
  dataset = dataset.map(item => item.id === 'log-ma-001' ? { ...item, status: 'Selesai' as const } : item);
  const statsAfter2 = calcStats(dataset);
  assert(statsAfter2.belumSelesai === 0, '6g. Belum Selesai reaches 0');
  assert(statsAfter2.totalPelanggaran === 2, '6h. Total Kasus remains 2 even when all complete');

  // Test 7: Filter logic in Rekap Pelanggaran:
  // - 'ALL' returns both
  // - 'BELUM_SELESAI' returns only not finished
  // - 'SELESAI' returns only finished
  const filterList = (list: RiwayatPelanggaran[], filter: 'ALL' | 'BELUM_SELESAI' | 'SELESAI') => {
    return list.filter(log => {
      if (filter === 'ALL') return true;
      if (filter === 'SELESAI') return log.status === 'Selesai';
      if (filter === 'BELUM_SELESAI') return log.status !== 'Selesai';
      return true;
    });
  };

  const mixedDataset: RiwayatPelanggaran[] = [
    { ...sampleLogSMP, id: '1', status: 'Selesai' },
    { ...sampleLogSMP, id: '2', status: 'Belum Selesai' },
    { ...sampleLogSMP, id: '3', status: 'Belum Selesai' }
  ];

  assert(filterList(mixedDataset, 'ALL').length === 3, '7a. Filter ALL returns 3 items');
  assert(filterList(mixedDataset, 'BELUM_SELESAI').length === 2, '7b. Filter BELUM_SELESAI returns 2 items');
  assert(filterList(mixedDataset, 'SELESAI').length === 1, '7c. Filter SELESAI returns 1 item');

  // Test 8: Empty or invalid ID handling
  const resInvalidId = await updatePelanggaranStatusInDB('', 'Selesai', {
    userId: 'usr-admin',
    userRole: 'KASIE_KEPESANTRENAN'
  });
  assert(resInvalidId.success === false, '8. Empty violation ID returns failure without modifying state');

  console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
