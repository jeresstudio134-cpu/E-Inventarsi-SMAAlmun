import { User, Barang, Peminjaman, DashboardStats } from '../types.js';

const API_BASE = ''; // Same origin

// Auth token management
export function getToken(): string | null {
  return localStorage.getItem('inventaris_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('inventaris_token', token);
  } else {
    localStorage.removeItem('inventaris_token');
  }
}

export function getSavedUser(): User | null {
  const data = localStorage.getItem('inventaris_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setSavedUser(user: User | null) {
  if (user) {
    localStorage.setItem('inventaris_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('inventaris_user');
  }
}

// Custom Fetch Wrapper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errMsg = 'Terjadi kesalahan sistem';
    try {
      const errData = await response.json();
      errMsg = errData.error || errMsg;
    } catch {
      // Use default
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(credentials: { username: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    setToken(res.token);
    setSavedUser(res.user);
    return res;
  },

  logout() {
    setToken(null);
    setSavedUser(null);
  },

  async getMe(): Promise<{ user: User }> {
    return apiFetch('/api/auth/me');
  },

  // Database Connection Info
  async getDbInfo(): Promise<{ isPostgres: boolean; provider: string; details: string }> {
    return apiFetch('/api/db-info');
  },

  // Public Guest Stats & Catalog
  async getPublicDashboardStats(): Promise<DashboardStats> {
    return apiFetch('/api/public/dashboard-stats');
  },

  async getPublicBarang(): Promise<Barang[]> {
    return apiFetch('/api/public/barang');
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return apiFetch('/api/dashboard-stats');
  },

  // Barang CRUD
  async getBarang(): Promise<Barang[]> {
    return apiFetch('/api/barang');
  },

  async createBarang(b: Omit<Barang, 'id' | 'stok_tersedia'>): Promise<Barang> {
    return apiFetch('/api/barang', {
      method: 'POST',
      body: JSON.stringify(b)
    });
  },

  async updateBarang(id: number, b: Partial<Barang>): Promise<Barang> {
    return apiFetch(`/api/barang/${id}`, {
      method: 'PUT',
      body: JSON.stringify(b)
    });
  },

  async deleteBarang(id: number): Promise<boolean> {
    return apiFetch(`/api/barang/${id}`, {
      method: 'DELETE'
    });
  },

  // Peminjaman CRUD
  async getPeminjaman(): Promise<Peminjaman[]> {
    return apiFetch('/api/peminjaman');
  },

  async createPeminjaman(p: Omit<Peminjaman, 'id'>): Promise<Peminjaman> {
    return apiFetch('/api/peminjaman', {
      method: 'POST',
      body: JSON.stringify(p)
    });
  },

  async updatePeminjaman(id: number, p: Partial<Peminjaman>): Promise<Peminjaman> {
    return apiFetch(`/api/peminjaman/${id}`, {
      method: 'PUT',
      body: JSON.stringify(p)
    });
  },

  async deletePeminjaman(id: number): Promise<boolean> {
    return apiFetch(`/api/peminjaman/${id}`, {
      method: 'DELETE'
    });
  },

  // User Management (Admin Only)
  async getUsers(): Promise<User[]> {
    return apiFetch('/api/users');
  },

  async createUser(u: Omit<User, 'id'> & { password?: string }): Promise<User> {
    return apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(u)
    });
  },

  async updateUser(id: number, u: Partial<User> & { password?: string }): Promise<User> {
    return apiFetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(u)
    });
  },

  async deleteUser(id: number): Promise<boolean> {
    return apiFetch(`/api/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Cloudinary Image Upload
  async uploadImage(base64Image: string): Promise<{ url: string; public_id: string }> {
    return apiFetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image })
    });
  }
};
