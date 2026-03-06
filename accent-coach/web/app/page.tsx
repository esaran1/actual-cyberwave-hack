"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, ShieldCheck } from "lucide-react";

import { analyzeFile, analyzeSample } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Hero } from "@/components/Hero";
import { FeatureCards } from "@/components/FeatureCards";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateToJob = useCallback(
    async (file: Blob, filename = "upload.webm") => {
      setError(null);
      setIsUploading(true);
      try {
        const jobId = await analyzeFile(file, filename);
        router.push(`/results/${jobId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [router]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      navigateToJob(accepted[0], accepted[0].name);
    },
    [navigateToJob]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [] },
    maxFiles: 1,
  });

  const runDemo = async () => {
    setError(null);
    setIsUploading(true);
    try {
      const jobId = await analyzeSample("demo");
      router.push(`/results/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12">
      <Hero onRunDemo={runDemo} isDemoLoading={isUploading} />

      <section id="upload" className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <motion.div
          {...getRootProps({
            role: "button",
            tabIndex: 0,
          })}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed bg-white/70 p-10 text-center shadow-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            isDragActive ? "border-brand bg-brand/5" : "border-slate-200 hover:bg-white"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-brand transition group-hover:scale-105" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Upload audio for instant clarity feedback</h2>
            <p className="mx-auto max-w-xl text-sm text-slate-500">
              Drop a WAV/MP3/MP4 or click to browse. We process it locally and return detailed feedback.
            </p>
            <Button size="lg" className="mx-auto mt-4" disabled={isUploading}>
              {isUploading ? "Uploading…" : "Select audio"}
            </Button>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-400">Private · Local processing</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardTitle>Prefer to record live?</CardTitle>
            <CardDescription className="mt-2 text-sm text-slate-600">
              Use the recorder for guided practice with waveforms and mic controls.
            </CardDescription>
            <Button asChild className="mt-6 w-full">
              <Link href="/record">Open recorder</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link href="/dashboard">View your progress</Link>
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={runDemo} disabled={isUploading}>
              Try demo
            </Button>
          </Card>
        </motion.div>
      </section>

      <FeatureCards />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-card"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Built for your success</p>
            <h3 className="mt-1 text-2xl font-semibold">Privacy-first, always</h3>
            <p className="max-w-2xl text-sm text-slate-600">
              All processing runs locally on your machine. No cloud uploads, no paid APIs—just you, your practice, and results that help you land and excel in frontline roles.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-brand" /> Local processing · No paid APIs
          </div>
        </div>
      </motion.section>
    </div>
  );
}
