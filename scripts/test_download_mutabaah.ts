// ==============================================================================
// SIMKA.ID PRO V1 - TEST: DOWNLOAD MUTABAAH READ-ONLY INTEGRITY & ZERO SIDE-EFFECTS
// ==============================================================================
import { getSupabaseClient, fetchPelanggaranFromDB, fetchSantriFromDB, findPembinaanBySinglePoin } from '../src/lib/supabase';
import { generatePembinaanFormData } from '../src/lib/pembinaanHelper';
import { initialMasterPembinaanList } from '../src/data/mockData';
import { exportMutabaahPembinaanPDF } from '../src/lib/exportPembinaanPdf';
import { RiwayatPelanggaran, Pelanggaran, Santri } from '../src/types';

async function runTest() {
  console.log('--- STARTING DOWNLOAD MUTABAAH BUG FIX VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available!');
    process.exit(1);
  }

  // 1. Fetch current database snapshot before test
  const { data: initialDbRows, error: initialErr } = await supabase
    .from('pelanggaran')
    .select('*')
    .order('created_at', { ascending: false });

  if (initialErr || !initialDbRows || initialDbRows.length === 0) {
    console.error('Failed to query initial pelanggaran rows from Supabase:', initialErr);
    process.exit(1);
  }

  const initialCount = initialDbRows.length;
  console.log(`Initial pelanggaran table record count: ${initialCount}`);

  // Pick target record
  const targetRow = initialDbRows[0];
  console.log('Target row selected for download test:', {
    id: targetRow.id,
    santri_id: targetRow.santri_id,
    poin: targetRow.poin,
    tanggal_waktu: targetRow.tanggal_waktu,
    status: targetRow.status
  });

  // Fetch santri and pelanggaran list
  const allLogs = await fetchPelanggaranFromDB();
  const allSantri = await fetchSantriFromDB();

  const targetLog: RiwayatPelanggaran | undefined = allLogs?.find((l) => l.id === targetRow.id);
  assert(Boolean(targetLog), '1. Successfully resolved RiwayatPelanggaran from database');

  if (!targetLog) process.exit(1);

  // Compute santri total points before download
  const santriLogs = (allLogs || []).filter((l) => l.santriId === targetLog.santriId);
  const calculatedTotalPoin = santriLogs.reduce((sum, item) => sum + (Number(item.poin) || 0), 0);

  const matchedSantri: Santri = allSantri?.find((s) => s.id === targetLog.santriId) || {
    id: targetLog.santriId,
    nis: 'S174',
    nama: targetLog.santriNama,
    kelas: targetLog.santriKelas,
    unit: targetLog.santriUnit,
    asrama: 'MADINA 10',
    musyrif: 'Ustzh. Maria Ulfa',
    totalPoin: calculatedTotalPoin,
    statusPembinaan: 'SP 1'
  };

  matchedSantri.totalPoin = calculatedTotalPoin;

  console.log(`Santri: ${matchedSantri.nama}, Total Points in system before download: ${matchedSantri.totalPoin}`);
  console.log(`Case points: ${targetLog.poin}`);

  // Resolve pembinaan level
  const pembinaan = findPembinaanBySinglePoin(targetLog.poin, initialMasterPembinaanList);
  assert(Boolean(pembinaan), `2. Found valid pembinaan level (${pembinaan?.nama_tingkat}) for ${targetLog.poin} points`);

  if (!pembinaan) process.exit(1);

  const targetPelanggaran: Pelanggaran = {
    id: targetLog.jenisPelanggaranId,
    kode: 'P212',
    jenis: targetLog.jenisPelanggaranNama,
    kategori: 'Sedang',
    poin: targetLog.poin,
    konsekuensi: targetLog.hukuman
  };

  // 2. Generate form data with fixed isNewRecord: false
  const formData = generatePembinaanFormData({
    santri: matchedSantri,
    pelanggaran: targetPelanggaran,
    pembinaan,
    user: null,
    startDate: targetLog.timestamp || targetLog.tanggal,
    tanggalPelanggaran: targetLog.tanggal,
    kasusId: targetLog.id,
    isNewRecord: false
  });

  // Test assertions on formData:
  assert(formData.pelanggaran.poin === targetLog.poin,
    `3. Case points on document (${formData.pelanggaran.poin}) strictly equals case points (${targetLog.poin})`);

  assert(formData.santri.totalPoin === calculatedTotalPoin,
    `4. Student total points on document (${formData.santri.totalPoin}) strictly equals actual accumulated points (${calculatedTotalPoin}), NOT inflated (${calculatedTotalPoin + targetLog.poin})`);

  assert(formData.pelanggaran.tanggal === targetLog.tanggal,
    `5. Violation date on document (${formData.pelanggaran.tanggal}) matches original violation date (${targetLog.tanggal}), not today's date`);

  assert(formData.kasus?.id === targetLog.id,
    `6. Case ID on document correctly binds to selected record ID (${targetLog.id})`);

  // 3. Test PDF generation (mocking doc.save to avoid browser window prompt in node)
  try {
    exportMutabaahPembinaanPDF(formData);
    assert(true, '7. exportMutabaahPembinaanPDF generated vector PDF without crashing');
  } catch (err: any) {
    assert(false, `7. exportMutabaahPembinaanPDF error: ${err?.message}`);
  }

  // 4. Verify Supabase Database State After Download
  const { data: afterDbRows, error: afterErr } = await supabase
    .from('pelanggaran')
    .select('*')
    .order('created_at', { ascending: false });

  assert(!afterErr, '8. Queried database successfully after download');
  assert(afterDbRows?.length === initialCount,
    `9. ZERO new rows inserted in database (count before: ${initialCount}, count after: ${afterDbRows?.length})`);

  const afterTargetRow = afterDbRows?.find((r) => r.id === targetRow.id);
  assert(Boolean(afterTargetRow), '10. Target record still exists in Supabase');

  assert(afterTargetRow?.poin === targetRow.poin,
    `11. Target record points in DB untouched (expected: ${targetRow.poin}, actual: ${afterTargetRow?.poin})`);

  assert(afterTargetRow?.tanggal_waktu === targetRow.tanggal_waktu,
    `12. Target record tanggal_waktu in DB untouched (expected: ${targetRow.tanggal_waktu}, actual: ${afterTargetRow?.tanggal_waktu})`);

  assert(afterTargetRow?.status === targetRow.status,
    `13. Target record status in DB untouched (expected: ${targetRow.status}, actual: ${afterTargetRow?.status})`);

  assert(afterTargetRow?.created_at === targetRow.created_at,
    `14. Target record created_at in DB untouched`);

  // 5. Test repeated download (idempotency check)
  const formDataRepeat = generatePembinaanFormData({
    santri: matchedSantri,
    pelanggaran: targetPelanggaran,
    pembinaan,
    user: null,
    startDate: targetLog.timestamp || targetLog.tanggal,
    tanggalPelanggaran: targetLog.tanggal,
    kasusId: targetLog.id,
    isNewRecord: false
  });

  assert(formDataRepeat.santri.totalPoin === calculatedTotalPoin,
    '15. Repeated download preserves exact points without point accretion or multiplication');

  console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
