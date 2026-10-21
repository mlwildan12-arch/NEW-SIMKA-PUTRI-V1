import jsPDFPackage from 'jspdf';
const jsPDF = (jsPDFPackage as any).jsPDF || jsPDFPackage;
import autoTable from 'jspdf-autotable';
import { PembinaanFormData } from './pembinaanHelper';
import { getAdaptiveWrappedText, fitSingleLineFontSize } from './pdfAdaptiveHelpers';

/**
 * Generate and download pure vector, publication-grade A4 Portrait PDF for MUTABA'AH PEMBINAAN SANTRI
 * Adheres strictly to adaptive layout principles:
 * - Dynamic font scaling and multi-line wrapping
 * - Exact height calculations to prevent collisions
 * - Independent 4-column signature grid with generous physical signing area
 * - Zero overlap, zero clipping, zero unhandled overflow
 */
export function exportMutabaahPembinaanPDF(data: PembinaanFormData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const { header, santri, pelanggaran, pembinaan, mutabaahRows, officers } = data;
  const codes = pembinaan.itemsWithCode;

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  let currentY = 13;

  // ============================================================
  // 1. KOP SURAT & DOKUMEN RESMI (Bersih, Formal, Tanpa Garis Tebal Berlebih)
  // ============================================================
  // Judul Dokumen Utama
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(header.title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.8;

  // Subjudul Lembaga
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text(header.institution.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.8;

  // SIMKA.ID Tagline
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SIMKA.ID — Sistem Monitoring Karakter & Akhlak Santri', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.2;

  // Garis Pembatas Kop Surat Resmi (Double Line)
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.55);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  doc.setLineWidth(0.18);
  doc.line(marginX, currentY + 0.7, pageWidth - marginX, currentY + 0.7);
  currentY += 3.5;

  // ============================================================
  // 2. LEVEL & DURASI BAR (Adaptif dalam Satu Baris)
  // ============================================================
  const levelBarHeight = 6.5;
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, levelBarHeight, 1, 1, 'FD');

  doc.setFont('times', 'bold');
  const levelFontSize = fitSingleLineFontSize(
    doc,
    `LEVEL: ${header.levelName}   POIN: ${header.rangePoin} (${pelanggaran.poin} Poin)   DURASI: ${header.durasiText}`,
    contentWidth - 6,
    8.2,
    7.0,
    'times',
    'bold'
  );
  doc.setFontSize(levelFontSize);
  doc.setTextColor(15, 23, 42);

  doc.text(`LEVEL: ${header.levelName}`, marginX + 3, currentY + 4.3);
  doc.text(`POIN PELANGGARAN: ${header.rangePoin} (${pelanggaran.poin} Poin)`, marginX + (contentWidth * 0.36), currentY + 4.3);
  doc.text(`DURASI: ${header.durasiText}`, pageWidth - marginX - 3, currentY + 4.3, { align: 'right' });

  currentY += levelBarHeight + 2.5;

  // ============================================================
  // 3. IDENTITAS SANTRI & DETAIL PELANGGARAN (2-KOLOM DINAMIS)
  // ============================================================
  const colHalf = (contentWidth - 4) / 2;
  const leftColX = marginX + 3;
  const rightColX = marginX + colHalf + 5;
  const labelWidthLeft = 28;
  const labelWidthRight = 30;
  const maxValWidthLeft = colHalf - labelWidthLeft - 4;
  const maxValWidthRight = colHalf - labelWidthRight - 4;

  // Adaptive wrapping untuk teks dinamis
  const namaAdaptive = getAdaptiveWrappedText(doc, santri.nama.toUpperCase(), maxValWidthLeft, {
    initialFontSize: 8.5,
    minFontSize: 7.2,
    fontName: 'times',
    fontStyle: 'bold',
    lineHeightFactor: 1.25,
    maxLines: 3
  });

  const jenisAdaptive = getAdaptiveWrappedText(doc, pelanggaran.jenis, maxValWidthRight, {
    initialFontSize: 8.5,
    minFontSize: 7.0,
    fontName: 'times',
    fontStyle: 'normal',
    lineHeightFactor: 1.25,
    maxLines: 4
  });

  const musyrifAdaptive = getAdaptiveWrappedText(doc, officers.musyrifNama, maxValWidthRight, {
    initialFontSize: 8.5,
    minFontSize: 7.2,
    fontName: 'times',
    fontStyle: 'normal',
    lineHeightFactor: 1.25,
    maxLines: 2
  });

  const kelasInfo = `${santri.kelas} (${santri.unit}) / ${santri.kamar || santri.asrama || '-'}`;
  const tglPelanggaran = pelanggaran.tanggal || data.kasus?.tanggalPelanggaran || '-';

  // Hitung tinggi vertikal kolom kiri & kanan secara proporsional
  const leftLinesHeight = 3.5 + namaAdaptive.totalHeightMm + 4.0 + 4.0 + 3.0;
  const rightLinesHeight = 3.5 + jenisAdaptive.totalHeightMm + 4.0 + 4.0 + 4.0 + musyrifAdaptive.totalHeightMm + 3.0;
  const idBoxHeight = Math.max(leftLinesHeight, rightLinesHeight, 26);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, idBoxHeight, 1.2, 1.2, 'FD');

  let rowLeftY = currentY + 3.8;
  let rowRightY = currentY + 3.8;

  // Kolom Kiri: Nama Santri
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text('Nama Santri', leftColX, rowLeftY);
  doc.text(':', leftColX + labelWidthLeft - 2, rowLeftY);

  doc.setFont('times', 'bold');
  doc.setFontSize(namaAdaptive.fontSize);
  let curNamaY = rowLeftY;
  namaAdaptive.lines.forEach((line) => {
    doc.text(line, leftColX + labelWidthLeft, curNamaY);
    curNamaY += namaAdaptive.lineHeightMm;
  });
  rowLeftY = curNamaY + 0.5;

  // Kolom Kiri: Kelas / Kamar
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.text('Kelas / Kamar', leftColX, rowLeftY);
  doc.text(':', leftColX + labelWidthLeft - 2, rowLeftY);
  doc.setFont('times', 'normal');
  doc.text(kelasInfo, leftColX + labelWidthLeft, rowLeftY);
  rowLeftY += 4.0;

  // Kolom Kiri: Total Poin Akumulasi
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.text('Total Akumulasi', leftColX, rowLeftY);
  doc.text(':', leftColX + labelWidthLeft - 2, rowLeftY);
  doc.setTextColor(185, 28, 28); // Red
  doc.text(`${santri.totalPoin} Poin`, leftColX + labelWidthLeft, rowLeftY);
  doc.setTextColor(15, 23, 42);

  // Kolom Kanan: Jenis Pelanggaran (Auto-wrapped, dynamic font)
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.text('Jenis Pelanggaran', rightColX, rowRightY);
  doc.text(':', rightColX + labelWidthRight - 2, rowRightY);

  doc.setFont('times', 'normal');
  doc.setFontSize(jenisAdaptive.fontSize);
  let curJenisY = rowRightY;
  jenisAdaptive.lines.forEach((line) => {
    doc.text(line, rightColX + labelWidthRight, curJenisY);
    curJenisY += jenisAdaptive.lineHeightMm;
  });
  rowRightY = curJenisY + 0.5;

  // Kolom Kanan: Poin Kasus Ini
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.text('Poin Kasus Ini', rightColX, rowRightY);
  doc.text(':', rightColX + labelWidthRight - 2, rowRightY);
  doc.setTextColor(185, 28, 28);
  doc.text(`${pelanggaran.poin} Poin`, rightColX + labelWidthRight, rowRightY);
  doc.setTextColor(15, 23, 42);
  rowRightY += 4.0;

  // Kolom Kanan: Waktu Kejadian
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.text('Waktu Kejadian', rightColX, rowRightY);
  doc.text(':', rightColX + labelWidthRight - 2, rowRightY);
  doc.setFont('times', 'normal');
  doc.text(tglPelanggaran, rightColX + labelWidthRight, rowRightY);
  rowRightY += 4.0;

  // Kolom Kanan: Periode Pembinaan
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.text('Periode Pembinaan', rightColX, rowRightY);
  doc.text(':', rightColX + labelWidthRight - 2, rowRightY);
  doc.setFont('times', 'normal');
  doc.text(pembinaan.periodeText, rightColX + labelWidthRight, rowRightY);
  rowRightY += 4.0;

  // Kolom Kanan: Musyrif / Pendamping
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.text('Musyrif / Musyrifah', rightColX, rowRightY);
  doc.text(':', rightColX + labelWidthRight - 2, rowRightY);

  doc.setFont('times', 'normal');
  doc.setFontSize(musyrifAdaptive.fontSize);
  let curMusyrifY = rowRightY;
  musyrifAdaptive.lines.forEach((line) => {
    doc.text(line, rightColX + labelWidthRight, curMusyrifY);
    curMusyrifY += musyrifAdaptive.lineHeightMm;
  });

  currentY += idBoxHeight + 1.8;

  // Petunjuk singkat
  doc.setFont('times', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('* Tanda (✓) = kegiatan pembinaan telah dilaksanakan. Kolom \'Paraf\' wajib divalidasi oleh Musyrif/ah pendamping.', marginX, currentY);
  currentY += 2.8;

  // ============================================================
  // 4. TABEL KETERANGAN KOLOM JENIS PEMBINAAN (P1 - Pn)
  // ============================================================
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    head: [['Kode', 'Uraian Butir Jenis Pembinaan']],
    body: codes.map((c) => [c.code, c.uraian]),
    styles: {
      font: 'times',
      fontSize: 7.2,
      cellPadding: 1.0,
      textColor: [15, 23, 42],
      lineColor: [30, 41, 59],
      lineWidth: 0.12,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 1.2
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'left', overflow: 'linebreak' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 2.5;

  // ============================================================
  // 5. TABEL MUTABA'AH HARIAN (Dinamis Sesuai Durasi Hari)
  // ============================================================
  const codeHeaders = codes.map((c) => c.code);
  const emptyHeadersCount = Math.max(0, 11 - codes.length);
  const extraHeaders = Array.from({ length: emptyHeadersCount }, () => '-');

  const tableHead = [
    ['No', 'Tanggal', ...codeHeaders, ...extraHeaders, 'Paraf', 'Keterangan']
  ];

  const tableBody = mutabaahRows.map((row) => [
    row.no,
    '..../..../20....',
    ...codes.map(() => ''),
    ...extraHeaders.map(() => ''),
    '',
    ''
  ]);

  // Baris Ringkasan Target
  tableBody.push([
    'Jumlah Hari Terlaksana:',
    '',
    `.......... Hari (Target: ${header.durasiHari} Hari)`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  const colStyles: any = {
    0: { cellWidth: 7.5, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 20, halign: 'center', fontSize: 6.2, font: 'courier' }
  };

  // Lebar kolom P1 s/d P11
  for (let i = 0; i < 11; i++) {
    colStyles[2 + i] = { cellWidth: 5.8, halign: 'center' };
  }
  colStyles[13] = { cellWidth: 13, halign: 'center' };
  colStyles[14] = { cellWidth: 'auto', halign: 'left' };

  // Hitung cellPadding dinamis berdasarkan jumlah hari agar seluruh dokumen muat rapi di 1 halaman A4
  const rowCount = mutabaahRows.length;
  const harianCellPadding = rowCount > 10 ? 0.6 : rowCount > 7 ? 0.8 : 1.1;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    head: tableHead,
    body: tableBody,
    styles: {
      font: 'times',
      fontSize: 6.8,
      cellPadding: harianCellPadding,
      textColor: [15, 23, 42],
      lineColor: [30, 41, 59],
      lineWidth: 0.12
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
      cellPadding: 1.0
    },
    columnStyles: colStyles,
    didParseCell: (dataCell) => {
      // Styling summary row di bagian bawah tabel
      if (dataCell.row.index === tableBody.length - 1) {
        dataCell.cell.styles.fillColor = [241, 245, 249];
        dataCell.cell.styles.fontStyle = 'bold';
        if (dataCell.column.index === 0) {
          dataCell.cell.colSpan = 2;
          dataCell.cell.styles.halign = 'right';
        } else if (dataCell.column.index === 2) {
          dataCell.cell.colSpan = 13;
          dataCell.cell.styles.halign = 'center';
        }
      }
    }
  });

  // Spacing proporsional setelah tabel mutaba'ah: ~8.5 mm (~24-30px)
  currentY = (doc as any).lastAutoTable.finalY + 8.5;

  // ============================================================
  // 6. AREA TANDA TANGAN 4 KOLOM SEIMBANG (REVISI FINAL)
  // ============================================================
  const sigColWidth = contentWidth / 4;
  const colCenters = [
    marginX + sigColWidth * 0.5,
    marginX + sigColWidth * 1.5,
    marginX + sigColWidth * 2.5,
    marginX + sigColWidth * 3.5
  ];

  const maxSigTextWidth = sigColWidth - 3.5; // ~42mm

  // Cek apakah posisi Y aman dari batas bawah A4
  const estimatedSigHeight = 32; // mm
  if (currentY + estimatedSigHeight > pageHeight - 10) {
    currentY = pageHeight - estimatedSigHeight - 10;
  }

  // --- BAGIAN ATAS AREA TANDA TANGAN (HEADER & LABEL PERAN) ---
  const headerBlockStartY = currentY;

  // Kolom 4: Tanggal & Kota (Tengaran, ...)
  doc.setFont('times', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(15, 23, 42);
  doc.text(officers.kotaTanggal, colCenters[3], headerBlockStartY, { align: 'center' });

  // Kolom 4: Mengetahui,
  const mengetahuiY = headerBlockStartY + 3.8;
  doc.setFont('times', 'normal');
  doc.setFontSize(8.0);
  doc.text('Mengetahui,', colCenters[3], mengetahuiY, { align: 'center' });

  // Baris Label Peran Utama (Sejajar Horisontal di ke-4 Kolom)
  const roleLabelY = headerBlockStartY + 7.8;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.0);
  doc.setTextColor(15, 23, 42);

  // Kolom 1: Santri
  doc.text('Santri', colCenters[0], roleLabelY, { align: 'center' });

  // Kolom 2: Orang Tua / Wali
  doc.text('Orang Tua / Wali', colCenters[1], roleLabelY, { align: 'center' });

  // Kolom 3: Musyrif / Musyrifah
  doc.text('Musyrif / Musyrifah', colCenters[2], roleLabelY, { align: 'center' });

  // Kolom 4: Koordinator Unit
  doc.setFontSize(8.5);
  doc.text(`Koordinator Unit ${officers.unitName}`, colCenters[3], roleLabelY, { align: 'center' });

  // --- RUANG KOSONG TANDA TANGAN (± 13.5 mm) ---
  const ttdGapMm = 13.5;
  const nameStartY = roleLabelY + ttdGapMm;

  // --- NAMA-NAMA PEJABAT / SANTRI (ADAPTIF, WRAP 2 BARIS, CENTER) ---
  // Kolom 1: Santri
  const santriSig = getAdaptiveWrappedText(doc, santri.nama.toUpperCase(), maxSigTextWidth, {
    initialFontSize: 8.8,
    minFontSize: 7.2,
    fontName: 'times',
    fontStyle: 'bold',
    maxLines: 2,
    lineHeightFactor: 1.2
  });

  // Kolom 3: Musyrif / Musyrifah
  const musyrifSig = getAdaptiveWrappedText(doc, officers.musyrifNama, maxSigTextWidth, {
    initialFontSize: 8.8,
    minFontSize: 7.2,
    fontName: 'times',
    fontStyle: 'bold',
    maxLines: 2,
    lineHeightFactor: 1.2
  });

  // Kolom 4: Koordinator Unit
  const koordinatorSig = getAdaptiveWrappedText(doc, officers.koordinatorNama, maxSigTextWidth, {
    initialFontSize: 8.8,
    minFontSize: 7.2,
    fontName: 'times',
    fontStyle: 'bold',
    maxLines: 2,
    lineHeightFactor: 1.2
  });

  // Render Kolom 1: Nama Santri (Center)
  doc.setFont('times', 'bold');
  doc.setFontSize(santriSig.fontSize);
  doc.setTextColor(15, 23, 42);
  let yS = nameStartY;
  santriSig.lines.forEach((line) => {
    doc.text(line, colCenters[0], yS, { align: 'center' });
    yS += santriSig.lineHeightMm;
  });

  // Render Kolom 2: Titik-titik Orang Tua / Wali (Center)
  doc.setFont('times', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text('..........................', colCenters[1], nameStartY, { align: 'center' });

  // Render Kolom 3: Nama Musyrif (Center)
  doc.setFont('times', 'bold');
  doc.setFontSize(musyrifSig.fontSize);
  doc.setTextColor(15, 23, 42);
  let yM = nameStartY;
  musyrifSig.lines.forEach((line) => {
    doc.text(line, colCenters[2], yM, { align: 'center' });
    yM += musyrifSig.lineHeightMm;
  });

  // Render Kolom 4: Nama Koordinator (Center)
  doc.setFont('times', 'bold');
  doc.setFontSize(koordinatorSig.fontSize);
  doc.setTextColor(15, 23, 42);
  let yK = nameStartY;
  koordinatorSig.lines.forEach((line) => {
    doc.text(line, colCenters[3], yK, { align: 'center' });
    yK += koordinatorSig.lineHeightMm;
  });

  // Render footer catatan tanggal cetak (terpisah jelas dari tanggal pelanggaran)
  if (officers.tanggalCetak) {
    doc.setFont('times', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Dokumen Resmi SIMKA.ID • Dicetak: ${officers.tanggalCetak}`, marginX, pageHeight - 4.5);
  }

  // Simpan dan Unduh File PDF
  const sanitizedName = santri.nama.replace(/[\\/:*?"<>|]/g, '').trim() || 'Santri';
  const fileName = `Form Mutabaah Pembinaan - ${sanitizedName} - Tingkat ${header.levelNumber}.pdf`;
  doc.save(fileName);
}
