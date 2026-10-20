// app/(tabs)/favorit.tsx
import { useState, useCallback } from "react";
import { View, Button, Alert, Platform } from "react-native"; // Text dihapus dari sini
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../../components/TeksTema"; // BARU
import { useTema } from "../../context/TemaContext"; // BARU
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import { KotaFavorit } from "../../types/favorit";

export default function TabFavorit() {
  const { warna } = useTema(); // BARU
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit().then(setDaftarFavorit);
    }, [])
  );

  async function prosesHapus(id: number) {
    await hapusFavorit(id);
    setDaftarFavorit((prev) => prev.filter((k) => k.id !== id));
  }

  function hapus(id: number, nama: string) {
    if (Platform.OS === "web") {
      if (window.confirm(`Yakin hapus ${nama}?`)) prosesHapus(id);
      return;
    }
    Alert.alert("Konfirmasi Hapus", `Yakin hapus ${nama}?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => prosesHapus(id) },
    ]);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, gap: 12, backgroundColor: warna.latar }} // BARU
    >
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
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text>{kota.nama}</Text>
          <Button title="Hapus" onPress={() => hapus(kota.id, kota.nama)} />
        </View>
      ))}
    </SafeAreaView>
  );
}