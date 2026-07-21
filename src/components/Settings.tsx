import { useEffect, useState } from 'react';
import { Database, ShieldAlert, ArrowRight, CheckCircle2, AlertCircle, Terminal, Cpu, Info, Copy, Check } from 'lucide-react';
import { api } from '../lib/api.js';

export default function Settings() {
  const [dbInfo, setDbInfo] = useState<{ isPostgres: boolean; provider: string; details: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadDbInfo = async () => {
    setIsLoading(true);
    try {
      const info = await api.getDbInfo();
      setDbInfo(info);
    } catch (err) {
      console.error('Gagal memuat status database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDbInfo();
  }, []);

  const handleCopyEnv = () => {
    const text = 'DATABASE_URL="postgresql://username:password@ep-host.region.neon.tech/neondb?sslmode=require"';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Koneksi & Konfigurasi Database
        </h2>
        <p className="text-sm text-slate-500">
          Monitor status koneksi database Neon PostgreSQL cloud dan lihat panduan integrasi sistem.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Menganalisis status koneksi database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connection Status Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    dbInfo?.isPostgres ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Status Koneksi</span>
                    <span className="text-md font-bold text-slate-900">{dbInfo?.provider}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {dbInfo?.details}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                {dbInfo?.isPostgres ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Aktif & Terhubung ke Neon Cloud</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-bold bg-amber-50 border border-amber-100 p-3 rounded-xl">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
                    <span>Mode Lokal (Fallback Aktif)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guide Card (2 Columns) */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white space-y-5">
            <div className="flex items-center gap-2 text-teal-400">
              <Terminal className="w-5 h-5" />
              <h3 className="font-bold text-slate-100 text-md">Panduan Menghubungkan Neon PostgreSQL</h3>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-teal-400 border border-slate-700 font-bold flex items-center justify-center text-xs shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-slate-100">Buat Akun & Projek di Neon.tech</h4>
                  <p className="text-xs text-slate-400 mt-1">Registrasi akun gratis di <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">neon.tech</a>, buat projek baru, lalu pilih wilayah server terdekat (misal: Singapore).</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-teal-400 border border-slate-700 font-bold flex items-center justify-center text-xs shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-slate-100">Salin Connection String</h4>
                  <p className="text-xs text-slate-400 mt-1">Pada halaman Dashboard Neon, pilih tab **Dashboard** lalu salin URI koneksi PostgreSQL yang berformat `postgresql://...` lengkap.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-teal-400 border border-slate-700 font-bold flex items-center justify-center text-xs shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-slate-100">Masukkan ke Secrets AI Studio / .env</h4>
                  <p className="text-xs text-slate-400 mt-1">Masukkan kunci variabel rahasia tersebut dengan nama **DATABASE_URL** di panel Secrets AI Studio atau file `.env` lokal Anda.</p>
                </div>
              </div>
            </div>

            {/* Code snippet block */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">Kunci Variabel Lingkungan (.env)</span>
                <button
                  onClick={handleCopyEnv}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                  title="Copy snippet"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <code className="text-xs font-mono text-slate-300 block overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                DATABASE_URL="postgresql://username:password@ep-host.region.neon.tech/neondb?sslmode=require"
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Deployment & Architecture Notes */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Info className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-slate-900">Catatan Arsitektur Sistem & Portabilitas Vercel</h3>
        </div>
        
        <p className="text-sm text-slate-600 leading-relaxed">
          Aplikasi E-Inventaris ini dirancang menggunakan arsitektur **full-stack modern (Express.js API + React Client via Vite)**. 
          Sistem ini 100% siap di-deploy ke Vercel atau platform hosting serverless cloud lainnya.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Migrasi Database Otomatis</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Begitu Anda menyambungkan database Neon PostgreSQL via <code className="bg-slate-200/60 px-1 rounded text-slate-800 font-mono text-[10px]">DATABASE_URL</code>, 
              sistem backend akan **secara otomatis membuat tabel** (`users`, `barang`, `peminjaman`) dan melakukan **seeding data demo otomatis** jika tabel kosong pada saat pertama kali server dijalankan.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Keamanan & Peran Akses</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seluruh data sandi disimpan menggunakan sistem enkripsi hash Node.js. 
              Sistem ini membatasi akses sensitif (seperti menu kelola pengguna dan tombol hapus barang) agar **hanya dapat dieksekusi oleh pengguna dengan peran Admin**.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
