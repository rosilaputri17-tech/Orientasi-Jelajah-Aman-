import AsyncStorage from "@react-native-async-storage/async-storage";

export type HasilFetch<T> = {
  data: T;
  dariCache: boolean;
  waktu: number;
};

export async function fetchDenganCache<T>(
  url: string
): Promise<HasilFetch<T> | null> {
  const kunci = `cache:${url}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: T = await res.json();
    const waktu = Date.now();
    await AsyncStorage.setItem(kunci, JSON.stringify({ data, waktu }));
    return { data, dariCache: false, waktu };
  } catch {
    const tersimpan = await AsyncStorage.getItem(kunci);
    if (tersimpan) {
      const { data, waktu } = JSON.parse(tersimpan);
      return { data: data as T, dariCache: true, waktu };
    }
    return null; // offline dan belum pernah ada datanya
  }
}