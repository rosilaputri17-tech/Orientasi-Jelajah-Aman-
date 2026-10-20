import AsyncStorage from "@react-native-async-storage/async-storage";
import { HasilGeocoding } from "../types/geocoding";

const AWALAN_GEO = "cache:geo:";

// Harus sama persis dengan skema kunci di weatherService & airQualityService
const kunciCuaca = (lat: number, lon: number) =>
  `cache:cuaca:${lat.toFixed(2)},${lon.toFixed(2)}`;
const kunciUdara = (lat: number, lon: number) =>
  `cache:udara:${lat.toFixed(2)},${lon.toFixed(2)}`;

// Hapus semua cache milik satu kota: cuaca, kualitas udara,
// dan hasil kota itu di cache pencarian (geocoding).
// Mengembalikan jumlah entri cache yang diubah/dihapus.
export async function hapusCacheKota(nama: string): Promise<number> {
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

    // cuaca & udara untuk koordinat kota ini
    for (const k of cocok) {
      kunciDihapus.add(kunciCuaca(k.latitude, k.longitude));
      kunciDihapus.add(kunciUdara(k.latitude, k.longitude));
    }

    // buang kota ini dari entri pencarian; hapus entri kalau jadi kosong
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