import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ModeTema = "terang" | "gelap" | "sistem";
const KUNCI = "pengaturan_tema";

export type Warna = {
  latar: string;
  kartu: string;
  teks: string;
  teksSekunder: string;
  garis: string;
  aksen: string;
};

export const PALET: Record<"terang" | "gelap", Warna> = {
  terang: {
    latar: "#F2F2F2",
    kartu: "#FFFFFF",
    teks: "#111111",
    teksSekunder: "#666666",
    garis: "#DDDDDD",
    aksen: "#007AFF",
  },
  gelap: {
    latar: "#121212",
    kartu: "#1E1E1E",
    teks: "#F2F2F2",
    teksSekunder: "#A0A0A0",
    garis: "#333333",
    aksen: "#4DA3FF",
  },
};

type NilaiTema = {
  mode: ModeTema;
  setMode: (m: ModeTema) => void;
  gelap: boolean;
  warna: Warna;
};

const TemaContext = createContext<NilaiTema | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const skemaSistem = useColorScheme(); // "light" | "dark" | null
  const [mode, setModeState] = useState<ModeTema>("sistem");
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KUNCI)
      .then((v) => {
        if (v === "terang" || v === "gelap" || v === "sistem") setModeState(v);
      })
      .finally(() => setSiap(true));
  }, []);

  function setMode(m: ModeTema) {
    setModeState(m);
    AsyncStorage.setItem(KUNCI, m).catch(() => {});
  }

  const gelap = mode === "sistem" ? skemaSistem === "dark" : mode === "gelap";

  const nilai = useMemo(
    () => ({ mode, setMode, gelap, warna: gelap ? PALET.gelap : PALET.terang }),
    [mode, gelap]
  );

  if (!siap) return null; // tunggu pilihan tersimpan terbaca, supaya tidak berkedip

  return <TemaContext.Provider value={nilai}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema harus dipakai di dalam TemaProvider");
  return ctx;
}