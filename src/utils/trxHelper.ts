import { Peminjaman } from '../types.js';

export interface BorrowGroup {
  groupKey: string;
  trxCode: string;
  trxNumber: number;
  nama_peminjam: string;
  kontak_peminjam: string;
  akun_medsos: string;
  alamat_domisili: string;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  jam_mulai: string;
  jam_selesai: string;
  jaminan: string;
  keperluan_acara: string;
  catatan: string;
  status: string;
  items: Peminjaman[];
}

/**
 * Groups all borrowing records into distinct transaction sessions
 * and assigns sequential transaction codes (TRX-0001, TRX-0002, TRX-0003, TRX-0004...)
 * ordered chronologically by creation (minimum DB record ID).
 */
export function groupAndNumberBorrows(borrows: Peminjaman[]): BorrowGroup[] {
  if (!borrows || borrows.length === 0) return [];

  // 1. Group all borrows by borrower + contact + dates
  const rawGroupsMap = new Map<string, Peminjaman[]>();

  for (const b of borrows) {
    const nameClean = (b.nama_peminjam || '').trim().toLowerCase();
    const phoneClean = (b.kontak_peminjam || '').trim();
    const key = `${nameClean}_${phoneClean}_${b.tanggal_pinjam}_${b.tanggal_kembali}`;

    if (!rawGroupsMap.has(key)) {
      rawGroupsMap.set(key, [b]);
    } else {
      rawGroupsMap.get(key)!.push(b);
    }
  }

  // 2. Sort groups by minimum item id in ascending order (creation sequence)
  const sortedRawGroups = Array.from(rawGroupsMap.entries()).sort(([, itemsA], [, itemsB]) => {
    const minIdA = Math.min(...itemsA.map(i => i.id));
    const minIdB = Math.min(...itemsB.map(i => i.id));
    return minIdA - minIdB;
  });

  // 3. Assign sequential transaction numbers: TRX-0001, TRX-0002, TRX-0003...
  const result: BorrowGroup[] = sortedRawGroups.map(([key, items], index) => {
    const trxNumber = index + 1;
    const trxCode = `TRX-${trxNumber.toString().padStart(4, '0')}`;
    const activeBorrow = items[0];

    // Attach trx_code and trx_number to each item
    items.forEach(item => {
      item.trx_code = trxCode;
      item.trx_number = trxNumber;
    });

    // Determine status of group
    const statuses = items.map(i => i.status);
    let groupStatus = statuses[0];
    if (statuses.every(s => s === 'Dikembalikan')) {
      groupStatus = 'Dikembalikan';
    } else if (statuses.includes('Terlambat')) {
      groupStatus = 'Terlambat';
    } else if (statuses.includes('Dipinjam')) {
      groupStatus = 'Dipinjam';
    } else if (statuses.includes('Booking')) {
      groupStatus = 'Booking';
    }

    return {
      groupKey: key,
      trxCode,
      trxNumber,
      nama_peminjam: activeBorrow.nama_peminjam,
      kontak_peminjam: activeBorrow.kontak_peminjam,
      akun_medsos: activeBorrow.akun_medsos || '',
      alamat_domisili: activeBorrow.alamat_domisili || '',
      tanggal_pinjam: activeBorrow.tanggal_pinjam,
      tanggal_kembali: activeBorrow.tanggal_kembali,
      jam_mulai: activeBorrow.jam_mulai || '',
      jam_selesai: activeBorrow.jam_selesai || '',
      jaminan: activeBorrow.jaminan || '',
      keperluan_acara: activeBorrow.keperluan_acara || '',
      catatan: activeBorrow.catatan || '',
      status: groupStatus,
      items
    };
  });

  return result;
}
