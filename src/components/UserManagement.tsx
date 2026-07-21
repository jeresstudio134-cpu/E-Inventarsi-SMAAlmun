import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, ShieldAlert, UserCheck, Key, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { User } from '../types.js';
import ExportButton from './ExportButton.js';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formUsername, setFormUsername] = useState('');
  const [formNamaLengkap, setFormNamaLengkap] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Petugas'>('Petugas');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user list
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormUsername('');
    setFormNamaLengkap('');
    setFormPassword('');
    setFormRole('Petugas');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormUsername(user.username);
    setFormNamaLengkap(user.nama_lengkap);
    setFormPassword(''); // blank for editing (leave blank to not change password)
    setFormRole(user.role);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formNamaLengkap || (modalMode === 'create' && !formPassword)) {
      setFormError('Mohon isi seluruh field bertanda wajib (*)');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      username: formUsername,
      nama_lengkap: formNamaLengkap,
      role: formRole,
      password: formPassword || undefined
    };

    try {
      if (modalMode === 'create') {
        await api.createUser(payload);
      } else if (selectedUser) {
        await api.updateUser(selectedUser.id, payload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user account
  const handleDelete = async (user: User) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan untuk masuk sesi ini.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus akun @${user.username} (${user.nama_lengkap})? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await api.deleteUser(user.id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengguna.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportColumns = [
    { key: 'username', label: 'Username' },
    { key: 'nama_lengkap', label: 'Nama Lengkap' },
    { key: 'role', label: 'Peran / Hak Akses' }
  ];

  return (
    <div className="space-y-6">
      {/* Header and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Manajemen Pengguna (Petugas/Admin)
          </h2>
          <p className="text-sm text-slate-500">
            Daftarkan staf petugas inventaris baru, atur hak akses (role), atau perbarui kata sandi login.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={filteredUsers}
            columns={exportColumns}
            filename="Laporan_Daftar_Pengguna"
          />
          <button
            id="btn-tambah-user-pemicu"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow transition-all duration-150 outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Petugas</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-users"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan username atau nama lengkap..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl text-slate-800 text-sm outline-none transition"
          />
        </div>
      </div>

      {/* Main Table view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Memuat data pengguna...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 flex flex-col items-center gap-3">
          <UserCheck className="w-12 h-12 text-slate-300" />
          <div>
            <h4 className="font-semibold text-slate-700">Pengguna Tidak Ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan pencarian username Anda.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Hak Akses / Role</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm text-slate-700">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200/55 flex items-center justify-center font-bold">
                        {u.nama_lengkap.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="font-bold text-slate-900">
                        {u.nama_lengkap}
                        {u.id === currentUser.id && (
                          <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-semibold rounded uppercase tracking-wider">
                            Akun Saya
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-slate-600">@{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                      u.role === 'Admin'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-teal-50 text-teal-700 border border-teal-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`btn-edit-user-${u.id}`}
                        onClick={() => openEditModal(u)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition"
                        title="Ubah Profil"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-hapus-user-${u.id}`}
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser.id}
                        className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {modalMode === 'create' ? 'Daftarkan Petugas Baru' : 'Ubah Akun Pengguna'}
              </h3>
              <button
                id="btn-close-modal-user"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Username *
                </label>
                <input
                  id="form-user-username"
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  disabled={modalMode === 'edit'} // Lock username on edit
                  placeholder="Contoh: joko_s"
                  className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  id="form-user-namalengkap"
                  type="text"
                  value={formNamaLengkap}
                  onChange={(e) => setFormNamaLengkap(e.target.value)}
                  placeholder="Contoh: Joko Susilo"
                  className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Password {modalMode === 'create' ? '*' : '(Kosongkan jika tidak diubah)'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    id="form-user-password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={modalMode === 'create' ? 'Masukkan password akun' : '••••••••'}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Hak Akses / Peran *
                </label>
                <select
                  id="form-user-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 rounded-xl text-sm outline-none transition"
                >
                  <option value="Petugas">Petugas (CRUD Barang & Peminjaman)</option>
                  <option value="Admin">Admin (Akses Penuh + Kelola Akun Staff)</option>
                </select>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  id="btn-form-user-batal"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border text-slate-600 font-semibold rounded-xl text-sm transition"
                >
                  Batal
                </button>
                <button
                  id="btn-form-user-simpan"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
