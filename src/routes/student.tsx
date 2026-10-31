import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  GraduationCap,
  FileText,
  ImageIcon,
  FileSpreadsheet,
  BarChart2,
  User,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  useExamStore,
  computeResults,
  EXAM_LABELS,
  SUBJECTS,
  SUBJECT_NAMES,
  SECTIONS,
  type ExamType,
  type Section,
  type Student,
  type StudentResult,
} from "@/lib/exam-store";
import { logStudentAccess } from "@/lib/student-access-log";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Result Portal — Smart Exam System" },
      {
        name: "description",
        content:
          "Students: view your personal examination marks and download your individual scorecard.",
      },
      { property: "og:title", content: "Student Result Portal" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StudentPortalPage,
});

// Quick roll selection chips
const QUICK_ROLL_CHIPS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

/**
 * Robust student resolver:
 * Matches:
 * 1. Direct roll matching (e.g. "01", "B1-01", "B1-001", "-01", "-001")
 * 2. 1-indexed class roll number in that section (e.g. student #1 of Section B1)
 * 3. Exact section-prefix roll matching
 */
function findStudentByRollAndSection(
  students: Student[],
  section: Section,
  rollNum: string
): Student | undefined {
  const cleanRoll = rollNum.trim();
  if (!cleanRoll) return undefined;

  const num = parseInt(cleanRoll, 10);
  const padded3 = isNaN(num) ? cleanRoll.padStart(3, "0") : String(num).padStart(3, "0");
  const padded2 = isNaN(num) ? cleanRoll.padStart(2, "0") : String(num).padStart(2, "0");
  const numStr = isNaN(num) ? cleanRoll : String(num);

  const sectionStudents = students.filter((s) => s.section === section);

  // 1. Direct match in section
  let match = sectionStudents.find(
    (s) =>
      s.roll === cleanRoll ||
      s.roll === padded2 ||
      s.roll === padded3 ||
      s.roll === numStr ||
      s.roll.endsWith("-" + padded3) ||
      s.roll.endsWith("-" + padded2) ||
      s.roll.endsWith("-" + numStr) ||
      s.roll.endsWith("/" + padded3) ||
      s.roll.endsWith("/" + padded2) ||
      s.roll.toLowerCase() === `${section.toLowerCase()}-${padded2}` ||
      s.roll.toLowerCase() === `${section.toLowerCase()}-${padded3}`
  );

  // 2. Fallback to N-th student in this section (1-indexed class roll number)
  if (!match && !isNaN(num) && num >= 1 && num <= sectionStudents.length) {
    match = sectionStudents[num - 1];
  }

  // 3. Fallback across all students if section prefix matches
  if (!match) {
    match = students.find(
      (s) =>
        s.roll === `${section}-${padded3}` ||
        s.roll === `${section}-${padded2}` ||
        s.roll.toLowerCase() === `${section.toLowerCase()}-${cleanRoll.toLowerCase()}`
    );
  }

  return match;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function StudentPortalPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const state = useExamStore((s) => s);

  const [step, setStep] = useState<"select" | "dashboard">("select");
  const [examType, setExamType] = useState<ExamType>("midsem");
  const [section, setSection] = useState<Section>("B1");
  const [rollNum, setRollNum] = useState<string>("01");

  const [resolvedResult, setResolvedResult] = useState<StudentResult | null>(null);
  const [allResults, setAllResults] = useState<StudentResult[]>([]);

  // Direct "View Result" handler
  const handleViewResult = () => {
    if (!rollNum.trim()) {
      toast.error("Please enter your class roll number.");
      return;
    }

    const student = findStudentByRollAndSection(state.students, section, rollNum);
    if (!student) {
      toast.error(
        `No student record found for Section ${section}, Roll ${rollNum}. Please check your details.`
      );
      return;
    }

    const computed = computeResults(state, examType);
    setAllResults(computed);

    const myResult = computed.find((r) => r.student.id === student.id) ?? null;
    if (!myResult) {
      toast.error("Could not compute result for this student.");
      return;
    }

    setResolvedResult(myResult);

    // Audit log student portal access
    void logStudentAccess({
      rollNo: rollNum,
      section,
      examType,
      studentName: student.name,
    });

    setStep("dashboard");
    toast.success(`Result loaded for ${student.name}`);
  };

  const handleReset = () => {
    setStep("select");
    setResolvedResult(null);
    setAllResults([]);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center text-slate-400">
        <div className="animate-pulse text-sm">Loading Student Portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-800 flex items-center px-5 gap-3 shrink-0">
        <div className="size-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
          <GraduationCap className="size-4 text-primary" />
        </div>
        <span className="font-display font-bold text-sm text-white">
          Smart Exam Result System
        </span>
        <Badge
          variant="outline"
          className="ml-1 text-[10px] border-sky-500/40 text-sky-400 bg-sky-500/10"
        >
          Student Portal
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400 hidden sm:block">
            Direct Access · No Login Required · Individual Scorecard
          </span>
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <main className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl space-y-5">
          {/* ── STEP 1: Selection Form ──────────────────────────────────── */}
          {step === "select" && (
            <SelectionStep
              examType={examType}
              section={section}
              rollNum={rollNum}
              onExamChange={setExamType}
              onSectionChange={setSection}
              onRollChange={setRollNum}
              onViewResult={handleViewResult}
            />
          )}

          {/* ── STEP 2: Student Analytics Dashboard ─────────────────────── */}
          {step === "dashboard" && resolvedResult && (
            <StudentDashboard
              result={resolvedResult}
              allResults={allResults}
              examType={examType}
              onReset={handleReset}
            />
          )}

          {step === "dashboard" && !resolvedResult && (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="p-6 text-center space-y-3">
                <AlertCircle className="size-10 text-destructive mx-auto" />
                <p className="text-white font-semibold">Student record not found.</p>
                <p className="text-sm text-slate-400">
                  The roll number and section combination did not match any active student record.
                </p>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-slate-700 text-slate-200"
                >
                  <ArrowLeft className="size-4 mr-2" /> Go Back
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="text-center py-4 text-[10px] text-slate-600 border-t border-slate-800/50">
        Smart Exam Result Management System · Student Portal · Individual Scorecard Access
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Selection Form (Direct Entry)
// ═══════════════════════════════════════════════════════════════════════════════
function SelectionStep({
  examType,
  section,
  rollNum,
  onExamChange,
  onSectionChange,
  onRollChange,
  onViewResult,
}: {
  examType: ExamType;
  section: Section;
  rollNum: string;
  onExamChange: (v: ExamType) => void;
  onSectionChange: (v: Section) => void;
  onRollChange: (v: string) => void;
  onViewResult: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <div className="text-center space-y-2 pt-4">
        <div className="inline-flex size-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 items-center justify-center shadow-lg mb-1">
          <User className="size-7 text-sky-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Check Your Result</h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Select your Exam Type, Section, and Class Roll Number to view your result instantly.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/90 backdrop-blur shadow-2xl">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Search className="size-5 text-sky-400" />
            Enter Examination Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          {/* 1. Exam Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              1. Exam Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["midsem", "put"] as ExamType[]).map((et) => (
                <button
                  key={et}
                  type="button"
                  onClick={() => onExamChange(et)}
                  className={`rounded-lg border py-3 text-sm font-semibold transition-all cursor-pointer ${
                    examType === et
                      ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {EXAM_LABELS[et]}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Section
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onSectionChange(sec)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
                    section === sec
                      ? "bg-sky-600 border-sky-500 text-white shadow-sm shadow-sky-600/30"
                      : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Class Roll Number */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              3. Class Roll Number
            </label>
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                placeholder="e.g. 01, 02, 03..."
                value={rollNum}
                onChange={(e) => onRollChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onViewResult();
                }}
                className="bg-slate-800/80 border-slate-700 text-white font-mono text-sm max-w-[140px]"
              />
              <span className="text-xs text-slate-500">or pick quick roll below:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_ROLL_CHIPS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRollChange(r)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                    rollNum === r
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30"
                      : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Selection summary */}
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-300">
              Exam: <span className="font-semibold text-white">{EXAM_LABELS[examType]}</span>
              {" · "}Section: <span className="font-semibold text-white">{section}</span>
              {" · "}Roll: <span className="font-semibold text-white">{rollNum || "—"}</span>
            </span>
          </div>

          {/* Direct "View Result" button */}
          <Button
            type="button"
            onClick={onViewResult}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-bold text-sm gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Search className="size-4" />
            View Result / परिणाम देखें
          </Button>
        </CardContent>
      </Card>

      {/* Staff login shortcut */}
      <p className="text-center text-xs text-slate-600">
        Faculty or Staff member?{" "}
        <a
          href="/login"
          className="text-sky-500 hover:text-sky-400 underline underline-offset-2"
        >
          Faculty &amp; Admin Login →
        </a>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Student Analytics Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function StudentDashboard({
  result,
  allResults,
  examType,
  onReset,
}: {
  result: StudentResult;
  allResults: StudentResult[];
  examType: ExamType;
  onReset: () => void;
}) {
  const cfg = useExamStore((s) => s.config[examType]);

  // Aggregated view-only statistics (no individual scores of other students)
  const classStats = useMemo(() => {
    const total = allResults.length;
    const passed = allResults.filter((r) => r.pass).length;
    const failed = total - passed;
    const avgPct = total ? allResults.reduce((a, r) => a + r.pct, 0) / total : 0;
    const subjectAvgs = SUBJECTS.map((sub) => {
      const vals = allResults
        .map((r) => r.marks[sub])
        .filter((v): v is number => typeof v === "number");
      return {
        sub,
        avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
      };
    });
    const sectionResults = allResults.filter(
      (r) => r.student.section === result.student.section
    );
    const sectionAvgPct = sectionResults.length
      ? sectionResults.reduce((a, r) => a + r.pct, 0) / sectionResults.length
      : 0;
    return { total, passed, failed, avgPct, subjectAvgs, sectionAvgPct };
  }, [allResults, result.student.section]);

  // Initials for avatar
  const initials = result.student.name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // 1. Download Individual PDF Scorecard (dynamic import to avoid SSR issues)
  const downloadPdf = async () => {
    toast.info("Generating PDF scorecard...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Smart Exam Result Management System", 105, 16, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`${EXAM_LABELS[examType]} — Student Scorecard`, 105, 24, {
        align: "center",
      });
      doc.setDrawColor(200);
      doc.line(15, 29, 195, 29);

      const info = [
        ["Name", result.student.name, "Roll No", result.student.roll],
        ["Enrollment", result.student.enrollment, "Section", result.student.section],
        ["Semester", String(result.student.semester), "Course", result.student.course],
      ];
      let y = 38;
      info.forEach((row) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(row[0] + ":", 18, y);
        doc.setFont("helvetica", "normal");
        doc.text(row[1], 52, y);
        doc.setFont("helvetica", "bold");
        doc.text(row[2] + ":", 115, y);
        doc.setFont("helvetica", "normal");
        doc.text(row[3], 148, y);
        y += 7;
      });

      const subMin = (cfg.passPct / 100) * cfg.maxMarks;
      autoTable(doc, {
        startY: y + 4,
        head: [["Subject Code", "Subject Name", "Max", "Marks Obtained", "Status"]],
        body: SUBJECTS.map((s) => {
          const raw = result.marks[s];
          const v = raw === "A" ? "Absent" : raw ?? "—";
          const isPass = typeof raw === "number" && raw >= subMin;
          return [
            s,
            SUBJECT_NAMES[s],
            cfg.maxMarks,
            v,
            typeof raw === "number"
              ? isPass
                ? "Pass"
                : "Fail"
              : raw === "A"
              ? "Absent"
              : "—",
          ];
        }),
        theme: "grid",
        headStyles: { fillColor: [30, 39, 97], textColor: 255 },
        styles: { fontSize: 10 },
      });

      const tbl1 = doc as unknown as { lastAutoTable: { finalY: number } };
      const finalY = tbl1.lastAutoTable.finalY + 8;
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total",
            `${result.total} / ${result.maxTotal}`,
            "Percentage",
            `${result.pct.toFixed(2)}%`,
          ],
          ["Grade", result.grade, "Result", result.pass ? "PASS ✓" : "FAIL ✗"],
          [
            "Class Rank",
            `#${result.rank} of ${allResults.length}`,
            "Section Rank",
            `#${result.sectionRank}`,
          ],
        ],
        theme: "grid",
        styles: { fontSize: 10, fontStyle: "bold" },
        columnStyles: {
          0: { fillColor: [240, 244, 255] },
          2: { fillColor: [240, 244, 255] },
        },
      });

      const tbl2 = doc as unknown as { lastAutoTable: { finalY: number } };
      const noteY = tbl2.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text(
        `Downloaded on ${new Date().toLocaleString("en-IN")} · Strictly Individual Student Scorecard`,
        105,
        noteY,
        { align: "center" }
      );
      doc.setTextColor(0);

      const safeRoll = result.student.roll.replace(/[^a-z0-9]/gi, "_");
      doc.save(`scorecard_${safeRoll}_${examType}.pdf`);
      toast.success("Individual student scorecard PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate PDF. Please try again.");
    }
  };

  // 2. Download Individual JPG Scorecard
  const downloadJpg = () => {
    const W = 800;
    const H = 600;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Canvas context unavailable");
      return;
    }

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Header band
    ctx.fillStyle = "#3730a3";
    ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Smart Exam Result Management System", W / 2, 28);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#c7d2fe";
    ctx.fillText(`${EXAM_LABELS[examType]} — Individual Student Scorecard`, W / 2, 50);

    // Avatar circle with student initials
    const AX = 70;
    const AY = 118;
    const AR = 38;
    ctx.fillStyle = "#4338ca";
    ctx.beginPath();
    ctx.arc(AX, AY, AR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(initials || "ST", AX, AY + 8);

    // Student identity
    ctx.textAlign = "left";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(result.student.name, 125, 95);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(
      `${result.student.roll}  ·  Section ${result.student.section}  ·  ${result.student.course}`,
      125,
      115
    );
    ctx.fillText(
      `Semester ${result.student.semester}  ·  Enrollment: ${result.student.enrollment}`,
      125,
      133
    );

    // Stats row
    const stats = [
      { label: "Total", val: `${result.total}/${result.maxTotal}` },
      { label: "Percentage", val: `${result.pct.toFixed(1)}%` },
      { label: "Grade", val: result.grade },
      { label: "Rank", val: `#${result.rank}` },
      { label: "Result", val: result.pass ? "PASS" : "FAIL" },
    ];
    const statW = (W - 60) / stats.length;
    stats.forEach((st, i) => {
      const x = 30 + i * statW;
      ctx.fillStyle = "#1e293b";
      canvasRoundRect(ctx, x, 160, statW - 8, 62, 8);
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(st.label, x + (statW - 8) / 2, 180);
      ctx.fillStyle =
        st.label === "Result"
          ? result.pass
            ? "#34d399"
            : "#f87171"
          : "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(st.val, x + (statW - 8) / 2, 202);
    });

    // Subjects table
    ctx.textAlign = "left";
    const tableX = 30;
    let tableY = 248;
    ctx.fillStyle = "#1e2761";
    ctx.fillRect(tableX, tableY, W - 60, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("Code", tableX + 8, tableY + 16);
    ctx.fillText("Subject Name", tableX + 80, tableY + 16);
    ctx.fillText("Marks", tableX + 450, tableY + 16);
    ctx.fillText("Max", tableX + 515, tableY + 16);
    ctx.fillText("Status", tableX + 570, tableY + 16);
    tableY += 24;

    const subMin = (cfg.passPct / 100) * cfg.maxMarks;
    SUBJECTS.forEach((sub, idx) => {
      const raw = result.marks[sub];
      const isPass = typeof raw === "number" && raw >= subMin;
      ctx.fillStyle = idx % 2 === 0 ? "#0f172a" : "#162033";
      ctx.fillRect(tableX, tableY, W - 60, 26);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px sans-serif";
      ctx.fillText(sub, tableX + 8, tableY + 17);
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(SUBJECT_NAMES[sub].slice(0, 32), tableX + 80, tableY + 17);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(raw ?? "—"), tableX + 470, tableY + 17);
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.fillText(String(cfg.maxMarks), tableX + 530, tableY + 17);
      ctx.fillStyle =
        typeof raw === "number"
          ? isPass
            ? "#34d399"
            : "#f87171"
          : "#94a3b8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(
        typeof raw === "number" ? (isPass ? "PASS" : "FAIL") : raw === "A" ? "ABSENT" : "—",
        tableX + 590,
        tableY + 17
      );
      ctx.textAlign = "left";
      tableY += 26;
    });

    // Footer
    ctx.fillStyle = "#475569";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `Strictly Individual Student Copy · Generated on ${new Date().toLocaleString("en-IN")}`,
      W / 2,
      H - 12
    );

    const safeRoll = result.student.roll.replace(/[^a-z0-9]/gi, "_");
    const link = document.createElement("a");
    link.download = `scorecard_${safeRoll}_${examType}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    toast.success("Individual student scorecard JPG downloaded!");
  };

  // 3. Download Individual Excel Scorecard (dynamic import to avoid SSR issues)
  const downloadExcel = async () => {
    toast.info("Generating Excel scorecard...");
    try {
      const XLSX = await import("xlsx");
      const subMin = (cfg.passPct / 100) * cfg.maxMarks;
      const info: (string | number)[][] = [
        ["Smart Exam Result Management System"],
        [`${EXAM_LABELS[examType]} — Individual Student Scorecard`],
        [],
        ["Name", result.student.name, "", "Roll No", result.student.roll],
        ["Enrollment", result.student.enrollment, "", "Course", result.student.course],
        ["Semester", result.student.semester, "", "Section", result.student.section],
        [],
        ["Subject Code", "Subject Name", "Max", "Marks Obtained", "Status"],
        ...SUBJECTS.map((s) => {
          const raw = result.marks[s];
          const v = raw === "A" ? "A" : (raw ?? 0);
          const isPass = typeof raw === "number" && raw >= subMin;
          return [
            s,
            SUBJECT_NAMES[s],
            cfg.maxMarks,
            v,
            typeof raw === "number" ? (isPass ? "Pass" : "Fail") : raw === "A" ? "Absent" : "—",
          ];
        }),
        [],
        ["Total", `${result.total} / ${result.maxTotal}`, "Percentage", `${result.pct.toFixed(2)}%`],
        ["Grade", result.grade, "Status", result.pass ? "PASS" : "FAIL"],
        ["Class Rank", `#${result.rank} of ${allResults.length}`, "Section Rank", `#${result.sectionRank}`],
        [],
        ["Generated On", new Date().toLocaleString("en-IN"), "Access Scope", "Individual Student Scorecard Only"],
      ];

      const ws = XLSX.utils.aoa_to_sheet(info);
      ws["!cols"] = [{ wch: 16 }, { wch: 32 }, { wch: 8 }, { wch: 18 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Scorecard");
      const safeRoll = result.student.roll.replace(/[^a-z0-9]/gi, "_");
      XLSX.writeFile(wb, `scorecard_${safeRoll}_${examType}.xlsx`);
      toast.success("Individual student scorecard Excel downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate Excel. Please try again.");
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="size-3.5" /> New Search / नया सर्च
        </button>
        <span className="text-slate-700 hidden sm:inline">·</span>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 gap-1 text-[11px]">
          <CheckCircle2 className="size-3" /> Result Verified
        </Badge>
        <Badge
          variant="outline"
          className="text-[10px] border-sky-500/40 text-sky-400 ml-auto"
        >
          {EXAM_LABELS[examType]}
        </Badge>
      </div>

      {/* ── Personal Report Card ────────────────────────────────────────── */}
      <Card className="border-indigo-500/30 bg-gradient-to-br from-slate-900 to-indigo-950/60 shadow-2xl shadow-indigo-900/20">
        <CardContent className="p-6 space-y-5">
          {/* Avatar + Personal Identity */}
          <div className="flex items-start gap-4">
            {/* Student Avatar with Initials */}
            <div className="size-16 rounded-2xl bg-indigo-600/30 border-2 border-indigo-500/50 flex items-center justify-center text-xl font-bold text-indigo-300 shrink-0 shadow-md">
              {initials || <User className="size-8 text-indigo-400" />}
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <div className="text-lg font-display font-bold text-white truncate">
                {result.student.name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Roll:{" "}
                <span className="text-slate-200 font-mono font-semibold">
                  {result.student.roll}
                </span>
                {" · "}Enrollment:{" "}
                <span className="text-slate-200 font-mono font-semibold">
                  {result.student.enrollment}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Section:{" "}
                <span className="text-slate-200 font-semibold">
                  {result.student.section}
                </span>
                {" · "}Sem:{" "}
                <span className="text-slate-200 font-semibold">
                  {result.student.semester}
                </span>
                {" · "}
                {result.student.course}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge
                  className={`text-[11px] font-bold px-2.5 py-0.5 ${
                    result.pass
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-red-500/20 text-red-400 border-red-500/40"
                  }`}
                >
                  {result.pass ? "✓ PASS" : "✗ FAIL"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] border-indigo-500/40 text-indigo-300"
                >
                  Grade {result.grade}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] border-slate-600 text-slate-300"
                >
                  Class Rank #{result.rank}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] border-slate-600 text-slate-300"
                >
                  Sec. Rank #{result.sectionRank}
                </Badge>
              </div>
            </div>

            {/* Score Percentage */}
            <div className="hidden sm:flex flex-col items-center text-center shrink-0">
              <div className="text-3xl font-bold tabular-nums text-white">
                {result.pct.toFixed(1)}
                <span className="text-lg text-slate-400">%</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Score</div>
              <div className="text-lg font-bold text-indigo-400 mt-0.5">
                {result.total}
                <span className="text-sm font-normal text-slate-500">
                  /{result.maxTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Subject Marks Table */}
          <div className="rounded-xl overflow-hidden border border-slate-700/60">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="text-left px-3 py-2 font-semibold text-slate-300">Code</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-300 hidden sm:table-cell">
                    Subject
                  </th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-300">
                    Marks
                  </th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-300">Max</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {SUBJECTS.map((sub, i) => {
                  const raw = result.marks[sub];
                  const subMin = (cfg.passPct / 100) * cfg.maxMarks;
                  const isPass = typeof raw === "number" && raw >= subMin;
                  const isAbsent = raw === "A";
                  return (
                    <tr
                      key={sub}
                      className={`border-t border-slate-700/50 ${
                        i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-800/20"
                      }`}
                    >
                      <td className="px-3 py-2 font-mono font-semibold text-slate-300">
                        {sub}
                      </td>
                      <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">
                        {SUBJECT_NAMES[sub]}
                      </td>
                      <td className="px-3 py-2 text-center font-bold tabular-nums text-white">
                        {isAbsent ? (
                          <span className="text-red-400">A</span>
                        ) : (
                          raw ?? "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-500">
                        {cfg.maxMarks}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAbsent
                              ? "bg-red-500/15 text-red-400"
                              : isPass
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {isAbsent ? "ABSENT" : isPass ? "PASS" : "FAIL"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="border-t-2 border-indigo-500/40 bg-indigo-950/40">
                  <td
                    colSpan={2}
                    className="px-3 py-2.5 font-bold text-indigo-300 hidden sm:table-cell"
                  >
                    TOTAL
                  </td>
                  <td
                    colSpan={2}
                    className="px-3 py-2.5 font-bold text-indigo-300 sm:hidden"
                  >
                    TOTAL
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold tabular-nums text-white text-sm">
                    {result.total}
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-400 text-sm">
                    {result.maxTotal}
                  </td>
                  <td className="px-3 py-2.5 text-center text-indigo-300 font-semibold text-xs">
                    {result.pct.toFixed(1)}% · Grade {result.grade}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Individual Downloads ── */}
          <div className="border-t border-slate-700/50 pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="size-3.5 text-amber-500 shrink-0" />
              <span>
                <strong>Strict Individual Download Scope:</strong> Downloads are enabled ONLY for your personal scorecard.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={downloadPdf}
                className="h-10 gap-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 cursor-pointer text-xs font-semibold"
              >
                <FileText className="size-4" />
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={downloadJpg}
                className="h-10 gap-2 border-sky-500/40 text-sky-300 hover:bg-sky-500/10 hover:text-sky-200 cursor-pointer text-xs font-semibold"
              >
                <ImageIcon className="size-4" />
                Download JPG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={downloadExcel}
                className="h-10 gap-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 cursor-pointer text-xs font-semibold"
              >
                <FileSpreadsheet className="size-4" />
                Download Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── General Class Statistics & Graphs (View-Only) ────────────────── */}
      <Card className="border-slate-700 bg-slate-900/70">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
            <BarChart2 className="size-4 text-sky-400" />
            Class Analytics &amp; Subject Graphs
            <Badge
              variant="outline"
              className="text-[9px] border-slate-600 text-slate-400 ml-auto"
            >
              View Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          {/* Class Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Students", val: String(classStats.total), color: "text-slate-200" },
              { label: "Pass Count", val: String(classStats.passed), color: "text-emerald-400" },
              { label: "Fail Count", val: String(classStats.failed), color: "text-red-400" },
              {
                label: "Class Avg %",
                val: classStats.avgPct.toFixed(1) + "%",
                color: "text-sky-400",
              },
            ].map((st) => (
              <div
                key={st.label}
                className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50"
              >
                <div className={`text-xl font-bold tabular-nums ${st.color}`}>{st.val}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>

          {/* Student Score vs Class Average Comparison */}
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Your Score vs Class Average</span>
              <span className="text-xs font-semibold text-slate-300">
                {result.pct.toFixed(1)}% vs {classStats.avgPct.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>Your Score</span>
                  <span>{result.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${Math.min(result.pct, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>Class Average</span>
                  <span>{classStats.avgPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-sky-500/60 transition-all"
                    style={{ width: `${Math.min(classStats.avgPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subject Graphs */}
          <div>
            <div className="text-xs text-slate-400 mb-3">
              Subject Graphs: Your Score vs Class Average
            </div>
            <div className="space-y-2.5">
              {classStats.subjectAvgs.map(({ sub, avg }) => {
                const myRaw = result.marks[sub];
                const myMark = typeof myRaw === "number" ? myRaw : 0;
                const maxMark = cfg.maxMarks;
                return (
                  <div key={sub}>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono font-semibold text-slate-300">{sub}</span>
                      <span className="text-slate-500">
                        You:{" "}
                        <span className="text-white font-semibold">
                          {myRaw === "A" ? "A" : myRaw ?? "—"}
                        </span>
                        {" · "}Avg:{" "}
                        <span className="text-sky-400 font-semibold">{avg.toFixed(1)}</span>
                        {" / "}
                        {maxMark}
                      </span>
                    </div>
                    <div className="relative h-5 rounded-md bg-slate-800 overflow-hidden">
                      {/* Class avg bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-slate-600/50 rounded-md"
                        style={{ width: `${(avg / maxMark) * 100}%` }}
                      />
                      {/* Your score bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-500/70 rounded-md"
                        style={{ width: `${(myMark / maxMark) * 100}%` }}
                      />
                      <span className="absolute inset-0 flex items-center pl-2 text-[10px] text-white/80 font-semibold">
                        {SUBJECT_NAMES[sub]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-2 rounded-sm bg-indigo-500/70" /> Your score
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-2 rounded-sm bg-slate-600/50" /> Class
                average
              </span>
            </div>
          </div>

          {/* Section Summary Stat */}
          <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/50 rounded-lg px-4 py-2.5 text-xs">
            <span className="text-slate-400">
              Section {result.student.section} Average:
            </span>
            <span className="font-bold text-sky-300">
              {classStats.sectionAvgPct.toFixed(1)}%
            </span>
            <span className="text-slate-500 ml-auto">
              {result.pct >= classStats.sectionAvgPct
                ? "🟢 Above section average"
                : "🔴 Below section average"}
            </span>
          </div>

          {/* Strict Lock Banner */}
          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2.5">
            <Lock className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-200/70 leading-snug">
              <strong>STRICT LOCK:</strong> Students cannot export or download the full class list or sheet. Only your individual scorecard is downloadable above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Canvas Helper ────────────────────────────────────────────────────────────
function canvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
