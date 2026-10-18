// services/geocodingService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GeocodingResponse, HasilGeocoding } from "../types/geocoding";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const BATAS_WAKTU_MS = 5000;
const AWALAN_CACHE = "cache:geo:";

// Seragamkan kata kunci agar "Pemalang" dan "pemalang " memakai cache yang sama
function normalisasi(nama: string) {
  return nama.trim().toLowerCase();
}

async function simpanCache(kata: string, data: HasilGeocoding[]) {
  try {
    await AsyncStorage.setItem(
      AWALAN_CACHE + kata,
      JSON.stringify({ kata, data, diperbaruiPada: Date.now() })
    );
  } catch {
    // gagal menyimpan cache tidak boleh menggagalkan pencarian
  }
}

async function bacaCache(kata: string): Promise<HasilGeocoding[] | null> {
  try {
    // 1. Cache yang cocok persis
    const persis = await AsyncStorage.getItem(AWALAN_CACHE + kata);
    if (persis) return JSON.parse(persis).data;

    // 2. Cache dari pencarian lain yang diawali kata ini
    //    (mengetik "pema" menemukan hasil "pemalang")
    const semuaKunci = await AsyncStorage.getAllKeys();
    const kunciGeo = semuaKunci.filter((k) => k.startsWith(AWALAN_CACHE));
    const pasangan = await AsyncStorage.multiGet(kunciGeo);

    const cocok = pasangan
      .map(([, nilai]) => (nilai ? JSON.parse(nilai) : null))
      .filter((item) => item && item.kata.startsWith(kata))
      .sort((a, b) => b.diperbaruiPada - a.diperbaruiPada)[0];

    return cocok ? cocok.data : null;
  } catch {
    return null;
  }
}

export async function cariKota(nama: string): Promise<HasilGeocoding[]> {
  const kata = normalisasi(nama);
  const url =
    `${BASE_URL}?name=${encodeURIComponent(kata)}&count=5&language=id&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATAS_WAKTU_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Gagal memuat data (status ${response.status})`);
    }

    const data: GeocodingResponse = await response.json();
    const hasil = data.results ?? [];

    // Hasil kosong tidak disimpan supaya tidak menimpa cache yang berguna
    if (hasil.length > 0) await simpanCache(kata, hasil);
    return hasil;
  } catch (err) {
    // Gagal (offline, timeout, server error): coba pakai data tersimpan
    const cache = await bacaCache(kata);
    if (cache) return cache;

    // Tidak ada cache yang cocok: lempar error seperti sebelumnya
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Pencarian kota melebihi batas waktu, coba lagi");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}