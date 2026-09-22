// app/(tabs)/index.tsx
import { useState } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SearchBox from "../../components/SearchBox";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
        }}
      >
        Beranda
      </Text>

      <SearchBox onCari={setTeksCari} />
    </SafeAreaView>
  );
}