"use client";
import { useEffect, useRef, useState } from "react";

// Nama file = isi folder public/music (sesuai nama MP3).
const TRACKS: Record<string, string> = {
  quality: "Quality - Flight of the Bumblebee.mp3",
  logistic: "Logistic - Winter (L'Inverno).mp3",
  equipment: "equipment - Can Can Music.mp3",
  process: "Process - Waltz No. 2.mp3",
};
const ORDER = ["quality", "logistic", "equipment", "process"];

// Putar lagu kategori yang andon-nya aktif (loop), berhenti saat selesai.
// ponytail: kalau >1 kategori aktif, hanya satu lagu (urutan ORDER). Mixer kalau perlu.
export function useAlarm(downtime?: Record<string, { active?: boolean }>) {
  const [enabled, setEnabled] = useState(false); // browser blokir suara sebelum ada klik
  const audio = useRef<HTMLAudioElement | null>(null);
  const current = useRef<string | null>(null);

  const key = ORDER.find((k) => downtime?.[k]?.active) ?? null;

  useEffect(() => {
    if (!audio.current) audio.current = new Audio();
    const a = audio.current;
    if (!enabled || !key) {
      a.pause();
      current.current = null;
      return;
    }
    if (current.current === key) return;
    current.current = key;
    a.src = "/music/" + encodeURIComponent(TRACKS[key]);
    a.loop = true;
    a.play().catch(() => setEnabled(false));
  }, [enabled, key]);

  return { enabled, enable: () => setEnabled(true), disable: () => setEnabled(false), playing: enabled ? key : null };
}
