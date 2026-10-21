import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RiwayatPelanggaran } from '../types';

export interface ExportPdfOptions {
  unitFilter?: string;
  statusFilter?: string;
  searchQuery?: string;
  userRole?: string;
  userName?: string;
}

/**
 * Format category based on official point ranges:
 * - Ringan: 5–49 poin (biru)
 * - Sedang: 50–79 poin (kuning / oranye)
 * - Berat: 80–94 poin (merah)
 * - Sangat Berat: 95–100+ poin (merah tua)
 */
export function getOfficialKategori(poin: number): {
  label: 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat';
  textColor: [number, number, number];
  bgColor: [number, number, number];
} {
  const p = Number(poin) || 0;
  if (p >= 95) {
    return { label: 'Sangat Berat', textColor: [159, 18, 57], bgColor: [255, 228, 230] }; // Rose/Merah Tua (95-100+)
  }
  if (p >= 80) {
    return { label: 'Berat', textColor: [185, 28, 28], bgColor: [254, 226, 226] }; // Red/Merah (80-94)
  }
  if (p >= 50) {
    return { label: 'Sedang', textColor: [180, 83, 9], bgColor: [254, 243, 199] }; // Amber/Oranye-Kuning (50-79)
  }
  return { label: 'Ringan', textColor: [29, 78, 216], bgColor: [239, 246, 255] }; // Blue/Biru (5-49)
}

/**
 * Export filtered riwayat pelanggaran to high quality, publication-ready A4 PDF
 * Adheres strictly to adaptive layout, automatic row height, and zero text collision.
 */
export function exportRiwayatPelanggaranPDF(
  records: RiwayatPelanggaran[],
  options: ExportPdfOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const now = new Date();
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const formattedDate = `${now.getDate()} ${monthsIndo[now.getMonth()]} ${now.getFullYear()}, ${String(
    now.getHours()
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  const currentPeriod = `${monthsIndo[now.getMonth()]} ${now.getFullYear()}`;

  const unitLabel = options.unitFilter && options.unitFilter !== 'ALL' && options.unitFilter !== 'Semua'
    ? `Unit ${options.unitFilter}`
    : 'Semua Unit';

  const statusLabel = options.statusFilter && options.statusFilter !== 'All' && options.statusFilter !== 'Semua'
    ? options.statusFilter
    : 'Semua Status';

  // Compute summary statistics
  const totalRecords = records.length;
  const uniqueSantri = new Set(records.map((r) => r.santriId || r.santriNama)).size;
  const totalPoints = records.reduce((sum, r) => sum + (r.poin || 0), 0);
  const totalSelesai = records.filter((r) => r.status === 'Selesai').length;
  const totalBelumSelesai = records.filter((r) => r.status !== 'Selesai').length;

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // ============================================================
  // 1. PAGE HEADER (Clean, Professional, Tanpa Garis Hijau Tebal di Atas)
  // ============================================================
  let currentY = 14;

  // Title Utama (18-20 pt)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('REKAP RIWAYAT PELANGGARAN SANTRI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.2;

  // Subtitle Instansi (11-12 pt)
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text('PESANTREN NURUL ISLAM TENGARAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.2;

  // Tagline SIMKA.ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('SIMKA.ID — Sistem Monitoring Karakter & Akhlak Santri', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.8;

  // Garis Pembatas Tipis & Elegan
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.35);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4.5;

  // ============================================================
  // 2. METADATA & FILTER BAR (Compact 2-Column Box)
  // ============================================================
  const metaBoxHeight = 12.5;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(marginX, currentY, contentWidth, metaBoxHeight, 1.2, 1.2, 'FD');

  const halfWidth = contentWidth / 2;
  const col1X = marginX + 3.5;
  const col2X = marginX + halfWidth + 3.5;

  doc.setFontSize(8);

  // Kolom Kiri
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Periode:', col1X, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(currentPeriod, col1X + 18, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Unit:', col1X, currentY + 9.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(unitLabel, col1X + 18, currentY + 9.2);

  // Kolom Kanan
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Status:', col2X, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(statusLabel, col2X + 22, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tanggal Cetak:', col2X, currentY + 9.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDate, col2X + 22, currentY + 9.2);

  currentY += metaBoxHeight + 3.5;

  // ============================================================
  // 3. SUMMARY STATS CARDS (4 Kolom Proporsional, Tinggi Sama)
  // ============================================================
  const cardGap = 2.5;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 11.5;

  const statCards = [
    { label: 'TOTAL PELANGGARAN', value: `${totalRecords} Data`, color: [15, 76, 58] as [number, number, number] },
    { label: 'SANTRI TERLIBAT', value: `${uniqueSantri} Santri`, color: [2, 132, 199] as [number, number, number] },
    { label: 'TOTAL POIN', value: `${totalPoints} Poin`, color: [225, 29, 72] as [number, number, number] },
    { label: 'STATUS TINDAK LANJUT', value: `${totalSelesai} Selesai • ${totalBelumSelesai} Aktif`, color: [79, 70, 229] as [number, number, number] }
  ];

  statCards.forEach((card, idx) => {
    const x = marginX + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.2, 1.2, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + 2.5, currentY + 4);

    // Value
    doc.setFontSize(8);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + 2.5, currentY + 8.8);
  });

  currentY += cardHeight + 4;

  // Catatan filter pencarian jika aktif
  if (options.searchQuery && options.searchQuery.trim()) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`* Filter pencarian aktif: "${options.searchQuery}" (${totalRecords} data ditemukan)`, marginX, currentY);
    currentY += 3.2;
  }

  // ============================================================
  // 4. TABEL REKAP RIWAYAT (ADAPTIVE WRAPPING & AUTO ROW HEIGHT)
  // ============================================================
  const tableData = records.map((log, index) => {
    const kat = getOfficialKategori(log.poin);
    const cleanKelasUnit = (log.santriKelas && log.santriKelas !== '-')
      ? `${log.santriKelas} (${log.santriUnit || 'SMP'})`
      : `Unit ${log.santriUnit || 'SMP'}`;
    const cleanSantriNama = (log.santriNama && log.santriNama.toLowerCase() !== 'santri' && log.santriNama !== '-')
      ? log.santriNama
      : (log.santriId ? `[Santri: ${log.santriId}]` : '[Santri Tidak Terdaftar]');
    const cleanJenis = (log.jenisPelanggaranNama && !log.jenisPelanggaranNama.toLowerCase().includes('tata tertib') && log.jenisPelanggaranNama !== '-')
      ? log.jenisPelanggaranNama
      : (log.jenisPelanggaranId ? `[Pelanggaran: ${log.jenisPelanggaranId}]` : '[Pelanggaran Tidak Terdaftar]');

    return [
      String(index + 1),
      log.tanggal || '-',
      cleanSantriNama,
      cleanKelasUnit,
      cleanJenis,
      `+${log.poin}`,
      kat.label,
      log.pencatat || 'Petugas',
      log.status === 'Selesai' ? 'Selesai' : 'Belum Selesai'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Tanggal', 'Nama Santri', 'Kelas / Unit', 'Jenis Pelanggaran', 'Poin', 'Kategori', 'Pelapor', 'Status']],
    body: tableData,
    theme: 'grid',
    margin: { left: marginX, right: marginX, top: 16, bottom: 16 },
    showHead: 'everyPage',
    pageBreak: 'auto',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800 (Clean, Dark, Professional)
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
      lineWidth: 0.15,
      lineColor: [203, 213, 225]
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
      valign: 'middle',
      overflow: 'linebreak',
      lineWidth: 0.12,
      lineColor: [226, 232, 240]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },                          // No
      1: { halign: 'center', cellWidth: 18, fontSize: 6.8 },           // Tanggal
      2: { fontStyle: 'bold', cellWidth: 26, overflow: 'linebreak' }, // Nama Santri (Wrap dynamic)
      3: { halign: 'center', cellWidth: 16, fontSize: 6.8 },           // Kelas / Unit
      4: { cellWidth: 'auto', overflow: 'linebreak', fontSize: 7.0 },  // Jenis Pelanggaran (Auto widest, wrap)
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 11 },       // Poin
      6: { halign: 'center', cellWidth: 16, fontSize: 6.8 },           // Kategori
      7: { cellWidth: 20, overflow: 'linebreak', fontSize: 6.8 },      // Pelapor
      8: { halign: 'center', cellWidth: 16, fontSize: 6.8 }            // Status
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rawRow = records[data.row.index];
        if (!rawRow) return;

        // Poin Column (Index 5)
        if (data.column.index === 5) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose 600
        }

        // Kategori Column (Index 6)
        if (data.column.index === 6) {
          const kat = getOfficialKategori(rawRow.poin);
          data.cell.styles.textColor = kat.textColor;
          data.cell.styles.fontStyle = 'bold';
        }

        // Status Column (Index 8)
        if (data.column.index === 8) {
          if (rawRow.status === 'Selesai') {
            data.cell.styles.textColor = [4, 120, 87]; // Emerald 700
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [185, 28, 28]; // Red 700
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    didDrawPage: (data) => {
      const pageNumber = data.pageNumber;
      const totalPageCount = (doc.internal as any).getNumberOfPages();

      // Top running title on pages 2+
      if (pageNumber > 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text('Rekap Riwayat Pelanggaran Santri — Pesantren Nurul Islam Tengaran', marginX, 10);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(marginX, 11.5, pageWidth - marginX, 11.5);
      }

      // Bottom Running Footer on every page
      const footerY = pageHeight - 9;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginX, footerY - 2, pageWidth - marginX, footerY - 2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139); // Slate 500

      // Left footer
      doc.text('SIMKA.ID — Sistem Monitoring Karakter & Akhlak Santri', marginX, footerY);

      // Center footer
      doc.text(`Dicetak: ${formattedDate}`, pageWidth / 2, footerY, { align: 'center' });

      // Right footer
      doc.text(`Halaman ${pageNumber} dari ${totalPageCount}`, pageWidth - marginX, footerY, { align: 'right' });
    }
  });

  // Save/Download PDF
  const cleanUnitName = (options.unitFilter || 'SEMUA').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStamp = now.toISOString().slice(0, 10);
  doc.save(`Rekap_Pelanggaran_Santri_${cleanUnitName}_${dateStamp}.pdf`);
}
