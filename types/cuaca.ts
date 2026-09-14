// types/cuaca.ts

export interface DataCuaca {
    kota: string;
    suhu: number;
    kelempaban: number;
    catatan?: string;
}
export type TingkatAQI = "BAIK" | "SEDANG" | "TIDAK_SEHAT" | "BERBAHAYA" ;

export interface WeatherCardProps {
    kota: string;
    suhu: number;
    tingkatAQI: TingkatAQI;
}
