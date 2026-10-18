// app/_layout.tsx (root layout)
import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";

export default function RootLayout() {
  // Daftarkan service worker agar web bisa dibuka saat offline
  useEffect(() => {
    if (Platform.OS === "web" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("Service worker gagal:", err));
    }
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="detail/[kota]" options={{ title: "Detail Cuaca" }} />
      <Stack.Screen
        name="tambah-favorit"
        options={{ presentation: "modal", title: "Tambah Favorit" }}
      />
    </Stack>
  );
}