"use client";

import { useEffect, useState } from "react";
import { wsClient } from "../lib/ws";

const url = process.env.NEXT_PUBLIC_WS_URL;

export function useWSData() {
  const [data, setData] = useState<any>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) {
      console.log("URL Not defined");
      return;
    }

    const unsubData = wsClient.subscribe(setData);
    const unsubStatus = wsClient.onStatus(setConnected);
    wsClient.connect(url);

    return () => {
      unsubData();
      unsubStatus();
      wsClient.disconnect();
    };
  }, []);

  return { data, connected };
}
