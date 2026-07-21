import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, AlertCircle, MapPin, Layers, Hash, Info, X, Upload, Camera, Image } from 'lucide-react';
import { api } from '../lib/api.js';
import { Barang, User } from '../types.js';
import ExportButton from './ExportButton.js';

interface BarangManagementProps {
  user: User;
  onRefreshStatsTrigger?: () => void;
  // Shared triggers for shortcut actions
  isOpenCreateModalExternally?: boolean;
  onCloseCreateModalExternally?: () => void;
}

export default function BarangManagement({ user, onRefreshStatsTrigger, isOpenCreateModalExternally, onCloseCreateModalExternally }: BarangManagementProps) {
  const [items, setItems] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<Barang | null>(null);

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formKode, setFormKode] = useState('');
  const [formKategori, setFormKategori] = useState('');
  const [formStokTotal, setFormStokTotal] = useState<number>(1);
  const [formLokasi, setFormLokasi] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Load items
  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getBarang();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar barang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Listen to shortcut openings from Dashboard
  useEffect(() => {
    if (isOpenCreateModalExternally) {
      openCreateModal();
    }
  }, [isOpenCreateModalExternally]);

  // Unique categories list
  const categories = ['All', ...Array.from(new Set(items.map(item => item.kategori)))];

  // Auto Generate Kode Barang (BRG-XXX) helper
  const handleAutoGenerateCode = () => {
    const numbersOnly = items
      .map(item => {
        const match = item.kode.match(/BRG-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    const nextNum = numbersOnly.length > 0 ? Math.max(...numbersOnly) + 1 : 1;
    setFormKode(`BRG-${String(nextNum).padStart(3, '0')}`);
  };

  // Open modal for creating
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedItem(null);
    setFormNama('');
    setFormKode('');
    setFormKategori('');
    setFormStokTotal(5);
    setFormLokasi('');
    setFormDeskripsi('');
    setFormImageUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (item: Barang) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormNama(item.nama);
    setFormKode(item.kode);
    setFormKategori(item.kategori);
    setFormStokTotal(item.stok_total);
    setFormLokasi(item.lokasi);
    setFormDeskripsi(item.deskripsi || '');
    setFormImageUrl(item.image_url || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle image selection & upload to Cloudinary
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran file foto terlalu besar. Maksimal adalah 5MB.');
      return;
    }

    setIsUploading(true);
    setFormError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.uploadImage(base64Data);
        setFormImageUrl(res.url);
      } catch (err: any) {
        setFormError(err.message || 'Gagal mengupload gambar ke Cloudinary.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setFormError('Gagal membaca file gambar.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle modal submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama || !formKode || !formKategori || !formLokasi) {
      setFormError('Mohon isi semua bidang bertanda bintang wajib (*).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      nama: formNama,
      kode: formKode,
      kategori: formKategori,
      stok_total: formStokTotal,
      lokasi: formLokasi,
      deskripsi: formDeskripsi,
      image_url: formImageUrl
    };

    try {
      if (modalMode === 'create') {
        await api.createBarang(payload);
      } else if (selectedItem) {
        await api.updateBarang(selectedItem.id, payload);
      }
      
      setIsModalOpen(false);
      if (onCloseCreateModalExternally) onCloseCreateModalExternally();
      fetchItems();
      if (onRefreshStatsTrigger) onRefreshStatsTrigger();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini? Semua catatan transaksi peminjaman terkait barang ini juga akan ikut terhapus secara permanen.')) {
      return;
    }
    try {
      await api.deleteBarang(id);
      fetchItems();
      if (onRefreshStatsTrigger) onRefreshStatsTrigger();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus barang.');
    }
  };

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || item.kategori === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Prepare columns configuration for export
  const exportColumns = [
    { key: 'kode', label: 'Kode Barang' },
    { key: 'nama', label: 'Nama Barang' },
    { key: 'kategori', label: 'Kategori' },
    { key: 'stok_total', label: 'Stok Total', format: (val: any) => String(val) },
    { key: 'stok_tersedia', label: 'Stok Tersedia', format: (val: any) => String(val) },
    { key: 'lokasi', label: 'Lokasi Penyimpanan' },
    { key: 'deskripsi', label: 'Deskripsi Detail' }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Manajemen Inventaris Barang
          </h2>
          <p className="text-sm text-slate-500">
            Kelola data persediaan barang, nomor kode unik, lokasi, dan monitor tingkat ketersediaan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={filteredItems}
            columns={exportColumns}
            filename="Laporan_Data_Barang"
          />
          <button
            id="btn-tambah-barang-pemicu"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-sm font-medium shadow transition-all duration-150 outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
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
            id="search-barang"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, kode, atau lokasi..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl text-slate-800 text-sm outline-none transition"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Kategori:
          </span>
          <div className="flex gap-1.5">
            {categories.map(cat => (
              <button
                id={`filter-kategori-${cat}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat === 'All' ? 'Semua' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Contents List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Memuat data barang...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 flex flex-col items-center gap-3">
          <Layers className="w-12 h-12 text-slate-300" />
          <div>
            <h4 className="font-semibold text-slate-700">Barang Tidak Ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau kategori filter Anda.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Kode</th>
                  <th className="px-6 py-4">Nama Barang</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Stok (Tersedia / Total)</th>
                  <th className="px-6 py-4">Lokasi Penyimpanan</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredItems.map(item => {
                  const stockPct = item.stok_total > 0 ? (item.stok_tersedia / item.stok_total) * 100 : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{item.kode}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.nama}
                              referrerPolicy="no-referrer"
                              className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm hover:scale-110 active:scale-95 transition-transform duration-200 cursor-zoom-in"
                              onClick={() => {
                                setLightboxImage(item.image_url);
                                setLightboxTitle(item.nama);
                              }}
                              title="Klik untuk memperbesar foto"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                              <Image className="w-8 h-8" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{item.nama}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 w-36">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className={`font-bold ${item.stok_tersedia === 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                              {item.stok_tersedia} Unit
                            </span>
                            <span className="text-slate-400">/ {item.stok_total}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.stok_tersedia === 0
                                  ? 'bg-rose-500'
                                  : stockPct < 30
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{item.lokasi}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={item.deskripsi}>
                        {item.deskripsi || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-barang-${item.id}`}
                            onClick={() => openEditModal(item)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition"
                            title="Ubah Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user.role === 'Admin' && (
                            <button
                              id={`btn-hapus-barang-${item.id}`}
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredItems.map(item => {
              const stockPct = item.stok_total > 0 ? (item.stok_tersedia / item.stok_total) * 100 : 0;
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 items-start min-w-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.nama}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-transform duration-200 cursor-zoom-in"
                          onClick={() => {
                            setLightboxImage(item.image_url);
                            setLightboxTitle(item.nama);
                          }}
                          title="Klik untuk memperbesar foto"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <Image className="w-7 h-7" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-400 block tracking-wider uppercase">{item.kode}</span>
                        <h4 className="font-bold text-slate-900 text-md truncate mt-0.5">{item.nama}</h4>
                        <span className="inline-flex px-2 py-0.5 mt-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded">
                          {item.kategori}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {user.role === 'Admin' && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 border border-rose-100 hover:bg-rose-50 rounded-lg text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Stok Tersedia:</span>
                      <span className={`font-mono font-extrabold ${item.stok_tersedia === 0 ? 'text-rose-600' : 'text-slate-950'}`}>
                        {item.stok_tersedia} / {item.stok_total} Unit
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border">
                      <div
                        className={`h-full rounded-full ${
                          item.stok_tersedia === 0
                            ? 'bg-rose-500'
                            : stockPct < 30
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200/60 text-slate-600 font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.lokasi}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.deskripsi || 'No description'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CRUD Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {modalMode === 'create' ? 'Tambah Barang Baru' : 'Ubah Data Barang'}
              </h3>
              <button
                id="btn-close-modal-barang"
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseCreateModalExternally) onCloseCreateModalExternally();
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Kode Barang Input (With Auto Generate button) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Kode Barang *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Hash className="w-4 h-4" />
                    </span>
                    <input
                      id="form-barang-kode"
                      type="text"
                      value={formKode}
                      onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                      placeholder="Contoh: BRG-001"
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition uppercase"
                    />
                  </div>
                  <button
                    id="btn-auto-kode"
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    title="Generate Kode Otomatis"
                  >
                    Otomatis
                  </button>
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Barang *
                </label>
                <input
                  id="form-barang-nama"
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Laptop Lenovo ThinkPad L13"
                  className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kategori */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Kategori *
                  </label>
                  <input
                    id="form-barang-kategori"
                    type="text"
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    placeholder="Contoh: Elektronik, Audio, Media"
                    className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Stok Total */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Stok Total *
                  </label>
                  <input
                    id="form-barang-stok"
                    type="number"
                    min="1"
                    value={formStokTotal}
                    onChange={(e) => setFormStokTotal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Lokasi Penyimpanan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Lokasi Penyimpanan *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    id="form-barang-lokasi"
                    type="text"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    placeholder="Contoh: Lab Komputer B, Lemari Multimedia"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Keterangan / Deskripsi Barang
                </label>
                <textarea
                  id="form-barang-deskripsi"
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Keterangan kondisi fisik barang, merk, kelengkapan, dsb..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition resize-none"
                />
              </div>

              {/* Upload Foto Barang (Cloudinary) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>Foto Barang (Cloudinary)</span>
                </label>
                
                <div className="space-y-3">
                  {formImageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-3 group h-64 md:h-72">
                      <img
                        src={formImageUrl}
                        alt="Preview Barang"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full rounded-xl object-contain shadow-sm cursor-zoom-in hover:scale-[1.02] transition-transform duration-200"
                        onClick={() => {
                          setLightboxImage(formImageUrl);
                          setLightboxTitle(formNama || 'Preview Foto Baru');
                        }}
                        title="Klik untuk memperbesar foto"
                      />
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                        title="Hapus Foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-6 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition group min-h-[120px]">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                          <span className="text-xs text-slate-500 font-medium animate-pulse">Mengupload foto ke Cloudinary...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-center">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition mb-1" />
                          <span className="text-xs font-semibold text-slate-700">Pilih Foto atau Klik di Sini</span>
                          <span className="text-[10px] text-slate-400">Format PNG, JPG, atau WEBP (Maksimal 5MB)</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Modal Footer / Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {modalMode === 'edit' && (
                    user.role === 'Admin' ? (
                      <button
                        id="btn-form-barang-hapus"
                        type="button"
                        onClick={() => {
                          if (selectedItem) {
                            handleDelete(selectedItem.id);
                            setIsModalOpen(false);
                            if (onCloseCreateModalExternally) onCloseCreateModalExternally();
                          }
                        }}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold rounded-xl text-sm transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus Barang</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg block">
                        🔒 Hanya Admin yang dapat menghapus data barang
                      </span>
                    )
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    id="btn-form-barang-batal"
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
                    id="btn-form-barang-simpan"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Simpan</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Preview */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 transition-all duration-300 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-white/80 text-xs font-medium font-mono bg-slate-900/60 backdrop-blur px-3 py-1.5 rounded-full select-none">
              {lightboxTitle}
            </span>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
              title="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div 
            className="relative max-w-4xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt={lightboxTitle}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
            />
          </div>
          <p className="text-white/60 text-xs mt-4 select-none font-medium">Klik di mana saja untuk menutup</p>
        </div>
      )}
    </div>
  );
}
