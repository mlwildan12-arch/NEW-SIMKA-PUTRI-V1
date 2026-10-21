import React, { useState } from 'react';
import { PembinaanFormData } from '../../lib/pembinaanHelper';
import { exportMutabaahPembinaanPDF } from '../../lib/exportPembinaanPdf';
import { Printer, X, Download, FileCheck, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface FormPembinaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PembinaanFormData | null;
}

export const FormPembinaanModal: React.FC<FormPembinaanModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const { header, santri, pelanggaran, pembinaan, mutabaahRows, officers } = data;
  const codes = pembinaan.itemsWithCode;

  // Ukuran baris & padding dinamis yang dihitung presisi untuk memanfaatkan ruang A4 secara seimbang
  const totalDays = mutabaahRows.length;
  
  // Row height dinamis agar tabel mengisi ruang vertikal secara elegan
  const rowHeightStyle =
    totalDays <= 3 ? 'h-9' :
    totalDays <= 5 ? 'h-8' :
    totalDays <= 7 ? 'h-7' :
    totalDays <= 10 ? 'h-6' :
    totalDays <= 12 ? 'h-[23px]' : 'h-[21px]';

  const cellPaddingClass =
    totalDays <= 7 ? 'py-1' :
    totalDays <= 10 ? 'py-0.5' : 'py-0';

  // Sizing dinamis untuk section atas & keterangan P1-P11
  const isHighDayCount = totalDays >= 12;
  const sectionGapClass = isHighDayCount ? 'mb-2' : 'mb-3';
  const headerPaddingClass = isHighDayCount ? 'pb-1.5 mb-2' : 'pb-2 mb-2.5';
  const identitasPaddingClass = isHighDayCount ? 'p-2 mb-2 text-[10.5px]' : 'p-2.5 mb-3 text-[11px]';
  const uraianFontSizeClass = isHighDayCount ? 'text-[9px]' : 'text-[9.5px]';
  const tableHeaderPaddingClass = isHighDayCount ? 'py-1' : 'py-1.5';
  
  // Area tanda tangan dengan ruang kosong yang cukup
  const signatureBoxHeightClass = isHighDayCount ? 'min-h-[90px]' : 'min-h-[105px]';
  const signatureGapHeightClass = isHighDayCount ? 'h-10' : 'h-12';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setDownloadSuccessMessage(null);

    try {
      // Primary High-Precision Vector Engine
      exportMutabaahPembinaanPDF(data);

      setDownloadSuccessMessage('Dokumen Mutaba\'ah Pembinaan (A4) berhasil diunduh!');
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (err) {
      console.warn('[PDF] Vector export warning, falling back to HD canvas...', err);
      
      // Fallback: Canvas snapshot
      try {
        const pageElement = document.getElementById('printable-form-pembinaan-page-1');
        if (pageElement) {
          const canvas = await html2canvas(pageElement, {
            scale: 2.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#FFFFFF'
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
          });
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          const cleanName = santri.nama.replace(/[\\/:*?"<>|]/g, '').trim() || 'Santri';
          pdf.save(`Form Mutabaah Pembinaan - ${cleanName}.pdf`);
          setDownloadSuccessMessage('Dokumen Mutaba\'ah Pembinaan (A4) berhasil diunduh!');
          setTimeout(() => setDownloadSuccessMessage(null), 5000);
        }
      } catch (fallbackErr) {
        console.error('[PDF] Download failed:', fallbackErr);
        alert('Gagal membuat PDF. Anda juga dapat menggunakan tombol "Cetak Form" untuk menyimpan sebagai PDF.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] my-auto">
        {/* Modal Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-slate-800/90 border-b border-slate-700 gap-3 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Dokumen Mutaba'ah Pembinaan Santri
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {santri.nama} • {header.levelName} ({header.durasiText})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors cursor-pointer"
              title="Cetak langsung menggunakan dialog printer browser"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Form</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors ml-1 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {downloadSuccessMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-4 py-2 flex items-center justify-between text-xs text-emerald-200 no-print animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">{downloadSuccessMessage}</span>
            </div>
            <button
              onClick={() => setDownloadSuccessMessage(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Modal Body: Scrollable Paper Preview */}
        <div className="overflow-y-auto p-2 sm:p-6 bg-[#070D18] flex flex-col items-center">
          {/* HALAMAN UTAMA A4 RESMI (210mm x 297mm ratio, max-w-[794px]) */}
          <div
            id="printable-form-pembinaan-page-1"
            className="form-pembinaan-a4-page w-full max-w-[794px] bg-white text-slate-900 px-6 sm:px-8 py-6 sm:py-7 font-serif shadow-2xl rounded-sm box-border print:m-0 print:p-0 print:shadow-none print:max-w-none print:w-full print:rounded-none"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              lineHeight: 1.25,
              backgroundColor: '#FFFFFF'
            }}
          >
            {/* BAGIAN ATAS S/D TABEL MUTABA'AH */}
            <div>
              {/* 1. KOP HEADER RESMI */}
              <div className={`text-center ${headerPaddingClass} border-b-2 border-slate-900`}>
                <h1 className="text-[18px] sm:text-[19px] font-bold tracking-wider uppercase text-slate-900 leading-tight">
                  {header.title}
                </h1>
                <h2 className="text-[13px] sm:text-[13.5px] font-bold tracking-wide uppercase text-slate-800">
                  {header.institution}
                </h2>
              </div>

              {/* 2. SUB-BAR LEVEL & DURASI */}
              <div className={`flex flex-wrap items-center justify-between border-y border-slate-900 py-1 px-2.5 bg-slate-100/90 text-[10.5px] font-bold uppercase ${sectionGapClass} gap-1`}>
                <div>
                  <span>LEVEL: </span>
                  <span className="font-extrabold underline">{header.levelName}</span>
                </div>
                <div>
                  <span>Poin Pelanggaran: </span>
                  <span className="font-extrabold">{header.rangePoin}</span>
                  <span className="text-[9.5px] font-normal normal-case ml-1">
                    ({pelanggaran.poin} Poin Tunggal)
                  </span>
                </div>
                <div>
                  <span>Durasi: </span>
                  <span className="font-extrabold">{header.durasiText}</span>
                </div>
              </div>

              {/* 3. IDENTITAS SANTRI - WRAP TEXT DYNAMIC */}
              <div className={`grid grid-cols-2 gap-x-4 gap-y-1.5 ${identitasPaddingClass} border border-slate-300 rounded bg-slate-50/50`}>
                <div className="flex items-start">
                  <span className="w-28 font-bold shrink-0">Nama Santri</span>
                  <span className="mr-1.5">:</span>
                  <span className="font-bold uppercase break-words leading-tight flex-1">{santri.nama}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold shrink-0">Jenis Pelanggaran</span>
                  <span className="mr-1.5">:</span>
                  <span className="break-words leading-tight flex-1">{pelanggaran.jenis}</span>
                </div>

                <div className="flex items-start">
                  <span className="w-28 font-bold shrink-0">Kelas / Kamar</span>
                  <span className="mr-1.5">:</span>
                  <span className="break-words leading-tight flex-1">
                    {santri.kelas} ({santri.unit}) / {santri.kamar}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold shrink-0">Poin Kasus Ini</span>
                  <span className="mr-1.5">:</span>
                  <span className="font-bold text-rose-600 leading-tight flex-1">{pelanggaran.poin} Poin</span>
                </div>

                <div className="flex items-start">
                  <span className="w-28 font-bold shrink-0">Total Akumulasi</span>
                  <span className="mr-1.5">:</span>
                  <span className="font-bold text-red-700 leading-tight flex-1">{santri.totalPoin} Poin</span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold shrink-0">Waktu Kejadian</span>
                  <span className="mr-1.5">:</span>
                  <span className="leading-tight flex-1">{pelanggaran.tanggal || data.kasus?.tanggalPelanggaran || '-'}</span>
                </div>

                <div className="flex items-start">
                  <span className="w-28 font-bold shrink-0">Musyrif/ah</span>
                  <span className="mr-1.5">:</span>
                  <span className="break-words leading-tight flex-1">{officers.musyrifNama}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-32 font-bold shrink-0">Periode Pembinaan</span>
                  <span className="mr-1.5">:</span>
                  <span className="leading-tight flex-1">{pembinaan.periodeText}</span>
                </div>
              </div>

              <p className="text-[9px] italic text-slate-700 mb-1.5">
                * Tanda (✓) = kegiatan pembinaan telah dilaksanakan. Kolom 'Paraf' wajib divalidasi oleh Musyrif/ah pendamping.
              </p>

              {/* 4. TABEL KETERANGAN KOLOM JENIS PEMBINAAN */}
              <div className={sectionGapClass}>
                <div className="bg-slate-800 text-white px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
                  KETERANGAN KOLOM JENIS PEMBINAAN
                </div>
                <table className={`w-full text-left ${uraianFontSizeClass} border-collapse border border-slate-900`}>
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                      <th className="border border-slate-900 px-2 py-0.5 text-center w-10">Kode</th>
                      <th className="border border-slate-900 px-2 py-0.5">Uraian Butir Jenis Pembinaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="border border-slate-900 px-2 py-0.5 text-center font-bold">
                          {item.code}
                        </td>
                        <td className="border border-slate-900 px-2 py-0.5 leading-tight">
                          {item.uraian}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5. TABEL MUTABA'AH HARIAN (Dinamis Sesuai Durasi Hari) */}
              <div className={sectionGapClass}>
                <div className="bg-slate-800 text-white px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
                  TABEL MUTABA'AH HARIAN
                </div>
                <table className="w-full text-center text-[9.5px] border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                      <th className={`border border-slate-900 px-1 ${tableHeaderPaddingClass} w-7`}>No</th>
                      <th className={`border border-slate-900 px-1.5 ${tableHeaderPaddingClass} w-22`}>Tanggal</th>
                      {codes.map((c) => (
                        <th key={c.code} className={`border border-slate-900 px-0.5 ${tableHeaderPaddingClass} w-6 font-bold`}>
                          {c.code}
                        </th>
                      ))}
                      {codes.length < 11 &&
                        Array.from({ length: 11 - codes.length }).map((_, i) => (
                          <th key={`empty-th-${i}`} className={`border border-slate-900 px-0.5 ${tableHeaderPaddingClass} w-6 text-slate-300`}>
                            -
                          </th>
                        ))}
                      <th className={`border border-slate-900 px-1 ${tableHeaderPaddingClass} w-14`}>Paraf</th>
                      <th className={`border border-slate-900 px-1.5 ${tableHeaderPaddingClass} w-26`}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutabaahRows.map((row) => (
                      <tr key={row.no} className={rowHeightStyle}>
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass} font-bold text-[9px]`}>
                          {row.no}
                        </td>
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass} text-[8.5px] text-slate-400 font-mono`}>
                          ..../..../20....
                        </td>
                        {codes.map((c) => (
                          <td key={c.code} className={`border border-slate-900 px-0.5 ${cellPaddingClass} text-center`}>
                            &nbsp;
                          </td>
                        ))}
                        {codes.length < 11 &&
                          Array.from({ length: 11 - codes.length }).map((_, i) => (
                            <td key={`empty-td-${i}`} className={`border border-slate-900 px-0.5 ${cellPaddingClass} bg-slate-50`}>
                              &nbsp;
                            </td>
                          ))}
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass}`}>
                          &nbsp;
                        </td>
                        <td className={`border border-slate-900 px-1 ${cellPaddingClass} text-left text-[8.5px]`}>
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                    {/* Baris Ringkasan & Target */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-[9.5px]">
                      <td colSpan={2} className="border border-slate-900 px-2 py-1 text-right">
                        Jumlah Hari Terlaksana:
                      </td>
                      <td colSpan={codes.length + (codes.length < 11 ? 11 - codes.length : 0)} className="border border-slate-900 px-2 py-1 text-center font-bold">
                        .......... Hari
                      </td>
                      <td colSpan={2} className="border border-slate-900 px-2 py-1 text-center">
                        Target: <span className="underline">{header.durasiHari} Hari</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BAGIAN BAWAH: TANDA TANGAN 4 KOLOM DENGAN SPACING PROPORSIONAL (~24-30px) */}
            <div className="mt-6 sm:mt-7 pt-2">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                {/* 1. Santri */}
                <div className="flex flex-col justify-between min-h-[95px]">
                  <div className="flex flex-col items-center justify-end min-h-[42px]">
                    <p className="font-bold text-[10.5px] sm:text-[11px] text-slate-900">Santri</p>
                  </div>
                  <div className="h-11 sm:h-12" />
                  <div>
                    <p className="font-bold uppercase text-[10px] sm:text-[10.5px] text-slate-900 break-words leading-tight px-0.5">
                      {santri.nama}
                    </p>
                  </div>
                </div>

                {/* 2. Orang Tua / Wali */}
                <div className="flex flex-col justify-between min-h-[95px]">
                  <div className="flex flex-col items-center justify-end min-h-[42px]">
                    <p className="font-bold text-[10.5px] sm:text-[11px] text-slate-900">Orang Tua / Wali</p>
                  </div>
                  <div className="h-11 sm:h-12" />
                  <div>
                    <p className="font-bold text-[10.5px] sm:text-[11px] text-slate-900 tracking-wider">
                      ..........................
                    </p>
                  </div>
                </div>

                {/* 3. Musyrif / Musyrifah */}
                <div className="flex flex-col justify-between min-h-[95px]">
                  <div className="flex flex-col items-center justify-end min-h-[42px]">
                    <p className="font-bold text-[10.5px] sm:text-[11px] text-slate-900">Musyrif / Musyrifah</p>
                  </div>
                  <div className="h-11 sm:h-12" />
                  <div>
                    <p className="font-bold text-[10px] sm:text-[10.5px] text-slate-900 break-words leading-tight px-0.5">
                      {officers.musyrifNama}
                    </p>
                  </div>
                </div>

                {/* 4. Koordinator Unit */}
                <div className="flex flex-col justify-between min-h-[95px]">
                  <div className="flex flex-col items-center justify-end min-h-[42px] text-[9.5px]">
                    <p className="text-[9.5px] text-slate-700 leading-tight">{officers.kotaTanggal}</p>
                    <p className="text-[9px] font-normal leading-tight">Mengetahui,</p>
                    <p className="font-bold text-[10px] sm:text-[10.5px] text-slate-900 leading-tight">
                      Koordinator Unit {officers.unitName}
                    </p>
                  </div>
                  <div className="h-11 sm:h-12" />
                  <div>
                    <p className="font-bold text-[10px] sm:text-[10.5px] text-slate-900 break-words leading-tight px-0.5">
                      {officers.koordinatorNama}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
