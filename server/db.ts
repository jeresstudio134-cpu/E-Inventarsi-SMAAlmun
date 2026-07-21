import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Barang, Peminjaman } from '../src/types.js';

const { Pool } = pg;

// Connection string for Neon / PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL;

const isPostgres = !!DATABASE_URL;
let pool: any = null;

if (isPostgres) {
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Neon serverless postgres connections
    }
  });
}

// Path to local JSON DB fallback
const LOCAL_DB_PATH = path.join(process.cwd(), 'db.json');

// Password helper using Node's native crypto
export function hashPassword(password: string): string {
  const salt = 'inventaris_salt_123';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Default seed data
const DEFAULT_USERS = [
  {
    username: 'admin',
    nama_lengkap: 'Administrator Utama',
    password: hashPassword('admin123'),
    role: 'Admin' as const,
  },
  {
    username: 'petugas',
    nama_lengkap: 'Petugas Inventaris',
    password: hashPassword('petugas123'),
    role: 'Petugas' as const,
  }
];

const DEFAULT_BARANG = [
  {
    nama: 'Laptop ASUS ROG Zephyrus',
    kode: 'BRG-001',
    kategori: 'Elektronik',
    stok_total: 5,
    stok_tersedia: 3,
    lokasi: 'Ruang Lab Komputer A',
    deskripsi: 'Laptop gaming spec tinggi untuk kebutuhan rendering dan coding.'
  },
  {
    nama: 'Proyektor Epson EB-X400',
    kode: 'BRG-002',
    kategori: 'Media Presentasi',
    stok_total: 3,
    stok_tersedia: 2,
    lokasi: 'Lemari Ruang Rapat',
    deskripsi: 'Proyektor 3300 lumens dengan input HDMI dan VGA.'
  },
  {
    nama: 'Kamera Sony Alpha A7 III',
    kode: 'BRG-003',
    kategori: 'Fotografi',
    stok_total: 2,
    stok_tersedia: 2,
    lokasi: 'Ruang Multimedia',
    deskripsi: 'Kamera Mirrorless Full-frame dengan lensa kit 28-70mm.'
  },
  {
    nama: 'Mic Wireless Rode Wireless GO',
    kode: 'BRG-004',
    kategori: 'Audio',
    stok_total: 4,
    stok_tersedia: 3,
    lokasi: 'Ruang Multimedia',
    deskripsi: 'Sistem mikrofon nirkabel kompak untuk perekaman audio berkualitas tinggi.'
  },
  {
    nama: 'Drone DJI Mavic 3 Pro',
    kode: 'BRG-005',
    kategori: 'Fotografi',
    stok_total: 1,
    stok_tersedia: 1,
    lokasi: 'Ruang Multimedia',
    deskripsi: 'Drone profesional dengan sistem tiga kamera Hasselblad.'
  }
];

const DEFAULT_PEMINJAMAN = [
  {
    nama_peminjam: 'Budi Santoso',
    kontak_peminjam: '081234567890',
    barang_id: 1, // Will map properly in database initialization
    jumlah: 1,
    tanggal_pinjam: '2026-07-15',
    tanggal_kembali: '2026-07-22',
    status: 'Dipinjam' as const,
    catatan: 'Untuk keperluan presentasi projek klien di luar kota.'
  },
  {
    nama_peminjam: 'Siti Rahma',
    kontak_peminjam: '089876543210',
    barang_id: 2,
    jumlah: 1,
    tanggal_pinjam: '2026-07-10',
    tanggal_kembali: '2026-07-13',
    status: 'Dikembalikan' as const,
    catatan: 'Digunakan di Ruang Rapat 2 untuk rapat koordinasi mingguan.'
  },
  {
    nama_peminjam: 'Andi Wijaya',
    kontak_peminjam: '085678901234',
    barang_id: 4,
    jumlah: 1,
    tanggal_pinjam: '2026-07-01',
    tanggal_kembali: '2026-07-05',
    status: 'Terlambat' as const,
    catatan: 'Dipinjam untuk perekaman konten video tutorial, belum dikembalikan.'
  }
];

// JSON Database Structure helper
interface LocalJsonDb {
  users: Array<any>;
  barang: Array<any>;
  peminjaman: Array<any>;
}

// Read local DB
function readLocalDb(): LocalJsonDb {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialDb: LocalJsonDb = {
      users: [...DEFAULT_USERS.map((u, idx) => ({ ...u, id: idx + 1, created_at: new Date().toISOString() }))],
      barang: [...DEFAULT_BARANG.map((b, idx) => ({ ...b, id: idx + 1, created_at: new Date().toISOString() }))],
      peminjaman: []
    };
    // Map default borrows
    initialDb.peminjaman = DEFAULT_PEMINJAMAN.map((p, idx) => ({
      ...p,
      id: idx + 1,
      created_at: new Date().toISOString()
    }));
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
}

// Write local DB
function writeLocalDb(data: LocalJsonDb) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
}

let isInitialized = false;
let initializingPromise: Promise<void> | null = null;

export async function ensureDb() {
  if (!isPostgres) return;
  if (isInitialized) return;

  if (!initializingPromise) {
    console.log('🔄 Lazy-initializing database tables in serverless instance...');
    initializingPromise = initDb().then(() => {
      isInitialized = true;
      console.log('✅ Lazy-initialization of database tables completed!');
    }).catch(err => {
      console.error("❌ Lazy-initialization failed:", err);
      initializingPromise = null;
      throw err;
    });
  }
  return initializingPromise;
}

// Initialize connection and tables
export async function initDb() {
  if (isPostgres) {
    console.log('🔌 Connecting to Neon PostgreSQL...');

    try {
      const client = await pool.connect();
      console.log('✅ Connected to Neon PostgreSQL successfully!');

      // Create Tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          nama_lengkap VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS barang (
          id SERIAL PRIMARY KEY,
          nama VARCHAR(100) NOT NULL,
          kode VARCHAR(50) UNIQUE NOT NULL,
          kategori VARCHAR(50) NOT NULL,
          stok_total INTEGER NOT NULL DEFAULT 0,
          stok_tersedia INTEGER NOT NULL DEFAULT 0,
          lokasi VARCHAR(100) NOT NULL,
          deskripsi TEXT,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Ensure existing table has the column
      await client.query(`
        ALTER TABLE barang ADD COLUMN IF NOT EXISTS image_url TEXT;
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS peminjaman (
          id SERIAL PRIMARY KEY,
          nama_peminjam VARCHAR(100) NOT NULL,
          kontak_peminjam VARCHAR(50) NOT NULL,
          barang_id INTEGER REFERENCES barang(id) ON DELETE CASCADE,
          jumlah INTEGER NOT NULL DEFAULT 1,
          tanggal_pinjam DATE NOT NULL,
          tanggal_kembali DATE NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'Dipinjam',
          catatan TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed database if users table is empty
      const userCheck = await client.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCheck.rows[0].count, 10) === 0) {
        console.log('🌱 Seeding PostgreSQL tables with initial data...');
        // Seed Users
        for (const user of DEFAULT_USERS) {
          await client.query(
            'INSERT INTO users (username, nama_lengkap, password, role) VALUES ($1, $2, $3, $4)',
            [user.username, user.nama_lengkap, user.password, user.role]
          );
        }

        // Seed Barang
        const barangIds: number[] = [];
        for (const b of DEFAULT_BARANG) {
          const res = await client.query(
            'INSERT INTO barang (nama, kode, kategori, stok_total, stok_tersedia, lokasi, deskripsi) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [b.nama, b.kode, b.kategori, b.stok_total, b.stok_tersedia, b.lokasi, b.deskripsi]
          );
          barangIds.push(res.rows[0].id);
        }

        // Seed Peminjaman
        for (let i = 0; i < DEFAULT_PEMINJAMAN.length; i++) {
          const p = DEFAULT_PEMINJAMAN[i];
          const mappedBarangId = barangIds[i % barangIds.length];
          await client.query(
            'INSERT INTO peminjaman (nama_peminjam, kontak_peminjam, barang_id, jumlah, tanggal_pinjam, tanggal_kembali, status, catatan) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [p.nama_peminjam, p.kontak_peminjam, mappedBarangId, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali, p.status, p.catatan]
          );
        }
        console.log('✅ PostgreSQL seeding completed successfully!');
      }

      client.release();
    } catch (err) {
      console.error('❌ Failed to connect or initialize PostgreSQL database:', err);
      console.log('⚠️ Falling back to Local JSON Database for this session...');
    }
  } else {
    console.log('📁 No DATABASE_URL found. Using Local JSON Database fallback...');
    // Self-initializes when we call readLocalDb
    readLocalDb();
    console.log('✅ Local JSON Database initialized at', LOCAL_DB_PATH);
  }
}

// --- DATABASE OPERATIONS ---

// 1. Database connection info
export function getDbInfo() {
  return {
    isPostgres: isPostgres && pool !== null,
    provider: isPostgres && pool !== null ? 'Neon PostgreSQL' : 'Local File JSON',
    details: isPostgres && pool !== null ? 'Sistem terhubung langsung ke database cloud Neon PostgreSQL.' : 'Menggunakan penyimpanan file lokal. Masukkan DATABASE_URL di secrets untuk terhubung ke Neon.'
  };
}

// 2. USER ACTIONS
export async function getUsers(): Promise<User[]> {
  await ensureDb();
  if (isPostgres && pool) {
    const res = await pool.query('SELECT id, username, nama_lengkap, role, created_at FROM users ORDER BY id ASC');
    return res.rows;
  } else {
    const db = readLocalDb();
    return db.users.map(({ password, ...u }) => u);
  }
}

export async function getUserByUsername(username: string): Promise<any> {
  await ensureDb();
  if (isPostgres && pool) {
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0] || null;
  } else {
    const db = readLocalDb();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }
}

export async function createUser(userData: Omit<User, 'id'> & { password?: string }): Promise<User> {
  await ensureDb();
  const hash = hashPassword(userData.password || '123456');
  if (isPostgres && pool) {
    const res = await pool.query(
      'INSERT INTO users (username, nama_lengkap, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, nama_lengkap, role, created_at',
      [userData.username, userData.nama_lengkap, hash, userData.role]
    );
    return res.rows[0];
  } else {
    const db = readLocalDb();
    if (db.users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error('Username sudah digunakan');
    }
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      username: userData.username,
      nama_lengkap: userData.nama_lengkap,
      password: hash,
      role: userData.role,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    writeLocalDb(db);
    const { password, ...safeUser } = newUser;
    return safeUser;
  }
}

export async function updateUser(id: number, userData: Partial<User> & { password?: string }): Promise<User> {
  await ensureDb();
  if (isPostgres && pool) {
    let query = 'UPDATE users SET username = $1, nama_lengkap = $2, role = $3';
    const params: any[] = [userData.username, userData.nama_lengkap, userData.role];
    if (userData.password) {
      query += ', password = $4 WHERE id = $5 RETURNING id, username, nama_lengkap, role, created_at';
      params.push(hashPassword(userData.password));
      params.push(id);
    } else {
      query += ' WHERE id = $4 RETURNING id, username, nama_lengkap, role, created_at';
      params.push(id);
    }
    const res = await pool.query(query, params);
    return res.rows[0];
  } else {
    const db = readLocalDb();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User tidak ditemukan');
    
    // Check unique username if username is changing
    if (userData.username && userData.username !== db.users[idx].username) {
      if (db.users.some(u => u.username.toLowerCase() === userData.username!.toLowerCase())) {
        throw new Error('Username sudah digunakan');
      }
    }

    db.users[idx].username = userData.username ?? db.users[idx].username;
    db.users[idx].nama_lengkap = userData.nama_lengkap ?? db.users[idx].nama_lengkap;
    db.users[idx].role = userData.role ?? db.users[idx].role;
    if (userData.password) {
      db.users[idx].password = hashPassword(userData.password);
    }
    writeLocalDb(db);
    const { password, ...safeUser } = db.users[idx];
    return safeUser;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  await ensureDb();
  if (isPostgres && pool) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  } else {
    const db = readLocalDb();
    const lenBefore = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    writeLocalDb(db);
    return db.users.length < lenBefore;
  }
}

// 3. BARANG (ITEMS) ACTIONS
export async function getBarang(): Promise<Barang[]> {
  await ensureDb();
  if (isPostgres && pool) {
    const res = await pool.query('SELECT * FROM barang ORDER BY id DESC');
    return res.rows;
  } else {
    const db = readLocalDb();
    // Soft clone and sort descending
    return [...db.barang].sort((a, b) => b.id - a.id);
  }
}

export async function createBarang(b: Omit<Barang, 'id'>): Promise<Barang> {
  await ensureDb();
  if (isPostgres && pool) {
    const res = await pool.query(
      'INSERT INTO barang (nama, kode, kategori, stok_total, stok_tersedia, lokasi, deskripsi, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [b.nama, b.kode, b.kategori, b.stok_total, b.stok_total, b.lokasi, b.deskripsi, b.image_url || ''] // stok_tersedia matches stok_total at start
    );
    return res.rows[0];
  } else {
    const db = readLocalDb();
    if (db.barang.some(item => item.kode.toLowerCase() === b.kode.toLowerCase())) {
      throw new Error(`Barang dengan kode ${b.kode} sudah terdaftar`);
    }
    const newId = db.barang.length > 0 ? Math.max(...db.barang.map(item => item.id)) + 1 : 1;
    const newB: Barang = {
      id: newId,
      nama: b.nama,
      kode: b.kode,
      kategori: b.kategori,
      stok_total: b.stok_total,
      stok_tersedia: b.stok_total, // default
      lokasi: b.lokasi,
      deskripsi: b.deskripsi,
      image_url: b.image_url || '',
      created_at: new Date().toISOString()
    };
    db.barang.push(newB);
    writeLocalDb(db);
    return newB;
  }
}

export async function updateBarang(id: number, b: Partial<Barang>): Promise<Barang> {
  await ensureDb();
  if (isPostgres && pool) {
    // We must handle stok adjustment carefully
    // Calculate new stok_tersedia based on change in total stock
    const currentRes = await pool.query('SELECT stok_total, stok_tersedia FROM barang WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) throw new Error('Barang tidak ditemukan');
    const curr = currentRes.rows[0];
    
    let updatedStokTersedia = curr.stok_tersedia;
    if (b.stok_total !== undefined) {
      const diff = b.stok_total - curr.stok_total;
      updatedStokTersedia = Math.max(0, curr.stok_tersedia + diff);
    }

    const res = await pool.query(
      'UPDATE barang SET nama = COALESCE($1, nama), kode = COALESCE($2, kode), kategori = COALESCE($3, kategori), stok_total = COALESCE($4, stok_total), stok_tersedia = $5, lokasi = COALESCE($6, lokasi), deskripsi = COALESCE($7, deskripsi), image_url = COALESCE($8, image_url) WHERE id = $9 RETURNING *',
      [b.nama, b.kode, b.kategori, b.stok_total, updatedStokTersedia, b.lokasi, b.deskripsi, b.image_url !== undefined ? b.image_url : null, id]
    );
    return res.rows[0];
  } else {
    const db = readLocalDb();
    const idx = db.barang.findIndex(item => item.id === id);
    if (idx === -1) throw new Error('Barang tidak ditemukan');

    if (b.kode && b.kode !== db.barang[idx].kode) {
      if (db.barang.some(item => item.kode.toLowerCase() === b.kode!.toLowerCase())) {
        throw new Error(`Barang dengan kode ${b.kode} sudah terdaftar`);
      }
    }

    const curr = db.barang[idx];
    let updatedStokTersedia = curr.stok_tersedia;
    if (b.stok_total !== undefined) {
      const diff = b.stok_total - curr.stok_total;
      updatedStokTersedia = Math.max(0, curr.stok_tersedia + diff);
    }

    db.barang[idx] = {
      ...curr,
      nama: b.nama ?? curr.nama,
      kode: b.kode ?? curr.kode,
      kategori: b.kategori ?? curr.kategori,
      stok_total: b.stok_total ?? curr.stok_total,
      stok_tersedia: updatedStokTersedia,
      lokasi: b.lokasi ?? curr.lokasi,
      deskripsi: b.deskripsi ?? curr.deskripsi,
      image_url: b.image_url !== undefined ? b.image_url : curr.image_url,
    };

    writeLocalDb(db);
    return db.barang[idx];
  }
}

export async function deleteBarang(id: number): Promise<boolean> {
  await ensureDb();
  if (isPostgres && pool) {
    await pool.query('DELETE FROM barang WHERE id = $1', [id]);
    return true;
  } else {
    const db = readLocalDb();
    const lenBefore = db.barang.length;
    db.barang = db.barang.filter(item => item.id !== id);
    // Cascade delete local borrows
    db.peminjaman = db.peminjaman.filter(p => p.barang_id !== id);
    writeLocalDb(db);
    return db.barang.length < lenBefore;
  }
}

// 4. PEMINJAMAN (BORROWING) ACTIONS
export async function getPeminjaman(): Promise<Peminjaman[]> {
  await ensureDb();
  if (isPostgres && pool) {
    const res = await pool.query(`
      SELECT p.*, b.nama as barang_nama, b.kode as barang_kode
      FROM peminjaman p
      LEFT JOIN barang b ON p.barang_id = b.id
      ORDER BY p.id DESC
    `);
    // Convert Dates properly
    return res.rows.map(row => ({
      ...row,
      tanggal_pinjam: row.tanggal_pinjam ? new Date(row.tanggal_pinjam).toISOString().split('T')[0] : '',
      tanggal_kembali: row.tanggal_kembali ? new Date(row.tanggal_kembali).toISOString().split('T')[0] : ''
    }));
  } else {
    const db = readLocalDb();
    const list = db.peminjaman.map(p => {
      const b = db.barang.find(item => item.id === p.barang_id);
      return {
        ...p,
        barang_nama: b ? b.nama : 'Barang Terhapus',
        barang_kode: b ? b.kode : 'N/A'
      };
    });
    return [...list].sort((a, b) => b.id - a.id);
  }
}

export async function createPeminjaman(p: Omit<Peminjaman, 'id'>): Promise<Peminjaman> {
  await ensureDb();
  if (isPostgres && pool) {
    // Transaction to safely check and update stock
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const bRes = await client.query('SELECT stok_tersedia, nama, kode FROM barang WHERE id = $1 FOR UPDATE', [p.barang_id]);
      if (bRes.rows.length === 0) throw new Error('Barang tidak ditemukan');
      
      const b = bRes.rows[0];
      if (b.stok_tersedia < p.jumlah) {
        throw new Error(`Stok tidak mencukupi. Tersedia: ${b.stok_tersedia}, Diminta: ${p.jumlah}`);
      }

      // Deduct stock
      await client.query('UPDATE barang SET stok_tersedia = stok_tersedia - $1 WHERE id = $2', [p.jumlah, p.barang_id]);
      
      // Create Peminjaman
      const res = await client.query(
        'INSERT INTO peminjaman (nama_peminjam, kontak_peminjam, barang_id, jumlah, tanggal_pinjam, tanggal_kembali, status, catatan) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [p.nama_peminjam, p.kontak_peminjam, p.barang_id, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali, p.status || 'Dipinjam', p.catatan]
      );
      
      await client.query('COMMIT');
      
      return {
        ...res.rows[0],
        barang_nama: b.nama,
        barang_kode: b.kode,
        tanggal_pinjam: new Date(res.rows[0].tanggal_pinjam).toISOString().split('T')[0],
        tanggal_kembali: new Date(res.rows[0].tanggal_kembali).toISOString().split('T')[0]
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const db = readLocalDb();
    const bIdx = db.barang.findIndex(item => item.id === p.barang_id);
    if (bIdx === -1) throw new Error('Barang tidak ditemukan');
    
    const b = db.barang[bIdx];
    if (b.stok_tersedia < p.jumlah) {
      throw new Error(`Stok tidak mencukupi. Tersedia: ${b.stok_tersedia}, Diminta: ${p.jumlah}`);
    }

    // Deduct stock
    db.barang[bIdx].stok_tersedia -= p.jumlah;

    const newId = db.peminjaman.length > 0 ? Math.max(...db.peminjaman.map(item => item.id)) + 1 : 1;
    const newP: Peminjaman = {
      id: newId,
      nama_peminjam: p.nama_peminjam,
      kontak_peminjam: p.kontak_peminjam,
      barang_id: p.barang_id,
      jumlah: p.jumlah,
      tanggal_pinjam: p.tanggal_pinjam,
      tanggal_kembali: p.tanggal_kembali,
      status: p.status || 'Dipinjam',
      catatan: p.catatan,
      created_at: new Date().toISOString()
    };
    db.peminjaman.push(newP);
    writeLocalDb(db);
    
    return {
      ...newP,
      barang_nama: b.nama,
      barang_kode: b.kode
    };
  }
}

export async function updatePeminjaman(id: number, p: Partial<Peminjaman>): Promise<Peminjaman> {
  await ensureDb();
  if (isPostgres && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currRes = await client.query('SELECT * FROM peminjaman WHERE id = $1 FOR UPDATE', [id]);
      if (currRes.rows.length === 0) throw new Error('Transaksi peminjaman tidak ditemukan');
      const curr = currRes.rows[0];

      let finalStatus = p.status ?? curr.status;
      let finalJumlah = p.jumlah ?? curr.jumlah;
      const bId = p.barang_id ?? curr.barang_id;

      const bRes = await client.query('SELECT stok_tersedia, stok_total, nama, kode FROM barang WHERE id = $1 FOR UPDATE', [bId]);
      if (bRes.rows.length === 0) throw new Error('Barang tidak ditemukan');
      const b = bRes.rows[0];

      // Handle stock return adjustments
      // Case 1: Status changing from Dipinjam / Terlambat to Dikembalikan
      if ((curr.status === 'Dipinjam' || curr.status === 'Terlambat') && finalStatus === 'Dikembalikan') {
        // Return quantity to stock_tersedia
        await client.query('UPDATE barang SET stok_tersedia = LEAST(stok_total, stok_tersedia + $1) WHERE id = $2', [curr.jumlah, bId]);
      } 
      // Case 2: Status changing from Dikembalikan back to Dipinjam / Terlambat
      else if (curr.status === 'Dikembalikan' && (finalStatus === 'Dipinjam' || finalStatus === 'Terlambat')) {
        // Check stock and deduct
        if (b.stok_tersedia < finalJumlah) {
          throw new Error(`Stok tidak mencukupi untuk meminjam kembali. Tersedia: ${b.stok_tersedia}`);
        }
        await client.query('UPDATE barang SET stok_tersedia = stok_tersedia - $1 WHERE id = $2', [finalJumlah, bId]);
      }
      // Case 3: Still borrowed, but changing borrowing quantity
      else if (curr.status !== 'Dikembalikan' && finalStatus !== 'Dikembalikan' && finalJumlah !== curr.jumlah) {
        const diff = finalJumlah - curr.jumlah; // if increasing (+), need more stock. if decreasing (-), release stock.
        if (b.stok_tersedia < diff) {
          throw new Error(`Stok tidak mencukupi untuk penyesuaian jumlah. Tersedia: ${b.stok_tersedia}`);
        }
        await client.query('UPDATE barang SET stok_tersedia = stok_tersedia - $1 WHERE id = $2', [diff, bId]);
      }

      const res = await pool.query(
        'UPDATE peminjaman SET nama_peminjam = COALESCE($1, nama_peminjam), kontak_peminjam = COALESCE($2, kontak_peminjam), jumlah = $3, tanggal_pinjam = COALESCE($4, tanggal_pinjam), tanggal_kembali = COALESCE($5, tanggal_kembali), status = $6, catatan = COALESCE($7, catatan) WHERE id = $8 RETURNING *',
        [p.nama_peminjam, p.kontak_peminjam, finalJumlah, p.tanggal_pinjam, p.tanggal_kembali, finalStatus, p.catatan, id]
      );

      await client.query('COMMIT');
      return {
        ...res.rows[0],
        barang_nama: b.nama,
        barang_kode: b.kode,
        tanggal_pinjam: new Date(res.rows[0].tanggal_pinjam).toISOString().split('T')[0],
        tanggal_kembali: new Date(res.rows[0].tanggal_kembali).toISOString().split('T')[0]
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const db = readLocalDb();
    const pIdx = db.peminjaman.findIndex(item => item.id === id);
    if (pIdx === -1) throw new Error('Peminjaman tidak ditemukan');

    const curr = db.peminjaman[pIdx];
    const bId = p.barang_id ?? curr.barang_id;
    const bIdx = db.barang.findIndex(item => item.id === bId);
    if (bIdx === -1) throw new Error('Barang tidak ditemukan');

    const b = db.barang[bIdx];
    let finalStatus = p.status ?? curr.status;
    let finalJumlah = p.jumlah ?? curr.jumlah;

    // Adjustments
    if ((curr.status === 'Dipinjam' || curr.status === 'Terlambat') && finalStatus === 'Dikembalikan') {
      db.barang[bIdx].stok_tersedia = Math.min(b.stok_total, b.stok_tersedia + curr.jumlah);
    } else if (curr.status === 'Dikembalikan' && (finalStatus === 'Dipinjam' || finalStatus === 'Terlambat')) {
      if (b.stok_tersedia < finalJumlah) {
        throw new Error(`Stok tidak mencukupi untuk meminjam kembali. Tersedia: ${b.stok_tersedia}`);
      }
      db.barang[bIdx].stok_tersedia -= finalJumlah;
    } else if (curr.status !== 'Dikembalikan' && finalStatus !== 'Dikembalikan' && finalJumlah !== curr.jumlah) {
      const diff = finalJumlah - curr.jumlah;
      if (b.stok_tersedia < diff) {
        throw new Error(`Stok tidak mencukupi untuk penyesuaian. Tersedia: ${b.stok_tersedia}`);
      }
      db.barang[bIdx].stok_tersedia -= diff;
    }

    db.peminjaman[pIdx] = {
      ...curr,
      nama_peminjam: p.nama_peminjam ?? curr.nama_peminjam,
      kontak_peminjam: p.kontak_peminjam ?? curr.kontak_peminjam,
      jumlah: finalJumlah,
      tanggal_pinjam: p.tanggal_pinjam ?? curr.tanggal_pinjam,
      tanggal_kembali: p.tanggal_kembali ?? curr.tanggal_kembali,
      status: finalStatus,
      catatan: p.catatan ?? curr.catatan,
    };

    writeLocalDb(db);
    return {
      ...db.peminjaman[pIdx],
      barang_nama: b.nama,
      barang_kode: b.kode
    };
  }
}

export async function deletePeminjaman(id: number): Promise<boolean> {
  await ensureDb();
  if (isPostgres && pool) {
    // If deleted transaction was active, restore stock
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const currRes = await client.query('SELECT status, jumlah, barang_id FROM peminjaman WHERE id = $1', [id]);
      if (currRes.rows.length > 0) {
        const curr = currRes.rows[0];
        if (curr.status === 'Dipinjam' || curr.status === 'Terlambat') {
          await client.query('UPDATE barang SET stok_tersedia = LEAST(stok_total, stok_tersedia + $1) WHERE id = $2', [curr.jumlah, curr.barang_id]);
        }
      }
      await client.query('DELETE FROM peminjaman WHERE id = $1', [id]);
      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const db = readLocalDb();
    const idx = db.peminjaman.findIndex(p => p.id === id);
    if (idx !== -1) {
      const curr = db.peminjaman[idx];
      if (curr.status === 'Dipinjam' || curr.status === 'Terlambat') {
        const bIdx = db.barang.findIndex(item => item.id === curr.barang_id);
        if (bIdx !== -1) {
          db.barang[bIdx].stok_tersedia = Math.min(db.barang[bIdx].stok_total, db.barang[bIdx].stok_tersedia + curr.jumlah);
        }
      }
      db.peminjaman.splice(idx, 1);
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}
