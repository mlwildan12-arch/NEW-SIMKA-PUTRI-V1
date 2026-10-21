import { Santri, Pelanggaran } from '../types';

/**
 * Natural numeric comparison for class names (e.g. 7A < 7B < 8A < 10.1 < 10.2 < 10.10 < 11.1 < 12.1 < X-A < XI-IPA)
 */
export function compareKelas(kelasA: string, kelasB: string): number {
  const cleanA = (kelasA || '').trim();
  const cleanB = (kelasB || '').trim();
  return cleanA.localeCompare(cleanB, undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

/**
 * Smart Natural Sorting for Data Santri:
 * 1. Unit (SMP -> MA -> SMA)
 * 2. Kelas (Natural numeric sorting: 7A < 7B < 8A < 10.1 < 10.2 < 10.10)
 * 3. Absen / Nama (Fallback A -> Z)
 * 4. NIS / Kode Santri
 */
export function sortSantriList(list: Santri[]): Santri[] {
  const unitOrder: Record<string, number> = { SMP: 1, MA: 2, SMA: 3 };

  return [...list].sort((a, b) => {
    // 1. Unit
    const unitA = unitOrder[a.unit] || 99;
    const unitB = unitOrder[b.unit] || 99;
    if (unitA !== unitB) return unitA - unitB;

    // 2. Kelas (natural numeric sort)
    const classComp = compareKelas(a.kelas, b.kelas);
    if (classComp !== 0) return classComp;

    // 3. Fallback: Nama A -> Z (or Absen order if name is sorted)
    const nameComp = (a.nama || '').trim().localeCompare((b.nama || '').trim(), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
    if (nameComp !== 0) return nameComp;

    // 4. NIS / Kode
    return (a.nis || '').trim().localeCompare((b.nis || '').trim(), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
}

/**
 * Consistent Auto-Sorting for Master Pelanggaran:
 * 1. BOBOT POIN ASC (terkecil -> terbesar: +5, +10, +20, +50, +100)
 * 2. NAMA / ITEM PELANGGARAN ASC (A -> Z)
 * 3. KODE ASC (A -> Z)
 */
export function sortMasterPelanggaranList(list: Pelanggaran[]): Pelanggaran[] {
  return [...list].sort((a, b) => {
    // 1. Point ASC
    const pointA = Number(a.poin) || 0;
    const pointB = Number(b.poin) || 0;
    if (pointA !== pointB) {
      return pointA - pointB;
    }

    // 2. Item Pelanggaran (jenis / nama) ASC (A -> Z)
    const jenisComp = (a.jenis || '').trim().localeCompare((b.jenis || '').trim(), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
    if (jenisComp !== 0) return jenisComp;

    // 3. Kode ASC (A -> Z)
    return (a.kode || '').trim().localeCompare((b.kode || '').trim(), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
}

/**
 * Sort Santri for Ringkasan Poin / Leaderboard:
 * 1. Total Poin DESC (tertinggi -> terendah)
 * 2. Jika poin sama: Nama Santri ASC (A -> Z)
 */
export function sortSantriByPoints(list: Santri[]): Santri[] {
  return [...list].sort((a, b) => {
    const poinA = Number(a.totalPoin) || 0;
    const poinB = Number(b.totalPoin) || 0;
    if (poinB !== poinA) {
      return poinB - poinA;
    }
    return (a.nama || '').trim().localeCompare((b.nama || '').trim(), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
}
