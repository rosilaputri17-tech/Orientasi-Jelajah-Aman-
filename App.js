import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import IndikatorAQI from "./components/IndikatorAQI";

export default function App() {
  const laporanUdara = {
    kota: "Pekalongan",
    indeksAQI: 75,
    tingkat: "SEDANG",
    diperbaruiPada: "15 September 2026",
  };

  return (
    <View style={styles.container}>
      <IndikatorAQI data={laporanUdara} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
});