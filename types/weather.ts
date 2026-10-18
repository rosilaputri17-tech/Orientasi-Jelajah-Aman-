// types/weather.ts

export interface CuacaSaatIni {
  suhu: number;
  kodeCuaca: number;
  kecepatanAngin: number;
  waktu: string;
}

export interface PrakiraanHarian {
  tanggal: string[];
  suhuMaksimal: number[];
  suhuMinimal: number[];
  kodeCuaca: number[];
}

export interface DataCuacaLengkap {
  saatIni: CuacaSaatIni;
  harian: PrakiraanHarian;
  dariCache?: boolean; // true = data lama dari penyimpanan HP
  diperbaruiPada?: number; // waktu data disimpan (ms), hanya ada kalau dariCache true
}

export interface DataKualitasUdara {
  indeksAQI: number;
  pm25: number;
  pm10: number;
  dariCache?: boolean;
  diperbaruiPada?: number;
}