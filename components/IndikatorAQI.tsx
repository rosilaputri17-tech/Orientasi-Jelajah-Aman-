import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { LaporanUdara } from "../types/LaporanUdara";

interface Props {
  data: LaporanUdara;
}

export default function IndikatorAQI({ data }: Props) {
  let keterangan = "";

  switch (data.tingkat) {
    case "BAIK":
      keterangan = "Kualitas udara baik";
      break;

    case "SEDANG":
      keterangan = "Kualitas udara sedang";
      break;

    case "TIDAK_SEHAT":
      keterangan = "Kualitas udara tidak sehat";
      break;

    case "BERBAHAYA":
      keterangan = "Kualitas udara berbahaya";
      break;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kota}>{data.kota}</Text>

      <Text style={styles.aqi}>
        AQI: {data.indeksAQI}
      </Text>

      <Text style={styles.tingkat}>
        Tingkat: {data.tingkat}
      </Text>

      <Text>{keterangan}</Text>

      <Text style={styles.update}>
        Diperbarui: {data.diperbaruiPada}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 10,
    backgroundColor: "#eeeeee",
  },

  kota: {
    fontSize: 22,
    fontWeight: "bold",
  },

  aqi: {
    fontSize: 18,
    marginTop: 10,
  },

  tingkat: {
    fontSize: 16,
    marginTop: 5,
    fontWeight: "bold",
  },

  update: {
    marginTop: 10,
    color: "#666",
  },
});