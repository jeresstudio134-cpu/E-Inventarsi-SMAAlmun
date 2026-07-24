import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Clock, User, Phone, MapPin, Shield, FileText, CheckCircle2, AlertCircle, X, Share2, Printer, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { Barang, Peminjaman } from '../types.js';
import { api } from '../lib/api.js';
import CetakBuktiA6Modal, { buildBookingWhatsAppText } from './CetakBuktiA6Modal.js';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Barang[];
  selectedItem?: Barang | null;
  onSuccessTrigger?: () => void;
}

export default function BookingModal({ isOpen, onClose, items, selectedItem, onSuccessTrigger }: BookingModalProps) {
  // Form Fields based on exact specified format
  const [namaLengkap, setNamaLengkap] = useState('');
  const [akunMedsos, setAkunMedsos] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [alamatDomisili, setAlamatDomisili] = useState('');
  
  // Multi-item selection list
  const [selectedItems, setSelectedItems] = useState<Array<{ barangId: number; jumlahUnit: number }>>([
    { barangId: 0, jumlahUnit: 1 }
  ]);

  const [tanggalMulai, setTanggalMulai] = useState('');
  const [jamMulai, setJamMulai] = useState('08:00');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('17:00');
  const [jaminanSewa, setJaminanSewa] = useState('');
  const [keperluanAcara, setKeperluanAcara] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBookings, setCreatedBookings] = useState<Peminjaman[]>([]);
  const [copiedWA, setCopiedWA] = useState(false);
  const [isA6ModalOpen, setIsA6ModalOpen] = useState(false);

  // Initialize defaults
  useEffect(() => {
    if (isOpen) {
      setNamaLengkap('');
      setAkunMedsos('');
      setNoWhatsapp('');
      setAlamatDomisili('');
      
      if (selectedItem) {
        setSelectedItems([{ barangId: selectedItem.id, jumlahUnit: 1 }]);
      } else if (items.length > 0) {
        setSelectedItems([{ barangId: items[0].id, jumlahUnit: 1 }]);
      } else {
        setSelectedItems([{ barangId: 0, jumlahUnit: 1 }]);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      setTanggalMulai(todayStr);
      setJamMulai('08:00');

      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      setTanggalSelesai(nextDay.toISOString().split('T')[0]);
      setJamSelesai('17:00');

      setJaminanSewa('KTP & SIM A');
      setKeperluanAcara('');
      setError(null);
      setCreatedBookings([]);
    }
  }, [isOpen, selectedItem, items]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    const chosenIds = new Set(selectedItems.map(i => i.barangId));
    const availableNext = items.find(i => !chosenIds.has(i.id) && i.stok_tersedia > 0) || items[0];
    if (availableNext) {
      setSelectedItems(prev => [...prev, { barangId: availableNext.id, jumlahUnit: 1 }]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemRowChange = (index: number, field: 'barangId' | 'jumlahUnit', val: number) => {
    setSelectedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap || !akunMedsos || !noWhatsapp || !alamatDomisili || !tanggalMulai || !tanggalSelesai || !jaminanSewa || !keperluanAcara) {
      setError('Mohon lengkapi seluruh kolom formulir booking (*).');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Mohon pilih minimal 1 barang/alat untuk disewa.');
      return;
    }

    // Validate barang selections
    for (const itemRow of selectedItems) {
      if (!itemRow.barangId || itemRow.barangId <= 0) {
        setError('Mohon pilih barang yang valid pada semua daftar pinjaman.');
        return;
      }
    }

    // Validate duplicates
    const selectedIds = selectedItems.map(i => i.barangId);
    const uniqueIds = new Set(selectedIds);
    if (uniqueIds.size < selectedIds.length) {
      setError('Terdapat barang yang dipilih lebih dari satu kali. Mohon gabungkan jumlah unitnya pada satu baris.');
      return;
    }

    // Validate stock limits
    for (const itemRow of selectedItems) {
      const targetBarang = items.find(i => i.id === itemRow.barangId);
      if (!targetBarang) {
        setError('Terdapat pilihan barang yang tidak valid.');
        return;
      }
      if (targetBarang.stok_tersedia < itemRow.jumlahUnit) {
        setError(`Stok alat "${targetBarang.nama}" tidak mencukupi. Sisa stok tersedia: ${targetBarang.stok_tersedia} unit.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const createdList: Peminjaman[] = [];
      for (const itemRow of selectedItems) {
        const payload = {
          nama_peminjam: namaLengkap,
          kontak_peminjam: noWhatsapp,
          akun_medsos: akunMedsos,
          alamat_domisili: alamatDomisili,
          barang_id: itemRow.barangId,
          jumlah: itemRow.jumlahUnit,
          tanggal_pinjam: tanggalMulai,
          tanggal_kembali: tanggalSelesai,
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai,
          jaminan: jaminanSewa,
          keperluan_acara: keperluanAcara,
          catatan: `Booking Sewa (${selectedItems.length} barang): ${keperluanAcara}`
        };

        const result = await api.createPublicBooking(payload);
        createdList.push(result);
      }

      setCreatedBookings(createdList);
      if (onSuccessTrigger) onSuccessTrigger();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim pengajuan booking sewa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyWA = () => {
    if (createdBookings.length === 0) return;
    const text = buildBookingWhatsAppText(createdBookings);
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
          
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Form Booking Sewa Alat</h3>
                <p className="text-xs text-slate-300">Isi data peminjaman/booking sesuai format resmi sekolah</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6">

            {/* If Successful Booking Submission */}
            {createdBookings.length > 0 ? (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-base text-emerald-950">Permohonan Booking Sewa Berhasil Terkirim!</h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Data booking ({createdBookings.length} barang) telah tersimpan dengan ID Transaksi <span className="font-mono font-bold">TRX-{Math.min(...createdBookings.map(b => b.id)).toString().padStart(4, '0')}</span>. Silakan simpan format pesan di bawah ini atau cetak bukti sewa A6 untuk diserahkan ke petugas lab.
                    </p>
                  </div>
                </div>

                {/* Text Summary Format Preview */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                  {buildBookingWhatsAppText(createdBookings)}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleCopyWA}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition shadow-sm cursor-pointer"
                  >
                    {copiedWA ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedWA ? 'Format WA Tersalin!' : 'Salin Format Ke WhatsApp'}</span>
                  </button>

                  <button
                    onClick={() => setIsA6ModalOpen(true)}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Bukti Sewa A6</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleSubmit} className="space-y-5">

                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Section 1: Data Diri */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Data Penyewa / Pemohon</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={namaLengkap}
                        onChange={(e) => setNamaLengkap(e.target.value)}
                        placeholder="Contoh: Ahmad Rizky"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Akun Medsos (IG/TikTok) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={akunMedsos}
                        onChange={(e) => setAkunMedsos(e.target.value)}
                        placeholder="Contoh: @ahmad_rizky / tiktok"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        No. WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={noWhatsapp}
                        onChange={(e) => setNoWhatsapp(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Alamat Domisili / Shareloc <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={alamatDomisili}
                        onChange={(e) => setAlamatDomisili(e.target.value)}
                        placeholder="Contoh: Bululawang / Shareloc link"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Detail Alat Multiple */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>2. Tipe Kamera / Peralatan yang Disewa</span>
                    </h4>

                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Barang</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedItems.map((itemRow, idx) => {
                      const selectedBarangData = items.find(i => i.id === itemRow.barangId);
                      return (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="font-bold text-slate-700">Barang #{idx + 1}</span>
                            {selectedItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-md transition cursor-pointer flex items-center gap-1 text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Pilih Peralatan <span className="text-rose-500">*</span>
                              </label>
                              <select
                                value={itemRow.barangId}
                                onChange={(e) => handleItemRowChange(idx, 'barangId', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                              >
                                <option value={0}>-- Pilih Peralatan --</option>
                                {items.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {item.nama} ({item.kode}) - Tersedia: {item.stok_tersedia} unit
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Jumlah Unit <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={selectedBarangData ? selectedBarangData.stok_tersedia : 10}
                                value={itemRow.jumlahUnit}
                                onChange={(e) => handleItemRowChange(idx, 'jumlahUnit', Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                              />
                            </div>
                          </div>

                          {selectedBarangData && (
                            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                              <span>Sisa stok tersedia: <strong className="text-slate-800">{selectedBarangData.stok_tersedia} Unit</strong></span>
                              <span className="text-blue-600 font-semibold">{selectedBarangData.kategori}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Waktu Sewa */}

                {/* Section 3: Waktu Sewa */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>3. Tanggal & Waktu Sewa</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal & Jam Mulai Sewa <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={tanggalMulai}
                          onChange={(e) => setTanggalMulai(e.target.value)}
                          className="w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                        />
                        <input
                          type="time"
                          required
                          value={jamMulai}
                          onChange={(e) => setJamMulai(e.target.value)}
                          className="w-1/3 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-center font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal & Jam Selesai Sewa <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={tanggalSelesai}
                          onChange={(e) => setTanggalSelesai(e.target.value)}
                          className="w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                        />
                        <input
                          type="time"
                          required
                          value={jamSelesai}
                          onChange={(e) => setJamSelesai(e.target.value)}
                          className="w-1/3 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Jaminan & Keperluan */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>4. Jaminan & Keperluan Acara</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jaminan Sewa (Min. 2 Identitas Asli) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={jaminanSewa}
                        onChange={(e) => setJaminanSewa(e.target.value)}
                        placeholder="Contoh: KTP & SIM A"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Keperluan Acara / Kegiatan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={keperluanAcara}
                        onChange={(e) => setKeperluanAcara(e.target.value)}
                        placeholder="Contoh: Pengambilan video dokumenter sekolah"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition shadow-md shadow-blue-600/15 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Mengirim Booking...</span>
                      </>
                    ) : (
                      <span>Kirim Booking Sewa</span>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* Modal Footer */}
          {createdBookings.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          )}

        </div>
      </div>

      {/* A6 Print Modal Nested */}
      {createdBookings.length > 0 && (
        <CetakBuktiA6Modal
          borrows={createdBookings}
          isOpen={isA6ModalOpen}
          onClose={() => setIsA6ModalOpen(false)}
        />
      )}
    </>
  );
}
