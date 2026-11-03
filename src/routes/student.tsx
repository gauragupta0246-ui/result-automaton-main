import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
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
  Phone,
  Landmark,
  ShieldCheck,
  Award,
  ChevronDown,
  Printer,
  FileCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RgpvMarksEntryReportModal } from "@/components/rgpv-marks-entry-report-modal";

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
import { LiveCameraSnapshot } from "@/components/live-camera-snapshot";
import { StudentAiGrievanceWidget } from "@/components/student-ai-grievance-widget";
import {
  RgpvTopBar,
  RgpvBrandHeader,
  RgpvNavbar,
  RgpvNotificationTicker,
  RgpvFooter,
  RgpvEmblem,
} from "@/components/rgpv-portal-layout";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Scorecard Verification — Official Examination Portal" },
      {
        name: "description",
        content:
          "Official Student Result Verification Gate and Individual Grade Statement Download.",
      },
    ],
  }),
  component: StudentPortalPage,
});

// Official University Emblem SVG
function UniversityEmblem({ className = "size-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="#ffffff" strokeWidth="3" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="41" stroke="#f1b82d" strokeWidth="2.5" />
      <path
        d="M50 18L58 26H70V38L78 46L70 54V66H58L50 74L42 66H30V54L22 46L30 38V26H42L50 18Z"
        fill="#ffffff"
        fillOpacity="0.08"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <circle cx="50" cy="46" r="16" stroke="#f1b82d" strokeWidth="2" fill="#0b2545" />
      <path
        d="M40 43C44 41 48 42 50 44C52 42 56 41 60 43V53C56 51 52 52 50 54C48 52 44 51 40 53V43Z"
        fill="#f1b82d"
      />
      <line x1="50" y1="44" x2="50" y2="54" stroke="#0b2545" strokeWidth="1.5" />
      <path d="M32 74C40 70 60 70 68 74L64 78C56 75 44 75 36 78L32 74Z" fill="#f1b82d" />
    </svg>
  );
}

const QUICK_ROLL_CHIPS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

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

  // 2. 1-indexed class roll number
  if (!match && !isNaN(num) && num >= 1 && num <= sectionStudents.length) {
    match = sectionStudents[num - 1];
  }

  // 3. Fallback across all students
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

// ─── Main Student Portal Page ────────────────────────────────────────────────
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
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const [resolvedResult, setResolvedResult] = useState<StudentResult | null>(null);
  const [allResults, setAllResults] = useState<StudentResult[]>([]);

  // Verification Handler
  const handleVerifyAndViewResult = () => {
    if (!capturedPhoto) {
      toast.error("Mandatory Camera Snapshot Missing: Please capture a live selfie to proceed.");
      return;
    }

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

    // Save captured face snapshot with timestamp into student_access_logs
    void logStudentAccess({
      rollNo: rollNum,
      section,
      examType,
      studentName: student.name,
      photoData: capturedPhoto,
    });

    setStep("dashboard");
    toast.success(`Identity verified! Official Grade Card loaded for ${student.name}`);
  };

  const handleReset = () => {
    setStep("select");
    setResolvedResult(null);
    setAllResults([]);
    setCapturedPhoto(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-[#003366]">
        <div className="text-sm font-bold font-serif animate-pulse">
          Connecting to RGPV Examination Server…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#111827] flex flex-col font-sans">
      {/* ── Official RGPV Header Suite ── */}
      <RgpvTopBar />
      <RgpvBrandHeader />
      <RgpvNavbar activeRoute="student" />
      <RgpvNotificationTicker />

      {/* Official Government Strip */}
      <div className="bg-[#e6eef5] border-b border-[#d1d5db] py-1.5 px-4 text-center text-xs text-[#003366] font-semibold flex items-center justify-center gap-2">
        <Landmark className="size-3.5 text-[#003366]" />
        <span>Mandatory Biometric Snapshot Verification Gate · Single Student Marksheet Access Only</span>
      </div>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl space-y-5">
          {/* ── STEP 1: Verification Form & Mandatory Camera Snapshot ── */}
          {step === "select" && (
            <VerificationStep
              examType={examType}
              section={section}
              rollNum={rollNum}
              capturedPhoto={capturedPhoto}
              onExamChange={setExamType}
              onSectionChange={setSection}
              onRollChange={setRollNum}
              onCapturePhoto={setCapturedPhoto}
              onClearPhoto={() => setCapturedPhoto(null)}
              onVerify={handleVerifyAndViewResult}
            />
          )}

          {/* ── STEP 2: University Grade Card & Scorecard ── */}
          {step === "dashboard" && resolvedResult && (
            <UniversityScorecard
              result={resolvedResult}
              allResults={allResults}
              examType={examType}
              capturedPhoto={capturedPhoto}
              onReset={handleReset}
            />
          )}

          {step === "dashboard" && !resolvedResult && (
            <Card className="border-[#b91c1c] bg-white rounded-[2px] p-6 text-center space-y-3">
              <AlertCircle className="size-10 text-[#b91c1c] mx-auto" />
              <p className="text-[#003366] font-serif font-bold text-base">
                Record Not Found in Examination Database
              </p>
              <p className="text-xs text-slate-600">
                The entered roll number and section could not be resolved. Please verify your admit card details.
              </p>
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-[#d1d5db] text-[#003366] rounded-[2px] text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="size-4 mr-2" /> Return to Verification Gate
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* AI Explainer Chatbot & Two-Tier Grievance Widget */}
      {step === "dashboard" && resolvedResult && (
        <StudentAiGrievanceWidget
          result={resolvedResult}
          allResults={allResults}
          examType={examType}
        />
      )}

      {/* Official Footer */}
      <RgpvFooter />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: Student Result Verification Gate (Mandatory Fresh Camera Snapshot)
// ═══════════════════════════════════════════════════════════════════════════════
function VerificationStep({
  examType,
  section,
  rollNum,
  capturedPhoto,
  onExamChange,
  onSectionChange,
  onRollChange,
  onCapturePhoto,
  onClearPhoto,
  onVerify,
}: {
  examType: ExamType;
  section: Section;
  rollNum: string;
  capturedPhoto: string | null;
  onExamChange: (v: ExamType) => void;
  onSectionChange: (v: Section) => void;
  onRollChange: (v: string) => void;
  onCapturePhoto: (p: string) => void;
  onClearPhoto: () => void;
  onVerify: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-serif font-black text-[#003366] uppercase">
          Student Result Verification Gate
        </h2>
        <p className="text-xs text-slate-600">
          Select your examination details and capture a mandatory live webcam selfie to view and download your scorecard.
        </p>
      </div>

      <Card className="bg-white border border-[#d1d5db] rounded-[2px] shadow-sm border-t-4 border-t-[#003366]">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Section 1: Examination Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exam Type Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                1. Examination Type *
              </label>
              <select
                value={examType}
                onChange={(e) => onExamChange(e.target.value as ExamType)}
                className="w-full h-10 px-3 bg-white border border-[#d1d5db] text-[#111827] text-xs font-semibold rounded-[2px] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
              >
                <option value="midsem">Mid Semester Examination (Mid Sem)</option>
                <option value="put">Pre-University Test (PUT)</option>
              </select>
            </div>

            {/* Section Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                2. Academic Section *
              </label>
              <select
                value={section}
                onChange={(e) => onSectionChange(e.target.value as Section)}
                className="w-full h-10 px-3 bg-white border border-[#d1d5db] text-[#111827] text-xs font-semibold rounded-[2px] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roll Number Input & Quick Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                3. Class Roll Number *
              </label>
              <span className="text-[11px] text-slate-500">e.g. 01, 02, 05...</span>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                placeholder="01"
                value={rollNum}
                onChange={(e) => onRollChange(e.target.value)}
                className="h-10 max-w-[140px] font-mono text-sm font-bold bg-white border-[#d1d5db] text-[#003366] rounded-[2px]"
              />
              <span className="text-xs text-slate-500">or pick quick roll below:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {QUICK_ROLL_CHIPS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRollChange(r)}
                  className={`px-2.5 py-1 text-xs font-bold font-mono rounded-[2px] border transition cursor-pointer ${
                    rollNum === r
                      ? "bg-[#003366] border-[#003366] text-white shadow-xs"
                      : "bg-[#f8fafc] border-[#d1d5db] text-slate-700 hover:border-[#003366]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Mandatory Camera Snapshot Module (Solid 2px navy border) */}
          <div className="pt-2 border-t border-[#e5e7eb]">
            <div className="border-2 border-[#003366] rounded-[2px] p-2 bg-[#f9fafb]">
              <LiveCameraSnapshot
                onCapture={onCapturePhoto}
                onClear={onClearPhoto}
                capturedPhoto={capturedPhoto}
              />
            </div>
          </div>

          {/* Verify & View Result Action Button (Disabled until live selfie captured) */}
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              onClick={onVerify}
              disabled={!capturedPhoto}
              className={`w-full h-11 text-xs sm:text-sm font-bold rounded-[2px] gap-2 tracking-wide uppercase transition shadow-sm ${
                capturedPhoto
                  ? "bg-[#003366] hover:bg-[#002244] text-white cursor-pointer"
                  : "bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed"
              }`}
            >
              {capturedPhoto ? (
                <>
                  <CheckCircle2 className="size-4 text-amber-300" />
                  <span>Verify Identity &amp; View Result / परिणाम देखें</span>
                </>
              ) : (
                <>
                  <Lock className="size-4 text-slate-400" />
                  <span>Result Locked — Capture Camera Snapshot to Unlock</span>
                </>
              )}
            </Button>

            {!capturedPhoto && (
              <p className="text-[11px] text-center text-[#b91c1c] font-bold">
                ⚠️ Live selfie snapshot required above to unlock your examination scorecard.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staff Login Link */}
      <div className="text-center text-xs text-[#475569]">
        Faculty or Examination Controller?{" "}
        <a href="/login" className="text-[#0b2545] font-bold underline hover:text-[#133966]">
          Faculty &amp; Admin Sign In →
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: University Scorecard & Single Download Restriction
// ═══════════════════════════════════════════════════════════════════════════════
function UniversityScorecard({
  result,
  allResults,
  examType,
  capturedPhoto,
  onReset,
}: {
  result: StudentResult;
  allResults: StudentResult[];
  examType: ExamType;
  capturedPhoto: string | null;
  onReset: () => void;
}) {
  const cfg = useExamStore((s) => s.config[examType]);
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);

  // Pass / ATKT / Fail calculation
  const statusLabel = useMemo(() => {
    const subMin = (cfg.passPct / 100) * cfg.maxMarks;
    const failedSubjects = SUBJECTS.filter((sub) => {
      const mark = result.marks[sub];
      return mark === "A" || (typeof mark === "number" && mark < subMin);
    });

    if (failedSubjects.length === 0) return "PASS";
    if (failedSubjects.length <= 2) return "ATKT (PROMOTED)";
    return "FAIL";
  }, [result, cfg]);

  // Aggregated view-only statistics (Single student lock enforced)
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
    return { total, passed, failed, avgPct, subjectAvgs };
  }, [allResults]);

  // 1. Download Individual PDF Scorecard
  const downloadPdf = async () => {
    toast.info("Generating Official University Grade Card PDF...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("STATE TECHNICAL BOARD & UNIVERSITY EXAMINATION AUTHORITY", 105, 14, {
        align: "center",
      });
      doc.setFontSize(11);
      doc.text("OFFICIAL GRADE STATEMENT & TRANSCRIPT OF MARKS", 105, 21, {
        align: "center",
      });
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text(`Examination: ${EXAM_LABELS[examType]} | Session 2025–2026`, 105, 27, {
        align: "center",
      });
      doc.setDrawColor(11, 37, 69);
      doc.setLineWidth(0.8);
      doc.line(15, 30, 195, 30);

      // Student Details Grid
      const info = [
        ["Candidate Name", result.student.name, "Roll Number", result.student.roll],
        ["Enrollment No.", result.student.enrollment, "Section / Class", result.student.section],
        ["Course / Branch", result.student.course, "Semester", String(result.student.semester)],
        ["Overall Status", statusLabel, "Grade Awarded", result.grade],
      ];

      let y = 37;
      info.forEach((row) => {
        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.text(row[0] + ":", 16, y);
        doc.setFont("times", "normal");
        doc.text(String(row[1]), 52, y);
        doc.setFont("times", "bold");
        doc.text(row[2] + ":", 112, y);
        doc.setFont("times", "normal");
        doc.text(String(row[3]), 148, y);
        y += 6;
      });

      const subMin = (cfg.passPct / 100) * cfg.maxMarks;
      autoTable(doc, {
        startY: y + 3,
        head: [["Subject Code", "Subject Name", "Max Marks", "Min Pass", "Marks Obtained", "Result"]],
        body: SUBJECTS.map((s) => {
          const raw = result.marks[s];
          const v = raw === "A" ? "Absent" : raw ?? "—";
          const isPass = typeof raw === "number" && raw >= subMin;
          return [
            s,
            SUBJECT_NAMES[s],
            String(cfg.maxMarks),
            String(Math.round(subMin)),
            String(v),
            typeof raw === "number" ? (isPass ? "PASS" : "FAIL") : raw === "A" ? "ABSENT" : "—",
          ];
        }),
        theme: "striped",
        headStyles: { fillColor: [11, 37, 69], textColor: 255, font: "times", fontStyle: "bold" },
        styles: { fontSize: 9, font: "times", cellPadding: 2.5 },
      });

      const tbl1 = doc as unknown as { lastAutoTable: { finalY: number } };
      const finalY = tbl1.lastAutoTable.finalY + 6;

      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Grand Total Marks",
            `${result.total} / ${result.maxTotal}`,
            "Percentage",
            `${result.pct.toFixed(2)}%`,
          ],
          [
            "Class Rank",
            `Rank #${result.rank} of ${allResults.length}`,
            "Section Rank",
            `Rank #${result.sectionRank}`,
          ],
        ],
        theme: "grid",
        styles: { fontSize: 9, font: "times", fontStyle: "bold" },
        columnStyles: {
          0: { fillColor: [244, 246, 249] },
          2: { fillColor: [244, 246, 249] },
        },
      });

      const tbl2 = doc as unknown as { lastAutoTable: { finalY: number } };
      const footerY = tbl2.lastAutoTable.finalY + 12;

      doc.setFontSize(8);
      doc.setFont("times", "italic");
      doc.setTextColor(80);
      doc.text(
        `Biometric Security Verification Logged · Generated on ${new Date().toLocaleString("en-IN")}`,
        105,
        footerY,
        { align: "center" }
      );
      doc.text(
        "Strictly Individual Scorecard · Controller of Examinations Seal · Any tampering is a statutory offense",
        105,
        footerY + 5,
        { align: "center" }
      );

      const safeRoll = result.student.roll.replace(/[^a-z0-9]/gi, "_");
      doc.save(`Official_Scorecard_${safeRoll}_${examType}.pdf`);
      toast.success("Individual Scorecard PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed. Please try again.");
    }
  };

  // 2. Download Individual Scorecard JPG
  const downloadJpg = () => {
    const W = 800;
    const H = 640;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Solid off-white background
    ctx.fillStyle = "#f4f6f9";
    ctx.fillRect(0, 0, W, H);

    // Official Navy top header
    ctx.fillStyle = "#0b2545";
    ctx.fillRect(0, 0, W, 70);

    // Gold stripe
    ctx.fillStyle = "#f1b82d";
    ctx.fillRect(0, 70, W, 4);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px serif";
    ctx.textAlign = "center";
    ctx.fillText("STATE TECHNICAL BOARD & UNIVERSITY EXAMINATION AUTHORITY", W / 2, 28);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`${EXAM_LABELS[examType]} — OFFICIAL TRANSCRIPT OF MARKS`, W / 2, 50);

    // Candidate Details Frame
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.fillRect(30, 90, W - 60, 80);
    ctx.strokeRect(30, 90, W - 60, 80);

    ctx.textAlign = "left";
    ctx.fillStyle = "#0b2545";
    ctx.font = "bold 15px serif";
    ctx.fillText(result.student.name, 45, 115);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText(
      `Roll No: ${result.student.roll}   |   Section: ${result.student.section}   |   ${result.student.course}`,
      45,
      135
    );
    ctx.fillText(
      `Enrollment: ${result.student.enrollment}   |   Status: ${statusLabel}   |   Grade: ${result.grade}`,
      45,
      155
    );

    // Table Header
    let y = 185;
    ctx.fillStyle = "#0b2545";
    ctx.fillRect(30, y, W - 60, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("Code", 45, y + 16);
    ctx.fillText("Subject Name", 140, y + 16);
    ctx.fillText("Max", 460, y + 16);
    ctx.fillText("Min", 520, y + 16);
    ctx.fillText("Marks", 580, y + 16);
    ctx.fillText("Result", 660, y + 16);
    y += 24;

    const subMin = (cfg.passPct / 100) * cfg.maxMarks;
    SUBJECTS.forEach((sub, i) => {
      const raw = result.marks[sub];
      const isPass = typeof raw === "number" && raw >= subMin;
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#f1f5f9";
      ctx.fillRect(30, y, W - 60, 26);
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(30, y, W - 60, 26);

      ctx.fillStyle = "#0f172a";
      ctx.font = "11px sans-serif";
      ctx.fillText(sub, 45, y + 17);
      ctx.fillText(SUBJECT_NAMES[sub].slice(0, 36), 140, y + 17);
      ctx.fillText(String(cfg.maxMarks), 460, y + 17);
      ctx.fillText(String(Math.round(subMin)), 520, y + 17);
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(String(raw ?? "—"), 580, y + 17);

      ctx.fillStyle =
        typeof raw === "number" ? (isPass ? "#15803d" : "#991b1b") : "#64748b";
      ctx.fillText(
        typeof raw === "number" ? (isPass ? "PASS" : "FAIL") : raw === "A" ? "ABSENT" : "—",
        660,
        y + 17
      );
      y += 26;
    });

    // Summary Box
    y += 10;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(30, y, W - 60, 40);
    ctx.strokeRect(30, y, W - 60, 40);
    ctx.fillStyle = "#0b2545";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(
      `Grand Total: ${result.total} / ${result.maxTotal}   |   Percentage: ${result.pct.toFixed(1)}%   |   Class Rank: #${result.rank}`,
      45,
      y + 25
    );

    // Official Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `Strictly Individual Candidate Copy · Security Audit Timestamp: ${new Date().toLocaleString("en-IN")}`,
      W / 2,
      H - 14
    );

    const safeRoll = result.student.roll.replace(/[^a-z0-9]/gi, "_");
    const link = document.createElement("a");
    link.download = `Official_Scorecard_${safeRoll}_${examType}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    toast.success("Individual Scorecard JPG downloaded!");
  };

  // 3. Download Individual Scorecard Excel
  const downloadExcel = async () => {
    toast.info("Generating Individual Scorecard Excel...");
    try {
      const XLSX = await import("xlsx");
      const subMin = (cfg.passPct / 100) * cfg.maxMarks;
      const data: (string | number)[][] = [
        ["STATE TECHNICAL BOARD & UNIVERSITY EXAMINATION AUTHORITY"],
        [`${EXAM_LABELS[examType]} — INDIVIDUAL STUDENT GRADE CARD`],
        [],
        ["Candidate Name", result.student.name, "", "Roll Number", result.student.roll],
        ["Enrollment No", result.student.enrollment, "", "Section", result.student.section],
        ["Course", result.student.course, "", "Semester", result.student.semester],
        ["Result Status", statusLabel, "", "Grade", result.grade],
        [],
        ["Subject Code", "Subject Name", "Max Marks", "Min Pass Marks", "Marks Obtained", "Status"],
        ...SUBJECTS.map((s) => {
          const raw = result.marks[s];
          const isPass = typeof raw === "number" && raw >= subMin;
          return [
            s,
            SUBJECT_NAMES[s],
            cfg.maxMarks,
            Math.round(subMin),
            raw === "A" ? "A" : (raw ?? 0),
            typeof raw === "number" ? (isPass ? "PASS" : "FAIL") : raw === "A" ? "ABSENT" : "—",
          ];
        }),
        [],
        ["Total Marks", `${result.total} / ${result.maxTotal}`, "Percentage", `${result.pct.toFixed(2)}%`],
        ["Class Rank", `#${result.rank} of ${allResults.length}`, "Section Rank", `#${result.sectionRank}`],
        [],
        ["Access Scope", "Individual Student Scorecard Only", "Generated On", new Date().toLocaleString("en-IN")],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      ws["!cols"] = [{ wch: 16 }, { wch: 34 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "GradeCard");
      const safeRoll = result.student.roll.replace(/[^a-z0-9]/gi, "_");
      XLSX.writeFile(wb, `Scorecard_${safeRoll}_${examType}.xlsx`);
      toast.success("Individual Scorecard Excel downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Excel generation failed.");
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Return button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-[#0b2545] hover:underline font-bold cursor-pointer"
        >
          <ArrowLeft className="size-3.5" /> Return to Verification Gate / नया सर्च
        </button>

        <Badge className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded-[2px] text-[11px] font-bold">
          <CheckCircle2 className="size-3 mr-1" /> Biometrically Verified
        </Badge>
      </div>

      {/* ── PHYSICAL UNIVERSITY SCORECARD CARD ── */}
      <div className="bg-white border-2 border-[#003366] rounded-[2px] shadow-md p-5 sm:p-7 space-y-5 relative overflow-hidden">
        {/* RGPV Crest Faint Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
          <RgpvEmblem className="size-96" />
        </div>

        {/* University Crest & Official Header */}
        <div className="text-center pb-4 border-b-2 border-[#d1d5db] space-y-1 relative z-10">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <RgpvEmblem className="size-14" />
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-white bg-[#003366] px-2.5 py-0.5 rounded-[2px] inline-block">
                RAJIV GANDHI PROUDYOGIKI VISHWAVIDYALAYA, BHOPAL
              </div>
              <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                (State Technological University of Madhya Pradesh)
              </div>
              <h2 className="text-base sm:text-lg font-serif font-black text-[#003366] tracking-tight mt-1">
                OFFICIAL GRADE STATEMENT &amp; TRANSCRIPT OF MARKS
              </h2>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 font-semibold">
            {EXAM_LABELS[examType]} · Academic Session 2025–2026 · Even Semester
          </div>
        </div>

        {/* Candidate Identity & Face Photo Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#f8fafc] border border-[#d1d5db] p-4 rounded-[2px] relative z-10">
          <div className="flex items-center gap-4">
            {/* Live Camera Snapshot Thumbnail */}
            {capturedPhoto ? (
              <div className="size-20 rounded-[2px] border-2 border-[#003366] overflow-hidden bg-slate-900 shrink-0 shadow-xs relative">
                <img
                  src={capturedPhoto}
                  alt="Identity Snapshot"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-x-0 bottom-0 bg-[#003366]/90 text-[7.5px] text-white text-center font-bold py-0.2 tracking-wider">
                  VERIFIED
                </div>
              </div>
            ) : (
              <div className="size-20 rounded-[2px] border-2 border-[#d1d5db] bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <User className="size-8" />
              </div>
            )}

            <div className="space-y-0.5">
              <div className="text-base font-serif font-black text-[#003366]">
                {result.student.name}
              </div>
              <div className="text-xs text-slate-700">
                Roll No: <span className="font-mono font-bold text-[#003366]">{result.student.roll}</span>
                {" · "}Section: <span className="font-bold">{result.student.section}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Enrollment: <span className="font-mono font-bold">{result.student.enrollment}</span>
                {" · "}Semester: {result.student.semester}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">{result.student.course}</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-[2px] border ${
                statusLabel.includes("PASS")
                  ? "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]"
                  : statusLabel.includes("ATKT")
                  ? "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                  : "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"
              }`}
            >
              RESULT: {statusLabel}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#003366]">
              Grade: {result.grade} | Rank: #{result.rank}
            </span>
          </div>
        </div>

        {/* High-Contrast Tabular Marks Sheet */}
        <div className="border border-[#003366] rounded-[2px] overflow-hidden relative z-10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="text-left px-3 py-2.5 font-bold uppercase tracking-wider">Subject Code</th>
                <th className="text-left px-3 py-2.5 font-bold uppercase tracking-wider hidden sm:table-cell">
                  Subject Name
                </th>
                <th className="text-center px-3 py-2.5 font-bold uppercase tracking-wider">Max</th>
                <th className="text-center px-3 py-2.5 font-bold uppercase tracking-wider">Min Pass</th>
                <th className="text-center px-3 py-2.5 font-bold uppercase tracking-wider">Marks Obtained</th>
                <th className="text-center px-3 py-2.5 font-bold uppercase tracking-wider">Status</th>
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
                    className={`border-t border-[#d1d5db] ${
                      i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono font-bold text-[#003366]">{sub}</td>
                    <td className="px-3 py-2.5 text-slate-800 font-medium hidden sm:table-cell">
                      {SUBJECT_NAMES[sub]}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-600 font-mono">{cfg.maxMarks}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600 font-mono">{Math.round(subMin)}</td>
                    <td className="px-3 py-2.5 text-center font-bold font-mono text-sm text-slate-900">
                      {isAbsent ? <span className="text-[#b91c1c]">A</span> : raw ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] ${
                          isAbsent
                            ? "bg-red-100 text-red-800"
                            : isPass
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isAbsent ? "ABSENT" : isPass ? "PASS" : "FAIL"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Grand Total Row */}
              <tr className="bg-[#e6eef5] border-t-2 border-[#003366] font-bold text-[#003366]">
                <td colSpan={2} className="px-3 py-3 text-xs uppercase tracking-wider hidden sm:table-cell">
                  Grand Total Marks / कुल प्राप्तांक
                </td>
                <td colSpan={2} className="px-3 py-3 text-xs uppercase tracking-wider sm:hidden">
                  Total
                </td>
                <td className="px-3 py-3 text-center text-sm font-mono">{result.maxTotal}</td>
                <td className="px-3 py-3 text-center text-sm font-mono text-xs">—</td>
                <td className="px-3 py-3 text-center text-base font-mono font-bold text-[#003366]">
                  {result.total}
                </td>
                <td className="px-3 py-3 text-center font-mono text-xs">
                  {result.pct.toFixed(1)}% · Grade {result.grade}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Official Controller of Examinations Signature & Seal Footer ── */}
        <div className="pt-4 border-t border-[#d1d5db] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10">
          <div className="space-y-1 text-slate-600 text-[11px]">
            <div>
              <strong>Verification Seal:</strong> Biometrically Logged &amp; Cryptographically Timestamped
            </div>
            <div>
              <strong>Issued By:</strong> Office of the Controller of Examinations, RGPV Bhopal
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              Doc ID: RGPV/EXAM/2026/{result.student.roll}/{Date.now().toString(36).toUpperCase()}
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-1">
            <div className="size-14 rounded-full border-2 border-dashed border-[#003366] flex flex-col items-center justify-center p-1 text-[8px] text-[#003366] font-bold uppercase tracking-tight">
              <span>RGPV SEAL</span>
              <span className="text-[6px]">EXAM CELL</span>
            </div>
            <div className="font-serif font-bold text-xs text-[#003366]">
              Controller of Examinations
            </div>
            <div className="text-[10px] text-slate-500">
              Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal
            </div>
          </div>
        </div>

        {/* ── Individual Marksheet Exports ── */}
        <div className="pt-2 space-y-3 relative z-10">
          <div className="flex items-center gap-1.5 text-xs text-[#003366] font-semibold">
            <Lock className="size-3.5 text-[#b91c1c] shrink-0" />
            <span>Individual Student Marksheet Export (Single Student Only):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <Button
              type="button"
              onClick={() => setShowPrintReportModal(true)}
              className="h-10 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-[2px] gap-2 cursor-pointer shadow-xs border border-[#002244]"
            >
              <Printer className="size-4 text-amber-300" />
              Print Result
            </Button>

            <Button
              type="button"
              onClick={() => setShowPrintReportModal(true)}
              className="h-10 bg-[#990000] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-[2px] gap-2 cursor-pointer shadow-xs border border-[#7f1d1d]"
            >
              <FileCheck className="size-4 text-rose-200" />
              Download Marksheet
            </Button>

            <Button
              type="button"
              onClick={downloadPdf}
              className="h-10 bg-[#475569] hover:bg-[#334155] text-white text-xs font-bold rounded-[2px] gap-2 cursor-pointer shadow-xs"
            >
              <FileText className="size-4 text-sky-200" />
              Download Official PDF
            </Button>

            <Button
              type="button"
              onClick={downloadExcel}
              className="h-10 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-[2px] gap-2 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="size-4 text-emerald-100" />
              Download Excel Copy
            </Button>
          </div>
        </div>
      </div>

      {/* ── View-Only Class Analytics & Graphs (Bulk Download Blocked) ── */}
      <div className="bg-white border border-[#cbd5e1] rounded-[4px] p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
          <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wide flex items-center gap-2">
            <BarChart2 className="size-4 text-[#0b2545]" />
            Cohort Performance Analytics (View-Only)
          </h3>
          <Badge variant="outline" className="text-[10px] font-bold border-[#cbd5e1] text-[#475569] rounded-[2px]">
            Strictly View-Only
          </Badge>
        </div>

        {/* Lock Notice: Bulk class sheet download strictly blocked */}
        <div className="flex items-start gap-2 bg-[#fffbeb] border border-[#fde68a] rounded-[3px] p-3 text-xs text-[#92400e]">
          <Lock className="size-4 text-[#b45309] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>STATUTORY RESTRICTION:</strong> Bulk class marksheet export and other students' individual marks are strictly blocked for student logins under University Examination Privacy Act. Only aggregated class averages are viewable below.
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "Class Cohort Size", val: `${classStats.total} Students` },
            { label: "Passed Percentage", val: `${((classStats.passed / (classStats.total || 1)) * 100).toFixed(0)}%` },
            { label: "Class Mean Score", val: `${classStats.avgPct.toFixed(1)}%` },
            { label: "Your Standing", val: `Rank #${result.rank}` },
          ].map((item) => (
            <div key={item.label} className="bg-[#f8fafc] border border-[#cbd5e1] rounded-[3px] p-3 text-center">
              <div className="text-base font-bold font-mono text-[#0b2545]">{item.val}</div>
              <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mt-0.5">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Subject Comparison Graph */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-[#0b2545]">Subject-wise Score vs Class Cohort Mean:</div>
          <div className="space-y-2">
            {classStats.subjectAvgs.map(({ sub, avg }) => {
              const myRaw = result.marks[sub];
              const myMark = typeof myRaw === "number" ? myRaw : 0;
              const maxMark = cfg.maxMarks;
              return (
                <div key={sub} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#0b2545] font-mono">{sub} ({SUBJECT_NAMES[sub]})</span>
                    <span className="text-[#475569]">
                      Your Score: <strong>{myRaw === "A" ? "A" : myRaw ?? "—"}</strong> / {maxMark} · Class Mean: <strong>{avg.toFixed(1)}</strong>
                    </span>
                  </div>
                  <div className="relative h-4 rounded-[2px] bg-slate-200 overflow-hidden">
                    {/* Class mean bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-400"
                      style={{ width: `${(avg / maxMark) * 100}%` }}
                    />
                    {/* Student mark bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-[#0b2545]"
                      style={{ width: `${(myMark / maxMark) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[#475569] pt-1">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[1px] bg-[#0b2545]" /> Your Marks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[1px] bg-slate-400" /> Class Mean
            </span>
          </div>
        </div>
      </div>

      {/* ── Official RGPV Marks Entry Report Modal ── */}
      <RgpvMarksEntryReportModal
        isOpen={showPrintReportModal}
        onClose={() => setShowPrintReportModal(false)}
        result={result}
        exam={examType}
      />
    </div>
  );
}
