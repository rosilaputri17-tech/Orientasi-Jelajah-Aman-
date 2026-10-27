import AsyncStorage from "@react-native-async-storage/async-storage";
import { hapusCacheNama } from "./cacheRepository";
import { HasilGeocoding } from "../types/geocoding";

const AWALAN_GEO = "cache:geo:";

// Hapus kota ini dari cache pencarian (AsyncStorage) dan sisa cache lama
// cuaca/udara yang kuncinya berbasis koordinat.
async function hapusCacheAsyncStorage(nama: string): Promise<number> {
  const target = nama.trim().toLowerCase();

  const semuaKunci = await AsyncStorage.getAllKeys();
  const kunciGeo = semuaKunci.filter((k) => k.startsWith(AWALAN_GEO));
  const pasangan = await AsyncStorage.multiGet(kunciGeo);

  const kunciDihapus = new Set<string>();
  const entriDiperbarui: [string, string][] = [];

  for (const [kunci, nilai] of pasangan) {
    if (!nilai) continue;

    let entri: { data?: HasilGeocoding[] };
    try {
      entri = JSON.parse(nilai);
    } catch {
      continue;
    }

    const data = entri.data ?? [];
    const cocok = data.filter((k) => k.name.trim().toLowerCase() === target);
    if (cocok.length === 0) continue;

    for (const k of cocok) {
      kunciDihapus.add(`cache:cuaca:${k.latitude.toFixed(2)},${k.longitude.toFixed(2)}`);
      kunciDihapus.add(`cache:udara:${k.latitude.toFixed(2)},${k.longitude.toFixed(2)}`);
    }

    const sisa = data.filter((k) => !cocok.includes(k));
    if (sisa.length === 0) {
      kunciDihapus.add(kunci);
    } else {
      entriDiperbarui.push([kunci, JSON.stringify({ ...entri, data: sisa })]);
    }
  }

  const adaDiPerangkat = semuaKunci.filter((k) => kunciDihapus.has(k));
  if (adaDiPerangkat.length > 0) await AsyncStorage.multiRemove(adaDiPerangkat);
  if (entriDiperbarui.length > 0) await AsyncStorage.multiSet(entriDiperbarui);

  return adaDiPerangkat.length + entriDiperbarui.length;
}

// Hapus semua cache milik satu kota: baris di SQLite + cache pencarian.
// Mengembalikan jumlah entri yang terhapus/diubah.
export async function hapusCacheKota(nama: string): Promise<number> {
  const dariSqlite = await hapusCacheNama(nama);
  const dariAsyncStorage = await hapusCacheAsyncStorage(nama);
  return dariSqlite + dariAsyncStorage;
}