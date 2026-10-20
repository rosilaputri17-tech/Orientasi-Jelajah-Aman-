// app/(tabs)/index.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { mintaIzinLokasi, ambilKoordinatSaatIni } from "../../services/locationService";
import { View, ActivityIndicator, Button, TouchableOpacity } from "react-native"; // Text dihapus dari sini
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import Text from "../../components/TeksTema"; // BARU: Text yang ikut tema
import { useTema } from "../../context/TemaContext"; // BARU
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import BannerOffline from "../../components/BannerOffline";
import { useDebounce } from "../../hooks/use-debounce";
import { useOnline } from "../../hooks/useOnline";
import { cariKota } from "../../services/geocodingService";
import { ambilCuaca } from "../../services/weatherService";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { tambahRiwayat } from "../../services/riwayatStorage";

export default function HalamanUtama() {
  const { warna } = useTema(); // BARU

  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);
  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [pesanCari, setPesanCari] = useState<string | null>(null);
  const [sudahFavorit, setSudahFavorit] = useState(false);

  const online = useOnline();
  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);

  // Parameter dari tab Riwayat (kota yang diklik)
  const { cari, t } = useLocalSearchParams<{ cari?: string; t?: string }>();

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasilPencarian([]);
      setPesanCari(null);
      return;
    }

    // cariKota sudah memakai cache: saat offline, hasil dari
    // pencarian sebelumnya tetap muncul
    cariKota(teksTertunda)
      .then((hasil) => {
        setHasilPencarian(hasil);
        setPesanCari(null);
      })
      .catch(() => {
        setHasilPencarian([]);
        setPesanCari(
          "Pencarian gagal. Saat offline, hanya kota yang pernah dicari yang tersedia."
        );
      });
  }, [teksTertunda]);

  // Saat kota di tab Riwayat diklik, cari otomatis dan tampilkan cuacanya
  useEffect(() => {
    if (!cari) return;

    let dibatalkan = false;

    cariKota(cari)
      .then((hasil) => {
        if (dibatalkan) return;

        setHasilPencarian(hasil);

        if (hasil.length === 0) {
          setPesanCari(`Kota "${cari}" tidak ditemukan.`);
          return;
        }

        setPesanCari(null);
        pilihKota(hasil[0]);
      })
      .catch(() => {
        if (dibatalkan) return;
        setHasilPencarian([]);
        setPesanCari(
          "Pencarian gagal. Saat offline, hanya kota yang pernah dicari yang tersedia."
        );
      });

    return () => {
      dibatalkan = true;
    };
  }, [cari, t]);

  // Cek ulang status favorit setiap kali layar ini kembali tampil
  // (misalnya setelah menyimpan di halaman tambah-favorit,
  // atau setelah menghapus di halaman Favorit)
  useFocusEffect(
    useCallback(() => {
      let dibatalkan = false;

      async function cekFavorit() {
        if (!kotaTerpilih || kotaTerpilih.id === -1) {
          setSudahFavorit(false);
          return;
        }

        const daftarFavorit = await ambilSemuaFavorit();
        const sudahAda = daftarFavorit.some(
          (kota) => kota.id === kotaTerpilih.id
        );

        if (!dibatalkan) setSudahFavorit(sudahAda);
      }

      cekFavorit();

      return () => {
        dibatalkan = true;
      };
    }, [kotaTerpilih])
  );

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

      if (idSaatIni !== requestIdRef.current) return;

      setCuaca(dataCuaca);
      setKualitasUdara(dataAQI);

      // Catat ke riwayat (bukan untuk "Lokasi Saat Ini")
      if (kota.id !== -1) {
        tambahRiwayat(kota.name);
      }
    } catch (err) {
      if (idSaatIni !== requestIdRef.current) return;

      setPesanError(
        online
          ? "Gagal memuat data cuaca. Coba lagi beberapa saat."
          : "Anda sedang offline dan data kota ini belum pernah tersimpan. Buka sekali saat online."
      );
    } finally {
      if (idSaatIni === requestIdRef.current) {
        setSedangMemuat(false);
      }
    }
  }

  async function gunakanLokasiSaatIni() {
    const status = await mintaIzinLokasi();

    if (status === "denied") {
      setPesanLokasi(
        "Izin lokasi ditolak. Silakan cari kota secara manual di atas."
      );
      return;
    }

    if (status === "unavailable") {
      setPesanLokasi(
        "Layanan lokasi tidak aktif di perangkat ini. Silakan cari kota secara manual."
      );
      return;
    }

    setPesanLokasi(null);

    const koordinat = await ambilKoordinatSaatIni();

    pilihKota({
      id: -1,
      name: "Lokasi Saat Ini",
      latitude: koordinat.latitude,
      longitude: koordinat.longitude,
      country: "",
    });
  }

  // Keterangan data lama (dari cache)
  const dariCache = !!(cuaca?.dariCache || kualitasUdara?.dariCache);
  const waktuCache = cuaca?.diperbaruiPada ?? kualitasUdara?.diperbaruiPada;

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, gap: 16, backgroundColor: warna.latar }} // BARU
    >
      <BannerOffline />

      <SearchBox onCari={setTeksCari} />

      <Button
        title="Gunakan Lokasi Saat Ini"
        onPress={gunakanLokasiSaatIni}
      />

      {pesanLokasi && (
        <Text
          accessibilityLabel="Pesan lokasi"
          style={{ color: warna.teksSekunder }}
        >
          {pesanLokasi}
        </Text>
      )}

      {pesanCari && (
        <Text style={{ color: warna.teksSekunder }}>{pesanCari}</Text>
      )}

      {hasilPencarian.map((kota) => (
        <TouchableOpacity
          key={kota.id}
          onPress={() => pilihKota(kota)}
        >
          <Text>{kota.name}</Text>
        </TouchableOpacity>
      ))}

      {sedangMemuat && <ActivityIndicator />}

      {pesanError && (
        <View>
          <Text accessibilityLabel="Pesan error">
            {pesanError}
          </Text>

          <Button
            title="Coba Lagi"
            onPress={() =>
              kotaTerpilih && pilihKota(kotaTerpilih)
            }
          />
        </View>
      )}

      {cuaca &&
        kualitasUdara &&
        kotaTerpilih &&
        !sedangMemuat && (
          <>
            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(kualitasUdara.indeksAQI)}
              indeksAQI={kualitasUdara.indeksAQI}
            />

            {dariCache && waktuCache && (
              <Text style={{ fontSize: 12, color: "#b45309" }}>
                Data terakhir:{" "}
                {new Date(waktuCache).toLocaleString("id-ID")}
              </Text>
            )}

            {kotaTerpilih.id !== -1 &&
              (sudahFavorit ? (
                <View
                  style={{
                    backgroundColor: "#9e9e9e",
                    paddingVertical: 10,
                    borderRadius: 2,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    SUDAH DIFAVORITKAN
                  </Text>
                </View>
              ) : (
                <Button
                  title="Tambahkan ke Favorit"
                  onPress={() =>
                    router.push({
                      pathname: "/tambah-favorit",
                      params: {
                        id: String(kotaTerpilih.id),
                        nama: kotaTerpilih.name,
                        lat: String(kotaTerpilih.latitude),
                        lon: String(kotaTerpilih.longitude),
                      },
                    })
                  }
                />
              ))}

            <Text style={{ fontSize: 14 }}>
              Suhu maksimal:{" "}
              {cuaca.harian.suhuMaksimal[0]}°C
            </Text>

            <Text style={{ fontSize: 14 }}>
              Suhu minimal:{" "}
              {cuaca.harian.suhuMinimal[0]}°C
            </Text>
          </>
        )}

      {cuaca && (
        <Text style={{ fontSize: 12, color: warna.teksSekunder }}>
          Kondisi:{" "}
          {labelKodeCuaca(cuaca.saatIni.kodeCuaca)} • Angin{" "}
          {cuaca.saatIni.kecepatanAngin} km/j
        </Text>
      )}

      {kualitasUdara && (
        <Text
          style={{
            fontSize: 12,
            color: warna.teksSekunder,
            textAlign: "center",
          }}
        >
          PM2.5: {kualitasUdara.pm25} µg/m³ • PM10:{" "}
          {kualitasUdara.pm10} µg/m³
        </Text>
      )}

      <AtribusiCuaca />
    </SafeAreaView>
  );
}