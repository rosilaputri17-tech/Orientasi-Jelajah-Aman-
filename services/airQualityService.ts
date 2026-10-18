// services/airQualityService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DataKualitasUdara } from "../types/weather";

const BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const BATAS_WAKTU_MS = 5000;

// Koordinat dibulatkan agar lokasi yang sama selalu memakai cache yang sama
function kunciCache(latitude: number, longitude: number) {
  return `cache:udara:${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

async function simpanCache(kunci: string, data: DataKualitasUdara) {
  try {
    await AsyncStorage.setItem(
      kunci,
      JSON.stringify({ data, diperbaruiPada: Date.now() })
    );
  } catch {
    // gagal menyimpan cache tidak boleh menggagalkan tampilan
  }
}

async function bacaCache(kunci: string): Promise<DataKualitasUdara | null> {
  try {
    const tersimpan = await AsyncStorage.getItem(kunci);
    if (!tersimpan) return null;
    const { data, diperbaruiPada } = JSON.parse(tersimpan);
    return { ...data, dariCache: true, diperbaruiPada };
  } catch {
    return null;
  }
}

export async function ambilKualitasUdara(
  latitude: number,
  longitude: number
): Promise<DataKualitasUdara> {
  const url =
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=european_aqi,pm2_5,pm10`;

  const kunci = kunciCache(latitude, longitude);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATAS_WAKTU_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Gagal memuat kualitas udara (status ${response.status})`);
    }

    const data = await response.json();
    const hasil: DataKualitasUdara = {
      indeksAQI: data.current.european_aqi,
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
      dariCache: false,
    };

    await simpanCache(kunci, hasil);
    return hasil;
  } catch (err) {
    // Gagal (offline, timeout, server error): coba pakai data tersimpan
    const cache = await bacaCache(kunci);
    if (cache) return cache;

    // Tidak ada cache: lempar error seperti sebelumnya
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Permintaan kualitas udara melebihi batas waktu, coba lagi");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}