"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

import { fetchJob, getJobStreamUrl, JobResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Transcript, WordFeedback } from "@/components/Transcript";
import { WordDetailSheet } from "@/components/WordDetailSheet";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Progress } from "@/components/ui/progress";
import { PracticeDrill } from "@/components/PracticeDrill";

export default function ResultsPage() {
  const params = useParams<{ job_id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeout: NodeJS.Timeout;
    let eventSource: EventSource | null = null;
    const jobId = params.job_id;
    const isPronunciationJob = !jobId.startsWith("presentation_") && !jobId.startsWith("text_") && !jobId.startsWith("interview_") && !jobId.startsWith("customercare_") && !jobId.startsWith("roleplay_");

    function trySSE() {
      if (!isPronunciationJob) return;
      try {
        eventSource = new EventSource(getJobStreamUrl(jobId));
        eventSource.onmessage = (e) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(e.data);
            if (data.event === "status") {
              setJob((prev) => (prev ? { ...prev, status: data.status } : prev));
            }
            if (data.event === "done" && data.result) {
              setJob((prev) => (prev ? { ...prev, status: "done", result: data.result } : prev));
              eventSource?.close();
            }
            if (data.event === "error") {
              setError(data.detail || "Error");
              eventSource?.close();
            }
          } catch {
            /* ignore parse errors */
          }
        };
        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;
        };
      } catch {
        /* SSE not supported, fall back to poll */
      }
    }

    trySSE();

    async function poll() {
      try {
        const response = await fetchJob(jobId);
        if (!isMounted) return;
        setJob(response);
        setError(null);
        if (response.status === "processing") {
          timeout = setTimeout(poll, 2000);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unable to load job");
        timeout = setTimeout(poll, 4000);
      }
    }
    poll();
    return () => {
      isMounted = false;
      if (timeout) clearTimeout(timeout);
      eventSource?.close();
    };
  }, [params.job_id]);

  const status = job?.status;
  const isLoading = !status || status === "processing";

  const summaryCards = useMemo(() => {
    if (job?.status !== "done" || !job.result) return null;
    const topIssues = job.result.summary.top_issues;
    const practiceList = job.result.summary.practice;
    return { topIssues, practiceList };
  }, [job]);

  const handleSelectWord = (word: WordFeedback) => {
    setSelectedWord(word);
    setIsSheetOpen(true);
  };

  const goHome = () => router.push("/");

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Clarity report</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your communication summary</h1>
          <p className="text-sm text-slate-500">Job ID: {params.job_id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" onClick={goHome}>
            Back home
          </Button>
        </div>
      </motion.div>

      {isLoading && <LoadingSkeleton />}

      {(error || status === "error") && !isLoading && (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Something went wrong
          </CardTitle>
          <CardDescription className="mt-2 text-rose-700">
            {job?.error || error || "Please try again."}
          </CardDescription>
        </Card>
      )}

      {status === "done" && job?.result && (
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-4">
            <Card>
              <CardTitle className="text-sm uppercase tracking-wide text-slate-500">Overall clarity score</CardTitle>
              <p className="mt-4 text-4xl font-semibold">
                {job.result.summary.overall_score}
                <span className="text-base text-slate-400"> / 100</span>
              </p>
              <Progress className="mt-4" value={job.result.summary.overall_score} />
              <CardDescription className="mt-2 text-sm text-slate-500">Based on your word-level delivery and clarity</CardDescription>
            </Card>
            {job.result.pacing && (
              <Card>
                <CardTitle className="text-sm uppercase tracking-wide text-slate-500">Pacing</CardTitle>
                <p className="mt-2 text-lg font-medium">
                  {job.result.pacing.words_per_minute} words/min
                  <span className="ml-2 text-sm font-normal text-slate-400">({job.result.pacing.label})</span>
                </p>
                {job.result.pacing.feedback && job.result.pacing.feedback.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {job.result.pacing.feedback.map((fb, i) => (
                      <li key={i}>• {fb}</li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
            {job.result.confidence && (
              <Card>
                <CardTitle className="text-sm uppercase tracking-wide text-slate-500">Confidence</CardTitle>
                <p className="mt-2 text-lg font-medium">
                  {job.result.confidence.confidence_score} / 100
                  {job.result.confidence.filler_count > 0 && (
                    <span className="ml-2 text-sm font-normal text-amber-600">
                      ({job.result.confidence.filler_count} filler{job.result.confidence.filler_count !== 1 ? "s" : ""})
                    </span>
                  )}
                </p>
                {job.result.confidence.feedback && job.result.confidence.feedback.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {job.result.confidence.feedback.map((fb, i) => (
                      <li key={i}>• {fb}</li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
            <Card>
              <CardTitle>Top issues</CardTitle>
              <div className="mt-4 flex flex-wrap gap-2">
                {summaryCards?.topIssues?.length ? (
                  summaryCards.topIssues.map((issue) => (
                    <Badge key={issue.label} className="capitalize">
                      {issue.label} ({issue.count})
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No major issues detected 🎉</p>
                )}
              </div>
            </Card>
            <Card>
              <CardTitle>Practice focus</CardTitle>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {summaryCards?.practiceList?.length ? (
                  summaryCards.practiceList.map((word) => (
                    <li key={word} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-brand" /> {word}
                    </li>
                  ))
                ) : (
                  <li>No practice suggestions yet.</li>
                )}
              </ul>
            </Card>
            <PracticeDrill words={job.result.transcript} />
          </div>
          <div className="space-y-4">
            <Card>
              <CardTitle>Transcript & word insights</CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-500">
                Tap a word to hear your recording, compare with an example, and see tips for improvement.
              </CardDescription>
              <div className="mt-4">
                <Transcript words={job.result.transcript} onSelect={handleSelectWord} />
              </div>
            </Card>
            <Card>
              <CardTitle>Full text</CardTitle>
              <p className="mt-3 text-slate-700">{job.result.text}</p>
            </Card>
          </div>
        </div>
      )}

      <WordDetailSheet
        word={selectedWord}
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setSelectedWord(null);
        }}
      />
    </div>
  );
}
