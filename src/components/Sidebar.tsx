import { LayoutDashboard, Box, ClipboardList, Users, Settings, LogOut, Menu, X, UserCheck, Globe } from 'lucide-react';
import { useState } from 'react';
import { User } from '../types.js';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'All' },
    { id: 'barang', label: 'Data Barang', icon: Box, role: 'All' },
    { id: 'peminjaman', label: 'Peminjaman', icon: ClipboardList, role: 'All' },
    { id: 'users', label: 'Kelola Pengguna', icon: Users, role: 'Admin' },
    { id: 'settings', label: 'Koneksi Database', icon: Settings, role: 'All' },
    { id: 'beranda-publik', label: 'Beranda Publik', icon: Globe, role: 'All' },
  ];

  const filteredMenu = menuItems.filter(item => item.role === 'All' || user.role === 'Admin');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center">
            <Box className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-md leading-tight">E-Inventaris</span>
            <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider leading-none">SMA AL MUNAWWARIYYAH</span>
          </div>
        </div>
        <button
          id="btn-toggle-sidebar"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:sticky lg:h-screen lg:z-30`}
      >
        {/* Upper Sidebar */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo / Title */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-white font-sans leading-none">E-Inventaris</h1>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mt-0.5 block leading-none">SMA AL MUNAWWARIYYAH</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="px-4 py-4 border-b border-slate-800/60 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                {user.nama_lengkap.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{user.nama_lengkap}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium leading-none tracking-wider ${
                    user.role === 'Admin'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">@{user.username}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredMenu.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar / Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 shrink-0">
          <button
            id="btn-logout"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/40 rounded-xl text-sm font-medium transition-all outline-none cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>
    </>
  );
}
