import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  initDb,
  getDbInfo,
  getUsers,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  getBarang,
  createBarang,
  updateBarang,
  deleteBarang,
  getPeminjaman,
  createPeminjaman,
  updatePeminjaman,
  deletePeminjaman,
  hashPassword
} from './server/db.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Token encryption helper
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'inventaris_gokil_secret_key_98765';
function generateToken(payload: any): string {
  try {
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(TOKEN_SECRET, 'salt', 32), Buffer.alloc(16));
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (err) {
    console.error('Error generating token:', err);
    throw new Error('Gagal menghasilkan token keamanan');
  }
}

function verifyToken(token: string): any {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(TOKEN_SECRET, 'salt', 32), Buffer.alloc(16));
    let decrypted = decipher.update(token, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}

// Middlewares
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi tidak sah. Silakan login terlebih dahulu.' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa atau tidak valid.' });
  }
  req.user = decoded;
  next();
}

function adminMiddleware(req: any, res: any, next: any) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Akses ditolak. Menu ini hanya dapat diakses oleh Admin.' });
    }
    next();
  });
}

// --- API ENDPOINTS ---

// Database connection info
app.get('/api/db-info', async (req, res) => {
  try {
    const info = getDbInfo();
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Image Upload Endpoint (Cloudinary)
app.post('/api/upload', authMiddleware, async (req: any, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Tidak ada gambar yang dikirim.' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('⚠️ Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
      return res.status(400).json({
        error: 'Cloudinary belum dikonfigurasi. Harap atur environment variables di panel Secrets.',
        isNotConfigured: true
      });
    }

    const { v2: cloudinaryLib } = await import('cloudinary');
    cloudinaryLib.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    const uploadResponse = await cloudinaryLib.uploader.upload(image, {
      folder: 'e_inventaris_barang',
      resource_type: 'image'
    });

    res.json({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id
    });
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Gagal mengupload gambar ke Cloudinary: ' + error.message });
  }
});

// Authentication Endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password harus diisi.' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const hashed = hashPassword(password);
    if (user.password !== hashed) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Generate token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role
    };
    const token = generateToken(tokenPayload);

    res.json({
      token,
      user: tokenPayload
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: any, res) => {
  res.json({ user: req.user });
});

// BARANG CRUD
app.get('/api/barang', authMiddleware, async (req, res) => {
  try {
    const items = await getBarang();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/barang', authMiddleware, async (req, res) => {
  try {
    const { nama, kode, kategori, stok_total, lokasi, deskripsi, image_url } = req.body;
    if (!nama || !kode || !kategori || stok_total === undefined || !lokasi) {
      return res.status(400).json({ error: 'Mohon lengkapi seluruh field wajib.' });
    }
    const item = await createBarang({
      nama,
      kode,
      kategori,
      stok_total: parseInt(stok_total, 10),
      stok_tersedia: parseInt(stok_total, 10),
      lokasi,
      deskripsi: deskripsi || '',
      image_url: image_url || ''
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/barang/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama, kode, kategori, stok_total, lokasi, deskripsi, image_url } = req.body;
    const updateData: any = {};
    if (nama !== undefined) updateData.nama = nama;
    if (kode !== undefined) updateData.kode = kode;
    if (kategori !== undefined) updateData.kategori = kategori;
    if (stok_total !== undefined) updateData.stok_total = parseInt(stok_total, 10);
    if (lokasi !== undefined) updateData.lokasi = lokasi;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (image_url !== undefined) updateData.image_url = image_url;

    const item = await updateBarang(id, updateData);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/barang/:id', adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteBarang(id);
    res.json({ success: true, message: 'Barang berhasil dihapus' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PEMINJAMAN CRUD
app.get('/api/peminjaman', authMiddleware, async (req, res) => {
  try {
    const list = await getPeminjaman();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/peminjaman', authMiddleware, async (req, res) => {
  try {
    const { 
      nama_peminjam, 
      kontak_peminjam, 
      akun_medsos, 
      alamat_domisili, 
      barang_id, 
      jumlah, 
      tanggal_pinjam, 
      tanggal_kembali, 
      jam_mulai, 
      jam_selesai, 
      jaminan, 
      keperluan_acara, 
      status, 
      catatan 
    } = req.body;

    if (!nama_peminjam || !kontak_peminjam || !barang_id || !jumlah || !tanggal_pinjam || !tanggal_kembali) {
      return res.status(400).json({ error: 'Mohon lengkapi seluruh field transaksi peminjaman.' });
    }

    const trx = await createPeminjaman({
      nama_peminjam,
      kontak_peminjam,
      akun_medsos: akun_medsos || '',
      alamat_domisili: alamat_domisili || '',
      barang_id: parseInt(barang_id, 10),
      jumlah: parseInt(jumlah, 10),
      tanggal_pinjam,
      tanggal_kembali,
      jam_mulai: jam_mulai || '',
      jam_selesai: jam_selesai || '',
      jaminan: jaminan || '',
      keperluan_acara: keperluan_acara || '',
      status: status || 'Dipinjam',
      catatan: catatan || ''
    });

    res.status(201).json(trx);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/peminjaman/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { 
      nama_peminjam, 
      kontak_peminjam, 
      akun_medsos, 
      alamat_domisili, 
      barang_id, 
      jumlah, 
      tanggal_pinjam, 
      tanggal_kembali, 
      jam_mulai, 
      jam_selesai, 
      jaminan, 
      keperluan_acara, 
      status, 
      catatan 
    } = req.body;

    const updateData: any = {};
    if (nama_peminjam !== undefined) updateData.nama_peminjam = nama_peminjam;
    if (kontak_peminjam !== undefined) updateData.kontak_peminjam = kontak_peminjam;
    if (akun_medsos !== undefined) updateData.akun_medsos = akun_medsos;
    if (alamat_domisili !== undefined) updateData.alamat_domisili = alamat_domisili;
    if (barang_id !== undefined) updateData.barang_id = parseInt(barang_id, 10);
    if (jumlah !== undefined) updateData.jumlah = parseInt(jumlah, 10);
    if (tanggal_pinjam !== undefined) updateData.tanggal_pinjam = tanggal_pinjam;
    if (tanggal_kembali !== undefined) updateData.tanggal_kembali = tanggal_kembali;
    if (jam_mulai !== undefined) updateData.jam_mulai = jam_mulai;
    if (jam_selesai !== undefined) updateData.jam_selesai = jam_selesai;
    if (jaminan !== undefined) updateData.jaminan = jaminan;
    if (keperluan_acara !== undefined) updateData.keperluan_acara = keperluan_acara;
    if (status !== undefined) updateData.status = status;
    if (catatan !== undefined) updateData.catatan = catatan;

    const trx = await updatePeminjaman(id, updateData);
    res.json(trx);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUBLIC BOOKING ROUTE FOR VISITORS
app.post('/api/public/booking', async (req, res) => {
  try {
    const { 
      nama_peminjam, 
      kontak_peminjam, 
      akun_medsos, 
      alamat_domisili, 
      barang_id, 
      jumlah, 
      tanggal_pinjam, 
      tanggal_kembali, 
      jam_mulai, 
      jam_selesai, 
      jaminan, 
      keperluan_acara, 
      catatan 
    } = req.body;

    if (!nama_peminjam || !kontak_peminjam || !barang_id || !jumlah || !tanggal_pinjam || !tanggal_kembali) {
      return res.status(400).json({ error: 'Mohon lengkapi seluruh field wajib (*).' });
    }

    const trx = await createPeminjaman({
      nama_peminjam,
      kontak_peminjam,
      akun_medsos: akun_medsos || '',
      alamat_domisili: alamat_domisili || '',
      barang_id: parseInt(barang_id, 10),
      jumlah: parseInt(jumlah, 10),
      tanggal_pinjam,
      tanggal_kembali,
      jam_mulai: jam_mulai || '',
      jam_selesai: jam_selesai || '',
      jaminan: jaminan || '',
      keperluan_acara: keperluan_acara || '',
      status: 'Booking',
      catatan: catatan || ''
    });

    res.status(201).json(trx);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/peminjaman/:id', adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deletePeminjaman(id);
    res.json({ success: true, message: 'Transaksi peminjaman berhasil dihapus' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// USER CRUD
app.get('/api/users', adminMiddleware, async (req, res) => {
  try {
    const list = await getUsers();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', adminMiddleware, async (req, res) => {
  try {
    const { username, nama_lengkap, password, role } = req.body;
    if (!username || !nama_lengkap || !password || !role) {
      return res.status(400).json({ error: 'Username, Nama Lengkap, Password, dan Role harus diisi.' });
    }
    const user = await createUser({ username, nama_lengkap, password, role });
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { username, nama_lengkap, password, role } = req.body;
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (nama_lengkap !== undefined) updateData.nama_lengkap = nama_lengkap;
    if (password !== undefined && password !== '') updateData.password = password;
    if (role !== undefined) updateData.role = role;

    const user = await updateUser(id, updateData);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteUser(id);
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DASHBOARD STATS
app.get('/api/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const items = await getBarang();
    const borrows = await getPeminjaman();
    const users = await getUsers();

    const totalItems = items.length;
    const categoriesSet = new Set(items.map(item => item.kategori));
    const totalCategories = categoriesSet.size;

    const activeBorrows = borrows.filter(p => p.status === 'Dipinjam' || p.status === 'Terlambat').length;
    const lateReturns = borrows.filter(p => p.status === 'Terlambat').length;

    // Recent borrows (last 5)
    const recentBorrows = borrows.slice(0, 5);

    // Category distribution
    const categoryCount: Record<string, number> = {};
    items.forEach(item => {
      categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + item.stok_total;
    });
    const categoryDistribution = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));

    // Status distribution
    const statusCount = {
      'Dipinjam': borrows.filter(p => p.status === 'Dipinjam').length,
      'Dikembalikan': borrows.filter(p => p.status === 'Dikembalikan').length,
      'Terlambat': borrows.filter(p => p.status === 'Terlambat').length,
    };
    const borrowStatusStats = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value
    }));

    res.json({
      totalItems,
      totalCategories,
      activeBorrows,
      lateReturns,
      recentBorrows,
      categoryDistribution,
      borrowStatusStats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC ENDPOINTS FOR VISITORS
app.get('/api/public/barang', async (req, res) => {
  try {
    const items = await getBarang();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public/dashboard-stats', async (req, res) => {
  try {
    const items = await getBarang();
    const borrows = await getPeminjaman();

    const totalItems = items.length;
    const categoriesSet = new Set(items.map(item => item.kategori));
    const totalCategories = categoriesSet.size;

    const activeBorrows = borrows.filter(p => p.status === 'Dipinjam' || p.status === 'Terlambat').length;
    const lateReturns = borrows.filter(p => p.status === 'Terlambat').length;

    // Recent borrows (last 5) - anonymized borrower names for public visitors
    const recentBorrows = borrows.slice(0, 5).map(p => ({
      id: p.id,
      nama_peminjam: p.nama_peminjam.length > 2 
        ? p.nama_peminjam.substring(0, 3) + '***' 
        : p.nama_peminjam + '***',
      barang_nama: p.barang_nama,
      jumlah: p.jumlah,
      tanggal_pinjam: p.tanggal_pinjam,
      status: p.status
    }));

    // Category distribution
    const categoryCount: Record<string, number> = {};
    items.forEach(item => {
      categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + item.stok_total;
    });
    const categoryDistribution = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));

    // Status distribution
    const statusCount = {
      'Dipinjam': borrows.filter(p => p.status === 'Dipinjam').length,
      'Dikembalikan': borrows.filter(p => p.status === 'Dikembalikan').length,
      'Terlambat': borrows.filter(p => p.status === 'Terlambat').length,
    };
    const borrowStatusStats = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value
    }));

    res.json({
      totalItems,
      totalCategories,
      activeBorrows,
      lateReturns,
      recentBorrows,
      categoryDistribution,
      borrowStatusStats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VITE MIDDLEWARE AND SPA HANDLER ---

async function startServer() {
  // Initialize Database before starting server listen
  await initDb();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server e-inventaris berjalan di http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
