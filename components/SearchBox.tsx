import { useState } from "react";
import { View, TextInput } from "react-native";

interface SearchBoxProps {
  onCari: (teks: string) => void;
}

export default function SearchBox({ onCari }: SearchBoxProps) {
  const [teks, setTeks] = useState("");

  function handleChange(nilai: string) {
    setTeks(nilai);
    onCari(nilai);
  }

  return (
    <View style={{ width: "100%" }}>
      <TextInput
        placeholder="Cari nama kota..."
        value={teks}
        onChangeText={handleChange}
        accessibilityLabel="Cari cuaca untuk kota yang dimasukkan"
        style={{
          width: "100%",
          height: 50,
          borderWidth: 1,
          borderColor: "#999",
          borderRadius: 8,
          paddingHorizontal: 12,
        }}
      />
    </View>
  );
}