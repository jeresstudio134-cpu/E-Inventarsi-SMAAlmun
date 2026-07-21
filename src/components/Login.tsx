import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, User as UserIcon, Lock, Box, AlertCircle, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { User } from '../types.js';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onBackToGuest?: () => void;
}

export default function Login({ onLoginSuccess, onBackToGuest }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Masukkan username dan password Anda.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login({ username, password });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali username dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDynamicYearRange = () => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2026, currentYear);
    return `${startYear}-${startYear + 1}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white shadow-xl shadow-blue-500/20 mb-4">
            <Box className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1 font-sans">
            E-Inventaris
          </h1>
          <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-2 select-none">
            SMA AL MUNAWWARIYYAH
          </p>
          <p className="text-slate-400 text-sm">
            Sistem Peminjaman & Manajemen Barang
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative">
          {onBackToGuest && (
            <button
              id="btn-close-login"
              type="button"
              onClick={onBackToGuest}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 rounded-full transition cursor-pointer"
              aria-label="Kembali ke Portal Pengunjung"
              title="Kembali ke Portal Pengunjung"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-white mb-6">
            Masuk ke Akun Anda
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </span>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 outline-none shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk Sekarang</span>
                </>
              )}
            </button>

            {/* No bottom back button, replaced with top-right X button */}
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Sistem E-Inventaris &copy; {getDynamicYearRange()} SMA AL MUNAWWARIYYAH.
        </div>
      </motion.div>
    </div>
  );
}
