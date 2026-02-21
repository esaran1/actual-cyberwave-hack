"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PresentationResult } from "@/lib/api";

interface PresentationInsightsProps {
  result: PresentationResult;
}

export function PresentationInsights({ result }: PresentationInsightsProps) {
  const transcriptText = result.analysis?.transcript?.text?.toLowerCase() ?? "";
  const slidesText = result.analysis?.slides_text ?? [];

  const forgotten = useMemo(() => {
    if (!slidesText.length || !transcriptText) return [];
    const missing: string[] = [];
    slidesText.forEach((slide) => {
      const bullet = slide.split(/\n|•|\u2022/).map((t) => t.trim()).filter(Boolean);
      bullet.forEach((item) => {
        const snippet = item.slice(0, 80).toLowerCase();
        if (snippet && !transcriptText.includes(snippet.slice(0, 20))) {
          missing.push(item.slice(0, 120));
        }
      });
    });
    return missing.slice(0, 8);
  }, [slidesText, transcriptText]);

  const syncTimeline = useMemo(() => {
    const slideCount = result.slides.count ?? 0;
    const duration = result.video.duration_seconds ?? 0;
    if (!slideCount || !duration) return [];
    const perSlide = duration / slideCount;
    return Array.from({ length: slideCount }).map((_, idx) => ({
      index: idx + 1,
      start: Math.round(idx * perSlide),
      end: Math.round((idx + 1) * perSlide),
    }));
  }, [result]);

  const gestureBuckets = useMemo(() => {
    const duration = result.video.duration_seconds ?? 0;
    if (!duration) return [];
    const buckets = 8;
    const per = duration / buckets;
    return Array.from({ length: buckets }).map((_, idx) => ({
      label: `${Math.round(idx * per)}s`,
      level: (result.analysis?.video?.gesture_rate ?? 0) > 8 ? "dynamic" : "static",
    }));
  }, [result]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
      <Card>
        <CardTitle>The Vibe Check</CardTitle>
        <CardDescription className="mt-2">Body language, energy, and delivery pacing.</CardDescription>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>Energy: {result.analysis?.video?.gesture_rate ? "Engaged" : "Steady"}</p>
          <p>Posture score: {result.analysis?.video?.posture_score ?? "Unknown"}</p>
          <p>Gaze variance: {result.analysis?.video?.gaze_variance ?? "Unknown"}</p>
        </div>
      </Card>
      <Card>
        <CardTitle>The Sync Score</CardTitle>
        <CardDescription className="mt-2">Slide timing vs. speech pacing.</CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {syncTimeline.length ? (
            syncTimeline.map((slide) => (
              <div key={slide.index} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                <span className="font-semibold">Slide {slide.index}</span>
                <span>{slide.start}s–{slide.end}s</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Sync timeline appears once slides and media are analyzed.</p>
          )}
        </div>
      </Card>
      <Card>
        <CardTitle>Gesture heatmap</CardTitle>
        <CardDescription className="mt-2">Dynamic vs. static gesture moments.</CardDescription>
        <div className="mt-4 grid grid-cols-8 gap-2">
          {gestureBuckets.map((bucket, idx) => (
            <div key={idx} className="space-y-1 text-center">
              <div
                className={cn(
                  "h-10 rounded-xl",
                  bucket.level === "dynamic" ? "bg-emerald-200" : "bg-slate-200"
                )}
              />
              <span className="text-[10px] text-slate-400">{bucket.label}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>The Gaps Report</CardTitle>
        <CardDescription className="mt-2">Slide points that weren&apos;t mentioned.</CardDescription>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          {forgotten.length ? (
            forgotten.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Badge variant="outline">Missing</Badge>
                <span>{item}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">No missing slide points detected.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
