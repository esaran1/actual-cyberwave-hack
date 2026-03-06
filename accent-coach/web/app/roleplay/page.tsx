"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, User, Info, ChevronRight, Sparkles } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recorder } from "@/components/Recorder";
import { AudioWavePlayer } from "@/components/AudioWavePlayer";
import { startRoleplay, submitRoleplayReply, completeRoleplay, type RoleplayScenario } from "@/lib/api";

const SCENARIO_TYPES = [
  { id: "customer_complaint", label: "Customer complaint" },
  { id: "policy_explanation", label: "Policy explanation" },
  { id: "urgent_request", label: "Urgent request" },
];

const DIFFICULTIES = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

type Step = "config" | "practice" | "feedback";

export default function RoleplayPage() {
  const [step, setStep] = useState<Step>("config");
  const [jobRole, setJobRole] = useState("");
  const [scenarioType, setScenarioType] = useState("customer_complaint");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [jobId, setJobId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [currentExchange, setCurrentExchange] = useState(0);
  const [replies, setReplies] = useState<{ transcript: string; audio_id: string }[]>([]);
  const [result, setResult] = useState<{ summary: string; score: number; improvements: string[] } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerLines = scenario?.customer_lines ?? [];
  const hasReplied = currentExchange < replies.length && replies[currentExchange]?.transcript;
  const allDone = customerLines.length > 0 && replies.length >= customerLines.length;

  const handleStart = async () => {
    if (!jobRole.trim()) return;
    setIsStarting(true);
    setError(null);
    try {
      const { job_id, scenario: sc } = await startRoleplay(jobRole.trim(), scenarioType, difficulty);
      setJobId(job_id);
      setScenario(sc);
      setCurrentExchange(0);
      setReplies([]);
      setResult(null);
      setStep("practice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsStarting(false);
    }
  };

  const handleReplySubmit = async (blob: Blob, filename = "reply.webm") => {
    if (!jobId) return;
    try {
      const { transcript } = await submitRoleplayReply(jobId, currentExchange, blob, filename);
      setReplies((prev) => {
        const next = [...prev];
        while (next.length <= currentExchange) next.push({ transcript: "", audio_id: "" });
        next[currentExchange] = { transcript, audio_id: `${jobId}_reply_${currentExchange}` };
        return next;
      });
      if (currentExchange < customerLines.length - 1) {
        setCurrentExchange((i) => i + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  const handleComplete = async () => {
    if (!jobId) return;
    try {
      const { result: res } = await completeRoleplay(jobId);
      setResult(res);
      setStep("feedback");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete");
    }
  };

  const conversationHistory: { role: "customer" | "user"; text: string }[] = [];
  for (let e = 0; e <= currentExchange; e++) {
    conversationHistory.push({ role: "customer", text: customerLines[e] ?? "" });
    if (e < currentExchange && replies[e]?.transcript) {
      conversationHistory.push({ role: "user", text: replies[e].transcript });
    } else if (e === currentExchange && hasReplied) {
      conversationHistory.push({ role: "user", text: replies[currentExchange]?.transcript ?? "" });
    }
  }

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Custom roleplay</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Practice any scenario</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose your job role, scenario type, and difficulty. We&apos;ll generate a realistic practice session.
        </p>
      </motion.div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription className="mt-2 text-rose-700">{error}</CardDescription>
        </Card>
      )}

      {step === "config" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardTitle>Configure your session</CardTitle>
            <CardDescription className="mt-1">
              Describe your job role (e.g., Retail Associate, Hotel Front Desk) and pick a scenario.
            </CardDescription>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Job role</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Retail Associate, Hotel Front Desk"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Scenario type</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SCENARIO_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setScenarioType(t.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        scenarioType === t.id
                          ? "bg-brand text-white"
                          : "border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Difficulty</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        difficulty === d.id
                          ? "bg-brand text-white"
                          : "border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <Button size="lg" onClick={handleStart} disabled={!jobRole.trim() || isStarting}>
            {isStarting ? "Generating…" : "Start roleplay"}
          </Button>
        </motion.div>
      )}

      {step === "practice" && scenario && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {scenario.context && (
            <Card className="border-amber-200 bg-amber-50/80">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-900">
                <Info className="h-4 w-4" /> Context
              </CardTitle>
              <p className="mt-2 text-sm text-amber-900/90">{scenario.context}</p>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Conversation</p>
              <div className="mt-4 space-y-4">
                {conversationHistory.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "customer" ? "" : "flex-row-reverse"}`}>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === "customer" ? "bg-slate-200 text-slate-600" : "bg-brand/20 text-brand"
                      }`}
                    >
                      {msg.role === "customer" ? <User className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    </div>
                    <div
                      className={`flex-1 rounded-xl px-4 py-2 ${
                        msg.role === "customer"
                          ? "bg-white border border-slate-100"
                          : "bg-brand/5 border border-brand/20"
                      }`}
                    >
                      <p className="text-sm text-slate-800">&ldquo;{msg.text}&rdquo;</p>
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
                    Exchange {currentExchange + 1} of {customerLines.length}
                  </p>
                  <div className="mt-4">
                    <Recorder
                      key={currentExchange}
                      onSubmit={handleReplySubmit}
                      submitLabel="Send reply"
                      showUploadFallback={true}
                      maxDurationSeconds={20}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-sm font-medium text-slate-600">Your reply</p>
                  <p className="mt-2 text-slate-700">&ldquo;{replies[currentExchange]?.transcript}&rdquo;</p>
                  {currentExchange < customerLines.length - 1 ? (
                    <Button className="mt-3" variant="outline" onClick={() => setCurrentExchange((i) => i + 1)}>
                      Next exchange
                    </Button>
                  ) : (
                    <Button className="mt-3 gap-2" onClick={handleComplete}>
                      <Sparkles className="h-4 w-4" /> Get feedback
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {step === "feedback" && result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className={`overflow-hidden ${result.score >= 70 ? "border-emerald-200" : result.score >= 50 ? "border-amber-200" : "border-rose-200"}`}>
            <div className="px-6 py-8">
              <CardTitle>Score</CardTitle>
              <p className="mt-2 text-5xl font-bold tabular-nums text-slate-900">
                {result.score}
                <span className="text-2xl font-normal text-slate-600"> / 100</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">{result.summary}</p>
            </div>
          </Card>
          <Card>
            <CardTitle>Tips</CardTitle>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {(result.improvements ?? []).map((tip, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 shrink-0 text-brand" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
          <Button variant="outline" onClick={() => setStep("config")}>
            New roleplay
          </Button>
        </motion.div>
      )}
    </div>
  );
}
