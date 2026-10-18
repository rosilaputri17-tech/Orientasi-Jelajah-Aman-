// services/weatherService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DataCuacaLengkap } from "../types/weather";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const BATAS_WAKTU_MS = 3000;

// Koordinat dibulatkan agar lokasi yang sama selalu memakai cache yang sama
function kunciCache(latitude: number, longitude: number) {
  return `cache:cuaca:${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

async function simpanCache(kunci: string, data: DataCuacaLengkap) {
  try {
    await AsyncStorage.setItem(
      kunci,
      JSON.stringify({ data, diperbaruiPada: Date.now() })
    );
  } catch {
    // gagal menyimpan cache tidak boleh menggagalkan tampilan cuaca
  }
}

async function bacaCache(kunci: string): Promise<DataCuacaLengkap | null> {
  try {
    const tersimpan = await AsyncStorage.getItem(kunci);
    if (!tersimpan) return null;
    const { data, diperbaruiPada } = JSON.parse(tersimpan);
    return { ...data, dariCache: true, diperbaruiPada };
  } catch {
    return null;
  }
}

export async function ambilCuaca(
  latitude: number,
  longitude: number
): Promise<DataCuacaLengkap> {
  const url =
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

  const kunci = kunciCache(latitude, longitude);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATAS_WAKTU_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Gagal memuat cuaca (status ${response.status})`);
    }

    const data = await response.json();
    const hasil: DataCuacaLengkap = {
      saatIni: {
        suhu: data.current.temperature_2m,
        kodeCuaca: data.current.weather_code,
        kecepatanAngin: data.current.wind_speed_10m,
        waktu: data.current.time,
      },
      harian: {
        tanggal: data.daily.time,
        suhuMaksimal: data.daily.temperature_2m_max,
        suhuMinimal: data.daily.temperature_2m_min,
        kodeCuaca: data.daily.weather_code,
      },
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
      throw new Error("Permintaan cuaca melebihi batas waktu, coba lagi");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}