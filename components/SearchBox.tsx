import { View, Text } from "react-native";

interface SearchBoxProps {
  onCari: (kota: string) => void;
}

export default function SearchBox({ onCari }: SearchBoxProps) {
  return (
    <View
      style={{
        backgroundColor: "red",
        padding: 20,
        marginBottom: 20,
      }}
    >
      <Text style={{ color: "white", fontSize: 20 }}>
        SEARCH BOX TEST
      </Text>
    </View>
  );
}