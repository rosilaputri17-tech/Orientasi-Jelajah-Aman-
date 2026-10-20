import { useState, useCallback } from "react";
import {
  View,
  Button,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../../components/TeksTema";
import { useTema } from "../../context/TemaContext";
import { ambilRiwayat, hapusSemuaRiwayat } from "../../services/riwayatStorage";
import { hapusCacheKota } from "../../services/cacheService";

export default function TabRiwayat() {
  const router = useRouter();
  const { warna } = useTema();
  const [daftarRiwayat, setDaftarRiwayat] = useState<string[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      ambilRiwayat().then(setDaftarRiwayat);
      setPesan(null);
    }, [])
  );

  function cariUlang(nama: string) {
    router.navigate({
      pathname: "/",
      params: { cari: nama, t: String(Date.now()) },
    });
  }

  async function prosesHapusCache(nama: string) {
    const jumlah = await hapusCacheKota(nama);
    setPesan(
      jumlah > 0
        ? `Cache ${nama} dihapus dari perangkat.`
        : `Tidak ada cache tersimpan untuk ${nama}.`
    );
  }

  function konfirmasiHapusCache(nama: string) {
    const teks = `Data cache ${nama} akan dihapus dari perangkat. Saat offline, kota ini tidak bisa ditampilkan lagi sampai dicari ulang saat online. Lanjutkan?`;

    if (Platform.OS === "web") {
      if (window.confirm(teks)) prosesHapusCache(nama);
      return;
    }

    Alert.alert("Hapus Cache", teks, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => prosesHapusCache(nama),
      },
    ]);
  }

  async function bersihkan() {
    await hapusSemuaRiwayat();
    setDaftarRiwayat([]);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, gap: 12, backgroundColor: warna.latar }}
    >
      {daftarRiwayat.length === 0 ? (
        <Text>
          Belum ada riwayat pencarian. Cari kota di Beranda dan hasilnya akan
          muncul di sini.
        </Text>
      ) : (
        <>
          <Text>
            {daftarRiwayat.length} pencarian terakhir (ketuk untuk mencari lagi)
          </Text>

          {pesan && <Text style={{ color: warna.teksSekunder }}>{pesan}</Text>}

          {daftarRiwayat.map((nama) => (
            <View
              key={nama}
              style={[styles.baris, { backgroundColor: warna.kartu }]}
            >
              <Pressable style={{ flex: 1 }} onPress={() => cariUlang(nama)}>
                <Text style={styles.teks}>{nama}</Text>
              </Pressable>

              <Button
                title="Hapus Cache"
                color="#d32f2f"
                onPress={() => konfirmasiHapusCache(nama)}
              />
            </View>
          ))}

          <View style={{ alignSelf: "flex-start" }}>
            <Button title="Hapus Semua Riwayat" onPress={bersihkan} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  baris: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 10,
  },
  teks: { fontSize: 16 },
});