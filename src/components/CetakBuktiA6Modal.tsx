import React, { useState } from 'react';
import { Printer, Copy, Check, X, Camera, Shield, Calendar, Clock, MapPin, User, Phone, Share2, FileText } from 'lucide-react';
import { Peminjaman } from '../types.js';

interface CetakBuktiA6ModalProps {
  borrow?: Peminjaman | null;
  borrowData?: Peminjaman | null;
  borrows?: Peminjaman[] | null;
  trxCode?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function buildBookingWhatsAppText(borrowsInput: Peminjaman | Peminjaman[], customTrxCode?: string): string {
  const borrows = Array.isArray(borrowsInput) ? borrowsInput : (borrowsInput ? [borrowsInput] : []);
  if (borrows.length === 0) return '';
  
  const sorted = [...borrows].sort((a, b) => a.id - b.id);
  const first = sorted[0];
  const tglMulai = `${first.tanggal_pinjam}${first.jam_mulai ? ', Jam ' + first.jam_mulai : ''}`;
  const tglSelesai = `${first.tanggal_kembali}${first.jam_selesai ? ', Jam ' + first.jam_selesai : ''}`;
  
  const itemsText = sorted.map((b, i) => `${i + 1}. *${b.barang_nama || 'Alat'}* (${b.barang_kode || '-'}) - *${b.jumlah} Unit*`).join('\n');
  const totalUnits = sorted.reduce((acc, curr) => acc + curr.jumlah, 0);
  const trxId = customTrxCode || first.trx_code || `TRX-${first.id.toString().padStart(4, '0')}`;

  return `*FORMAT BOOKING SEWA KAMERA / ALAT*
*E-INVENTARIS SMA AL MUNAWWARIYYAH*
----------------------------------------
*Nama Lengkap:* ${first.nama_peminjam}
*Nama Akun Medsos (IG/TikTok):* ${first.akun_medsos || '-'}
*No. WhatsApp / HP Aktif:* ${first.kontak_peminjam}
*Alamat Domisili:* ${first.alamat_domisili || '-'}

*Daftar Kamera / Alat Disewa (${borrows.length} Jenis, Total ${totalUnits} Unit):*
${itemsText}

*Tanggal Mulai Sewa:* ${tglMulai}
*Tanggal Selesai Sewa:* ${tglSelesai}
*Jaminan Sewa (Min. 2 Identitas Asli):* ${first.jaminan || '-'}
*Keperluan Acara:* ${first.keperluan_acara || first.catatan || '-'}
*Status:* ${first.status.toUpperCase()}
----------------------------------------
*ID Transaksi:* ${trxId}
*Waktu Pengajuan:* ${first.created_at ? new Date(first.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}`;
}

export default function CetakBuktiA6Modal({ borrow, borrowData, borrows, trxCode, isOpen, onClose }: CetakBuktiA6ModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Normalize items list & sort by ID ascending
  let rawList: Peminjaman[] = [];
  if (borrows && borrows.length > 0) {
    rawList = borrows;
  } else if (borrow) {
    rawList = [borrow];
  } else if (borrowData) {
    rawList = [borrowData];
  }

  if (!isOpen || rawList.length === 0) return null;

  const itemList = [...rawList].sort((a, b) => a.id - b.id);
  const activeBorrow = itemList[0];
  const trxIdDisplay = trxCode || activeBorrow.trx_code || `TRX-${activeBorrow.id.toString().padStart(4, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWA = () => {
    const text = buildBookingWhatsAppText(itemList, trxIdDisplay);
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
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">
              ID Transaksi: {trxIdDisplay}
            </span>
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
                <p className="text-[10px] font-bold text-slate-700 tracking-tight uppercase">E-INVENTARIS & SEWA ALAT</p>
                <p className="text-[8px] text-slate-500">Jl. Raya Sudimoro No. 9, Bululawang, Malang, Jawa Timur</p>
              </div>

              {/* Title & Status */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-black text-[11px] text-slate-900 tracking-tight block">BUKTI SEWA / PEMINJAMAN</span>
                  <span className="text-[9.5px] text-slate-600 font-mono font-bold">
                    ID: {trxIdDisplay}
                  </span>
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
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Alamat / Shareloc:</span>
                    <span className="font-semibold text-slate-800 text-right leading-tight">{activeBorrow.alamat_domisili || '-'}</span>
                  </div>
                </div>

                {/* Barang & Waktu Info */}
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 space-y-1">
                  <span className="text-[9px] font-bold text-slate-700 block border-b border-slate-200 pb-0.5">
                    Rincian Alat Disewa ({itemList.length} Jenis, Total {itemList.reduce((a, b) => a + b.jumlah, 0)} Unit):
                  </span>
                  {itemList.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-start gap-2 text-[9.5px]">
                      <span className="font-bold text-blue-900 leading-snug">
                        {itemList.length > 1 ? `${idx + 1}. ` : ''}{item.barang_nama || 'Alat'} <span className="font-normal text-slate-500 font-mono">({item.barang_kode || '-'})</span>
                      </span>
                      <span className="font-bold text-slate-800 shrink-0">{item.jumlah} Unit</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-slate-200 space-y-0.5 text-[9px]">
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
