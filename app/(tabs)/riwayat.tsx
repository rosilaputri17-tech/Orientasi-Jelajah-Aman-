// app/(tabs)/riwayat.tsx  (gabungan Favorit + Riwayat)
import { useState, useCallback } from "react";
import { View, Button, Pressable, ScrollView, Alert, Platform, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../../components/TeksTema";
import { useTema } from "../../context/TemaContext";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import { ambilRiwayat, hapusSemuaRiwayat } from "../../services/riwayatStorage";
import { hapusCacheKota } from "../../services/cacheService";
import { KotaFavorit } from "../../types/favorit";

type Mode = "favorit" | "riwayat";

// Konfirmasi lintas platform (Alert tidak berfungsi di web)
function konfirmasi(
  judul: string,
  teks: string,
  tombol: string,
  aksi: () => void
) {
  if (Platform.OS === "web") {
    if (window.confirm(teks)) aksi();
    return;
  }
  Alert.alert(judul, teks, [
    { text: "Batal", style: "cancel" },
    { text: tombol, style: "destructive", onPress: aksi },
  ]);
}

export default function TabFavoritRiwayat() {
  const router = useRouter();
  const { warna } = useTema();

  const [mode, setMode] = useState<Mode>("favorit");
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [daftarRiwayat, setDaftarRiwayat] = useState<string[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit().then(setDaftarFavorit);
      ambilRiwayat().then(setDaftarRiwayat);
      setPesan(null);
    }, [])
  );

  // ---------- Favorit ----------
  async function prosesHapusFavorit(id: number) {
    await hapusFavorit(id);
    setDaftarFavorit((prev) => prev.filter((k) => k.id !== id));
  }

  function hapusFav(id: number, nama: string) {
    konfirmasi("Konfirmasi Hapus", `Yakin hapus ${nama}?`, "Hapus", () =>
      prosesHapusFavorit(id)
    );
  }

  // ---------- Riwayat ----------
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

  function hapusCache(nama: string) {
    konfirmasi(
      "Hapus Cache",
      `Data cache ${nama} akan dihapus dari perangkat. Saat offline, kota ini tidak bisa ditampilkan lagi sampai dicari ulang saat online. Lanjutkan?`,
      "Hapus",
      () => prosesHapusCache(nama)
    );
  }

  async function bersihkanRiwayat() {
    await hapusSemuaRiwayat();
    setDaftarRiwayat([]);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, gap: 12, backgroundColor: warna.latar }}
    >
      {/* Tombol segmen */}
      <View style={[styles.segmen, { backgroundColor: warna.garis }]}>
        {(["favorit", "riwayat"] as const).map((m) => {
          const aktif = mode === m;
          const jumlah = m === "favorit" ? daftarFavorit.length : daftarRiwayat.length;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.segmenItem,
                aktif && { backgroundColor: warna.kartu },
              ]}
            >
              <Text
                style={aktif ? { fontWeight: "600", color: warna.aksen } : undefined}
              >
                {m === "favorit" ? "Favorit" : "Riwayat"} ({jumlah})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {mode === "favorit" ? (
          <>
            <Text>{daftarFavorit.length} kota tersimpan</Text>

            {daftarFavorit.length === 0 && (
              <Text>
                Belum ada kota favorit. Cari kota di Beranda lalu simpan sebagai
                favorit agar muncul di sini.
              </Text>
            )}

            {daftarFavorit.map((kota) => (
              <View
                key={kota.id}
                style={[styles.baris, { backgroundColor: warna.kartu }]}
              >
                <Text style={styles.teks}>{kota.nama}</Text>
                <Button title="Hapus" onPress={() => hapusFav(kota.id, kota.nama)} />
              </View>
            ))}
          </>
        ) : (
          <>
            {daftarRiwayat.length === 0 ? (
              <Text>
                Belum ada riwayat pencarian. Cari kota di Beranda dan hasilnya
                akan muncul di sini.
              </Text>
            ) : (
              <>
                <Text>
                  {daftarRiwayat.length} pencarian terakhir (ketuk untuk mencari
                  lagi)
                </Text>

                {pesan && (
                  <Text style={{ color: warna.teksSekunder }}>{pesan}</Text>
                )}

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
                      onPress={() => hapusCache(nama)}
                    />
                  </View>
                ))}

                <View style={{ alignSelf: "flex-start" }}>
                  <Button title="Hapus Semua Riwayat" onPress={bersihkanRiwayat} />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segmen: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  segmenItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
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