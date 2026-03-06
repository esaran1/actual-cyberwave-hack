"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";

import { WordFeedback } from "@/components/Transcript";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioWavePlayer } from "@/components/AudioWavePlayer";
import { API_BASE } from "@/lib/utils";

interface PracticeDrillProps {
  words: WordFeedback[];
}

export function PracticeDrill({ words }: PracticeDrillProps) {
  const drillWords = useMemo(() => words.filter((word) => word.issue !== "ok"), [words]);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);

  if (!drillWords.length) {
    return (
      <Card>
        <CardTitle>Practice drill</CardTitle>
        <CardDescription className="mt-2">
          No words need extra practice yet. Record another take to unlock targeted drills.
        </CardDescription>
      </Card>
    );
  }

  const current = drillWords[index % drillWords.length];

  const handleNext = () => {
    setIndex((prev) => prev + 1);
    setStreak((prev) => prev + 1);
  };

  const handleReset = () => {
    setIndex(0);
    setStreak(0);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Practice drill <Sparkles className="h-4 w-4 text-brand" />
          </CardTitle>
          <CardDescription className="mt-2">Repeat challenging words and track your streak.</CardDescription>
        </div>
        <Badge variant="secondary">Streak {streak}</Badge>
      </div>

      <div className="mt-6 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.word}-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Focus word</p>
                <h3 className="mt-2 text-3xl font-semibold capitalize text-slate-900">{current.word}</h3>
                <p className="mt-2 text-sm text-slate-600">{current.tip}</p>
              </div>
              <Badge className="capitalize" variant="outline">
                {current.issue}
              </Badge>
            </div>
          </motion.div>
        </AnimatePresence>

        <AudioWavePlayer
          src={current.clip_id ? `${API_BASE}/api/audio/${current.clip_id}` : undefined}
          label="You said"
          emptyText="Play from the word panel to hear your clip."
        />
        <AudioWavePlayer
          src={current.tts_id ? `${API_BASE}/api/tts/${current.tts_id}` : undefined}
          label="Example pronunciation"
          emptyText="Open a word panel to generate an example clip."
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNext} size="lg">
            Nailed it, next word
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset streak
          </Button>
        </div>
      </div>
    </Card>
  );
}
