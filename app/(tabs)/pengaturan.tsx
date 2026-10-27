// app/(tabs)/pengaturan.tsx
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../../components/TeksTema"; // BARU
import PilihTema from "../../components/PilihTema"; // BARU
import { useTema } from "../../context/TemaContext"; // BARU

export default function TabPengaturan() {
  const { warna } = useTema(); // BARU

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, gap: 24, backgroundColor: warna.latar }} // BARU
    >
      {/* Pilihan tema: Terang / Gelap / Ikuti Sistem */}
      <PilihTema />

      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          Jelajah Aman
        </Text>

        <Text>Versi 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}