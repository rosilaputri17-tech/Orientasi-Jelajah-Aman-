// app/detail/[kota].tsx
import { View, Button, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function HalamanDetail() {
  const { kota } = useLocalSearchParams<{ kota: string }>();

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Detail Kota: {kota}
      </Text>

      <Button
        title="Tambahkan ke Favorit"
        onPress={() => router.push("/tambah-favorit")}
      />
    </View>
  );
}