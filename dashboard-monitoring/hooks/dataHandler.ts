"use client";

import { useEffect, useState } from "react";
import { wsClient } from "../lib/ws";

const url = process.env.NEXT_PUBLIC_WS_URL;

export function useWSData(){
    const [data, setData] = useState<any>({});
    useEffect(() => {
        console.log("🔥 useEffect jalan");
        console.log("WS URL:", url);

        if(!url){
            console.log("URL Not defined")
            return;
        }

        wsClient.connect(url)

        wsClient.subscribe((incoming) => {
            setData(incoming);
        });

        return () => {
            wsClient.disconnect();
        };
    },[]);

    return data;
}