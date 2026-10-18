// app/tambah-favorit.tsx
import { useState } from "react";
import { View, Text, Button } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { tambahFavorit } from "../services/favoritStorage";
import BannerOffline from "../components/BannerOffline";

export default function ModalTambahFavorit() {
  const { id, nama, lat, lon } = useLocalSearchParams<{
    id: string;
    nama: string;
    lat: string;
    lon: string;
  }>();

  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const dataLengkap =
    !!nama &&
    id !== undefined &&
    lat !== undefined &&
    lon !== undefined &&
    !Number.isNaN(Number(id)) &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lon));

  async function simpan() {
    if (!dataLengkap || sedangMenyimpan) return;

    setSedangMenyimpan(true);
    setPesanError(null);

    try {
      await tambahFavorit({
        id: Number(id),
        nama,
        latitude: Number(lat),
        longitude: Number(lon),
      });
      router.back();
    } catch {
      setPesanError("Gagal menyimpan favorit. Coba lagi.");
      setSedangMenyimpan(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <BannerOffline />

      <View style={{ padding: 16, gap: 16 }}>
        {dataLengkap ? (
          <>
            <Text>Tambahkan {nama} ke daftar favorit?</Text>
            <Button
              title={sedangMenyimpan ? "Menyimpan..." : "Simpan"}
              onPress={simpan}
              disabled={sedangMenyimpan}
            />
          </>
        ) : (
          <>
            <Text>
              Data kota tidak lengkap. Pilih kota dari halaman Beranda, lalu
              tekan "Tambahkan ke Favorit".
            </Text>
            <Button title="Kembali" onPress={() => router.back()} />
          </>
        )}

        {pesanError && <Text>{pesanError}</Text>}
      </View>
    </View>
  );
}