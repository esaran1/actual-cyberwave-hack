"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  FileText,
  Sparkles,
  AlertTriangle,
  Mic,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Recorder } from "@/components/Recorder";
import { AudioWavePlayer } from "@/components/AudioWavePlayer";
import {
  startInterview,
  submitInterviewAnswer,
  completeInterview,
  fetchInterviewJob,
  getInterviewAudioUrl,
  InterviewJobResponse,
} from "@/lib/api";

type Step = "form" | "questions" | "completing" | "results";

export default function InterviewPage() {
  const [step, setStep] = useState<Step>("form");
  const [companyName, setCompanyName] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [companyMission, setCompanyMission] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [job, setJob] = useState<InterviewJobResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = job?.questions ?? [];
  const answers = job?.answers ?? [];
  const allAnswered = questions.length > 0 && answers.length >= questions.length;

  const handleStart = async () => {
    if (!companyName.trim() || !jobPosition.trim()) {
      setError("Company name and job position are required.");
      return;
    }
    if (!qualifications.trim() && !resumeFile) {
      setError("Provide qualifications or upload a resume.");
      return;
    }
    setIsStarting(true);
    setError(null);
    try {
      const { job_id, questions: qs } = await startInterview(
        companyName.trim(),
        jobPosition.trim(),
        companyMission.trim(),
        qualifications.trim(),
        resumeFile ?? undefined
      );
      setJob({
        job_id,
        status: "in_progress",
        questions: qs,
        answers: [],
      });
      setCurrentQuestionIndex(0);
      setStep("questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswerSubmit = async (blob: Blob, filename = "answer.webm") => {
    if (!job?.job_id) return;
    try {
      const { transcript } = await submitInterviewAnswer(
        job.job_id,
        currentQuestionIndex,
        blob,
        filename
      );
      setJob((prev) => {
        if (!prev) return prev;
        const ans = [...(prev.answers ?? [])];
        while (ans.length <= currentQuestionIndex) {
          ans.push({ question: "", transcript: "", audio_id: "" });
        }
        ans[currentQuestionIndex] = {
          question: questions[currentQuestionIndex] ?? "",
          transcript,
          audio_id: `${prev.job_id}_answer_${currentQuestionIndex}`,
        };
        return { ...prev, answers: ans };
      });
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((i) => i + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    }
  };

  const handleComplete = async () => {
    if (!job?.job_id) return;
    setIsCompleting(true);
    setError(null);
    setStep("completing");
    try {
      await completeInterview(job.job_id);
      pollForResult(job.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete");
      setStep("questions");
    } finally {
      setIsCompleting(false);
    }
  };

  const pollForResult = (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetchInterviewJob(jobId);
        setJob(res);
        if (res.status === "processing") {
          setTimeout(() => poll(), 2000);
        } else if (res.status === "done") {
          setStep("results");
        } else if (res.status === "error") {
          setError(res.error ?? "Analysis failed");
          setStep("questions");
        }
      } catch {
        setTimeout(() => poll(), 3000);
      }
    };
    poll();
  };

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Interview</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Interview practice</h1>
            <p className="text-sm text-slate-500">
              Practice for frontline roles in healthcare, retail, construction, and more. Answer tailored questions, get scored feedback, and build confidence for your next interview.
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

      {step === "form" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="space-y-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Target role
            </CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Company name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Health"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Job position *</label>
                <input
                  type="text"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="e.g. Patient Care Assistant"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Company mission / values (optional)
              </label>
              <textarea
                value={companyMission}
                onChange={(e) => setCompanyMission(e.target.value)}
                placeholder="Paste mission statement or core values..."
                className="mt-1 min-h-[80px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Your qualifications
            </CardTitle>
            <CardDescription>List experience and skills, or upload your resume (PDF, DOCX, TXT).</CardDescription>
            <textarea
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="e.g. 2 years retail, forklift certified, customer service..."
              className="min-h-[120px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
              disabled={!!resumeFile}
            />
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setResumeFile(f ?? null);
                    if (f) setQualifications("");
                  }}
                />
                <FileText className="mb-2 h-8 w-8 text-slate-400" />
                {resumeFile ? resumeFile.name : "Upload resume (TXT, PDF, DOCX)"}
              </label>
              {resumeFile && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setResumeFile(null)}>
                  Clear file
                </Button>
              )}
            </div>
          </Card>

          <Button size="lg" onClick={handleStart} disabled={isStarting}>
            {isStarting ? "Generating questions…" : "Start interview practice"}
          </Button>
        </motion.div>
      )}

      {step === "questions" && job && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentQuestionIndex(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  i < answers.length
                    ? "bg-emerald-100 text-emerald-700"
                    : i === currentQuestionIndex
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {i < answers.length ? <CheckCircle2 className="h-4 h-4" /> : i + 1}
              </button>
            ))}
          </div>

          <Card>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" /> Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <p className="mt-4 text-lg font-medium text-slate-800">
              {questions[currentQuestionIndex]}
            </p>
            {answers[currentQuestionIndex]?.transcript && (
              <p className="mt-2 text-sm text-slate-500">
                Your answer: &ldquo;{answers[currentQuestionIndex].transcript.slice(0, 200)}
                {answers[currentQuestionIndex].transcript.length > 200 ? "…" : ""}&rdquo;
              </p>
            )}
            <div className="mt-6">
              <Recorder
                key={currentQuestionIndex}
                onSubmit={handleAnswerSubmit}
                disabled={isCompleting}
                submitLabel="Submit answer"
                showUploadFallback={true}
                maxDurationSeconds={30}
              />
            </div>
          </Card>

          {allAnswered && (
            <Card className="border-emerald-100 bg-emerald-50/50">
              <CardTitle>All questions answered</CardTitle>
              <CardDescription className="mt-1">
                Complete the interview to get your score, summary, and tips to strengthen your next performance.
              </CardDescription>
              <Button
                size="lg"
                className="mt-4 gap-2"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                <Sparkles className="h-4 w-4" />
                {isCompleting ? "Analyzing…" : "Complete & get feedback"}
              </Button>
            </Card>
          )}
        </motion.div>
      )}

      {step === "completing" && (
        <Card>
          <CardTitle>Analyzing your interview</CardTitle>
          <CardDescription className="mt-2">
            Scoring your performance and generating feedback…
          </CardDescription>
        </Card>
      )}

      {step === "results" && job?.result && (
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
              <CardTitle className="text-slate-800">Interview score</CardTitle>
              <p className="mt-2 text-5xl font-bold tabular-nums text-slate-900">
                {job.result.score}
                <span className="text-2xl font-normal text-slate-600"> / 100</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {job.result.score >= 70
                  ? "Strong match—your answers and delivery are solid."
                  : job.result.score >= 50
                    ? "Possible with improvements—focus on the tips below."
                    : "Needs practice—use the feedback to prepare for your next try."}
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle>Summary</CardTitle>
            <p className="mt-4 text-slate-700">{job.result.summary}</p>
          </Card>

          <Card>
            <CardTitle>Improvements</CardTitle>
            <CardDescription className="mt-1">
              Use these tips to strengthen your next interview and stand out as a candidate.
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

          {answers.length > 0 && (
            <Card>
              <CardTitle>Your answers (playback)</CardTitle>
              <CardDescription className="mt-1">
                Review how you sounded for each question.
              </CardDescription>
              <div className="mt-4 space-y-4">
                {answers.map((a, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 p-4">
                    <p className="text-sm font-medium text-slate-800">Q: {a.question || questions[i]}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      A: {a.transcript || "No transcript available."}
                    </p>
                    <div className="mt-2">
                      <AudioWavePlayer
                        src={getInterviewAudioUrl(job!.job_id!, i)}
                        label="Play"
                        emptyText="No audio"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setStep("form");
              setJob(null);
              setCurrentQuestionIndex(0);
            }}
          >
            Practice again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
