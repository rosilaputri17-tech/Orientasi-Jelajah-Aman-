// hooks/useOnline.ts
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const berhenti = NetInfo.addEventListener((s: NetInfoState) =>
      setOnline(!!s.isConnected && s.isInternetReachable !== false)
    );
    return berhenti;
  }, []);

  return online;
}