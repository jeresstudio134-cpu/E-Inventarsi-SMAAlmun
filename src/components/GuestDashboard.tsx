import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  FolderOpen, 
  Search, 
  LogIn, 
  Clock, 
  MapPin, 
  Activity, 
  Info, 
  Database, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Grid, 
  List,
  Eye,
  Image,
  X,
  Calendar,
  Plus
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Barang, DashboardStats } from '../types.js';
import BookingModal from './BookingModal.js';

interface GuestDashboardProps {
  onLoginClick: () => void;
  isLoggedIn?: boolean;
  onBackToAdmin?: () => void;
}

export default function GuestDashboard({ onLoginClick, isLoggedIn, onBackToAdmin }: GuestDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<Barang[]>([]);
  const [dbInfo, setDbInfo] = useState<{ isPostgres: boolean; provider: string; details: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'empty'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedItem, setSelectedItem] = useState<Barang | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<Barang | null>(null);

  // Clock state
  const [timeStr, setTimeStr] = useState<string>('');

  const getDynamicYearRange = () => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2026, currentYear);
    return `${startYear}-${startYear + 1}`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statsData = await api.getPublicDashboardStats();
      setStats(statsData);
      
      const barangData = await api.getPublicBarang();
      setItems(barangData);

      const info = await api.getDbInfo();
      setDbInfo(info);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data inventaris publik.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Clock effect
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const categories = ['Semua', ...Array.from(new Set(items.map(item => item.kategori)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    
    const matchesAvailability = 
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && item.stok_tersedia > 0) ||
      (availabilityFilter === 'empty' && item.stok_tersedia === 0);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6">
        <div className="flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Menghubungkan ke Portal e-Inventaris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col">
      {/* Dynamic Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/15">
              <Package className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg block leading-tight">E-Inventaris</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">SMA AL MUNAWWARIYYAH</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-600 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>{timeStr}</span>
            </div>

            {isLoggedIn ? (
              <button
                id="btn-back-to-admin"
                onClick={onBackToAdmin}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4 rotate-180" />
                <span>Kembali ke Panel Admin</span>
              </button>
            ) : (
              <button
                id="btn-goto-login"
                onClick={onLoginClick}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-sm hover:shadow shadow-blue-600/10 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login Petugas</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(20,184,166,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(37,99,235,0.12),transparent_50%)]" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Cari & Pantau Ketersediaan Alat Praktikum & Inventaris Sekolah
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Temukan informasi lengkap mengenai spesifikasi barang, posisi penyimpanan, 
              dan sisa stok aktual sebelum Anda melakukan pengajuan peminjaman kepada petugas laboratorium.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setBookingItem(null);
                  setIsBookingOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Form Booking / Sewa Kamera & Alat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1st Dashboard Block: High Level Metrics (Stats) */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat Card 1 */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total Barang</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalItems}</span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Kategori</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalCategories}</span>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Stok Tersedia</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {items.reduce((acc, item) => acc + item.stok_tersedia, 0)}
                </span>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Sedang Dipinjam</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.activeBorrows}</span>
              </div>
            </div>

          </div>
        )}

        {/* 2nd Dashboard Block: Dynamic Searchable Catalog */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Katalog Inventaris & Status Ketersediaan</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar item resmi yang berada dalam pengawasan administrasi.</p>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl border transition ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                title="Tampilan Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl border transition ${viewMode === 'table' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search, Category, and Availability Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, kode barang, atau lokasi penyimpanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 outline-none transition"
                />
              </div>

              {/* Availability Filter */}
              <select
                value={availabilityFilter}
                onChange={(e: any) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition cursor-pointer"
              >
                <option value="all">Semua Status Stok</option>
                <option value="available">Hanya yang Tersedia (Stok &gt; 0)</option>
                <option value="empty">Kosong / Sedang Dipinjam Habis</option>
              </select>
            </div>

            {/* Categories Quick Filter */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0 mr-1">Kategori:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Catalog Listing */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 flex flex-col items-center gap-3">
              <Layers className="w-12 h-12 text-slate-300 animate-pulse" />
              <div>
                <h4 className="font-semibold text-slate-700">Tidak ada barang cocok</h4>
                <p className="text-xs text-slate-400 mt-0.5">Silakan gunakan kata kunci pencarian atau filter kategori lainnya.</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const isAvailable = item.stok_tersedia > 0;
                const stockPct = item.stok_total > 0 ? (item.stok_tersedia / item.stok_total) * 100 : 0;
                return (
                  <motion.div
                    key={item.id}
                    layoutId={`public-item-${item.id}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition duration-200"
                  >
                    <div className="space-y-3">
                      {item.image_url ? (
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center group/img relative cursor-zoom-in">
                          <img
                            src={item.image_url}
                            alt={item.nama}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            onClick={() => {
                              setLightboxImage(item.image_url);
                              setLightboxTitle(item.nama);
                            }}
                            title="Klik untuk memperbesar foto"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-[4/3] rounded-xl border border-slate-150 bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-1.5">
                          <Image className="w-8 h-8 text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tidak Ada Foto</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{item.kode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAvailable 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-150'
                        }`}>
                          {isAvailable ? 'Tersedia' : 'Kosong'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 min-h-[40px] hover:text-blue-600 transition" onClick={() => setSelectedItem(item)}>
                        {item.nama}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed">
                        {item.deskripsi || 'Tidak ada deskripsi spesifik.'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200/50">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                          <span>Sisa Stok Fisik</span>
                          <span className="font-bold text-slate-900">{item.stok_tersedia} / {item.stok_total} Unit</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              stockPct > 50 
                                ? 'bg-gradient-to-r from-blue-500 to-emerald-500' 
                                : stockPct > 0 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${stockPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.lokasi}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium shrink-0">
                          {item.kategori}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        <button
                          onClick={() => {
                            setBookingItem(item);
                            setIsBookingOpen(true);
                          }}
                          disabled={item.stok_tersedia <= 0}
                          className="py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Booking</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                      <th className="px-6 py-4">Kode</th>
                      <th className="px-6 py-4">Nama Barang</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4">Stok Tersedia</th>
                      <th className="px-6 py-4">Lokasi</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {filteredItems.map((item) => {
                      const isAvailable = item.stok_tersedia > 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-slate-400 whitespace-nowrap">{item.kode}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.nama}
                                  referrerPolicy="no-referrer"
                                  className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm hover:scale-115 active:scale-95 transition-transform duration-200 cursor-zoom-in"
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
                              <div className="font-semibold text-slate-900 truncate max-w-xs" title={item.nama}>
                                {item.nama}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{item.kategori}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{item.stok_tersedia}</span>
                            <span className="text-slate-400"> / {item.stok_total} Unit</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-xxs truncate">{item.lokasi}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isAvailable ? 'Tersedia' : 'Kosong'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition border border-slate-200 cursor-pointer"
                                title="Lihat Detail"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setBookingItem(item);
                                  setIsBookingOpen(true);
                                }}
                                disabled={item.stok_tersedia <= 0}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold rounded-lg text-[11px] transition shadow-xs cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Booking</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 3rd Block: Anonymized Recent Borrow Log & Operator Information */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
            <h3 className="font-bold text-slate-900 tracking-tight text-base">Riwayat Transaksi & Mutasi Terakhir</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Log aktivitas peminjaman barang terbaru oleh pengunjung. Nama peminjam disamarkan demi menjaga keamanan data pribadi.
          </p>

          {stats && stats.recentBorrows && stats.recentBorrows.length > 0 ? (
            <div className="divide-y divide-slate-100 pt-1">
              {stats.recentBorrows.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between text-xs gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{b.nama_peminjam}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-500">Log #{b.id}</span>
                    </div>
                    <p className="text-slate-500 truncate mt-0.5">Meminjam <span className="font-medium text-slate-700">{b.barang_nama}</span> sebanyak <span className="font-bold text-slate-800">{b.jumlah} unit</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono block">{b.tanggal_pinjam}</span>
                    <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold mt-1 ${
                      b.status === 'Dikembalikan' 
                        ? 'bg-slate-100 text-slate-600' 
                        : b.status === 'Terlambat'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Belum ada transaksi peminjaman terdaftar.
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-medium">
          Sistem E-Inventaris &copy; {getDynamicYearRange()} SMA AL MUNAWWARIYYAH. Portal Monitoring Sarana & Prasarana.
        </div>
      </footer>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Spesifikasi Detail Barang</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {selectedItem.image_url && (
                <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2 cursor-zoom-in relative group/detail">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.nama}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full rounded-xl object-contain group-hover/detail:scale-105 transition duration-300"
                    onClick={() => {
                      setLightboxImage(selectedItem.image_url);
                      setLightboxTitle(selectedItem.nama);
                    }}
                    title="Klik untuk memperbesar foto"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400 uppercase">{selectedItem.kode}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedItem.stok_tersedia > 0 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {selectedItem.stok_tersedia > 0 ? 'Stok Tersedia' : 'Habis Dipinjam'}
                </span>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nama Barang</h4>
                <p className="font-bold text-slate-900 text-base mt-0.5">{selectedItem.nama}</p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deskripsi / Spesifikasi</h4>
                <p className="text-slate-600 mt-1 leading-relaxed text-xs">
                  {selectedItem.deskripsi || 'Tidak ada deskripsi atau spesifikasi alat yang dicantumkan.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kategori</h4>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedItem.kategori}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lokasi Lab</h4>
                  <p className="font-semibold text-slate-800 mt-0.5 truncate flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{selectedItem.lokasi}</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-150">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sisa Stok Siap Pakai:</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedItem.stok_tersedia} Unit</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total Inventaris Terdaftar:</span>
                  <span className="font-bold text-slate-700 font-mono">{selectedItem.stok_total} Unit</span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200/50">
                  <span className="text-slate-500 font-medium">Status Pengambilan:</span>
                  <span className="font-semibold text-blue-600">Hubungi Laboran / Petugas</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Preview */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 transition-all duration-300 cursor-zoom-out animate-in fade-in"
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

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        items={items}
        selectedItem={bookingItem}
        onSuccessTrigger={() => {
          fetchData();
        }}
      />
    </div>
  );
}
