// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ThemeProvider as NavTheme,
  DarkTheme,
  DefaultTheme,
} from "expo-router/react-navigation";
import { TemaProvider, useTema } from "../context/TemaContext";

function IsiLayout() {
  const { gelap } = useTema();

  return (
    <NavTheme value={gelap ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="detail/[kota]" options={{ title: "Detail Cuaca" }} />
        <Stack.Screen
          name="tambah-favorit"
          options={{ presentation: "modal", title: "Tambah Favorit" }}
        />
      </Stack>
      <StatusBar style={gelap ? "light" : "dark"} />
    </NavTheme>
  );
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <IsiLayout />
    </TemaProvider>
  );
}