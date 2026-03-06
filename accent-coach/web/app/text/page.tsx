"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Sparkles, AlertTriangle, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  analyzeText,
  fetchTextJob,
  fetchTextAnswers,
  TextJobResponse,
  AudienceAnswer,
} from "@/lib/api";

export default function TextPage() {
  const [inputText, setInputText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [job, setJob] = useState<TextJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AudienceAnswer[] | null>(null);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim() && !uploadFile) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const jobId = await analyzeText(inputText.trim() || undefined, uploadFile ?? undefined);
      pollJob(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollJob = async (jobId: string) => {
    try {
      const response = await fetchTextJob(jobId);
      setJob(response);
      setAnswers(null);
      if (response.status === "processing") {
        setTimeout(() => pollJob(jobId), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load result");
    }
  };

  const handleGenerateAnswers = async () => {
    if (!job?.job_id) return;
    setIsLoadingAnswers(true);
    setError(null);
    try {
      const { answers: res } = await fetchTextAnswers(job.job_id);
      setAnswers(res);
      if (res.length > 0) setExpandedQ(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate answers");
    } finally {
      setIsLoadingAnswers(false);
    }
  };

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Text</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Script & feedback from text</h1>
            <p className="text-sm text-slate-500">
              Turn your notes, reports, or documents into a presentation script, delivery feedback, and practice questions—no recording required.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Type or paste your content</CardTitle>
              <CardDescription className="mt-1">Notes, outline, or draft.</CardDescription>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your presentation notes, outline, or any content you want to turn into a script..."
            className="min-h-[180px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
            disabled={!!uploadFile}
          />
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Or upload a document</CardTitle>
              <CardDescription className="mt-1">TXT, PDF, or DOCX.</CardDescription>
            </div>
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
            <input
              type="file"
              accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setUploadFile(f ?? null);
                if (f) setInputText("");
              }}
            />
            <span className="text-slate-700">Choose file</span>
            <span className="text-xs text-slate-400">Max 10MB</span>
          </label>
          {uploadFile && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{uploadFile.name}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadFile(null);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" /> What you&apos;ll get
          </CardTitle>
          <CardDescription className="mt-2">
            A spoken-word script, clarity feedback, and questions your audience might ask—with
            optional AI-generated answers.
          </CardDescription>
        </div>
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={(!inputText.trim() && !uploadFile) || isSubmitting}
        >
          {isSubmitting ? "Analyzing…" : "Generate script & feedback"}
        </Button>
      </Card>

      {error && (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Something went wrong
          </CardTitle>
          <CardDescription className="mt-2 text-rose-700">{error}</CardDescription>
        </Card>
      )}

      {job?.status === "processing" && (
        <Card>
          <CardTitle>Generating your script</CardTitle>
          <CardDescription className="mt-2">
            Creating a presentation script, feedback, and audience questions…
          </CardDescription>
        </Card>
      )}

      {job?.status === "done" && job.result && (
        <div className="space-y-6">
          <Card>
            <CardTitle>Your presentation script</CardTitle>
            <CardDescription className="mt-1">
              A spoken-word script you can use to present this content (2–4 min read).
            </CardDescription>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {job.result.script || "No script generated."}
            </div>
          </Card>

          <Card>
            <CardTitle>Feedback</CardTitle>
            <CardDescription className="mt-1">Tips to improve clarity and delivery.</CardDescription>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {(job.result.feedback || []).map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </Card>

          {job.result.questions?.length ? (
            <Card className="border-amber-100 bg-amber-50/50">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-amber-600" /> Audience questions
              </CardTitle>
              <CardDescription className="mt-1">
                Questions your audience might ask—generate AI answers to prepare.
              </CardDescription>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {job.result.questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-xs font-semibold text-amber-800">
                      {i + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {!answers ? (
                  <Button
                    variant="outline"
                    className="gap-2 border-amber-300 bg-white hover:bg-amber-50"
                    onClick={handleGenerateAnswers}
                    disabled={isLoadingAnswers}
                  >
                    <Sparkles className="h-4 w-4" />
                    {isLoadingAnswers ? "Generating answers…" : "Generate answers"}
                  </Button>
                ) : answers.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Suggested answers
                    </p>
                    {answers.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-amber-200/60 bg-white p-4 shadow-sm"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-800"
                          onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                        >
                          {item.question}
                          {expandedQ === i ? (
                            <ChevronUp className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                        {expandedQ === i && (
                          <p className="mt-3 border-t border-amber-100 pt-3 text-sm text-slate-600">
                            {item.answer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No answers generated. Try again.</p>
                )}
              </div>
            </Card>
          ) : null}
        </div>
      )}

      {job?.status === "error" && (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Analysis failed
          </CardTitle>
          <CardDescription className="mt-2 text-rose-700">{job.error}</CardDescription>
        </Card>
      )}
    </div>
  );
}
