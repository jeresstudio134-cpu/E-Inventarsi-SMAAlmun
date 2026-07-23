import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, AlertCircle, Calendar, User as UserIcon, Phone, FileText, CheckCircle, RefreshCw, X, Printer, Share2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { Peminjaman, Barang, User } from '../types.js';
import ExportButton from './ExportButton.js';
import CetakBuktiA6Modal from './CetakBuktiA6Modal.js';

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
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Booking' | 'Dipinjam' | 'Dikembalikan' | 'Terlambat'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBorrow, setSelectedBorrow] = useState<Peminjaman | null>(null);

  // Print A6 Receipt State
  const [printBorrowItems, setPrintBorrowItems] = useState<Peminjaman[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form State
  const [formNamaPeminjam, setFormNamaPeminjam] = useState('');
  const [formAkunMedsos, setFormAkunMedsos] = useState('');
  const [formKontakPeminjam, setFormKontakPeminjam] = useState('');
  const [formAlamatDomisili, setFormAlamatDomisili] = useState('');
  const [formBarangId, setFormBarangId] = useState<number>(0);
  const [formJumlah, setFormJumlah] = useState<number>(1);
  const [formSelectedItems, setFormSelectedItems] = useState<Array<{ barangId: number; jumlah: number }>>([
    { barangId: 0, jumlah: 1 }
  ]);
  const [formTanggalPinjam, setFormTanggalPinjam] = useState('');
  const [formJamMulai, setFormJamMulai] = useState('08:00');
  const [formTanggalKembali, setFormTanggalKembali] = useState('');
  const [formJamSelesai, setFormJamSelesai] = useState('17:00');
  const [formJaminan, setFormJaminan] = useState('KTP & SIM A');
  const [formKeperluanAcara, setFormKeperluanAcara] = useState('');
  const [formStatus, setFormStatus] = useState<'Booking' | 'Dipinjam' | 'Dikembalikan' | 'Terlambat' | 'Batal'>('Dipinjam');
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
    setFormAkunMedsos('');
    setFormKontakPeminjam('');
    setFormAlamatDomisili('');
    
    // Choose first available item as default if any
    const availableItems = items.filter(i => i.stok_tersedia > 0);
    const firstId = availableItems.length > 0 ? availableItems[0].id : (items.length > 0 ? items[0].id : 0);
    setFormBarangId(firstId);
    setFormJumlah(1);
    setFormSelectedItems([{ barangId: firstId, jumlah: 1 }]);
    
    // Default dates & time
    const today = new Date().toISOString().split('T')[0];
    setFormTanggalPinjam(today);
    setFormJamMulai('08:00');
    
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    setFormTanggalKembali(threeDaysLater.toISOString().split('T')[0]);
    setFormJamSelesai('17:00');
    
    setFormJaminan('KTP & SIM A');
    setFormKeperluanAcara('');
    setFormStatus('Dipinjam');
    setFormCatatan('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (borrow: Peminjaman) => {
    setModalMode('edit');
    setSelectedBorrow(borrow);
    setFormNamaPeminjam(borrow.nama_peminjam);
    setFormAkunMedsos(borrow.akun_medsos || '');
    setFormKontakPeminjam(borrow.kontak_peminjam);
    setFormAlamatDomisili(borrow.alamat_domisili || '');
    setFormBarangId(borrow.barang_id);
    setFormJumlah(borrow.jumlah);
    setFormTanggalPinjam(borrow.tanggal_pinjam);
    setFormJamMulai(borrow.jam_mulai || '08:00');
    setFormTanggalKembali(borrow.tanggal_kembali);
    setFormJamSelesai(borrow.jam_selesai || '17:00');
    setFormJaminan(borrow.jaminan || 'KTP & SIM A');
    setFormKeperluanAcara(borrow.keperluan_acara || '');
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
    if (!formNamaPeminjam || !formKontakPeminjam || !formTanggalPinjam || !formTanggalKembali) {
      setFormError('Mohon isi seluruh kolom wajib (*)');
      return;
    }

    if (modalMode === 'create') {
      if (formSelectedItems.length === 0) {
        setFormError('Pilih minimal 1 barang/alat yang ingin dipinjam.');
        return;
      }

      for (const row of formSelectedItems) {
        if (!row.barangId || row.barangId <= 0) {
          setFormError('Mohon pilih barang yang valid.');
          return;
        }
        const target = items.find(i => i.id === row.barangId);
        if (!target) {
          setFormError('Barang tidak ditemukan.');
          return;
        }
        if (target.stok_tersedia < row.jumlah) {
          setFormError(`Stok "${target.nama}" tidak mencukupi. Tersedia: ${target.stok_tersedia} unit.`);
          return;
        }
      }

      const selectedIds = formSelectedItems.map(i => i.barangId);
      if (new Set(selectedIds).size < selectedIds.length) {
        setFormError('Terdapat barang yang dipilih lebih dari satu kali. Mohon gabungkan jumlahnya.');
        return;
      }
    } else {
      // Edit mode validation
      const targetItem = items.find(i => i.id === formBarangId);
      if (!targetItem) {
        setFormError('Barang tidak valid.');
        return;
      }
      if (selectedBorrow) {
        const stockDiff = formJumlah - selectedBorrow.jumlah;
        if (formStatus !== 'Dikembalikan' && selectedBorrow.status !== 'Dikembalikan' && stockDiff > 0) {
          if (targetItem.stok_tersedia < stockDiff) {
            setFormError(`Stok tambahan tidak mencukupi. Tersedia: ${targetItem.stok_tersedia} unit.`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'create') {
        for (const row of formSelectedItems) {
          const payload = {
            nama_peminjam: formNamaPeminjam,
            kontak_peminjam: formKontakPeminjam,
            akun_medsos: formAkunMedsos,
            alamat_domisili: formAlamatDomisili,
            barang_id: row.barangId,
            jumlah: row.jumlah,
            tanggal_pinjam: formTanggalPinjam,
            tanggal_kembali: formTanggalKembali,
            jam_mulai: formJamMulai,
            jam_selesai: formJamSelesai,
            jaminan: formJaminan,
            keperluan_acara: formKeperluanAcara,
            status: formStatus,
            catatan: formCatatan
          };
          await api.createPeminjaman(payload);
        }
      } else if (selectedBorrow) {
        const payload = {
          nama_peminjam: formNamaPeminjam,
          kontak_peminjam: formKontakPeminjam,
          akun_medsos: formAkunMedsos,
          alamat_domisili: formAlamatDomisili,
          barang_id: formBarangId,
          jumlah: formJumlah,
          tanggal_pinjam: formTanggalPinjam,
          tanggal_kembali: formTanggalKembali,
          jam_mulai: formJamMulai,
          jam_selesai: formJamSelesai,
          jaminan: formJaminan,
          keperluan_acara: formKeperluanAcara,
          status: formStatus,
          catatan: formCatatan
        };
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

  // Handle Cetak Bukti (Groups all items for the same borrower session if more than 1)
  const handlePrintBukti = (b: Peminjaman) => {
    const nameClean = (b.nama_peminjam || '').trim().toLowerCase();
    const phoneClean = (b.kontak_peminjam || '').trim();
    
    // Find all matching items belonging to the same borrower & date session
    const matchingGroup = borrows.filter(item => {
      const iName = (item.nama_peminjam || '').trim().toLowerCase();
      const iPhone = (item.kontak_peminjam || '').trim();
      return (
        iName === nameClean &&
        iPhone === phoneClean &&
        item.tanggal_pinjam === b.tanggal_pinjam &&
        item.tanggal_kembali === b.tanggal_kembali
      );
    });

    setPrintBorrowItems(matchingGroup.length > 0 ? matchingGroup : [b]);
    setIsPrintModalOpen(true);
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

  // Grouping borrows by borrower name, contact, borrow date & return date
  interface BorrowGroup {
    groupKey: string;
    nama_peminjam: string;
    kontak_peminjam: string;
    akun_medsos: string;
    alamat_domisili: string;
    tanggal_pinjam: string;
    tanggal_kembali: string;
    jam_mulai: string;
    jam_selesai: string;
    jaminan: string;
    keperluan_acara: string;
    catatan: string;
    status: string;
    items: Peminjaman[];
  }

  const groupedBorrows: BorrowGroup[] = useMemo(() => {
    const groupsMap = new Map<string, BorrowGroup>();

    for (const b of filteredBorrows) {
      const nameClean = (b.nama_peminjam || '').trim().toLowerCase();
      const phoneClean = (b.kontak_peminjam || '').trim();
      const key = `${nameClean}_${phoneClean}_${b.tanggal_pinjam}_${b.tanggal_kembali}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          groupKey: key,
          nama_peminjam: b.nama_peminjam,
          kontak_peminjam: b.kontak_peminjam,
          akun_medsos: b.akun_medsos || '',
          alamat_domisili: b.alamat_domisili || '',
          tanggal_pinjam: b.tanggal_pinjam,
          tanggal_kembali: b.tanggal_kembali,
          jam_mulai: b.jam_mulai || '',
          jam_selesai: b.jam_selesai || '',
          jaminan: b.jaminan || '',
          keperluan_acara: b.keperluan_acara || '',
          catatan: b.catatan || '',
          status: b.status,
          items: [b]
        });
      } else {
        const group = groupsMap.get(key)!;
        group.items.push(b);
        const statuses = group.items.map(i => i.status);
        if (statuses.every(s => s === 'Dikembalikan')) {
          group.status = 'Dikembalikan';
        } else if (statuses.includes('Terlambat')) {
          group.status = 'Terlambat';
        } else if (statuses.includes('Dipinjam')) {
          group.status = 'Dipinjam';
        } else {
          group.status = statuses[0];
        }
      }
    }

    return Array.from(groupsMap.values());
  }, [filteredBorrows]);

  const handleQuickReturnGroup = async (group: BorrowGroup) => {
    const activeItems = group.items.filter(i => i.status !== 'Dikembalikan');
    if (activeItems.length === 0) return;

    if (!confirm(`Apakah Anda yakin ingin memproses pengembalian seluruh barang (${activeItems.length} barang) untuk ${group.nama_peminjam}?`)) {
      return;
    }
    try {
      for (const item of activeItems) {
        await api.updatePeminjaman(item.id, { status: 'Dikembalikan' });
      }
      loadData();
      if (onRefreshStatsTrigger) onRefreshStatsTrigger();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status pengembalian.');
    }
  };

  const handleDeleteGroup = async (group: BorrowGroup) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus seluruh log transaksi peminjaman (${group.items.length} barang) untuk ${group.nama_peminjam}?`)) {
      return;
    }
    try {
      for (const item of group.items) {
        await api.deletePeminjaman(item.id);
      }
      loadData();
      if (onRefreshStatsTrigger) onRefreshStatsTrigger();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi.');
    }
  };

  const handlePrintBuktiGroup = (group: BorrowGroup) => {
    setPrintBorrowItems(group.items);
    setIsPrintModalOpen(true);
  };

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
            {['All', 'Booking', 'Dipinjam', 'Dikembalikan', 'Terlambat'].map(status => (
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
      ) : groupedBorrows.length === 0 ? (
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
                  <th className="px-6 py-4">Barang Dipinjam</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Tanggal Pinjam</th>
                  <th className="px-6 py-4">Tenggat Kembali</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-sm text-slate-700">
                {groupedBorrows.map(g => (
                  <tr key={g.groupKey} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900">{g.nama_peminjam}</div>
                        <div className="text-xs text-slate-400 font-medium font-mono mt-0.5">{g.kontak_peminjam}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {g.items.map((item, idx) => (
                          <div key={item.id} className="text-xs flex items-center gap-1.5">
                            {g.items.length > 1 && <span className="text-slate-400 font-semibold">{idx + 1}.</span>}
                            <span className="font-semibold text-slate-900">{item.barang_nama}</span>
                            <span className="text-[11px] font-mono font-bold text-blue-500">({item.barang_kode})</span>
                            {g.items.length > 1 && <span className="font-mono text-slate-600 font-bold text-[11px]">[{item.jumlah} Unit]</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-slate-900">
                      {g.items.reduce((acc, curr) => acc + curr.jumlah, 0)} Unit
                      {g.items.length > 1 && (
                        <span className="block text-[11px] font-normal text-slate-400 font-sans">
                          ({g.items.length} jenis)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{g.tanggal_pinjam}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{g.tanggal_kembali}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                        g.status === 'Booking'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : g.status === 'Dipinjam'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : g.status === 'Dikembalikan'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-[150px] truncate" title={g.catatan}>
                      {g.catatan || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrintBuktiGroup(g)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg transition cursor-pointer"
                          title="Cetak Bukti A6"
                        >
                          <Printer className="w-4 h-4 text-blue-600" />
                        </button>

                        {(g.status === 'Booking' || g.status === 'Dipinjam' || g.status === 'Terlambat') && (
                          <button
                            onClick={() => handleQuickReturnGroup(g)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Proses Pengembalian Seluruh Barang"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(g.items[0])}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
                          title="Ubah Rincian"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.role === 'Admin' && (
                          <button
                            onClick={() => handleDeleteGroup(g)}
                            className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition cursor-pointer"
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
            {groupedBorrows.map(g => (
              <div key={g.groupKey} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Header card */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-md truncate">{g.nama_peminjam}</h4>
                    <span className="text-xs text-slate-400 font-mono font-medium block mt-0.5">{g.kontak_peminjam}</span>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                    g.status === 'Dipinjam'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : g.status === 'Dikembalikan'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : g.status === 'Booking'
                      ? 'bg-purple-50 text-purple-700 border border-purple-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {g.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="py-3 px-4 bg-slate-50/50 rounded-xl border border-slate-100/50 space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-700 border-b border-slate-200/60 pb-1.5 flex justify-between">
                    <span>Barang Dipinjam ({g.items.length} Jenis)</span>
                    <span className="text-slate-900 font-mono">Total {g.items.reduce((a, b) => a + b.jumlah, 0)} Unit</span>
                  </div>

                  <div className="space-y-1.5 py-0.5">
                    {g.items.map((item, idx) => (
                      <div key={item.id} className="flex justify-between items-start gap-2 text-xs">
                        <span className="font-bold text-slate-800 leading-snug">
                          {g.items.length > 1 ? `${idx + 1}. ` : ''}{item.barang_nama}{' '}
                          <span className="font-mono text-[10px] text-blue-500 font-medium">({item.barang_kode})</span>
                        </span>
                        <span className="font-bold font-mono text-slate-900 shrink-0">{item.jumlah} Unit</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 space-y-1 text-slate-500 text-xs">
                    <div className="flex justify-between">
                      <span>Tanggal Pinjam:</span>
                      <span className="font-mono text-slate-700">{g.tanggal_pinjam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenggat Kembali:</span>
                      <span className="font-mono text-slate-700">{g.tanggal_kembali}</span>
                    </div>
                  </div>
                </div>

                {g.catatan && (
                  <p className="text-xs text-slate-500 italic flex items-start gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>"{g.catatan}"</span>
                  </p>
                )}

                {/* Card footer actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handlePrintBuktiGroup(g)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Bukti</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {(g.status === 'Booking' || g.status === 'Dipinjam' || g.status === 'Terlambat') && (
                      <button
                        onClick={() => handleQuickReturnGroup(g)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Kembalikan</span>
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(g.items[0])}
                      className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer"
                      title="Ubah Rincian"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {user.role === 'Admin' && (
                      <button
                        onClick={() => handleDeleteGroup(g)}
                        className="p-1.5 border border-rose-100 hover:bg-rose-50 rounded-xl text-rose-500 cursor-pointer"
                        title="Hapus Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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

              {/* Nama Peminjam & Medsos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Nama Peminjam *
                  </label>
                  <input
                    id="form-pinjam-peminjam"
                    type="text"
                    value={formNamaPeminjam}
                    onChange={(e) => setFormNamaPeminjam(e.target.value)}
                    placeholder="Contoh: Ahmad Rizky"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Akun Medsos (IG/TikTok)
                  </label>
                  <input
                    type="text"
                    value={formAkunMedsos}
                    onChange={(e) => setFormAkunMedsos(e.target.value)}
                    placeholder="Contoh: @ahmad_rizky"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* No Kontak & Alamat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    No. WA / HP Aktif *
                  </label>
                  <input
                    id="form-pinjam-kontak"
                    type="text"
                    value={formKontakPeminjam}
                    onChange={(e) => setFormKontakPeminjam(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Alamat Domisili / Shareloc
                  </label>
                  <input
                    type="text"
                    value={formAlamatDomisili}
                    onChange={(e) => setFormAlamatDomisili(e.target.value)}
                    placeholder="Contoh: Bululawang"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Barang Selection & Jumlah */}
              {modalMode === 'create' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Daftar Barang / Alat Disewa *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chosen = new Set(formSelectedItems.map(i => i.barangId));
                        const next = items.find(i => !chosen.has(i.id) && i.stok_tersedia > 0) || items[0];
                        if (next) {
                          setFormSelectedItems([...formSelectedItems, { barangId: next.id, jumlah: 1 }]);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Barang</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formSelectedItems.map((row, idx) => {
                      const itemData = items.find(i => i.id === row.barangId);
                      return (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="font-bold text-slate-700">Barang #{idx + 1}</span>
                            {formSelectedItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setFormSelectedItems(formSelectedItems.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-md transition cursor-pointer flex items-center gap-1 text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <select
                                value={row.barangId}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setFormSelectedItems(prev => {
                                    const u = [...prev];
                                    u[idx] = { ...u[idx], barangId: val };
                                    return u;
                                  });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition font-medium text-slate-800"
                              >
                                <option value={0} disabled>-- Pilih Barang --</option>
                                {items.map(i => (
                                  <option key={i.id} value={i.id} disabled={i.stok_tersedia === 0}>
                                    {i.nama} ({i.kode}) - Stok: {i.stok_tersedia} Unit
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <input
                                type="number"
                                min="1"
                                max={itemData ? itemData.stok_tersedia : 10}
                                value={row.jumlah}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                  setFormSelectedItems(prev => {
                                    const u = [...prev];
                                    u[idx] = { ...u[idx], jumlah: val };
                                    return u;
                                  });
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Pilih Barang / Alat *
                    </label>
                    <select
                      id="form-pinjam-barang-id"
                      value={formBarangId}
                      onChange={(e) => setFormBarangId(parseInt(e.target.value, 10))}
                      disabled={modalMode === 'edit'}
                      className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value={0} disabled>-- Pilih Barang --</option>
                      {items.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.nama} ({i.kode}) - Stok: {i.stok_tersedia} Unit
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Jumlah Unit *
                    </label>
                    <input
                      id="form-pinjam-jumlah"
                      type="number"
                      min="1"
                      value={formJumlah}
                      onChange={(e) => setFormJumlah(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Tanggal & Jam Pinjam / Kembali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Mulai Sewa (Tgl & Jam) *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={formTanggalPinjam}
                      onChange={(e) => setFormTanggalPinjam(e.target.value)}
                      className="w-2/3 px-2 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                    />
                    <input
                      type="time"
                      value={formJamMulai}
                      onChange={(e) => setFormJamMulai(e.target.value)}
                      className="w-1/3 px-1 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition text-center font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Selesai Sewa (Tgl & Jam) *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={formTanggalKembali}
                      onChange={(e) => setFormTanggalKembali(e.target.value)}
                      className="w-2/3 px-2 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                    />
                    <input
                      type="time"
                      value={formJamSelesai}
                      onChange={(e) => setFormJamSelesai(e.target.value)}
                      className="w-1/3 px-1 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Jaminan & Keperluan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Jaminan Sewa (Min. 2 Identitas)
                  </label>
                  <input
                    type="text"
                    value={formJaminan}
                    onChange={(e) => setFormJaminan(e.target.value)}
                    placeholder="Contoh: KTP & SIM A"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Keperluan Acara
                  </label>
                  <input
                    type="text"
                    value={formKeperluanAcara}
                    onChange={(e) => setFormKeperluanAcara(e.target.value)}
                    placeholder="Contoh: Dokumentasi Pentas Seni"
                    className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Status Transaksi *
                </label>
                <select
                  id="form-pinjam-status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition font-semibold"
                >
                  <option value="Booking">Booking (Reservasi Aktif)</option>
                  <option value="Dipinjam">Dipinjam (Barang Diambil)</option>
                  <option value="Dikembalikan">Dikembalikan (Selesai)</option>
                  <option value="Terlambat">Terlambat (Jatuh Tempo)</option>
                  <option value="Batal">Batal (Dibatalkan)</option>
                </select>
              </div>

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

      {/* Cetak Bukti A6 Modal */}
      <CetakBuktiA6Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        borrows={printBorrowItems}
      />
    </div>
  );
}
