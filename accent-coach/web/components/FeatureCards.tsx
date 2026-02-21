"use client";

import { motion } from "framer-motion";
import { Ear, Sparkles, Volume2, Clock, Mic, AudioLines } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Word-by-word coaching",
    description: "See clarity scores, supportive tips, and color-coded confidence for every word you spoke.",
    icon: Sparkles,
  },
  {
    title: "Audio comparisons",
    description: "Hear your pronunciation next to an AccentCoach example built with expressive TTS.",
    icon: Ear,
  },
  {
    title: "Actionable practice",
    description: "Surface the top sounds to revisit and a short practice list to keep improving.",
    icon: Volume2,
  },
];

const steps = [
  {
    title: "Record or upload",
    description: "Share a 10–20 second audio sample or try the demo clip.",
    icon: Mic,
  },
  {
    title: "Accent-aware analysis",
    description: "We normalize audio, run faster-whisper, and label accent-sensitive sounds.",
    icon: AudioLines,
  },
  {
    title: "Friendly results",
    description: "Review the transcript, scores, and listen to coach clips from your browser.",
    icon: Clock,
  },
];

export function FeatureCards() {
  return (
    <section className="space-y-12">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="h-full bg-white/80 shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription className="mt-2 text-sm text-slate-600">{feature.description}</CardDescription>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <div id="how-it-works" className="rounded-3xl border border-slate-100 bg-white/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">How it works</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Three calm steps to clearer pronunciation</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="rounded-2xl border border-slate-100 bg-surface-subtle p-4">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
