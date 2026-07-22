import React, { useState } from 'react';
import { Printer, Copy, Check, X, Camera, Shield, Calendar, Clock, MapPin, User, Phone, Share2, FileText } from 'lucide-react';
import { Peminjaman } from '../types.js';

interface CetakBuktiA6ModalProps {
  borrow?: Peminjaman | null;
  borrowData?: Peminjaman | null;
  isOpen: boolean;
  onClose: () => void;
}

export function buildBookingWhatsAppText(borrow: Peminjaman): string {
  const tglMulai = `${borrow.tanggal_pinjam}${borrow.jam_mulai ? ', Jam ' + borrow.jam_mulai : ''}`;
  const tglSelesai = `${borrow.tanggal_kembali}${borrow.jam_selesai ? ', Jam ' + borrow.jam_selesai : ''}`;
  
  return `*FORMAT BOOKING SEWA KAMERA / ALAT*
*E-INVENTARIS SMA AL MUNAWWARIYYAH*
----------------------------------------
*Nama Lengkap:* ${borrow.nama_peminjam}
*Nama Akun Medsos (IG/TikTok):* ${borrow.akun_medsos || '-'}
*No. WhatsApp / HP Aktif:* ${borrow.kontak_peminjam}
*Alamat Domisili (Shareloc jika diperlukan):* ${borrow.alamat_domisili || '-'}
*Tipe Kamera / Alat yang Disewa:* ${borrow.barang_nama || 'Alat'} (${borrow.barang_kode || ''})
*Jumlah Unit:* ${borrow.jumlah} Unit
*Tanggal Mulai Sewa:* ${tglMulai}
*Tanggal Selesai Sewa:* ${tglSelesai}
*Jaminan Sewa (Minimal 2 Identitas Asli):* ${borrow.jaminan || '-'}
*Keperluan Acara:* ${borrow.keperluan_acara || borrow.catatan || '-'}
*Status:* ${borrow.status.toUpperCase()}
----------------------------------------
*ID Transaksi:* TRX-${borrow.id.toString().padStart(4, '0')}
*Waktu Pengajuan:* ${borrow.created_at ? new Date(borrow.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}`;
}

export default function CetakBuktiA6Modal({ borrow, borrowData, isOpen, onClose }: CetakBuktiA6ModalProps) {
  const [copied, setCopied] = useState(false);
  const activeBorrow = borrow || borrowData;

  if (!isOpen || !activeBorrow) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWA = () => {
    const text = buildBookingWhatsAppText(activeBorrow);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* CSS for print mode (A6 Paper: 105mm x 148mm) */}
      <style>{`
        @media print {
          @page {
            size: A6 portrait;
            margin: 5mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-a6-receipt, #printable-a6-receipt * {
            visibility: visible !important;
          }
          #printable-a6-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 105mm !important;
            min-height: 148mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
            font-family: Arial, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header Actions (Screen Only) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <span>Cetak Struk / Bukti Peminjaman (A6)</span>
            </h3>
            <p className="text-xs text-slate-500">Format cetak resmi ukuran A6 (105mm x 148mm)</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar (Screen Only) */}
        <div className="p-3 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <span className="text-blue-800 font-medium flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>ID Transaksi: TRX-{activeBorrow.id.toString().padStart(4, '0')}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWA}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks WA'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak A6 Now</span>
            </button>
          </div>
        </div>

        {/* Printable Receipt Container */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
          
          {/* A6 Simulated Sheet */}
          <div 
            id="printable-a6-receipt"
            className="w-[105mm] min-h-[148mm] bg-white text-slate-900 p-4 shadow-md border border-slate-300 font-sans text-[11px] leading-tight flex flex-col justify-between shrink-0"
          >
            {/* Kop Surat Header */}
            <div>
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-2">
                <h4 className="font-extrabold text-[13px] tracking-wider text-slate-900 uppercase">SMA AL MUNAWWARIYYAH</h4>
                <p className="text-[10px] font-bold text-slate-700 tracking-tight uppercase">E-INVENTARIS & SEWA ALAT MULTIMEDIA</p>
                <p className="text-[8px] text-slate-500">Jl. Raya Sudimoro No. 1, Bululawang, Malang, Jawa Timur</p>
              </div>

              {/* Title & Status */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-black text-[11px] text-slate-900 tracking-tight block">BUKTI SEWA / PEMINJAMAN</span>
                  <span className="text-[9px] text-slate-500 font-mono">TRX-{activeBorrow.id.toString().padStart(4, '0')}</span>
                </div>
                <div className="px-2 py-0.5 border border-slate-900 font-black text-[9px] uppercase tracking-wider rounded">
                  {activeBorrow.status}
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-1.5 my-2 text-[10px]">
                
                {/* Penyewa Info */}
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Nama Lengkap:</span>
                    <span className="font-bold text-slate-900">{activeBorrow.nama_peminjam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Medsos (IG/TikTok):</span>
                    <span className="font-semibold text-slate-800">{activeBorrow.akun_medsos || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">WhatsApp / HP:</span>
                    <span className="font-semibold text-slate-800">{activeBorrow.kontak_peminjam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Alamat / Shareloc:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate">{activeBorrow.alamat_domisili || '-'}</span>
                  </div>
                </div>

                {/* Barang & Waktu Info */}
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Alat Disewa:</span>
                    <span className="font-bold text-blue-900">{activeBorrow.barang_nama || 'Alat'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Kode & Jumlah:</span>
                    <span className="font-semibold text-slate-800">{activeBorrow.barang_kode || '-'} ({activeBorrow.jumlah} Unit)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Mulai Sewa:</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplayDate(activeBorrow.tanggal_pinjam)}{activeBorrow.jam_mulai ? `, Pkl ${activeBorrow.jam_mulai}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Selesai Sewa:</span>
                    <span className="font-semibold text-slate-800">
                      {formatDisplayDate(activeBorrow.tanggal_kembali)}{activeBorrow.jam_selesai ? `, Pkl ${activeBorrow.jam_selesai}` : ''}
                    </span>
                  </div>
                </div>

                {/* Jaminan & Keperluan */}
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Jaminan Sewa:</span>
                    <span className="font-bold text-slate-900">{activeBorrow.jaminan || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Keperluan:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[170px] truncate">{activeBorrow.keperluan_acara || activeBorrow.catatan || '-'}</span>
                  </div>
                </div>

              </div>

              {/* Term & Conditions */}
              <div className="text-[8px] text-slate-600 bg-slate-100 p-1.5 rounded border border-slate-200 my-1">
                <p className="font-bold text-slate-800 mb-0.5">Ketentuan Sewa:</p>
                <ol className="list-decimal list-inside space-y-0.5 leading-none">
                  <li>Wajib menyerahkan jaminan 2 identitas asli saat serah terima.</li>
                  <li>Pengembalian tepat waktu sesuai batas jam yang disepakati.</li>
                  <li>Segala kerusakan/kehilangan menjadi tanggung jawab penyewa.</li>
                </ol>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-2 pt-2 border-t border-slate-300 text-[9px]">
              <div className="text-right text-[8px] text-slate-500 mb-1">
                Malang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>

              <div className="grid grid-cols-2 text-center gap-2">
                <div>
                  <p className="font-semibold text-slate-700">Penyewa / Peminjam</p>
                  <div className="h-8"></div>
                  <p className="font-bold text-slate-900 underline">( {activeBorrow.nama_peminjam} )</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700">Petugas Lab / Admin</p>
                  <div className="h-8"></div>
                  <p className="font-bold text-slate-900 underline">( .............................. )</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <button
            onClick={handleCopyWA}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl text-xs transition cursor-pointer border border-emerald-200"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
            <span>{copied ? 'Teks Format WA Tersalin!' : 'Salin Format WA (Pesan)'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Ukuran A6</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
