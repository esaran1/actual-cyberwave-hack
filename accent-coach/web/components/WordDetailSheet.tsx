"use client";

import { API_BASE } from "@/lib/utils";
import { WordFeedback } from "@/components/Transcript";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AudioWavePlayer } from "@/components/AudioWavePlayer";

interface WordDetailSheetProps {
  word: WordFeedback | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WordDetailSheet({ word, open, onOpenChange }: WordDetailSheetProps) {
  const userClip = word?.clip_id ? `${API_BASE}/api/audio/${word.clip_id}` : undefined;
  const coachClip = word?.tts_id ? `${API_BASE}/api/tts/${word.tts_id}` : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {word ? (
          <SheetHeader>
            <SheetTitle className="flex flex-col gap-2 capitalize">
              <span>{word.word}</span>
              <Badge className="w-fit" variant={word.issue === "ok" ? "secondary" : "default"}>
                {word.issue === "ok" ? "Clear" : word.issue}
              </Badge>
            </SheetTitle>
            <SheetDescription className="text-base text-slate-700">
              Score {word.score}/100 · Confidence {Math.round(word.confidence * 100)}%
            </SheetDescription>
          </SheetHeader>
        ) : (
          <p className="text-sm text-slate-500">Select a word from the transcript to see details.</p>
        )}
        {word && (
          <div className="mt-6 space-y-6">
            <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">{word.tip}</p>
            <AudioWavePlayer
              src={userClip}
              label="You said"
              emptyText="We could not capture this clip yet."
            />
            <AudioWavePlayer
              src={coachClip}
              label="AccentCoach example"
              emptyText="Example audio shows up when a word needs practice."
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
