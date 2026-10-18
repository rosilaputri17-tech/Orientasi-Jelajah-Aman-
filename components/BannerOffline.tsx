// components/BannerOffline.tsx
import { Text, View } from "react-native";
import { useOnline } from "../hooks/useOnline";

export default function BannerOffline() {
  const online = useOnline();

  if (online) return null;

  return (
    <View style={{ backgroundColor: "#b45309", padding: 8 }}>
      <Text style={{ color: "white", textAlign: "center" }}>
        Mode offline: menampilkan data terakhir yang tersimpan
      </Text>
    </View>
  );
}