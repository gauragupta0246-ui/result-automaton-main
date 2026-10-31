import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Award,
  Activity,
  Trophy,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useExamStore,
  computeResults,
  EXAM_LABELS,
  SUBJECTS,
  SUBJECT_NAMES,
  type ExamType,
} from "@/lib/exam-store";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Exam System" },
      { name: "description", content: "Review Mid Sem and PUT performance, class averages, and student leaders." },
      { property: "og:title", content: "Dashboard — Smart Exam System" },
      { property: "og:description", content: "Review Mid Sem and PUT performance, class averages, and student leaders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const EXAMS: ExamType[] = ["midsem", "put"];

function Dashboard() {
  const state = useExamStore((s) => s);
  const [exam, setExam] = useState<ExamType>("midsem");

  // Recompute results strictly based on the chosen exam
  const results = useMemo(() => computeResults(state, exam), [state, exam]);
  const cfg = state.config[exam];

  const totalStudents = state.students.length;
  const sections = new Set(state.students.map((s) => s.section)).size;
  const courses = new Set(state.students.map((s) => s.course)).size;

  const assessedResults = results.filter((r) =>
    Object.values(r.marks).some((mark) => typeof mark === "number" || mark === "A"),
  );
  const passed = assessedResults.filter((r) => r.pass).length;
  const failed = assessedResults.length - passed;
  const passPct = assessedResults.length ? (passed / assessedResults.length) * 100 : 0;
  const avgPct = assessedResults.length
    ? assessedResults.reduce((a, r) => a + r.pct, 0) / assessedResults.length
    : 0;
  const assessmentSub = assessedResults.length
    ? `${assessedResults.length} of ${totalStudents} assessed`
    : "No marks entered yet";
  const topPerformers = [...assessedResults].sort((a, b) => b.total - a.total).slice(0, 5);

  const subjectAvg = SUBJECTS.map((sub) => {
    const vals = results
      .map((r) => {
        const v = r.marks[sub];
        return typeof v === "number" ? v : v === "A" ? 0 : null;
      })
      .filter((v): v is number => typeof v === "number");
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return {
      subject: sub,
      fullName: SUBJECT_NAMES[sub],
      avg: +avg.toFixed(1),
      max: cfg.maxMarks,
    };
  });

  const sectionData = Array.from(new Set(assessedResults.map((r) => r.student.section)))
    .sort()
    .map((sec) => {
      const rows = assessedResults.filter((r) => r.student.section === sec);
      const avg = rows.length ? rows.reduce((a, r) => a + r.pct, 0) / rows.length : 0;
      return { section: sec, avg: +avg.toFixed(1), count: rows.length };
    });

  const isMidSem = exam === "midsem";

  // Distinct Color Schemes for Mid Sem vs. PUT
  const theme = isMidSem
    ? {
        accentColor: "#4f46e5",
        accentGradient: "from-blue-600 via-indigo-600 to-indigo-700",
        barColor: "#4f46e5",
        sectionBarColor: "#06b6d4",
        badgeBg: "bg-indigo-600 text-white border-indigo-400",
        bannerBorder: "border-indigo-500/40",
        bannerBg:
          "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-900/10 dark:from-indigo-950/40",
        title: "Viewing: Mid Semester Assessment",
        subtitle: `Evaluated out of ${cfg.maxMarks} marks per subject · Pass criterion: ≥ ${cfg.passPct}%`,
        indicator: "Blue & Indigo Theme (Internal College Mid Term)",
      }
    : {
        accentColor: "#059669",
        accentGradient: "from-emerald-600 via-teal-600 to-amber-600",
        barColor: "#059669",
        sectionBarColor: "#d97706",
        badgeBg: "bg-emerald-600 text-white border-emerald-400",
        bannerBorder: "border-emerald-500/40",
        bannerBg:
          "bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-amber-950/10 dark:from-emerald-950/40",
        title: "Viewing: Pre-University Test (PUT)",
        subtitle: `Comprehensive pre-university final trial · Max ${cfg.maxMarks} marks · Pass threshold: ≥ ${cfg.passPct}%`,
        indicator: "Deep Emerald & Amber Theme (Full Curriculum Mock Test)",
      };

  const passData = [
    { name: "Pass", value: passed, color: isMidSem ? "#3b82f6" : "#10b981" },
    { name: "Fail", value: failed, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & High-Contrast Exam Toggle */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Academic Performance Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time analytics, grade distributions, and student rankings calculated automatically
          </p>
        </div>

        {/* High-Contrast Distinct Exam Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-md">
          <Button
            type="button"
            size="sm"
            onClick={() => setExam("midsem")}
            className={`h-9 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isMidSem
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50 scale-[1.02]"
                : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layers className="size-3.5 mr-1.5" />
            <span>Mid Sem (Mid Term)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setExam("put")}
            className={`h-9 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isMidSem
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-[1.02]"
                : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sparkles className="size-3.5 mr-1.5" />
            <span>Pre-University Test (PUT)</span>
          </Button>
        </div>
      </header>

      {/* 5. Prominent Active Exam Theme Banner */}
      <div
        className={`rounded-2xl border p-4.5 shadow-sm backdrop-blur-md transition-all duration-300 flex flex-wrap items-center justify-between gap-4 ${theme.bannerBg} ${theme.bannerBorder}`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`size-11 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${theme.accentGradient}`}
          >
            <BarChart3 className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs font-bold tracking-wide shadow-xs ${theme.badgeBg}`}>
                {theme.title}
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono hidden md:inline">
                {theme.indicator}
              </span>
            </div>
            <p className="text-xs text-foreground/80 mt-1">{theme.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Badge variant="outline" className="h-7 px-2.5 bg-background/50 font-medium">
            Max Score: {cfg.maxMarks * SUBJECTS.length} pts
          </Badge>
          <Badge variant="outline" className="h-7 px-2.5 bg-background/50 font-medium">
            Subject Min: {((cfg.passPct / 100) * cfg.maxMarks).toFixed(1)} pts
          </Badge>
        </div>
      </div>

      {/* 6. Summary KPI Cards with Modern Glassmorphism & Hover Micro-Interactions */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Total Students"
          value={totalStudents}
          sub={`Across ${sections} registered sections`}
          gradient="from-sky-500/20 to-blue-600/10 text-sky-600 dark:text-sky-400"
        />
        <KpiCard
          icon={BookOpen}
          label="Active Subjects"
          value={SUBJECTS.length}
          sub={`Max ${cfg.maxMarks} marks each`}
          gradient="from-indigo-500/20 to-purple-600/10 text-indigo-600 dark:text-indigo-400"
        />
        <KpiCard
          icon={TrendingUp}
          label="Average Score"
          value={`${avgPct.toFixed(1)}%`}
          sub={assessmentSub}
          gradient="from-blue-500/20 to-cyan-600/10 text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={Activity}
          label="Passing Rate"
          value={`${passPct.toFixed(1)}%`}
          sub={`${passed} passed · ${failed} failed`}
          gradient="from-emerald-500/20 to-teal-600/10 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Passed Students"
          value={passed}
          sub={`${((passed / (totalStudents || 1)) * 100).toFixed(0)}% of class strength`}
          gradient="from-teal-500/20 to-emerald-600/10 text-teal-600 dark:text-teal-400"
        />
        <KpiCard
          icon={XCircle}
          label="Failed / Backlog"
          value={failed}
          sub="Requires re-assessment"
          gradient="from-rose-500/20 to-red-600/10 text-rose-600 dark:text-rose-400"
        />
        <KpiCard
          icon={Award}
          label="Batch Highest"
          value={results.length ? Math.max(...results.map((r) => r.total)) : 0}
          sub={`Out of ${cfg.maxMarks * SUBJECTS.length} total`}
          gradient="from-amber-500/20 to-orange-600/10 text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={Trophy}
          label="Batch Lowest"
          value={results.length ? Math.min(...results.map((r) => r.total)) : 0}
          sub={`Out of ${cfg.maxMarks * SUBJECTS.length} total`}
          gradient="from-slate-500/20 to-slate-700/10 text-slate-600 dark:text-slate-400"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Subject Performance Bar Chart */}
        <Card className="lg:col-span-2 border-border/60 bg-card/70 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Subject Performance ({EXAM_LABELS[exam]})</span>
              <Badge variant="outline" className="text-xs font-normal">
                Subject Average Marks
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Average student score per subject calculated from {EXAM_LABELS[exam]} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assessedResults.length === 0 ? (
              <div className="flex h-[280px] flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                <BarChart3 className="size-8 text-muted-foreground/40" />
                <p>No marks entered for {EXAM_LABELS[exam]} yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={subjectAvg} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="subject"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    domain={[0, cfg.maxMarks]}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                    }}
                    formatter={(val: any) => [`${val} / ${cfg.maxMarks} marks`, "Average"]}
                  />
                  <Bar
                    dataKey="avg"
                    fill={theme.barColor}
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pass vs Fail Donut Chart */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pass vs Fail Ratio</CardTitle>
            <CardDescription className="text-xs">Overall clearance status</CardDescription>
          </CardHeader>
          <CardContent>
            {assessedResults.length === 0 ? (
              <div className="flex h-[280px] flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                <Activity className="size-8 text-muted-foreground/40" />
                <p>No assessed results yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={passData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {passData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Comparison & Top Performers */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Section Comparison */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Section Performance Comparison ({EXAM_LABELS[exam]})
            </CardTitle>
            <CardDescription className="text-xs">Class-wide average % by section</CardDescription>
          </CardHeader>
          <CardContent>
            {assessedResults.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No section results to compare yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sectionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="section"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    domain={[0, 100]}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                    formatter={(val: any) => [`${val}%`, "Section Avg"]}
                  />
                  <Bar
                    dataKey="avg"
                    fill={theme.sectionBarColor}
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Performers in Selected Exam */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" /> Top Performers ({EXAM_LABELS[exam]})
              </span>
              <Badge variant="secondary" className="text-xs">
                {topPerformers.length} Ranked
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Highest scorers in {EXAM_LABELS[exam]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            {topPerformers.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No marked students to rank yet.
              </div>
            ) : (
              topPerformers.map((r, i) => (
                <div
                  key={r.student.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/60 transition-colors"
                >
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? "bg-amber-500 text-white shadow-sm"
                        : i === 1
                        ? "bg-slate-300 dark:bg-slate-700 text-foreground font-bold"
                        : i === 2
                        ? "bg-amber-700 text-white font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-sm text-foreground">
                      {r.student.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {r.student.roll} · Section {r.student.section}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold tabular-nums text-foreground">
                      {r.total}
                      <span className="text-muted-foreground font-normal text-xs">
                        /{r.maxTotal}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] mt-0.5 font-semibold">
                      {r.pct.toFixed(1)}% · Grade {r.grade}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  gradient: string;
}) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300">
      <CardContent className="p-4.5 flex items-start gap-3.5">
        <div
          className={`size-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} shadow-xs`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            {label}
          </div>
          <div className="text-2xl font-bold tabular-nums mt-0.5 text-foreground">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground truncate mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}