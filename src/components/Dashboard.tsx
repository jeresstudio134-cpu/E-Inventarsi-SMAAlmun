import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Package, FolderOpen, RefreshCw, AlertTriangle, FileText, ArrowUpRight, Plus, Eye, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api.js';
import { DashboardStats } from '../types.js';

interface DashboardProps {
  onNavigate: (tabId: string) => void;
  onOpenPinjamModal: () => void;
  onOpenBarangModal: () => void;
}

export default function Dashboard({ onNavigate, onOpenPinjamModal, onOpenBarangModal }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dbInfo, setDbInfo] = useState<{ isPostgres: boolean; provider: string; details: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      const info = await api.getDbInfo();
      setDbInfo(info);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat statistik dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Memuat visualisasi statistik...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center text-center gap-4 max-w-lg mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-800">Gagal Memuat Dashboard</h3>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const colors = [
    'bg-blue-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-emerald-500',
  ];

  const totalUnits = stats.categoryDistribution.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
            Dashboard Panel Utama
          </h2>
          <p className="text-sm text-slate-500">
            Akses cepat sistem inventaris, rekam transaksi peminjaman, dan status server cloud.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-refresh-stats"
            onClick={fetchStats}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Grid Layout Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Card 1: Total Barang (Bento col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">TOTAL BARANG</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">{stats.totalItems.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Card 2: Dipinjam (Bento col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl shrink-0">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">DIPINJAM</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">{stats.activeBorrows.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Card 3: Tersedia (Bento col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">TERSEDIA</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {Math.max(0, stats.totalItems - stats.activeBorrows).toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Card 7: Category Distribution (Bento col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 text-sm">Distribusi Kategori</h3>
              <span className="text-[10px] font-mono bg-slate-100 border text-slate-600 px-2 py-0.5 rounded-lg font-bold">
                {totalUnits} Unit
              </span>
            </div>

            {stats.categoryDistribution.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">Belum ada kategori terdaftar.</div>
            ) : (
              <div className="space-y-4">
                {stats.categoryDistribution.slice(0, 4).map((cat, idx) => {
                  const percentage = totalUnits > 0 ? Math.round((cat.value / totalUnits) * 100) : 0;
                  const colorClass = colors[idx % colors.length];
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 truncate max-w-[150px]">{cat.name}</span>
                        <span className="font-mono text-slate-400 font-bold">{cat.value} Unit ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          className={`h-full rounded-full ${colorClass}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-50 pt-3.5 mt-4 text-[11px] text-slate-400 font-medium">
            Mencakup kategori item terpopuler saat ini.
          </div>
        </motion.div>

        {/* Card 8: Proporsi Status Peminjaman (Bento col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="font-black text-slate-900 text-sm mb-4">Proporsi Transaksi</h3>
            <div className="space-y-3">
              {[
                { name: 'Aktif Dipinjam', key: 'Dipinjam', color: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100', bgLight: 'bg-amber-50/30' },
                { name: 'Dikembalikan', key: 'Dikembalikan', color: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100', bgLight: 'bg-emerald-50/30' },
                { name: 'Terlambat', key: 'Terlambat', color: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-100', bgLight: 'bg-rose-50/30' }
              ].map(status => {
                const statObj = stats.borrowStatusStats.find(s => s.name === status.key);
                const val = statObj ? statObj.value : 0;
                const totalTrx = stats.borrowStatusStats.reduce((acc, curr) => acc + curr.value, 0);
                const pct = totalTrx > 0 ? Math.round((val / totalTrx) * 100) : 0;
                
                return (
                  <div key={status.name} className={`flex items-center gap-3 justify-between ${status.bgLight} p-2.5 rounded-xl border ${status.border}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                      <span className="text-xs font-bold text-slate-700">{status.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                      <span className="text-slate-800">{val} Trx</span>
                      <span className={`px-1 rounded text-[10px] ${status.text}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="border-t border-slate-50 pt-3.5 mt-4 text-[11px] text-slate-400 font-medium">
            Memantau rasio kedisiplinan pengembalian.
          </div>
        </motion.div>

        {/* Card 9: Quick Action Card (Bento col-span-4) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm min-h-[220px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black text-xs">
              ADD
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 leading-none">Tambah Cepat</h4>
              <p className="text-[11px] text-slate-400 mt-1">Shortcut rekam data langsung</p>
            </div>
          </div>
          
          <div className="space-y-2 my-4">
            <button
              id="btn-shortcut-pinjam"
              onClick={onOpenPinjamModal}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Buat Peminjaman</span>
            </button>
            <button
              id="btn-shortcut-barang"
              onClick={onOpenBarangModal}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Tambah Item Baru</span>
            </button>
          </div>
          
          <div className="text-[10px] text-slate-400 font-mono text-center border-t border-slate-50 pt-2 flex justify-between items-center">
            <span>Status server:</span>
            <span className="font-bold text-emerald-600">LIVE</span>
          </div>
        </motion.div>

      </div>

      {/* Bottom Wide Section: Aktivitas Peminjaman Terkini */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="font-black text-lg text-slate-900 leading-tight">Aktivitas Peminjaman Terkini</h3>
            <p className="text-xs text-slate-400 mt-0.5">Log transaksi peminjaman barang terbaru oleh staf / siswa.</p>
          </div>
          <button
            id="btn-see-all-borrows"
            onClick={() => onNavigate('peminjaman')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-100 hover:border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-3.5 py-1.5 rounded-xl transition"
          >
            Lihat Semua
          </button>
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="px-6 py-3.5">PEMINJAM</th>
                <th className="px-6 py-3.5">BARANG</th>
                <th className="px-6 py-3.5">TGL PINJAM</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats.recentBorrows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
                    Belum ada log aktivitas peminjaman terdaftar.
                  </td>
                </tr>
              ) : (
                stats.recentBorrows.map(borrow => (
                  <tr key={borrow.id} className="hover:bg-slate-50/30 transition duration-150">
                    <td className="px-6 py-4 font-bold text-slate-900">{borrow.nama_peminjam}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-slate-100 border px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-black">
                          {borrow.jumlah}x
                        </span>
                        <span className="truncate max-w-[180px]">{borrow.barang_nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono">{borrow.tanggal_pinjam}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        borrow.status === 'Dipinjam'
                          ? 'bg-orange-50 text-orange-700 border border-orange-100'
                          : borrow.status === 'Dikembalikan'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {borrow.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        id={`btn-manage-borrow-${borrow.id}`}
                        onClick={() => onNavigate('peminjaman')}
                        className="text-xs font-bold text-blue-600 hover:underline hover:text-blue-800"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

