"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { motion } from "framer-motion";
import { Mic, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RecorderProps {
  onSubmit: (blob: Blob, filename?: string) => Promise<void>;
  disabled?: boolean;
  submitLabel?: string;
  showUploadFallback?: boolean;
  /** Max recording length in seconds. Auto-stops when reached. */
  maxDurationSeconds?: number;
}

type RecorderState = "idle" | "recording" | "preview" | "submitting";

export function Recorder({
  onSubmit,
  disabled,
  submitLabel = "Analyze take",
  showUploadFallback = true,
  maxDurationSeconds,
}: RecorderProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [status, setStatus] = useState<RecorderState>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const chunks = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const waveContainer = useRef<HTMLDivElement | null>(null);
  const waveSurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveContainer.current && !waveSurfer.current) {
      waveSurfer.current = WaveSurfer.create({
        container: waveContainer.current,
        waveColor: "#bfd3ff",
        progressColor: "#2563eb",
        height: 120,
        responsive: true,
        cursorColor: "transparent",
      });
    }
  }, []);

  useEffect(() => {
    if (previewUrl && waveSurfer.current) {
      waveSurfer.current.load(previewUrl);
    }
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const fullBlob = new Blob(chunks.current, { type: "audio/webm" });
        setBlob(fullBlob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(fullBlob);
        });
        chunks.current = [];
        setStatus("preview");
      };
      recorder.start();
      recorderRef.current = recorder;
      setMediaRecorder(recorder);
      setStatus("recording");
      setElapsed(0);
      intervalRef.current && clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (maxDurationSeconds != null && next >= maxDurationSeconds) {
            intervalRef.current && clearInterval(intervalRef.current);
            const r = recorderRef.current;
            if (r && r.state !== "inactive") {
              r.stop();
              r.stream.getTracks().forEach((t) => t.stop());
            }
            recorderRef.current = null;
            setMediaRecorder(null);
            setStatus("preview");
            return maxDurationSeconds;
          }
          return next;
        });
      }, 1000);
    } catch {
      setError("Mic access was blocked. Try uploading an existing clip below.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    setMediaRecorder(null);
    setStatus("preview");
    intervalRef.current && clearInterval(intervalRef.current);
  };

  const resetRecording = () => {
    setBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setElapsed(0);
    waveSurfer.current?.empty();
    setStatus("idle");
  };

  const handleSubmit = async (file?: Blob, filename = "recording.webm") => {
    const payload = file || blob;
    if (!payload) return;
    setStatus("submitting");
    try {
      await onSubmit(payload, filename);
    } finally {
      setStatus("preview");
    }
  };

  const handleUploadFallback = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleSubmit(file, file.name);
  };

  const isProcessing = status === "submitting" || disabled;

  return (
    <div className={showUploadFallback ? "grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : "space-y-6"}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live capture</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {formatTime(elapsed)}
              {maxDurationSeconds != null && (
                <span className="ml-2 text-base font-normal text-slate-400">/ {formatTime(maxDurationSeconds)} max</span>
              )}
            </p>
          </div>
          <StatusPill state={status} />
        </div>
        <div ref={waveContainer} className="mt-8 h-40 rounded-2xl bg-slate-50" aria-live="polite" />
        <div className="mt-8 flex flex-wrap gap-3">
          {status !== "recording" ? (
            <Button size="lg" className="gap-2" onClick={startRecording} disabled={isProcessing}>
              <Mic className="h-4 w-4" /> Start recording
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="gap-2" onClick={stopRecording}>
              Stop capture
            </Button>
          )}
          <Button variant="outline" onClick={resetRecording} disabled={!blob || isProcessing}>
            Reset
          </Button>
          <Button onClick={() => handleSubmit()} disabled={!blob || isProcessing}>
            {status === "submitting" ? "Processing…" : submitLabel}
          </Button>
        </div>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </motion.div>
      {showUploadFallback && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6"
        >
          <div className="flex items-center gap-2 text-slate-700">
            <Upload className="h-5 w-5" />
            <div>
              <p className="font-semibold">Prefer uploading?</p>
              <p className="text-sm text-slate-500">Drop a WAV/MP3/MP4 and we will process it the same way.</p>
            </div>
          </div>
          <label className="mt-6 flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
            <input type="file" accept="audio/*" className="hidden" onChange={handleUploadFallback} />
            <span className="text-slate-700">Upload audio</span>
            <span className="text-xs text-slate-400">Supported: MP3, WAV, M4A</span>
          </label>
        </motion.div>
      )}
    </div>
  );
}

function StatusPill({ state }: { state: RecorderState }) {
  const labels: Record<RecorderState, string> = {
    idle: "Idle",
    recording: "Recording",
    preview: "Ready to submit",
    submitting: "Processing",
  };
  const colors: Record<RecorderState, string> = {
    idle: "bg-slate-200 text-slate-600",
    recording: "bg-rose-100 text-rose-700",
    preview: "bg-emerald-100 text-emerald-700",
    submitting: "bg-amber-100 text-amber-700",
  };
  return <span className={`rounded-full px-4 py-1 text-xs font-semibold ${colors[state]}`}>{labels[state]}</span>;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
