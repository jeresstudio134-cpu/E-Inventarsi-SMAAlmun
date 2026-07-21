import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, AlertCircle, Calendar, User as UserIcon, Phone, FileText, CheckCircle, RefreshCw, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { Peminjaman, Barang, User } from '../types.js';
import ExportButton from './ExportButton.js';

interface PeminjamanManagementProps {
  user: User;
  onRefreshStatsTrigger?: () => void;
  isOpenCreateModalExternally?: boolean;
  onCloseCreateModalExternally?: () => void;
}

export default function PeminjamanManagement({ user, onRefreshStatsTrigger, isOpenCreateModalExternally, onCloseCreateModalExternally }: PeminjamanManagementProps) {
  const [borrows, setBorrows] = useState<Peminjaman[]>([]);
  const [items, setItems] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Dipinjam' | 'Dikembalikan' | 'Terlambat'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBorrow, setSelectedBorrow] = useState<Peminjaman | null>(null);

  // Form State
  const [formNamaPeminjam, setFormNamaPeminjam] = useState('');
  const [formKontakPeminjam, setFormKontakPeminjam] = useState('');
  const [formBarangId, setFormBarangId] = useState<number>(0);
  const [formJumlah, setFormJumlah] = useState<number>(1);
  const [formTanggalPinjam, setFormTanggalPinjam] = useState('');
  const [formTanggalKembali, setFormTanggalKembali] = useState('');
  const [formStatus, setFormStatus] = useState<'Dipinjam' | 'Dikembalikan' | 'Terlambat'>('Dipinjam');
  const [formCatatan, setFormCatatan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load borrowing data and items
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bData = await api.getPeminjaman();
      setBorrows(bData);
      const iData = await api.getBarang();
      setItems(iData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data peminjaman.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to external modal opens from Dashboard
  useEffect(() => {
    if (isOpenCreateModalExternally) {
      openCreateModal();
    }
  }, [isOpenCreateModalExternally]);

  // Set default dates when opening create modal
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedBorrow(null);
    setFormNamaPeminjam('');
    setFormKontakPeminjam('');
    
    // Choose first available item as default if any
    const availableItems = items.filter(i => i.stok_tersedia > 0);
    setFormBarangId(availableItems.length > 0 ? availableItems[0].id : 0);
    
    setFormJumlah(1);
    
    // Default dates
    const today = new Date().toISOString().split('T')[0];
    setFormTanggalPinjam(today);
    
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    setFormTanggalKembali(threeDaysLater.toISOString().split('T')[0]);
    
    setFormStatus('Dipinjam');
    setFormCatatan('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (borrow: Peminjaman) => {
    setModalMode('edit');
    setSelectedBorrow(borrow);
    setFormNamaPeminjam(borrow.nama_peminjam);
    setFormKontakPeminjam(borrow.kontak_peminjam);
    setFormBarangId(borrow.barang_id);
    setFormJumlah(borrow.jumlah);
    setFormTanggalPinjam(borrow.tanggal_pinjam);
    setFormTanggalKembali(borrow.tanggal_kembali);
    setFormStatus(borrow.status);
    setFormCatatan(borrow.catatan || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Direct quick return register action
  const handleQuickReturn = async (borrow: Peminjaman) => {
    if (!confirm(`Apakah Anda yakin ingin memproses pengembalian barang untuk ${borrow.nama_peminjam}?`)) {
      return;
    }
    try {
      await api.updatePeminjaman(borrow.id, { status: 'Dikembalikan' });
      loadData();
      if (onRefreshStatsTrigger) onRefreshStatsTrigger();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status pengembalian.');
    }
  };

  // Handle submit (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaPeminjam || !formKontakPeminjam || !formBarangId || !formJumlah || !formTanggalPinjam || !formTanggalKembali) {
      setFormError('Mohon isi seluruh kolom wajib (*)');
      return;
    }

    // Validation: check stock availability during create
    const targetItem = items.find(i => i.id === formBarangId);
    if (!targetItem) {
      setFormError('Barang tidak valid.');
      return;
    }

    if (modalMode === 'create' && targetItem.stok_tersedia < formJumlah) {
      setFormError(`Stok tidak mencukupi. Stok tersedia saat ini: ${targetItem.stok_tersedia} unit.`);
      return;
    }

    // If edit, check stock change safely
    if (modalMode === 'edit' && selectedBorrow) {
      const stockDiff = formJumlah - selectedBorrow.jumlah;
      // If we are increasing the borrow amount and item is still active, verify stock
      if (formStatus !== 'Dikembalikan' && selectedBorrow.status !== 'Dikembalikan' && stockDiff > 0) {
        if (targetItem.stok_tersedia < stockDiff) {
          setFormError(`Stok tambahan tidak mencukupi. Tersedia: ${targetItem.stok_tersedia} unit.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      nama_peminjam: formNamaPeminjam,
      kontak_peminjam: formKontakPeminjam,
      barang_id: formBarangId,
      jumlah: formJumlah,
      tanggal_pinjam: formTanggalPinjam,
      tanggal_kembali: formTanggalKembali,
      status: formStatus,
      catatan: formCatatan
    };

    try {
      if (modalMode === 'create') {
        await api.createPeminjaman(payload);
      } else if (selectedBorrow) {
        await api.updatePeminjaman(selectedBorrow.id, payload);
      }

      setIsModalOpen(false);
      if (onCloseCreateModalExternally) onCloseCreateModalExternally();
      loadData();
      if (onRefreshStatsTrigger) onRefreshStatsTrigger();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan transaksi peminjaman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete transaction
  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan transaksi peminjaman ini? Jika barang masih dipinjam, stok barang terkait akan dikembalikan ke posisi semula.')) {
      return;
    }
    try {
      await api.deletePeminjaman(id);
      loadData();
      if (onRefreshStatsTrigger) onRefreshStatsTrigger();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi.');
    }
  };

  // Filter lists
  const filteredBorrows = borrows.filter(b => {
    const matchesSearch =
      b.nama_peminjam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.barang_nama && b.barang_nama.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.barang_kode && b.barang_kode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.kontak_peminjam.includes(searchQuery);

    const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Export headers configuration
  const exportColumns = [
    { key: 'nama_peminjam', label: 'Nama Peminjam' },
    { key: 'kontak_peminjam', label: 'No. Kontak/WA' },
    { key: 'barang_kode', label: 'Kode Barang' },
    { key: 'barang_nama', label: 'Nama Barang' },
    { key: 'jumlah', label: 'Jumlah Pinjam', format: (val: any) => String(val) },
    { key: 'tanggal_pinjam', label: 'Tanggal Pinjam' },
    { key: 'tanggal_kembali', label: 'Tenggat Kembali' },
    { key: 'status', label: 'Status' },
    { key: 'catatan', label: 'Catatan' }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Transaksi Peminjaman Barang
          </h2>
          <p className="text-sm text-slate-500">
            Catat peminjaman barang, pantau tenggat pengembalian, dan lakukan pemrosesan pengembalian instan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={filteredBorrows}
            columns={exportColumns}
            filename="Laporan_Peminjaman_Barang"
          />
          <button
            id="btn-tambah-pinjam-pemicu"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow shadow-blue-600/10 transition-all duration-150 outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Pinjam Barang</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-peminjaman"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari peminjam, nama barang, kode barang..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl text-slate-800 text-sm outline-none transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Status:
          </span>
          <div className="flex gap-1.5">
            {['All', 'Dipinjam', 'Dikembalikan', 'Terlambat'].map(status => (
              <button
                id={`filter-status-${status}`}
                key={status}
                onClick={() => setSelectedStatus(status as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status === 'All' ? 'Semua' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Memuat riwayat transaksi...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : filteredBorrows.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 flex flex-col items-center gap-3">
          <Calendar className="w-12 h-12 text-slate-300" />
          <div>
            <h4 className="font-semibold text-slate-700">Tidak Ada Data Peminjaman</h4>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan pencarian atau filter status Anda.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden xl:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Peminjam</th>
                  <th className="px-6 py-4">Barang</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Tanggal Pinjam</th>
                  <th className="px-6 py-4">Tenggat Kembali</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-sm text-slate-700">
                {filteredBorrows.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900">{b.nama_peminjam}</div>
                        <div className="text-xs text-slate-400 font-medium font-mono mt-0.5">{b.kontak_peminjam}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-900">{b.barang_nama}</div>
                        <div className="text-[11px] font-mono font-bold text-blue-500 mt-0.5">{b.barang_kode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-slate-900">{b.jumlah} Unit</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{b.tanggal_pinjam}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{b.tanggal_kembali}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                        b.status === 'Dipinjam'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : b.status === 'Dikembalikan'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-[150px] truncate" title={b.catatan}>
                      {b.catatan || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(b.status === 'Dipinjam' || b.status === 'Terlambat') && (
                          <button
                            id={`btn-kembali-cepat-${b.id}`}
                            onClick={() => handleQuickReturn(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold transition"
                            title="Proses Pengembalian Instan"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        )}
                        <button
                          id={`btn-edit-peminjaman-${b.id}`}
                          onClick={() => openEditModal(b)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition"
                          title="Ubah Rincian"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.role === 'Admin' && (
                          <button
                            id={`btn-hapus-peminjaman-${b.id}`}
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition"
                            title="Hapus Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:hidden gap-4">
            {filteredBorrows.map(b => (
              <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Header card */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-md truncate">{b.nama_peminjam}</h4>
                    <span className="text-xs text-slate-400 font-mono font-medium block mt-0.5">{b.kontak_peminjam}</span>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                    b.status === 'Dipinjam'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : b.status === 'Dikembalikan'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {b.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="py-3 px-4 bg-slate-50/50 rounded-xl border border-slate-100/50 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Barang Dipinjam:</span>
                    <span className="font-bold text-slate-800">{b.barang_nama} <span className="font-mono text-[10px] text-blue-500">({b.barang_kode})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kuantitas:</span>
                    <span className="font-bold text-slate-900 font-mono">{b.jumlah} Unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tanggal Pinjam:</span>
                    <span className="font-mono text-slate-600">{b.tanggal_pinjam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tenggat Kembali:</span>
                    <span className="font-mono text-slate-600">{b.tanggal_kembali}</span>
                  </div>
                </div>

                {b.catatan && (
                  <p className="text-xs text-slate-500 italic flex items-start gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>"{b.catatan}"</span>
                  </p>
                )}

                {/* Card footer actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  {(b.status === 'Dipinjam' || b.status === 'Terlambat') && (
                    <button
                      onClick={() => handleQuickReturn(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-xs font-semibold transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Kembalikan</span>
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                    title="Ubah"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {user.role === 'Admin' && (
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 border border-rose-100 hover:bg-rose-50 rounded-lg text-rose-500"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {modalMode === 'create' ? 'Buat Peminjaman Barang' : 'Ubah Data Peminjaman'}
              </h3>
              <button
                id="btn-close-modal-peminjaman"
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseCreateModalExternally) onCloseCreateModalExternally();
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Peminjam */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Peminjam (Siswa/Pegawai) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    id="form-pinjam-peminjam"
                    type="text"
                    value={formNamaPeminjam}
                    onChange={(e) => setFormNamaPeminjam(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* No Kontak */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  No. Kontak / WA Peminjam *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    id="form-pinjam-kontak"
                    type="text"
                    value={formKontakPeminjam}
                    onChange={(e) => setFormKontakPeminjam(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Barang Selection & Jumlah */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Barang Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Pilih Barang *
                  </label>
                  <select
                    id="form-pinjam-barang-id"
                    value={formBarangId}
                    onChange={(e) => setFormBarangId(parseInt(e.target.value, 10))}
                    disabled={modalMode === 'edit'} // Lock item during edits for simpler inventory tracking
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-sm outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value={0} disabled>-- Pilih Barang --</option>
                    {items.map(i => {
                      const isOutOfStock = i.stok_tersedia === 0 && modalMode === 'create';
                      return (
                        <option
                          key={i.id}
                          value={i.id}
                          disabled={isOutOfStock}
                        >
                          {i.nama} ({i.kode}) - Stok: {i.stok_tersedia} Unit
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Jumlah Pinjam */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Jumlah Unit *
                  </label>
                  <input
                    id="form-pinjam-jumlah"
                    type="number"
                    min="1"
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Tanggal Pinjam & Kembali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tgl Pinjam */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Tanggal Pinjam *
                  </label>
                  <input
                    id="form-pinjam-tgl-pinjam"
                    type="date"
                    value={formTanggalPinjam}
                    onChange={(e) => setFormTanggalPinjam(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>

                {/* Tgl Kembali */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Tenggat Pengembalian *
                  </label>
                  <input
                    id="form-pinjam-tgl-kembali"
                    type="date"
                    value={formTanggalKembali}
                    onChange={(e) => setFormTanggalKembali(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Status Selector (Only visible during EDIT mode) */}
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Status Transaksi *
                  </label>
                  <select
                    id="form-pinjam-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-sm outline-none transition"
                  >
                    <option value="Dipinjam">Dipinjam (Aktif)</option>
                    <option value="Dikembalikan">Dikembalikan (Selesai)</option>
                    <option value="Terlambat">Terlambat (Denda/Teguran)</option>
                  </select>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Catatan Tambahan
                </label>
                <textarea
                  id="form-pinjam-catatan"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Keterangan keperluan, jaminan KTP/Kartu Siswa, kondisi barang, dsb..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition resize-none"
                />
              </div>

              {/* Modal Footer / Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3.5">
                <button
                  id="btn-form-pinjam-batal"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onCloseCreateModalExternally) onCloseCreateModalExternally();
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border text-slate-600 font-semibold rounded-xl text-sm transition"
                >
                  Batal
                </button>
                <button
                  id="btn-form-pinjam-simpan"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
