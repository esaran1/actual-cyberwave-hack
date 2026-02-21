"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Recorder } from "@/components/Recorder";
import { analyzeFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function RecordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (blob: Blob, filename = "recording.webm") => {
    setIsSubmitting(true);
    setError(null);
    try {
      const jobId = await analyzeFile(blob, filename);
      router.push(`/results/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Record</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Record a short phrase</h1>
            <p className="text-sm text-slate-500">
              Speak naturally for 10–20 seconds. AccentCoach will handle conversion, transcription, and scoring.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </motion.div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Recorder onSubmit={handleSubmit} disabled={isSubmitting} />
      <Card>
        <CardTitle>Tip</CardTitle>
        <CardDescription className="mt-2 text-sm text-slate-600">
          Accents aren&apos;t wrong. This session simply highlights patterns that might reduce clarity for new listeners.
        </CardDescription>
      </Card>
    </div>
  );
}
