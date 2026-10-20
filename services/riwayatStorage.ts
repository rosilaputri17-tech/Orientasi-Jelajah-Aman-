import AsyncStorage from "@react-native-async-storage/async-storage";

const KUNCI = "riwayat_pencarian";
const MAKS = 10;

export async function ambilRiwayat(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KUNCI);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function tambahRiwayat(kota: string): Promise<void> {
  const nama = kota.trim();
  if (!nama) return;

  const lama = await ambilRiwayat();
  // buang duplikat (tidak peduli huruf besar/kecil), lalu taruh paling atas
  const baru = [
    nama,
    ...lama.filter((k) => k.toLowerCase() !== nama.toLowerCase()),
  ].slice(0, MAKS);

  await AsyncStorage.setItem(KUNCI, JSON.stringify(baru));
}

export async function hapusSemuaRiwayat(): Promise<void> {
  await AsyncStorage.removeItem(KUNCI);
}