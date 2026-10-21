import React from 'react';
import { PembinaanRecord, Santri } from '../../types';
import { MosqueLogoIcon } from '../layout/IslamicPattern';
import { Printer, X, Shield, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface FormPembinaanA4Props {
  pembinaan: PembinaanRecord;
  santri?: Santri;
  onClose: () => void;
}

export const FormPembinaanA4: React.FC<FormPembinaanA4Props> = ({
  pembinaan,
  santri,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 my-8 print:m-0 print:p-8 print:shadow-none print:w-full print:max-w-none">
        {/* Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Pratinjau Lembar Form Pembinaan Karakter (A4)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* OFFICIAL KOP SURAT PESANTREN */}
        {/* ============================================================ */}
        <div className="border-b-4 border-double border-slate-800 pb-4 mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center">
              <MosqueLogoIcon className="w-10 h-10 text-slate-800" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                PONDOK PESANTREN ISLAM TERPADU
              </h1>
              <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-800">
                BAGIAN KEPESANTRENAN & PEMBINAAN AKHLAK SANTRI (SIMKA.ID)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Jl. Pesantren Luhur No. 01, Kompleks Pendidikan Islam Terpadu • Telp: (021) 8899-7766
              </p>
            </div>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center my-4">
          <h3 className="text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-900">
            BERITA ACARA & FORM TINDAKAN PEMBINAAN SANTRI
          </h3>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Nomor: {pembinaan.id.toUpperCase()}/SIMKA-PBN/{new Date().getFullYear()}
          </p>
        </div>

        {/* Student & Violation Profile Grid */}
        <div className="my-6 space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-3 text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>I. IDENTITAS SANTRI TERBINA</span>
            </h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6">
              <div className="flex">
                <span className="w-32 text-slate-500">Nama Lengkap</span>
                <span className="font-bold text-slate-900">: {pembinaan.santriNama}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Unit Pesantren</span>
                <span className="font-bold text-slate-900">: Unit {pembinaan.santriUnit}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Nomor Induk (NIS)</span>
                <span className="font-bold text-slate-900">: {santri?.nis || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Tingkat / Kelas</span>
                <span className="font-bold text-slate-900">: Kelas {pembinaan.santriKelas}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Nama Musyrif</span>
                <span className="font-bold text-slate-900">: {santri?.musyrif || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Total Akumulasi Poin</span>
                <span className="font-bold text-rose-600">: {santri?.totalPoin || 0} Poin</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-3 text-[11px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>II. RINCIAN BENTUK TINDAKAN PEMBINAAN</span>
            </h4>
            <div className="space-y-2.5">
              <div className="flex">
                <span className="w-36 text-slate-500 shrink-0">Bentuk Pembinaan</span>
                <span className="font-bold text-slate-900">: {pembinaan.jenisPembinaan}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 shrink-0">Ustadz Pembina</span>
                <span className="font-bold text-slate-900">: {pembinaan.pembina}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 shrink-0">Tanggal Ditetapkan</span>
                <span className="font-bold text-slate-900">: {pembinaan.tanggal}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 shrink-0">Target Penyelesaian</span>
                <span className="font-bold text-slate-900">: {pembinaan.tanggalTargetSelesai || 'Sesuai Arahan Pembina'}</span>
              </div>
              <div className="flex items-start">
                <span className="w-36 text-slate-500 shrink-0">Instruksi & Catatan Khusus</span>
                <span className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 flex-1 leading-relaxed">
                  {pembinaan.catatan || 'Santri berkomitmen untuk memperbaiki diri, disiplin shalat berjamaah, dan menjaga adab santri.'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>III. PERNYATAAN & KOMITMEN SANTRI</span>
            </h4>
            <p className="text-slate-700 leading-relaxed italic text-[11px]">
              "Saya yang bertanda tangan di bawah ini menyatakan mengakui kekhilafan dan berjanji dengan sungguh-sungguh untuk mentaati tata tertib pondok pesantren, memperbaiki akhlak, dan melaksanakan seluruh rangkaian pembinaan ini dengan penuh keikhlasan serta tanggung jawab demi ridha Allah SWT."
            </p>
          </div>
        </div>

        {/* Tanda Tangan 3 Kolom */}
        <div className="mt-8 pt-6 border-t border-slate-300">
          <p className="text-right text-xs text-slate-600 mb-6">
            Ditetapkan di Pesantren, {pembinaan.tanggal}
          </p>

          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500">Santri yang Dibina,</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline">
                {pembinaan.santriNama}
              </p>
              <p className="text-[10px] text-slate-500">NIS: {santri?.nis || '-'}</p>
            </div>

            <div>
              <p className="text-slate-500">Ustadz Pembina / Musyrif,</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline">
                {pembinaan.pembina}
              </p>
              <p className="text-[10px] text-slate-500">Pembina Karakter</p>
            </div>

            <div>
              <p className="text-slate-500">Mengetahui,<br />Kasie Kepesantrenan</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 underline">
                Ust. H. Abdullah Mansur, Lc.
              </p>
              <p className="text-[10px] text-slate-500">NIP: 19840512-201001-1-003</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
