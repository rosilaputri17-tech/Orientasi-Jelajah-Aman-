// app/(tabs)/index.tsx
import { useState, useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { ambilCuaca } from "../../services/weatherService";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);
  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  
  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0); // pencegah race condition
  
  useEffect(() => {
  if (teksTertunda.trim().length === 0) {
  setHasilPencarian([]);
  return;
  }
  cariKota(teksTertunda).then(setHasilPencarian).catch(() => setHasilPencarian([]));
  }, [teksTertunda]);

  async function pilihKota(kota: HasilGeocoding) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);
    
    try {
      const [dataCuaca, dataAQI] = await Promise.all([
      ambilCuaca(kota.latitude, kota.longitude),
      ambilKualitasUdara(kota.latitude, kota.longitude),
    ]);

    if (idSaatIni !== requestIdRef.current) return; // hasil basi, abaikan
  
    setCuaca(dataCuaca);
    setKualitasUdara(dataAQI);
  } catch (err) {
    if (idSaatIni !== requestIdRef.current) return;
    setPesanError("Gagal memuat data cuaca. Periksa koneksi internet Anda.");
  } finally {
    if (idSaatIni === requestIdRef.current) setSedangMemuat(false);
  }
}

return (
  <SafeAreaView style={{ flex: 1, padding: 16, gap: 16 }}>
    <SearchBox onCari={setTeksCari} />
    
    {hasilPencarian.map((kota) => (
      <TouchableOpacity key={kota.id} onPress={() => pilihKota(kota)}>
        <Text>{kota.name}</Text>
      </TouchableOpacity>
    ))}

    {sedangMemuat && <ActivityIndicator />}
    
    {pesanError && (
    <View>
      <Text>{pesanError}</Text>
      <Button
        title="Coba Lagi"
        onPress={() => kotaTerpilih && pilihKota(kotaTerpilih)}
      />
      </View>
    )}

{cuaca && kualitasUdara && kotaTerpilih && !sedangMemuat && (
  <>
    <WeatherCard
      kota={kotaTerpilih.name}
      suhu={cuaca.saatIni.suhu}
      tingkatAQI={konversiTingkatAQI(kualitasUdara.indeksAQI)}
      indeksAQI={kualitasUdara.indeksAQI}
    />

    <Text style={{ fontSize: 14 }}>
      Suhu maksimal: {cuaca.harian.suhuMaksimal[0]}°C
    </Text>

    <Text style={{ fontSize: 14 }}>
      Suhu minimal: {cuaca.harian.suhuMinimal[0]}°C
    </Text>
  </>
)}

{cuaca && (
  <Text style={{ fontSize: 12, color: "#888" }}>
    Kondisi: {labelKodeCuaca(cuaca.saatIni.kodeCuaca)} • Angin
{cuaca.saatIni.kecepatanAngin} km/j
  </Text>
  )}
  
  <Text style={{ fontSize: 12, color: "#888", textAlign: "center" }}>
    PM2.5: {kualitasUdara?.pm25} µg/m³ • PM10: {kualitasUdara?.pm10} µg/m³
  </Text>

  <AtribusiCuaca />
  </SafeAreaView>
  );
}