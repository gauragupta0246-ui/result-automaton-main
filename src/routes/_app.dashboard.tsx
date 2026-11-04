import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncUserRoleFromDatabase } from "@/lib/auth";
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
  Bell,
  Clock,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Building2,
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
import {
  RgpvQuickAccessTiles,
  RgpvNoticeBoard,
} from "@/components/rgpv-portal-layout";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Academic Performance Dashboard — Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV)" },
      { name: "description", content: "Official RGPV Examination & Evaluation Analytics Portal." },
    ],
  }),
  component: Dashboard,
});

const EXAMS: ExamType[] = ["midsem", "put"];

function Dashboard() {
  const [role, setRole] = useState<"admin" | "faculty">("admin");
  const [isLoadingRole, setIsLoadingRole] = useState<boolean>(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role) {
        setRole(profile.role as "admin" | "faculty");
        void syncUserRoleFromDatabase(
          session.user.id,
          session.user.email || "",
          (session.user.user_metadata?.full_name as string)
        );
      } else {
        // Default fallback: keep admin if first user or explicitly set
        setRole("admin");
        void syncUserRoleFromDatabase(
          session.user.id,
          session.user.email || "",
          (session.user.user_metadata?.full_name as string)
        );
      }
      setIsLoadingRole(false);
    };

    fetchRole();
  }, []);

  const state = useExamStore((s) => s);
  const [exam, setExam] = useState<ExamType>("midsem");

  // Recompute results strictly based on chosen exam
  const results = useMemo(() => computeResults(state, exam), [state, exam]);
  const cfg = state.config[exam];

  const totalStudents = state.students.length;
  const sections = new Set(state.students.map((s) => s.section)).size;

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

  // Official RGPV Colors
  const theme = isMidSem
    ? {
        accentColor: "#003366",
        barColor: "#003366",
        badgeBg: "bg-[#003366] text-white border-[#002244]",
        bannerBorder: "border-[#003366]",
        bannerBg: "bg-[#e6eef5]",
        title: "Viewing: Mid Semester Examination",
        subtitle: `Internal assessment trial · Max ${cfg.maxMarks} marks per theory paper · Pass threshold: ≥ ${cfg.passPct}%`,
        indicator: "Official Internal Evaluation",
      }
    : {
        accentColor: "#b91c1c",
        barColor: "#b91c1c",
        badgeBg: "bg-[#b91c1c] text-white border-[#990000]",
        bannerBorder: "border-[#b91c1c]",
        bannerBg: "bg-[#fef2f2]",
        title: "Viewing: Pre-University Test (PUT)",
        subtitle: `Comprehensive pre-university final mock trial · Max ${cfg.maxMarks} marks · Pass criterion: ≥ ${cfg.passPct}%`,
        indicator: "Official Pre-University Test",
      };

  const passData = [
    { name: "Passed", value: passed, color: "#15803d" },
    { name: "Failed / ATKT", value: failed, color: "#b91c1c" },
  ];

  return (
    <div className="space-y-5">
      {/* ── 1. RGPV-Style Solid Rectangular Quick Access 4-Tile Action Grid ── */}
      <div>
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#d1d5db]">
          <span className="text-xs font-bold font-serif text-[#003366] uppercase tracking-wider">
            RGPV Examination Cell · Quick Navigation Hub
          </span>
          <span className="text-[10.5px] text-slate-500 font-mono">
            RGPV BHOPAL (M.P.)
          </span>
        </div>
        <RgpvQuickAccessTiles />
      </div>

      {/* ── 2. RGPV Split Notice Board (Important Notices + Portal Links) ── */}
      <RgpvNoticeBoard />

      {/* ── 3. Examination Analytics Header & Distinct Exam Switcher ── */}
      <header className="flex flex-wrap items-center justify-between gap-4 pt-2 pb-3 border-b border-[#d1d5db]">
        <div>
          <div className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-widest">
            OFFICE OF CONTROLLER OF EXAMINATIONS
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-[#003366]">
            ACADEMIC PERFORMANCE &amp; RESULT EVALUATION DASHBOARD
          </h2>
          <p className="text-slate-600 text-xs mt-0.5">
            Tabular tabulation register, subject clearance percentiles, and rank analytics
          </p>
        </div>

        {/* High-Contrast Distinct Exam Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#d1d5db] rounded-[2px] shadow-xs">
          <Button
            type="button"
            size="sm"
            onClick={() => setExam("midsem")}
            className={`h-8 px-3 text-xs font-bold rounded-[2px] transition cursor-pointer ${
              isMidSem
                ? "bg-[#003366] text-white shadow-xs"
                : "bg-transparent text-slate-700 hover:text-[#003366] hover:bg-slate-100"
            }`}
          >
            <Layers className="size-3.5 mr-1.5" />
            <span>Mid Sem Examination</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setExam("put")}
            className={`h-8 px-3 text-xs font-bold rounded-[2px] transition cursor-pointer ${
              !isMidSem
                ? "bg-[#b91c1c] text-white shadow-xs"
                : "bg-transparent text-slate-700 hover:text-[#b91c1c] hover:bg-slate-100"
            }`}
          >
            <Sparkles className="size-3.5 mr-1.5" />
            <span>Pre-University Test (PUT)</span>
          </Button>
        </div>
      </header>

      {/* ── 4. Prominent Active Exam Theme Banner ── */}
      <div
        className={`rounded-[2px] border-2 p-3.5 shadow-xs transition-all flex flex-wrap items-center justify-between gap-4 ${theme.bannerBg} ${theme.bannerBorder}`}
      >
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-[2px] flex items-center justify-center text-white bg-[#003366] shadow-xs shrink-0">
            <BarChart3 className="size-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs font-bold rounded-[2px] ${theme.badgeBg}`}>
                {theme.title}
              </Badge>
              <span className="text-[11px] text-slate-600 font-mono hidden md:inline">
                {theme.indicator}
              </span>
            </div>
            <p className="text-xs text-slate-900 mt-0.5 font-medium">{theme.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="h-7 px-2.5 bg-white border-[#d1d5db] text-[#003366] font-bold rounded-[2px]">
            Total Paper Max: {cfg.maxMarks * SUBJECTS.length} pts
          </Badge>
          <Badge variant="outline" className="h-7 px-2.5 bg-white border-[#d1d5db] text-[#003366] font-bold rounded-[2px]">
            Min Clearance Mark: {((cfg.passPct / 100) * cfg.maxMarks).toFixed(1)} pts
          </Badge>
        </div>
      </div>

      {/* ── 5. Clean Institutional Summary Metric Tiles ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricTile
          icon={Users}
          label="Total Registered"
          value={totalStudents}
          sub={`Across ${sections} registered cohorts`}
        />
        <MetricTile
          icon={Activity}
          label="Clearance / Pass Rate"
          value={`${passPct.toFixed(1)}%`}
          sub={`${passed} Passed · ${failed} ATKT / Fail`}
        />
        <MetricTile
          icon={TrendingUp}
          label="Class Average"
          value={`${avgPct.toFixed(1)}%`}
          sub={assessmentSub}
        />
        <MetricTile
          icon={Award}
          label="Batch High Score"
          value={results.length ? Math.max(...results.map((r) => r.total)) : 0}
          sub={`Out of ${cfg.maxMarks * SUBJECTS.length} pts`}
        />
      </div>

      {/* ── 6. Subject Performance & Pass/Fail Ratio Charts ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Subject Average Bar Chart */}
        <Card className="lg:col-span-2 border border-[#d1d5db] bg-white rounded-[2px] shadow-xs">
          <CardHeader className="pb-2 border-b border-[#d1d5db] bg-[#f9fafb]">
            <CardTitle className="text-xs font-bold text-[#003366] uppercase flex items-center justify-between">
              <span>Subject Performance Analysis ({EXAM_LABELS[exam]})</span>
              <Badge variant="outline" className="text-[10px] font-bold text-[#003366] border-[#d1d5db] rounded-[2px]">
                Average Marks / {cfg.maxMarks}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Department-wise student marks distribution calculated from official entries
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {assessedResults.length === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center text-sm text-slate-500 gap-2">
                <BarChart3 className="size-8 text-slate-400" />
                <p>No marks entered for {EXAM_LABELS[exam]} yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={subjectAvg} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="subject" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis dataKey="avg" stroke="#475569" fontSize={11} domain={[0, cfg.maxMarks]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: 2,
                      fontSize: 12,
                    }}
                    formatter={(val: any) => [`${val} / ${cfg.maxMarks} marks`, "Subject Average"]}
                  />
                  <Bar dataKey="avg" fill={theme.barColor} radius={[2, 2, 0, 0]} animationDuration={600} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pass vs Fail Ratio */}
        <Card className="border border-[#d1d5db] bg-white rounded-[2px] shadow-xs">
          <CardHeader className="pb-2 border-b border-[#d1d5db] bg-[#f9fafb]">
            <CardTitle className="text-xs font-bold text-[#003366] uppercase">
              Pass vs ATKT Clearance Ratio
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Overall academic clearance status</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {assessedResults.length === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center text-sm text-slate-500 gap-2">
                <Activity className="size-8 text-slate-400" />
                <p>No assessed student records yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={passData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {passData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: 2,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 7. Strict University Tabular Layout: Top 5 Performers / Rank List ── */}
      <div className="border border-[#d1d5db] bg-white rounded-[2px] shadow-xs overflow-hidden">
        <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-xs uppercase tracking-wider">
            <Trophy className="size-4 text-amber-300" />
            <span>Merit Rank Order — Top 5 Performers ({EXAM_LABELS[exam]})</span>
          </div>
          <Link
            to="/results"
            className="text-[11px] text-amber-300 hover:text-white font-semibold underline flex items-center gap-1"
          >
            <span>View Complete Broadsheet</span>
            <ChevronRight className="size-3" />
          </Link>
        </div>

        {topPerformers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No assessed student records to compile merit ranking yet. Please enter marks in valuation portal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] text-[#003366] font-bold border-b border-[#d1d5db] uppercase text-[10.5px]">
                  <th className="py-2.5 px-3 border-r border-[#d1d5db] text-center w-14">Rank</th>
                  <th className="py-2.5 px-3 border-r border-[#d1d5db]">Roll Number</th>
                  <th className="py-2.5 px-3 border-r border-[#d1d5db]">Candidate Name</th>
                  <th className="py-2.5 px-3 border-r border-[#d1d5db] text-center">Section</th>
                  <th className="py-2.5 px-3 border-r border-[#d1d5db] text-right">Marks Obtained</th>
                  <th className="py-2.5 px-3 border-r border-[#d1d5db] text-right">Percentage</th>
                  <th className="py-2.5 px-3 border-r border-[#d1d5db] text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {topPerformers.map((r, i) => (
                  <tr
                    key={r.student.id}
                    className={`hover:bg-[#e6eef5] transition-colors ${
                      i % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    }`}
                  >
                    <td className="py-2.5 px-3 border-r border-[#e5e7eb] text-center font-bold font-mono">
                      <span
                        className={`inline-block size-6 leading-6 rounded-[2px] text-white text-[11px] ${
                          i === 0
                            ? "bg-[#b91c1c] font-black"
                            : i === 1
                            ? "bg-[#003366] font-bold"
                            : "bg-[#475569] font-bold"
                        }`}
                      >
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#e5e7eb] font-mono font-bold text-[#003366]">
                      {r.student.roll}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#e5e7eb] font-medium text-slate-900">
                      {r.student.name}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#e5e7eb] text-center font-bold">
                      {r.student.section}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#e5e7eb] text-right font-mono font-bold">
                      {r.total}{" "}
                      <span className="text-slate-400 font-normal text-[10px]">
                        /{r.maxTotal}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#e5e7eb] text-right font-mono font-bold text-[#003366]">
                      {r.pct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#e5e7eb] text-center font-bold">
                      {r.grade}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge className="bg-[#15803d] text-white text-[9.5px] px-2 py-0.2 rounded-[2px] font-bold">
                        PASS
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Clean Institutional Metric Tile Component ────────────────────────────────
function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-[#d1d5db] rounded-[2px] p-3.5 shadow-xs flex items-center gap-3">
      <div className="size-10 rounded-[2px] bg-[#003366] text-white flex items-center justify-center shrink-0">
        <Icon className="size-5 text-amber-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          {label}
        </div>
        <div className="text-xl font-bold font-mono text-[#003366] leading-tight mt-0.5">
          {value}
        </div>
        {sub && <div className="text-[10.5px] text-slate-500 truncate mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}