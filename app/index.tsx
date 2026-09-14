// app/index.tsx
import { useState, useEffect } from "react";
import { View  } from "react-native";
import WeatherCard from "../components/weathercard";
import SearchBox from "../components/SearchBox";
import RiwayatList from "../components/RiwayatList";

export  default function HalamanUtama() {
    const [kotaAktif,setKotaAktif] = useState("Pekalongan");
    const [riwayat,setRiwayat] = useState<string[]>(["Pekalongan"]);

    useEffect(() => {
        console.log("Kota aktif berubah menjadi:", kotaAktif);
    }, [kotaAktif]);

    function handleCari(kota: string) {
        setKotaAktif(kota);
        if (!riwayat.includes(kota)) {
            setRiwayat([...riwayat, kota]);
        }
    }

    return (
        <View style={{ padding: 16, gap: 16 }}>
            <SearchBox onCari={handleCari} />
            <WeatherCard kota={kotaAktif} suhu={29} tingkatAQI="BAIK" />
            <RiwayatList daftarKota={riwayat} />
        </View>
    );
}