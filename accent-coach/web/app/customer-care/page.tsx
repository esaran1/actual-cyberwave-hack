"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Headphones,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MessageCircle,
  User,
  Info,
} from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recorder } from "@/components/Recorder";
import { AudioWavePlayer } from "@/components/AudioWavePlayer";
import {
  startCustomerCare,
  submitCustomerCareReply,
  completeCustomerCare,
  getCustomerCareAudioUrl,
  type CustomerCareJobResponse,
} from "@/lib/api";

const CATEGORIES = [
  "Healthcare",
  "Construction",
  "Retail",
  "Food Service",
  "Hospitality",
  "Transportation",
  "Banking & Finance",
];

type Step = "category" | "scenarios" | "feedback";

function getReplyIndex(scenarioIndex: number, exchangeIndex: number, scenarios: { customer_lines?: string[] }[]): number {
  let idx = 0;
  for (let s = 0; s < scenarioIndex; s++) {
    idx += scenarios[s]?.customer_lines?.length ?? 1;
  }
  return idx + exchangeIndex;
}

export default function CustomerCarePage() {
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [job, setJob] = useState<CustomerCareJobResponse | null>(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarios = job?.scenarios ?? [];
  const replies = job?.replies ?? [];
  const currentScenario = scenarios[currentScenarioIndex];
  const customerLines = currentScenario?.customer_lines ?? [];
  const currentCustomerLine = customerLines[currentExchangeIndex];

  const replyIndex = getReplyIndex(currentScenarioIndex, currentExchangeIndex, scenarios);
  const hasReplied = replyIndex < replies.length && replies[replyIndex]?.transcript;

  const totalExchanges = scenarios.reduce((sum, s) => sum + (s.customer_lines?.length ?? 1), 0);
  const completedExchanges = replies.filter((r) => r?.transcript).length;
  const allDone = totalExchanges > 0 && completedExchanges >= totalExchanges;

  const handleStart = async () => {
    if (!selectedCategory) return;
    setIsStarting(true);
    setError(null);
    try {
      const { job_id, scenarios: sc } = await startCustomerCare(selectedCategory);
      setJob({
        job_id,
        status: "in_progress",
        category: selectedCategory,
        scenarios: sc,
        replies: [],
      });
      setCurrentScenarioIndex(0);
      setCurrentExchangeIndex(0);
      setStep("scenarios");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsStarting(false);
    }
  };

  const handleReplySubmit = async (blob: Blob, filename = "reply.webm") => {
    if (!job?.job_id) return;
    try {
      const { transcript } = await submitCustomerCareReply(
        job.job_id,
        replyIndex,
        blob,
        filename
      );
      setJob((prev) => {
        if (!prev) return prev;
        const r = [...(prev.replies ?? [])];
        while (r.length <= replyIndex) {
          r.push({ transcript: "", audio_id: "" });
        }
        r[replyIndex] = {
          transcript,
          audio_id: `${prev.job_id!}_reply_${replyIndex}`,
        };
        return { ...prev, replies: r };
      });
      // Move to next exchange
      if (currentExchangeIndex < customerLines.length - 1) {
        setCurrentExchangeIndex((i) => i + 1);
      } else if (currentScenarioIndex < scenarios.length - 1) {
        setCurrentScenarioIndex((i) => i + 1);
        setCurrentExchangeIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit reply");
    }
  };

  const handleComplete = async () => {
    if (!job?.job_id) return;
    setError(null);
    try {
      const { result } = await completeCustomerCare(job.job_id);
      setJob((prev) =>
        prev ? { ...prev, status: "done", result } : prev
      );
      setStep("feedback");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get feedback");
    }
  };

  // Build conversation history for current scenario
  const conversationHistory: { role: "customer" | "user"; text: string; audioUrl?: string }[] = [];
  let replyIdx = getReplyIndex(currentScenarioIndex, 0, scenarios);
  for (let e = 0; e <= currentExchangeIndex; e++) {
    conversationHistory.push({
      role: "customer",
      text: customerLines[e] ?? "",
    });
    if (e < currentExchangeIndex && replyIdx < replies.length && replies[replyIdx]?.transcript) {
      conversationHistory.push({
        role: "user",
        text: replies[replyIdx]!.transcript,
        audioUrl: job ? getCustomerCareAudioUrl(job.job_id!, replyIdx) : undefined,
      });
      replyIdx++;
    } else if (e === currentExchangeIndex && hasReplied) {
      conversationHistory.push({
        role: "user",
        text: replies[replyIndex]!.transcript,
        audioUrl: job ? getCustomerCareAudioUrl(job.job_id!, replyIndex) : undefined,
      });
    }
  }

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Customer Care
        </p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Frontline worker practice
            </h1>
            <p className="text-sm text-slate-500">
              Choose your industry, face 3 simulated customers, and have a real
              back-and-forth conversation. The AI plays the customer—you respond.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </motion.div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Something went wrong
          </CardTitle>
          <CardDescription className="mt-2 text-rose-700">{error}</CardDescription>
        </Card>
      )}

      {step === "category" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" /> Select your role
            </CardTitle>
            <CardDescription className="mt-1">
              Pick the frontline category that matches your job. You&apos;ll have
              interactive conversations with 3 different customers.
            </CardDescription>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    selectedCategory === cat
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
                </button>
              ))}
            </div>
          </Card>
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!selectedCategory || isStarting}
          >
            {isStarting ? "Starting…" : "Begin practice"}
          </Button>
        </motion.div>
      )}

      {step === "scenarios" && job && currentScenario && currentCustomerLine && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            {scenarios.map((_, i) => {
              const startIdx = getReplyIndex(i, 0, scenarios);
              const count = scenarios[i]?.customer_lines?.length ?? 1;
              const done = replies.slice(startIdx, startIdx + count).every((r) => r?.transcript);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrentScenarioIndex(i);
                    const lineCount = scenarios[i]?.customer_lines?.length ?? 1;
                    const startIdx = getReplyIndex(i, 0, scenarios);
                    const allReplied = replies.slice(startIdx, startIdx + lineCount).every((r) => r?.transcript);
                    setCurrentExchangeIndex(allReplied ? lineCount - 1 : 0);
                  }}
                  className={`flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium transition ${
                    done ? "bg-emerald-100 text-emerald-700" : i === currentScenarioIndex ? "bg-brand text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : null}
                  Customer {i + 1}
                </button>
              );
            })}
          </div>

          {currentScenario?.context && (
            <Card className="border-amber-200 bg-amber-50/80">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-900">
                <Info className="h-4 w-4" /> Scenario context
              </CardTitle>
              <p className="mt-2 text-sm text-amber-900/90">
                {currentScenario.context}
              </p>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                <MessageCircle className="h-4 w-4" /> Conversation with Customer {currentScenarioIndex + 1}
              </p>
              <div className="mt-4 space-y-4">
                {conversationHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "customer" ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === "customer"
                          ? "bg-slate-200 text-slate-600"
                          : "bg-brand/20 text-brand"
                      }`}
                    >
                      {msg.role === "customer" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 rounded-xl px-4 py-2 ${
                        msg.role === "customer"
                          ? "bg-white border border-slate-100"
                          : "bg-brand/5 border border-brand/20"
                      }`}
                    >
                      <p className="text-sm text-slate-800">&ldquo;{msg.text}&rdquo;</p>
                      {msg.audioUrl && (
                        <div className="mt-2">
                          <AudioWavePlayer src={msg.audioUrl} label="Play" emptyText="" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-6">
              {!hasReplied ? (
                <>
                  <p className="text-sm font-medium text-slate-700">Your reply</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Exchange {currentExchangeIndex + 1} of {customerLines.length} · {completedExchanges} of {totalExchanges} total
                  </p>
                  <div className="mt-4">
                    <Recorder
                      key={`${currentScenarioIndex}-${currentExchangeIndex}`}
                      onSubmit={handleReplySubmit}
                      submitLabel="Send reply"
                      showUploadFallback={true}
                      maxDurationSeconds={20}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-sm font-medium text-slate-600">Your reply (submitted)</p>
                  <p className="mt-2 text-slate-700">&ldquo;{replies[replyIndex]?.transcript}&rdquo;</p>
                  <div className="mt-2">
                    <AudioWavePlayer
                      src={getCustomerCareAudioUrl(job.job_id!, replyIndex)}
                      label="Play"
                      emptyText=""
                    />
                  </div>
                  {currentExchangeIndex < customerLines.length - 1 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      The customer is responding… scroll up to see and reply.
                    </p>
                  ) : currentScenarioIndex < scenarios.length - 1 ? (
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        setCurrentScenarioIndex((i) => i + 1);
                        setCurrentExchangeIndex(0);
                      }}
                    >
                      Next customer →
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </Card>

          {allDone && (
            <Card className="border-emerald-100 bg-emerald-50/50">
              <CardTitle>All conversations complete</CardTitle>
              <CardDescription className="mt-1">
                Get feedback on how well you fulfilled each customer&apos;s needs.
              </CardDescription>
              <Button size="lg" className="mt-4 gap-2" onClick={handleComplete}>
                <Sparkles className="h-4 w-4" />
                View feedback
              </Button>
            </Card>
          )}
        </motion.div>
      )}

      {step === "feedback" && job?.result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="overflow-hidden">
            <div
              className={`px-6 py-8 ${
                job.result.score >= 70
                  ? "bg-emerald-50"
                  : job.result.score >= 50
                    ? "bg-amber-50"
                    : "bg-rose-50"
              }`}
            >
              <CardTitle className="text-slate-800">Customer care score</CardTitle>
              <p className="mt-2 text-5xl font-bold tabular-nums text-slate-900">
                {job.result.score}
                <span className="text-2xl font-normal text-slate-600"> / 100</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {job.result.score >= 70
                  ? "Strong—you acknowledged concerns and took action."
                  : job.result.score >= 50
                    ? "Good foundation—focus on empathy and clarity."
                    : "Keep practicing—acknowledge feelings and outline next steps."}
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle>Summary</CardTitle>
            <p className="mt-4 text-slate-700">{job.result.summary}</p>
          </Card>

          <Card>
            <CardTitle>Tips to improve</CardTitle>
            <CardDescription className="mt-1">
              Apply these when handling real customers.
            </CardDescription>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {(job.result.improvements ?? []).map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          <Button
            variant="outline"
            onClick={() => {
              setStep("category");
              setJob(null);
              setSelectedCategory(null);
              setCurrentScenarioIndex(0);
              setCurrentExchangeIndex(0);
            }}
          >
            Practice again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
