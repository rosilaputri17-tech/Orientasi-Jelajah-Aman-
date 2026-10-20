import { Text, TextProps } from "react-native";
import { useTema } from "../context/TemaContext";

export default function Teks({ style, ...rest }: TextProps) {
  const { warna } = useTema();
  return <Text {...rest} style={[{ color: warna.teks }, style]} />;
}