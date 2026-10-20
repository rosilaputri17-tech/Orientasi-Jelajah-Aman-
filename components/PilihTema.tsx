import { View, Pressable, StyleSheet } from "react-native";
import Teks from "./TeksTema";
import { useTema, ModeTema } from "../context/TemaContext";

const OPSI: { nilai: ModeTema; label: string }[] = [
  { nilai: "terang", label: "Terang" },
  { nilai: "gelap", label: "Gelap" },
  { nilai: "sistem", label: "Ikuti Sistem" },
];

export default function PilihTema() {
  const { mode, setMode, warna } = useTema();

  return (
    <View style={{ gap: 8 }}>
      <Teks style={{ fontSize: 18, fontWeight: "bold" }}>Tampilan</Teks>

      {OPSI.map((o) => {
        const dipilih = mode === o.nilai;
        return (
          <Pressable
            key={o.nilai}
            onPress={() => setMode(o.nilai)}
            style={[
              styles.opsi,
              {
                backgroundColor: warna.kartu,
                borderColor: dipilih ? warna.aksen : warna.garis,
              },
            ]}
          >
            <Teks>{o.label}</Teks>
            <Teks style={{ color: warna.aksen }}>{dipilih ? "●" : "○"}</Teks>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  opsi: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
});