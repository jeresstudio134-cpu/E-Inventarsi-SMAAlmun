export interface User {
  id: number;
  username: string;
  nama_lengkap: string;
  role: 'Admin' | 'Petugas';
  created_at?: string;
}

export interface Barang {
  id: number;
  nama: string;
  kode: string;
  kategori: string;
  stok_total: number;
  stok_tersedia: number;
  lokasi: string;
  deskripsi: string;
  image_url?: string;
  created_at?: string;
}

export interface Peminjaman {
  id: number;
  nama_peminjam: string;
  kontak_peminjam: string;
  akun_medsos?: string;
  alamat_domisili?: string;
  barang_id: number;
  barang_nama?: string; // Loaded via join
  barang_kode?: string; // Loaded via join
  jumlah: number;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  jam_mulai?: string;
  jam_selesai?: string;
  jaminan?: string;
  keperluan_acara?: string;
  status: 'Booking' | 'Dipinjam' | 'Dikembalikan' | 'Terlambat' | 'Batal';
  catatan?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  activeBorrows: number;
  lateReturns: number;
  recentBorrows: Peminjaman[];
  categoryDistribution: { name: string; value: number }[];
  borrowStatusStats: { name: string; value: number }[];
}
