"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileVideo, Presentation, Sparkles, AlertTriangle, Video, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  analyzePresentation,
  fetchPresentationJob,
  fetchPresentationAnswers,
  PresentationJobResponse,
  AudienceAnswer,
} from "@/lib/api";
import { Recorder } from "@/components/Recorder";

export default function PresentationPage() {
  const [slidesFile, setSlidesFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<File | null>(null);
  const [useRecordedVideo, setUseRecordedVideo] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [useRecordedAudio, setUseRecordedAudio] = useState(false);
  const [job, setJob] = useState<PresentationJobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AudienceAnswer[] | null>(null);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const selectedAudio = useRecordedAudio ? recordedAudio : null;
  const selectedVideo = useRecordedVideo ? recordedVideo : null;

  const handleAnalyze = async () => {
    if (!slidesFile || (!videoFile && !selectedVideo && !selectedAudio)) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const jobId = await analyzePresentation(slidesFile, videoFile || selectedVideo, selectedAudio);
      pollJob(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollJob = async (jobId: string) => {
    try {
      const response = await fetchPresentationJob(jobId);
      setJob(response);
      setAnswers(null);
      if (response.status === "processing") {
        setTimeout(() => pollJob(jobId), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load job");
    }
  };

  const handleGenerateAnswers = async () => {
    if (!job?.job_id) return;
    setIsLoadingAnswers(true);
    setError(null);
    try {
      const { answers: res } = await fetchPresentationAnswers(job.job_id);
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
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Presentation</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Presentation coaching</h1>
            <p className="text-sm text-slate-500">
              Upload your slide deck and a recording of your talk to get pacing, posture, and gesture insights.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Presentation className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Upload your slides or materials</CardTitle>
              <CardDescription className="mt-1">
                PPT, PPTX, PDF, or Word (DOCX) accepted.
              </CardDescription>
            </div>
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
            <input
              type="file"
              accept=".ppt,.pptx,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => setSlidesFile(event.target.files?.[0] ?? null)}
            />
            <span className="text-slate-700">Choose file</span>
            <span className="text-xs text-slate-400">Max 100MB</span>
          </label>
          {slidesFile && <Badge variant="secondary">{slidesFile.name}</Badge>}
        </Card>

        <Card className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <FileVideo className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Upload your delivery video</CardTitle>
              <CardDescription className="mt-1">MP4 or MOV with audio.</CardDescription>
            </div>
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                setVideoFile(event.target.files?.[0] ?? null);
                setUseRecordedAudio(false);
                setUseRecordedVideo(false);
              }}
            />
            <span className="text-slate-700">Choose video</span>
            <span className="text-xs text-slate-400">Max 500MB</span>
          </label>
          {videoFile && <Badge variant="secondary">{videoFile.name}</Badge>}
        </Card>
      </div>

      <Card className="space-y-4">
        <CardTitle>Record video instead</CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Capture your full delivery with camera + mic so we can review gestures, posture, and pacing together.
        </CardDescription>
        <VideoRecorder
          onCapture={(file) => {
            setRecordedVideo(file);
            setUseRecordedVideo(true);
            setVideoFile(null);
            setUseRecordedAudio(false);
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={useRecordedVideo ? "secondary" : "outline"}
            onClick={() => setUseRecordedVideo((value) => !value)}
            aria-pressed={useRecordedVideo}
            className={
              useRecordedVideo ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : undefined
            }
            disabled={!recordedVideo}
          >
            {useRecordedVideo ? "Using this video" : "Use this video"}
          </Button>
          {recordedVideo && <Badge variant="secondary">Video ready: {recordedVideo.name}</Badge>}
          {!recordedVideo && (
            <p className="text-sm text-slate-500">Record a take, then select “Use this video”.</p>
          )}
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle>Record audio instead</CardTitle>
        <CardDescription className="text-sm text-slate-600">
          No video? Record your delivery audio and we&apos;ll still analyze pacing and speaking clarity.
        </CardDescription>
        <Recorder
          onSubmit={async (blob, filename) => {
            const file = new File([blob], filename || "presentation-audio.webm", { type: blob.type });
            setRecordedAudio(file);
            setUseRecordedAudio(true);
            setVideoFile(null);
            setUseRecordedVideo(false);
          }}
          submitLabel={useRecordedAudio ? "Recording selected" : "Use this recording"}
          showUploadFallback={false}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={useRecordedAudio ? "secondary" : "outline"}
            onClick={() => setUseRecordedAudio((value) => !value)}
            aria-pressed={useRecordedAudio}
            className={
              useRecordedAudio ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : undefined
            }
            disabled={!recordedAudio}
          >
            {useRecordedAudio ? "Using this recording" : "Use this recording"}
          </Button>
          {recordedAudio && <Badge variant="secondary">Audio ready: {recordedAudio.name}</Badge>}
          {!recordedAudio && (
            <p className="text-sm text-slate-500">Press “Use this recording” after capturing a take.</p>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            What you&apos;ll get <Sparkles className="h-4 w-4 text-brand" />
          </CardTitle>
          <CardDescription className="mt-2">
            Expect pacing feedback, filler-word tracking, posture alignment hints, and gesture consistency cues.
          </CardDescription>
        </div>
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={!slidesFile || (!videoFile && !selectedVideo && !selectedAudio) || isSubmitting}
        >
          {isSubmitting ? "Analyzing…" : "Analyze presentation"}
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
          <CardTitle>Analyzing your presentation</CardTitle>
          <CardDescription className="mt-2">Crunching pacing and slide timing…</CardDescription>
        </Card>
      )}

      {job?.status === "done" && job.result && (
        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          <Card>
            <CardTitle>Summary</CardTitle>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Slides: {job.result.slides.count ?? "Unknown"}</p>
              <p>
                {job.result.video.media_type === "audio" ? "Audio" : "Video"} length: {job.result.video.duration_seconds ?? "Unknown"} seconds
              </p>
              <p>
                Pace: {job.result.coaching.pacing.label} ({job.result.coaching.pacing.slides_per_minute ?? "?"} slides/min)
              </p>
            </div>
          </Card>
          <div className="space-y-4">
            {job.result.coaching.ai_tips?.length ? (
              <Card className="border-brand/20 bg-brand/5">
                <CardTitle className="flex items-center gap-2 text-brand">
                  <Sparkles className="h-5 w-5" /> AI insights
                </CardTitle>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {job.result.coaching.ai_tips.map((tip) => (
                    <li key={tip}>• {tip}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
            <Card>
              <CardTitle>Coaching tips</CardTitle>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {(job.result.coaching.base_tips ?? job.result.coaching.tips).map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {job?.status === "done" && job.result?.audience_questions?.length ? (
        <Card className="border-amber-100 bg-amber-50/50">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-amber-600" /> Audience Q&A prep
          </CardTitle>
          <CardDescription className="mt-1">
            Questions your audience might ask—generate AI answers to prepare your responses.
          </CardDescription>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {job.result.audience_questions.map((q, i) => (
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
  );
}

function VideoRecorder({ onCapture }: { onCapture: (file: File) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      chunksRef.current = [];
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      onCapture(new File([blob], "presentation-video.webm", { type: blob.type }));
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white/80 p-6">
      <div className="flex items-center gap-2 text-slate-700">
        <Video className="h-5 w-5 text-brand" />
        <p className="font-semibold">Camera + mic capture</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="relative aspect-video w-full bg-black">
          {!previewUrl && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain"
              autoPlay
              muted
              playsInline
            />
          )}
          {previewUrl && (
            <video
              className="absolute inset-0 h-full w-full object-contain"
              src={previewUrl}
              controls
            />
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!isRecording ? (
          <Button onClick={startRecording} size="lg" className="gap-2">
            <Video className="h-4 w-4" /> Start video recording
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="secondary" size="lg">
            Stop recording
          </Button>
        )}
      </div>
    </div>
  );
}
