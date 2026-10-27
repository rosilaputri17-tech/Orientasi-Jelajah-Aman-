import { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, ActivityIndicator, Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import Text from "../../components/TeksTema";
import { useTema } from "../../context/TemaContext";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import StatusData from "../../components/StatusData";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { ambilCuacaOfflineFirst, BATAS_CACHE_MS } from "../../services/cuacaRepository";
import { bersihkanCacheLama, daftarKotaTersimpan } from "../../services/cacheRepository";
import { tambahRiwayat } from "../../services/riwayatStorage";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { mintaIzinLokasi, ambilKoordinatSaatIni } from "../../services/locationService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import { HasilCuacaOffline } from "../../types/cache";

export default function HalamanUtama() {
  const { warna } = useTema();

  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [hasil, setHasil] = useState<HasilCuacaOffline | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [sudahFavorit, setSudahFavorit] = useState(false);
  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0); // pencegah race condition

  // Parameter dari tab Riwayat (kota yang diklik)
  const { cari, t } = useLocalSearchParams<{ cari?: string; t?: string }>();

  // Saat aplikasi dibuka: buang cache > 7 hari
  useEffect(() => {
    bersihkanCacheLama(BATAS_CACHE_MS).catch(() => {});
  }, []);

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasilPencarian([]);
      return;
    }
    cariKota(teksTertunda).then(setHasilPencarian).catch(() => setHasilPencarian([]));
  }, [teksTertunda]);

  // Saat kota di tab Riwayat diklik, cari otomatis dan tampilkan cuacanya
  useEffect(() => {
    if (!cari) return;

    let dibatalkan = false;

    async function cariDariRiwayat(nama: string) {
      try {
        // 1. Kalau kota ini ada di cache perangkat, buka langsung (juga bisa offline)
        const tersimpan = await daftarKotaTersimpan();
        const cocok = tersimpan.find(
          (k) => k.nama.trim().toLowerCase() === nama.trim().toLowerCase()
        );
        if (dibatalkan) return;

        if (cocok) {
          pilihKota({
            id: cocok.id,
            name: cocok.nama,
            latitude: cocok.latitude,
            longitude: cocok.longitude,
            country: "",
          });
          return;
        }

        // 2. Kalau tidak, cari lewat geocoding seperti biasa
        const hasilCari = await cariKota(nama);
        if (dibatalkan) return;

        setHasilPencarian(hasilCari);
        if (hasilCari.length === 0) {
          setPesanError(`Kota "${nama}" tidak ditemukan.`);
          return;
        }
        pilihKota(hasilCari[0]);
      } catch {
        if (dibatalkan) return;
        setHasilPencarian([]);
        setPesanError(
          "Pencarian gagal. Saat offline, hanya kota yang pernah dicari yang tersedia."
        );
      }
    }

    cariDariRiwayat(cari);

    return () => {
      dibatalkan = true;
    };
  }, [cari, t]);

  // Cek ulang status favorit setiap kota berganti dan setiap layar ini
  // tampil kembali (misalnya setelah menyimpan di halaman tambah-favorit,
  // atau setelah menghapus favorit di tab Riwayat)
  useFocusEffect(
    useCallback(() => {
      let dibatalkan = false;

      async function cekFavorit() {
        if (!kotaTerpilih || kotaTerpilih.id === -1) {
          setSudahFavorit(false);
          return;
        }

        const daftar = await ambilSemuaFavorit();
        const sudahAda = daftar.some((k) => k.id === kotaTerpilih.id);

        if (!dibatalkan) setSudahFavorit(sudahAda);
      }

      cekFavorit();

      return () => {
        dibatalkan = true;
      };
    }, [kotaTerpilih])
  );

  async function pilihKota(kota: HasilGeocoding, paksaPerbarui = false) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);

    try {
      const data = await ambilCuacaOfflineFirst(
        { id: kota.id, nama: kota.name, latitude: kota.latitude, longitude: kota.longitude },
        { paksaPerbarui }
      );
      if (idSaatIni !== requestIdRef.current) return; // hasil basi, abaikan
      setHasil(data);

      // Catat ke riwayat (bukan untuk "Lokasi Saat Ini")
      if (kota.id !== -1) {
        tambahRiwayat(kota.name);
      }
    } catch (err) {
      if (idSaatIni !== requestIdRef.current) return;
      setHasil(null);
      setPesanError(
        "Belum ada data tersimpan dan tidak ada koneksi internet. Sambungkan internet lalu coba lagi."
      );
    } finally {
      if (idSaatIni === requestIdRef.current) setSedangMemuat(false);
    }
  }

  async function gunakanLokasiSaatIni() {
    const status = await mintaIzinLokasi();
    if (status === "denied") {
      setPesanLokasi("Izin lokasi ditolak. Silakan cari kota secara manual di atas.");
      return;
    }
    if (status === "unavailable") {
      setPesanLokasi("Layanan lokasi tidak aktif di perangkat ini. Silakan cari kota secara manual.");
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: warna.latar }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBox onCari={setTeksCari} />

        <Button title="Gunakan Lokasi Saat Ini" onPress={gunakanLokasiSaatIni} />

        {pesanLokasi && <Text accessibilityLabel={pesanLokasi}>{pesanLokasi}</Text>}

        {hasilPencarian.map((kota) => (
          <TouchableOpacity key={kota.id} onPress={() => pilihKota(kota)}>
            <Text>{kota.name}</Text>
          </TouchableOpacity>
        ))}

        {sedangMemuat && <ActivityIndicator />}

        {pesanError && (
          <View>
            <Text accessibilityLabel={pesanError}>{pesanError}</Text>
            <Button
              title="Coba Lagi"
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih, true)}
            />
          </View>
        )}

        {hasil && kotaTerpilih && !sedangMemuat && (
          <>
            <StatusData sumber={hasil.sumber} disimpanPada={hasil.disimpanPada} />
            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={hasil.cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(hasil.kualitasUdara.indeksAQI)}
            />
            <Text style={{ fontSize: 12, color: warna.teksSekunder }}>
              Kondisi: {labelKodeCuaca(hasil.cuaca.saatIni.kodeCuaca)} {"\u2022"} Angin{" "}
              {hasil.cuaca.saatIni.kecepatanAngin} km/j
            </Text>
            <Button
              title="Perbarui Sekarang"
              onPress={() => pilihKota(kotaTerpilih, true)}
            />

            {/* Tombol berubah menjadi "SUDAH DIFAVORITKAN" bila sudah tersimpan.
                "Lokasi Saat Ini" (id -1) tidak bisa difavoritkan. */}
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
          </>
        )}

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}