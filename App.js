import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
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
      <Text style={styles.judul}>Kualitas Udara</Text>
      <Text style={styles.subjudul}>Informasi kualitas udara saat ini</Text>

      <IndikatorAQI data={laporanUdara} />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },

  judul: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subjudul: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
});