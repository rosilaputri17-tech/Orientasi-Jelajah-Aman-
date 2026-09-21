import { View, Text, StyleSheet } from "react-native";
import { typeScale, spacing } from "../../constants/styles";

export default function TentangScreen() {
  return (
    <View style={styles.container}>
      <Text
        style={styles.title}
        accessibilityLabel="Judul halaman Tentang"
      >
        Tentang
      </Text>

      <View style={styles.info}>
        <Text style={styles.label}>Nama Aplikasi</Text>
        <Text style={styles.value}>Orientasi Jelajah Aman</Text>

        <Text style={styles.label}>Versi</Text>
        <Text style={styles.value}>1.0.0</Text>

        <Text style={styles.label}>Pembuat</Text>
        <Text style={styles.value}>Rosila Agustina</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.besar,
  },

  title: {
    fontSize: typeScale.judul,
    fontWeight: "bold",
    marginBottom: spacing.besar,
  },

  info: {
    gap: spacing.sedang,
  },

  label: {
    fontSize: typeScale.subjudul,
    fontWeight: "600",
  },

  value: {
    fontSize: typeScale.isi,
    marginBottom: spacing.kecil,
  },
});