import { useState, useEffect } from 'react';
import { api, getSavedUser } from './lib/api.js';
import { User } from './types.js';
import Login from './components/Login.js';
import GuestDashboard from './components/GuestDashboard.js';
import Sidebar from './components/Sidebar.js';
import Dashboard from './components/Dashboard.js';
import BarangManagement from './components/BarangManagement.js';
import PeminjamanManagement from './components/PeminjamanManagement.js';
import UserManagement from './components/UserManagement.js';
import Settings from './components/Settings.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [viewAsGuest, setViewAsGuest] = useState(false);

  // External modal triggers from Dashboard shortcuts
  const [isOpenBarangModal, setIsOpenBarangModal] = useState(false);
  const [isOpenPinjamModal, setIsOpenPinjamModal] = useState(false);

  useEffect(() => {
    // Retrieve session on load
    const saved = getSavedUser();
    if (saved) {
      setUser(saved);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowLogin(false);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setShowLogin(false);
  };

  const handleOpenBarangModal = () => {
    setActiveTab('barang');
    setIsOpenBarangModal(true);
  };

  const handleOpenPinjamModal = () => {
    setActiveTab('peminjaman');
    setIsOpenPinjamModal(true);
  };

  const handleActiveTabChange = (tab: string) => {
    if (tab === 'beranda-publik') {
      setViewAsGuest(true);
    } else {
      setActiveTab(tab);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Menyiapkan sistem inventaris...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render GuestDashboard or Login portal
  if (!user) {
    if (showLogin) {
      return (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onBackToGuest={() => setShowLogin(false)} 
        />
      );
    }
    return <GuestDashboard onLoginClick={() => setShowLogin(true)} />;
  }

  // If logged in but viewing public page
  if (viewAsGuest) {
    return (
      <GuestDashboard 
        onLoginClick={() => setShowLogin(true)}
        isLoggedIn={true}
        onBackToAdmin={() => setViewAsGuest(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      {/* Sidebar shell layout */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={handleActiveTabChange}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Active view switcher */}
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              onOpenBarangModal={handleOpenBarangModal}
              onOpenPinjamModal={handleOpenPinjamModal}
            />
          )}

          {activeTab === 'barang' && (
            <BarangManagement
              user={user}
              isOpenCreateModalExternally={isOpenBarangModal}
              onCloseCreateModalExternally={() => setIsOpenBarangModal(false)}
            />
          )}

          {activeTab === 'peminjaman' && (
            <PeminjamanManagement
              user={user}
              isOpenCreateModalExternally={isOpenPinjamModal}
              onCloseCreateModalExternally={() => setIsOpenPinjamModal(false)}
            />
          )}

          {activeTab === 'users' && (
            user.role === 'Admin' ? (
              <UserManagement currentUser={user} />
            ) : (
              <div className="p-6 text-center text-rose-500 font-medium">
                Akses Ditolak: Anda tidak memiliki wewenang untuk melihat halaman ini.
              </div>
            )
          )}

          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}
