"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioWavePlayerProps {
  src?: string;
  label: string;
  emptyText?: string;
}

export function AudioWavePlayer({ src, label, emptyText }: AudioWavePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || waveSurferRef.current) return;
    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#cbd5ff",
      progressColor: "#2563eb",
      cursorColor: "transparent",
      height: 56,
      responsive: true,
    });
    waveSurferRef.current = waveSurfer;
    waveSurfer.on("ready", () => setIsReady(true));
    waveSurfer.on("play", () => setIsPlaying(true));
    waveSurfer.on("pause", () => setIsPlaying(false));
    waveSurfer.on("finish", () => setIsPlaying(false));
    waveSurfer.on("error", (err) => {
      // Suppress AbortError when destroy() aborts an in-flight load
      if (err?.name === "AbortError") return;
      console.warn("AudioWavePlayer error:", err);
    });
    return () => {
      try {
        waveSurfer.destroy();
      } catch {
        // AbortError expected when destroying during active load (e.g. closing sheet)
      }
      waveSurferRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!waveSurferRef.current || !src) return;
    setIsReady(false);
    const loadPromise = waveSurferRef.current.load(src);
    // Catch AbortError when component unmounts during load (destroy() aborts the fetch)
    if (loadPromise?.catch) loadPromise.catch(() => {});
  }, [src]);

  const togglePlayback = () => {
    if (!waveSurferRef.current || !isReady) return;
    waveSurferRef.current.playPause();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {src && (
          <Button size="sm" variant="outline" disabled={!isReady} onClick={togglePlayback} className="gap-2">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        )}
      </div>
      {src ? (
        <div
          className={cn(
            "rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-brand/40 hover:shadow-[0_12px_30px_rgba(37,99,235,0.18)]"
          )}
          aria-disabled={!isReady}
        >
          <div ref={containerRef} className="w-full" />
          {!isReady && <p className="mt-2 text-xs text-slate-400">Preparing audio…</p>}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
          {emptyText || "No audio yet"}
        </p>
      )}
    </div>
  );
}
