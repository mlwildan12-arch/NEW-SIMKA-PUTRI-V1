import React from 'react';
import { PelanggaranKategori } from '../../types';

interface PointBadgeProps {
  points: number;
  showSuffix?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PointBadge: React.FC<PointBadgeProps> = ({ points, showSuffix = true, size = 'md' }) => {
  let badgeStyle = '';
  let dotColor = '';

  if (points === 0) {
    badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (points < 50) {
    badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else {
    badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-400';
  }

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border tracking-wide whitespace-nowrap ${badgeStyle} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {points} {showSuffix ? (points > 1 ? 'Poin' : 'Poin') : ''}
    </span>
  );
};

export type KategoriPelanggaranType = PelanggaranKategori;

/**
 * Aturan Kategori Otomatis Berdasarkan Poin Resmi SIMKA.ID Pro V1:
 * - Ringan: 5–49 poin (biru)
 * - Sedang: 50–79 poin (kuning/oranye)
 * - Berat: 80–94 poin (merah)
 * - Sangat Berat: 95–100+ poin (merah tua / penekanan visual kuat)
 */
export function getKategoriFromPoin(poin: number): {
  kategori: 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat';
  colorName: string;
  badgeClass: string;
  dotColor: string;
} {
  const p = Number(poin) || 0;

  // Sangat Berat: 95–100+ (merah tua dengan penekanan visual kuat)
  if (p >= 95) {
    return {
      kategori: 'Sangat Berat',
      colorName: 'merah tua',
      badgeClass: 'bg-rose-950/80 text-rose-200 border-rose-500 ring-1 ring-rose-500/50 shadow-xs shadow-rose-950/50',
      dotColor: 'bg-rose-400 animate-pulse'
    };
  }

  // Berat: 80–94 (merah)
  if (p >= 80) {
    return {
      kategori: 'Berat',
      colorName: 'merah',
      badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700/50',
      dotColor: 'bg-red-500'
    };
  }

  // Sedang: 50–79 (kuning / oranye)
  if (p >= 50) {
    return {
      kategori: 'Sedang',
      colorName: 'oranye',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600/50',
      dotColor: 'bg-amber-500'
    };
  }

  // Ringan: 5–49 (biru)
  return {
    kategori: 'Ringan',
    colorName: 'biru',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600/50',
    dotColor: 'bg-blue-500'
  };
}

export const KategoriPelanggaranBadge: React.FC<{
  kategori?: string;
  poin?: number;
  size?: 'sm' | 'md';
}> = ({ kategori, poin, size = 'md' }) => {
  // Always derive strictly from numeric points if provided; otherwise map known category labels
  const resolved = poin !== undefined
    ? getKategoriFromPoin(poin)
    : kategori === 'Sangat Berat'
    ? getKategoriFromPoin(95)
    : kategori === 'Berat'
    ? getKategoriFromPoin(80)
    : kategori === 'Sedang'
    ? getKategoriFromPoin(50)
    : getKategoriFromPoin(5);

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border whitespace-nowrap transition-colors ${resolved.badgeClass} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${resolved.dotColor}`} />
      {resolved.kategori}
    </span>
  );
};
