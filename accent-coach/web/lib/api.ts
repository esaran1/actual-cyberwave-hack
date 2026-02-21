import { API_BASE } from "@/lib/utils";

export interface Summary {
  overall_score: number;
  top_issues: { label: string; count: number }[];
  practice: string[];
}

export interface WordResult {
  word: string;
  start: number;
  end: number;
  score: number;
  issue: string;
  tip: string;
  clip_id?: string;
  tts_id?: string;
}

export interface JobResponse {
  job_id: string;
  status: "processing" | "done" | "error";
  error?: string;
  result?: {
    transcript: WordResult[];
    summary: Summary;
    text: string;
  };
}

export interface PresentationResult {
  slides: { count: number | null; filename: string };
  video: { duration_seconds: number | null; filename: string; media_type?: string };
  coaching: {
    pacing: { slides_per_minute: number | null; label: string };
    tips: string[];
    ai_tips?: string[] | null;
    base_tips?: string[];
  };
  audience_questions?: string[] | null;
  analysis?: {
    audio?: {
      duration_seconds?: number | null;
      word_count?: number;
      wpm?: number | null;
      pause_ratio?: number | null;
      long_pauses?: number;
      filler_count?: number;
      filler_rate?: number;
    };
    video?: {
      supported?: boolean;
      gesture_rate?: number | null;
      posture_score?: number | null;
      gaze_variance?: number | null;
    };
    slides_text?: string[];
    transcript?: { text?: string; language?: string };
  };
}

export interface PresentationJobResponse {
  job_id: string;
  status: "processing" | "done" | "error";
  error?: string;
  result?: PresentationResult;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network error";
    throw new Error(
      `Failed to reach AccentCoach API at ${API_BASE}. Is the backend running on port 8000? (${message})`
    );
  }
  if (!response.ok) {
    const text = await response.text();
    let message = text || "Request failed";
    try {
      const json = JSON.parse(text);
      if (typeof json?.detail === "string") message = json.detail;
    } catch {
      /* use raw text */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function analyzeFile(blob: Blob, filename = "recording.webm"): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  const response = await request<{ job_id: string }>("/api/analyze", {
    method: "POST",
    body: formData,
  });
  return response.job_id;
}

export async function analyzeSample(name = "demo"): Promise<string> {
  const response = await request<{ job_id: string }>(`/api/analyze?sample=${name}`, {
    method: "POST",
  });
  return response.job_id;
}

export async function fetchJob(jobId: string): Promise<JobResponse> {
  return await request<JobResponse>(`/api/job/${jobId}`);
}

export async function analyzePresentation(
  slides: File,
  video?: File | null,
  audio?: File | null
): Promise<string> {
  const formData = new FormData();
  formData.append("slides", slides);
  if (video) formData.append("video", video);
  if (audio) formData.append("audio", audio);
  const response = await request<{ job_id: string }>("/api/presentation/analyze", {
    method: "POST",
    body: formData,
  });
  return response.job_id;
}

export async function fetchPresentationJob(jobId: string): Promise<PresentationJobResponse> {
  return await request<PresentationJobResponse>(`/api/presentation/job/${jobId}`);
}

export interface AudienceAnswer {
  question: string;
  answer: string;
}

export async function fetchPresentationAnswers(
  jobId: string
): Promise<{ answers: AudienceAnswer[] }> {
  return await request<{ answers: AudienceAnswer[] }>(
    `/api/presentation/job/${jobId}/answers`,
    { method: "POST" }
  );
}

export interface TextResult {
  content: string;
  script: string;
  feedback: string[];
  questions: string[];
}

export interface TextJobResponse {
  job_id: string;
  status: "processing" | "done" | "error";
  error?: string;
  result?: TextResult;
}

export async function analyzeText(text?: string, file?: File): Promise<string> {
  const formData = new FormData();
  if (text?.trim()) formData.append("text", text.trim());
  if (file) formData.append("file", file);
  const response = await request<{ job_id: string }>("/api/text/analyze", {
    method: "POST",
    body: formData,
  });
  return response.job_id;
}

export async function fetchTextJob(jobId: string): Promise<TextJobResponse> {
  return await request<TextJobResponse>(`/api/text/job/${jobId}`);
}

export async function fetchTextAnswers(
  jobId: string
): Promise<{ answers: AudienceAnswer[] }> {
  return await request<{ answers: AudienceAnswer[] }>(
    `/api/text/job/${jobId}/answers`,
    { method: "POST" }
  );
}

export interface InterviewJobInfo {
  company_name: string;
  job_position: string;
  company_mission: string;
}

export interface InterviewResult {
  summary: string;
  score: number;
  improvements: string[];
}

export interface InterviewJobResponse {
  job_id: string;
  status: "in_progress" | "processing" | "done" | "error";
  error?: string;
  job_info?: InterviewJobInfo;
  qualifications?: string;
  questions?: string[];
  answers?: { question: string; transcript: string; audio_id: string }[];
  result?: InterviewResult;
}

export async function startInterview(
  companyName: string,
  jobPosition: string,
  companyMission: string,
  qualifications: string,
  resume?: File | null
): Promise<{ job_id: string; questions: string[] }> {
  const formData = new FormData();
  formData.append("company_name", companyName);
  formData.append("job_position", jobPosition);
  formData.append("company_mission", companyMission);
  formData.append("qualifications", qualifications);
  if (resume) formData.append("resume", resume);
  return await request<{ job_id: string; questions: string[] }>(
    "/api/interview/start",
    { method: "POST", body: formData }
  );
}

export async function submitInterviewAnswer(
  jobId: string,
  questionIndex: number,
  audioBlob: Blob,
  filename = "answer.webm"
): Promise<{ transcript: string }> {
  const formData = new FormData();
  formData.append("question_index", String(questionIndex));
  formData.append("audio_file", audioBlob, filename);
  return await request<{ transcript: string }>(
    `/api/interview/job/${jobId}/answer`,
    { method: "POST", body: formData }
  );
}

export async function completeInterview(jobId: string): Promise<{ status: string }> {
  return await request<{ status: string }>(
    `/api/interview/job/${jobId}/complete`,
    { method: "POST" }
  );
}

export async function fetchInterviewJob(
  jobId: string
): Promise<InterviewJobResponse> {
  return await request<InterviewJobResponse>(
    `/api/interview/job/${jobId}`
  );
}

export function getInterviewAudioUrl(jobId: string, index: number): string {
  return `${API_BASE}/api/interview/job/${jobId}/audio/${index}`;
}
