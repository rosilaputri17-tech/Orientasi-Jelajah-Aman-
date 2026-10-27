import { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Text from "../../components/TeksTema";
import { useTema } from "../../context/TemaContext";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import StatusData from "../../components/StatusData";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { ambilCuacaOfflineFirst, BATAS_CACHE_MS } from "../../services/cuacaRepository";
import {
  bersihkanCacheLama,
  daftarKotaTersimpan,
  hapusCacheKunci,
  buatKunci,
} from "../../services/cacheRepository";
import { tambahRiwayat } from "../../services/riwayatStorage";
import { mintaIzinLokasi, ambilKoordinatSaatIni } from "../../services/locationService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import { HasilCuacaOffline, RingkasanKotaTersimpan } from "../../types/cache";

// Konfirmasi lintas platform (Alert tidak berfungsi di web)
function konfirmasi(judul: string, teks: string, aksi: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(teks)) aksi();
    return;
  }
  Alert.alert(judul, teks, [
    { text: "Batal", style: "cancel" },
    { text: "Hapus", style: "destructive", onPress: aksi },
  ]);
}

export default function HalamanUtama() {
  const { warna } = useTema();

  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [hasil, setHasil] = useState<HasilCuacaOffline | null>(null);
  const [kotaTersimpan, setKotaTersimpan] = useState<RingkasanKotaTersimpan[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [pesanCache, setPesanCache] = useState<string | null>(null);
  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0); // pencegah race condition

  // Parameter dari tab Favorit & Riwayat (kota yang diklik)
  const { cari, t } = useLocalSearchParams<{ cari?: string; t?: string }>();

  async function muatKotaTersimpan() {
    setKotaTersimpan(await daftarKotaTersimpan());
  }

  // Saat aplikasi dibuka: buang cache > 7 hari, lalu tampilkan daftar tersimpan
  useEffect(() => {
    bersihkanCacheLama(BATAS_CACHE_MS)
      .then(muatKotaTersimpan)
      .catch(() => {});
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

  async function pilihKota(kota: HasilGeocoding, paksaPerbarui = false) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);
    setPesanCache(null);

    try {
      const data = await ambilCuacaOfflineFirst(
        { id: kota.id, nama: kota.name, latitude: kota.latitude, longitude: kota.longitude },
        { paksaPerbarui }
      );
      if (idSaatIni !== requestIdRef.current) return; // hasil basi, abaikan
      setHasil(data);
      muatKotaTersimpan();

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

  // Hapus cache satu kota dari daftar "Tersimpan di perangkat"
  async function prosesHapusCache(k: RingkasanKotaTersimpan) {
    await hapusCacheKunci(k.kunci);
    await muatKotaTersimpan();

    // kalau kota yang sedang tampil adalah kota ini, sembunyikan datanya
    if (kotaTerpilih && buatKunci(kotaTerpilih.latitude, kotaTerpilih.longitude) === k.kunci) {
      setHasil(null);
    }
    setPesanCache(`Cache ${k.nama} dihapus dari perangkat.`);
  }

  function hapusCache(k: RingkasanKotaTersimpan) {
    konfirmasi(
      "Hapus Cache",
      `Data cache ${k.nama} akan dihapus dari perangkat. Saat offline, kota ini tidak bisa dibuka lagi sampai dicari ulang saat online. Lanjutkan?`,
      () => prosesHapusCache(k)
    );
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

        {kotaTersimpan.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "bold" }}>
              Tersimpan di perangkat (bisa dibuka offline)
            </Text>

            {pesanCache && (
              <Text style={{ color: warna.teksSekunder }}>{pesanCache}</Text>
            )}

            {kotaTersimpan.map((k) => (
              <View
                key={k.kunci}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: warna.kartu,
                }}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() =>
                    pilihKota({
                      id: k.id,
                      name: k.nama,
                      latitude: k.latitude,
                      longitude: k.longitude,
                      country: "",
                    })
                  }
                >
                  <Text>{k.nama}</Text>
                </TouchableOpacity>

                <Button
                  title="Hapus Cache"
                  color="#d32f2f"
                  onPress={() => hapusCache(k)}
                />
              </View>
            ))}
          </View>
        )}

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
          </>
        )}

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}