"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface WordFeedback {
  word: string;
  start: number;
  end: number;
  score: number;
  issue: string;
  tip: string;
  clip_id?: string;
  tts_id?: string;
  confidence?: number;
}

interface TranscriptProps {
  words: WordFeedback[];
  onSelect: (word: WordFeedback) => void;
}

export function Transcript({ words, onSelect }: TranscriptProps) {
  if (!words?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500">
        No transcript available yet. Upload or record audio to begin.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {words.map((word, index) => {
        const color = getScoreColor(word.score);
        return (
          <button
            type="button"
            key={`${word.word}-${index}`}
            onClick={() => onSelect(word)}
            className={cn(
              "group rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              color.border,
              color.background,
              "hover:-translate-y-0.5 hover:shadow"
            )}
          >
            <span className={cn("capitalize", color.text)}>{word.word}</span>
            {word.issue && word.issue !== "ok" && (
              <Badge className="ml-2" variant="outline">
                {word.issue}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 85) {
    return {
      border: "border-emerald-200",
      background: "bg-emerald-50/80",
      text: "text-emerald-700",
    };
  }
  if (score >= 65) {
    return {
      border: "border-amber-200",
      background: "bg-amber-50/80",
      text: "text-amber-700",
    };
  }
  return {
    border: "border-rose-200",
    background: "bg-rose-50/80",
    text: "text-rose-700",
  };
}
