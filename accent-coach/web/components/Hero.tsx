"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, Upload, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onRunDemo: () => void;
  isDemoLoading: boolean;
}

export function Hero({ onRunDemo, isDemoLoading }: HeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-10 text-white shadow-card"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/70">AccentCoach</p>
      <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
        Accents aren&apos;t wrong. This is supportive clarity coaching whenever you want it.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-white/80">
        Upload or record a quick phrase. AccentCoach highlights likely pronunciation hurdles word by word and shares
        gentle guidance with real example audio.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className="gap-2 bg-white text-brand hover:bg-brand/20 hover:text-white">
          <Link href="/record">
            <Mic className="h-4 w-4" /> Record now
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="gap-2 border-white/40 bg-white/5 text-white hover:bg-white/20"
        >
          <Link href="#upload">
            <Upload className="h-4 w-4" /> Upload audio
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="gap-2 text-white hover:bg-white/10"
          onClick={onRunDemo}
          disabled={isDemoLoading}
        >
          <Play className="h-4 w-4" /> {isDemoLoading ? "Loading demo…" : "Try demo"}
        </Button>
      </div>
    </motion.section>
  );
}
