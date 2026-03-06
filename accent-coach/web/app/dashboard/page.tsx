"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Award,
  Zap,
  Target,
  ArrowRight,
  Mic,
  MessageCircle,
  Briefcase,
  Flame,
  Star,
} from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchAnalytics, type AnalyticsStats } from "@/lib/api";

const DRILL_LINKS: Record<string, { href: string; label: string; icon: React.ElementType }> = {
  record: { href: "/record", label: "Pronunciation practice", icon: Mic },
  interview: { href: "/interview", label: "Interview prep", icon: Briefcase },
  "customer-care": { href: "/customer-care", label: "Customer care drills", icon: MessageCircle },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Loading your progress…</h1>
      </div>
    );
  }

  const avgPron = stats?.pronunciation_scores?.length
    ? stats.pronunciation_scores.reduce((a, b) => a + b, 0) / stats.pronunciation_scores.length
    : 0;
  const avgInterview = stats?.interview_scores?.length
    ? stats.interview_scores.reduce((a, b) => a + b, 0) / stats.interview_scores.length
    : 0;
  const avgCustomer = stats?.customer_care_scores?.length
    ? stats.customer_care_scores.reduce((a, b) => a + b, 0) / stats.customer_care_scores.length
    : 0;

  const suggested = stats?.suggested_drill ?? "record";
  const drillInfo = DRILL_LINKS[suggested] ?? DRILL_LINKS.record;
  const DrillIcon = drillInfo.icon;

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Performance</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your progress at a glance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track scores, earn badges, and stay motivated with streaks and suggested drills.
        </p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Zap className="h-4 w-4" /> Sessions
          </CardTitle>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {stats?.sessions_completed ?? 0}
          </p>
          <CardDescription className="mt-1">Practice sessions completed</CardDescription>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Star className="h-4 w-4" /> XP
          </CardTitle>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {stats?.total_xp ?? 0}
          </p>
          <CardDescription className="mt-1">Earned from practice</CardDescription>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Flame className="h-4 w-4" /> Streak
          </CardTitle>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {stats?.current_streak ?? 0}
          </p>
          <CardDescription className="mt-1">Days in a row</CardDescription>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <TrendingUp className="h-4 w-4" /> Avg pronunciation
          </CardTitle>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {Math.round(avgPron)}
            <span className="text-lg font-normal text-slate-400">/100</span>
          </p>
          <CardDescription className="mt-1">Clarity score trend</CardDescription>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Award className="h-4 w-4" /> Badges
          </CardTitle>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {stats?.badges?.length ?? 0}
          </p>
          <CardDescription className="mt-1">Earned achievements</CardDescription>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" /> Suggested next drill
          </CardTitle>
          <CardDescription className="mt-1">
            Based on your performance, we recommend:
          </CardDescription>
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/20 text-brand">
              <DrillIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{drillInfo.label}</p>
              <p className="text-sm text-slate-500">Build skills where it matters most.</p>
            </div>
            <Button asChild className="ml-auto">
              <Link href={drillInfo.href} className="gap-2">
                Start <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Score trends</CardTitle>
          <CardDescription className="mt-1">
            Average scores by module
          </CardDescription>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Pronunciation</span>
                <span className="font-medium">{Math.round(avgPron)}</span>
              </div>
              <Progress className="mt-1" value={avgPron} />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Interview</span>
                <span className="font-medium">{Math.round(avgInterview)}</span>
              </div>
              <Progress className="mt-1" value={avgInterview} />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Customer care</span>
                <span className="font-medium">{Math.round(avgCustomer)}</span>
              </div>
              <Progress className="mt-1" value={avgCustomer} />
            </div>
          </div>
        </Card>
      </div>

      {stats?.badges && stats.badges.length > 0 && (
        <Card>
          <CardTitle>Badges earned</CardTitle>
          <CardDescription className="mt-1">
            Celebrate your milestones—each badge reflects real progress.
          </CardDescription>
          <div className="mt-4 flex flex-wrap gap-3">
            {stats.badges.map((b) => (
              <Badge key={b.id} className="gap-2 py-2 px-4" variant="secondary">
                <Award className="h-4 w-4" />
                <span className="font-medium">{b.name}</span>
                <span className="text-slate-500">— {b.description}</span>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="border-brand/20 bg-brand/5">
        <CardTitle>Keep building</CardTitle>
        <CardDescription className="mt-1">
          Practice daily to maintain your streak and unlock new badges. You&apos;re building the clarity and confidence that employers notice.
        </CardDescription>
        <div className="mt-4 flex gap-3">
          <Button asChild>
            <Link href="/record">Record now</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/roleplay">Custom roleplay</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
