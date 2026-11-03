import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Save,
  Download,
  Upload,
  FileText,
  AlertCircle,
  Search,
  Settings2,
  RotateCcw,
  Trash2,
  UserPlus,
  Eraser,
  CheckCircle2,
  ShieldAlert,
  Send,
  BookOpen,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  buildStudentIndex,
  lookupStudent,
  parseInstituteSheet,
  parsePdfResultLines,
  type InstituteRow,
} from "@/lib/institute-import";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth, logAuditEvent } from "@/lib/auth";
import { SubjectClaimPanel } from "@/components/subject-claim-panel";
import { useSubjectClaims } from "@/lib/subject-claims";
import {
  useExamStore,
  examStore,
  computeResults,
  EXAM_LABELS,
  SUBJECTS,
  SUBJECT_NAMES,
  SECTIONS,
  BRANCHES,
  type ExamType,
  type Subject,
  type Section,
  type MarkValue,
} from "@/lib/exam-store";

export const Route = createFileRoute("/_app/marks")({
  head: () => ({
    meta: [
      { title: "Marks Entry — Smart Exam System" },
      { name: "description", content: "Enter and update Mid Sem and PUT marks with live result calculations." },
      { property: "og:title", content: "Marks Entry — Smart Exam System" },
      { property: "og:description", content: "Enter and update Mid Sem and PUT marks with live result calculations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarksPage,
});

const EXAMS: ExamType[] = ["midsem", "put"];

function MarksPage() {
  const { profile, isAdmin, isEmployee } = useAuth();
  const state = useExamStore((s) => s);
  const { claims, getApprovedClaimsForUser, isSubjectApprovedForUser } = useSubjectClaims();

  const [exam, setExam] = useState<ExamType>("midsem");
  const [section, setSection] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Refs for smooth native file dialog opening
  const importExcelInputRef = useRef<HTMLInputElement>(null);
  const importPdfInputRef = useRef<HTMLInputElement>(null);
  const adminUploadInputRef = useRef<HTMLInputElement>(null);

  // Admin student upload states
  const [uploadSemester, setUploadSemester] = useState<number>(2);
  const [uploadBranch, setUploadBranch] = useState<string>("CSE");
  const [uploadSection, setUploadSection] = useState<Section>("B1");

  const userApprovedClaims = useMemo(() => {
    if (isAdmin) return [];
    return getApprovedClaimsForUser(profile?.email || profile?.id);
  }, [isAdmin, profile, getApprovedClaimsForUser, claims]);

  const isFilterReady = Boolean(exam && section && subjectFilter);

  const isAuthorized = useMemo(() => {
    if (isAdmin) return true;
    if (!isFilterReady) return false;
    return isSubjectApprovedForUser(profile?.email || profile?.id, exam, section, subjectFilter);
  }, [isAdmin, isFilterReady, isSubjectApprovedForUser, profile, exam, section, subjectFilter, claims]);

  // Auto-select first authorized subject for staff if unselected
  useEffect(() => {
    if (isEmployee && userApprovedClaims.length > 0 && !section && !subjectFilter) {
      const first = userApprovedClaims[0];
      setExam(first.examType);
      setSection(first.section);
      setSubjectFilter(first.subject);
    }
  }, [isEmployee, userApprovedClaims, section, subjectFilter]);

  const cfg = state.config[exam];
  const results = useMemo(() => computeResults(state, exam), [state, exam]);

  const filtered = useMemo(() => {
    if (!isFilterReady) return [];
    return results.filter((r) => {
      if (r.student.section !== section) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.student.name.toLowerCase().includes(q) && !r.student.roll.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [results, isFilterReady, section, search]);

  const handleExport = () => {
    const rows = results.map((r) => {
      const row: Record<string, string | number> = {
        "Roll No": r.student.roll,
        Enrollment: r.student.enrollment,
        Name: r.student.name,
        Section: r.student.section,
      };
      SUBJECTS.forEach((s) => {
        row[s] = r.marks[s] ?? "";
      });
      row["Total"] = r.total;
      row["Max"] = r.maxTotal;
      row["Percentage"] = +r.pct.toFixed(2);
      row["Grade"] = r.grade;
      row["Status"] = r.pass ? "PASS" : "FAIL";
      row["Rank"] = r.rank;
      row["Section Rank"] = r.sectionRank;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, EXAM_LABELS[exam]);
    XLSX.writeFile(wb, `results_${exam}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const applyInstituteRows = (
    data: InstituteRow[],
    source: string,
    overrideMeta?: { semester: number; branch: string; section: Section }
  ) => {
    if (data.length === 0) {
      toast.error(`No student rows found in this ${source} file. Expected columns: Sr. No. / Roll No. / Name plus subject codes.`);
      return;
    }
    const index = buildStudentIndex(examStore.get().students);
    const studentsToImport = data.map((row) => {
      const existing = lookupStudent(index, row.roll, row.enrollment, row.name);
      const roll = existing ? existing.roll : row.roll;
      const targetSection = overrideMeta?.section || (row.section as Section) || existing?.section || (section !== "all" ? (section as Section) : "B1");
      const targetBranch = overrideMeta?.branch || row.branch || existing?.branch || "CSE";
      const targetSemester = overrideMeta?.semester ?? existing?.semester ?? 2;

      return {
        name: row.name,
        roll,
        enrollment: row.enrollment || existing?.enrollment || roll,
        semester: targetSemester,
        section: targetSection,
        branch: targetBranch,
        course: existing?.course ?? `B.Tech ${targetBranch}`,
      };
    });

    const counts = examStore.importStudents(studentsToImport);
    let marksCount = 0;
    let unmatched = 0;
    const freshIndex = buildStudentIndex(examStore.get().students);

    data.forEach((row) => {
      const student = lookupStudent(freshIndex, row.roll, row.enrollment, row.name);
      if (!student) {
        unmatched++;
        return;
      }
      (Object.entries(row.marks) as Array<[Subject, MarkValue]>).forEach(([sub, value]) => {
        if (value === "A") {
          examStore.setMark(exam, student.id, sub, "A", profile?.email ?? "import");
          marksCount++;
        } else if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= cfg.maxMarks) {
          examStore.setMark(exam, student.id, sub, value, profile?.email ?? "import");
          marksCount++;
        }
      });
    });

    // Record Audit Log for Batch Upload
    void logAuditEvent("LIST_UPLOAD", {
      source,
      count: counts.added + counts.updated,
      added: counts.added,
      updated: counts.updated,
      marksImported: marksCount,
      semester: overrideMeta?.semester ?? uploadSemester,
      branch: overrideMeta?.branch ?? uploadBranch,
      section: overrideMeta?.section ?? uploadSection,
      adminEmail: profile?.email,
    });

    if (!counts.added && !counts.updated && !marksCount) {
      toast.error("Nothing new to import — every row already matches existing student data.");
      return;
    }

    const parts = [`${counts.added} students added`, `${counts.updated} updated`, `${marksCount} marks imported`];
    if (unmatched) parts.push(`${unmatched} rows unmatched`);
    toast.success(`${source} import complete: ${parts.join(" · ")}`);
  };

  const handleAdminListUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        const ws = firstSheet ? wb.Sheets[firstSheet] : undefined;
        if (!ws) {
          toast.error("Excel file has no worksheet");
          return;
        }
        const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
        applyInstituteRows(parseInstituteSheet(grid), `Admin Batch Upload (${file.name})`, {
          semester: uploadSemester,
          branch: uploadBranch,
          section: uploadSection,
        });
      } catch {
        toast.error("Could not parse file. Please verify CSV or Excel structure.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGeneralImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        const ws = firstSheet ? wb.Sheets[firstSheet] : undefined;
        if (!ws) {
          toast.error("Excel file has no worksheet");
          return;
        }
        const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
        applyInstituteRows(parseInstituteSheet(grid), "Excel");
      } catch {
        toast.error("Could not parse Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePdfImport = async (file: File) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjs: any = await import("pdfjs-dist");
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "4.10.38"}/build/pdf.worker.min.mjs`;
      }
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const lines: string[] = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const rowMap = new Map<number, { x: number; str: string }[]>();
        for (const item of content.items as Array<{ str: string; transform: number[] }>) {
          if (!item.str.trim()) continue;
          const y = Math.round(item.transform[5] / 2);
          const arr = rowMap.get(y) ?? [];
          arr.push({ x: item.transform[4], str: item.str });
          rowMap.set(y, arr);
        }
        for (const [, arr] of [...rowMap.entries()].sort((a, b) => b[0] - a[0])) {
          arr.sort((a, b) => a.x - b.x);
          lines.push(arr.map((item) => item.str).join(" "));
        }
      }
      applyInstituteRows(parsePdfResultLines(lines), "PDF");
    } catch {
      toast.error("Could not parse PDF file");
    }
  };

  const downloadStudentTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        "Sr. No.": 1,
        "Name": "Aarav Sharma",
        "Father Name": "Ramesh Sharma",
        "Branch": "CSE",
        "Section": "B1",
        "Roll Number": "B1-101",
        "BT205": 18,
        "BT203": 17,
        "BT204": "A",
        "BT102": 19,
        "BT201": 20,
      },
      {
        "Sr. No.": 2,
        "Name": "Pooja Patel",
        "Father Name": "Suresh Patel",
        "Branch": "CSE",
        "Section": "B1",
        "Roll Number": "B1-102",
        "BT205": 16,
        "BT203": 18,
        "BT204": 15,
        "BT102": 18,
        "BT201": 19,
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student List");
    XLSX.writeFile(workbook, "Student_List_Template.xlsx");
  };

  // Submit / Save Marks Handler
  const handleSaveAndSubmitMarks = async () => {
    if (!isFilterReady) {
      toast.error("Please select Exam Type, Section, and Subject before saving marks");
      return;
    }
    if (!isAuthorized) {
      toast.error(
        `Unauthorized: You do not have approved access for ${subjectFilter} in Section ${section}.`
      );
      return;
    }
    const staffId = profile?.id ?? "employee-001";
    const staffEmail = profile?.email ?? "staff@smart.edu";
    const staffName = profile?.full_name ?? staffEmail;

    await logAuditEvent("MARKS_UPDATE", {
      staffId,
      staffEmail,
      staffName,
      role: profile?.role ?? "employee",
      examType: exam,
      subjectCode: subjectFilter,
      subjectName: SUBJECT_NAMES[subjectFilter as Subject] ?? subjectFilter,
      section: section,
      count: filtered.length,
      timestamp: new Date().toISOString(),
    });

    toast.success(
      `Marks submitted and saved! Exam: ${EXAM_LABELS[exam]}, Section: ${section}, Subject: ${subjectFilter}. Audit log created.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Marks Entry</h1>
            <Badge
              variant="outline"
              className={
                isAdmin
                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                  : "border-sky-500/40 text-sky-600 bg-sky-500/10"
              }
            >
              {isAdmin ? "Admin Full Access" : "Staff Marks Entry Only"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Edit student details, batch upload lists, adjust exam configurations, or edit student marks."
              : "Enter marks for assigned exam and subjects. Student names and roll numbers are read-only."}
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save / Submit Marks Button (Always Visible to both Staff & Admin) */}
          <Button
            onClick={handleSaveAndSubmitMarks}
            disabled={!isFilterReady || !isAuthorized || filtered.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-semibold disabled:opacity-50"
          >
            <Send className="size-4" /> Save / Submit Marks
          </Button>

          {/* Staff Self-Claim Subject Button */}
          {isEmployee && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClaimModal(true)}
              className="border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 gap-1.5 cursor-pointer font-medium"
            >
              <BookOpen className="size-4" /> Claim My Subjects
            </Button>
          )}

          {/* Admin Only Actions */}
          {isAdmin && (
            <>
              <ConfigDialog exam={exam} />
              <AddStudentDialog />
              <input
                ref={importExcelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleGeneralImport(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => importExcelInputRef.current?.click()}
                className="cursor-pointer gap-1.5"
              >
                <Upload className="size-4" /> Import Excel
              </Button>

              <input
                ref={importPdfInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePdfImport(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => importPdfInputRef.current?.click()}
                className="cursor-pointer gap-1.5"
              >
                <FileText className="size-4" /> Import PDF
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={downloadStudentTemplate} className="cursor-pointer gap-1.5">
            <Download className="size-4" /> Template
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="cursor-pointer gap-1.5">
            <Download className="size-4" /> Export Excel
          </Button>

          {/* Destructive Admin Actions */}
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Clear marks for all ${state.students.length} students in Mid Sem and PUT? Student details will remain.`
                    )
                  ) {
                    examStore.clearAllMarks();
                    void logAuditEvent("MARKS_CLEAR", { admin: profile?.email, timestamp: new Date().toISOString() });
                    toast.success("All exam marks cleared; student list kept");
                  }
                }}
              >
                <Eraser className="size-4 mr-1.5" /> Clear marks
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={state.students.length === 0}
                onClick={() => {
                  if (
                    confirm(
                      `Remove all ${state.students.length} students and their marks from this saved list? This cannot be undone.`
                    )
                  ) {
                    examStore.deleteAllStudents();
                    void logAuditEvent("STUDENT_LIST_DELETE", { admin: profile?.email, timestamp: new Date().toISOString() });
                    toast.success("Student list removed");
                  }
                }}
              >
                <Trash2 className="size-4 mr-1.5" /> Remove student list
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 5. Admin Special Facility: Batch Student List Upload */}
      {isAdmin && (
        <Card className="border border-[#d1d5db] bg-white rounded-[2px] shadow-xs overflow-hidden">
          <CardHeader className="py-2.5 px-4 border-b border-[#002244] bg-[#003366] text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-amber-300" />
                <CardTitle className="text-xs sm:text-sm font-serif font-bold text-white tracking-wide uppercase">
                  Institutional Roster Import: Batch Upload Student Register
                </CardTitle>
                <Badge className="text-[9px] bg-[#b91c1c] text-white border-0 font-bold rounded-[2px]">Admin Only</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadStudentTemplate}
                className="text-xs h-7 gap-1 text-blue-100 hover:text-white hover:bg-white/10 rounded-[2px]"
              >
                <Download className="size-3" /> Download Sample CSV/Excel Template
              </Button>
            </div>
            <CardDescription className="text-[11px] text-blue-100 mt-0.5">
              Upload class roster CSV or Excel files. Students will be automatically assigned to the selected Semester, Branch, and Section.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-3 flex flex-wrap items-end gap-3 bg-[#f8f9fa]">
            {/* Semester Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#003366] uppercase">Semester</label>
              <Select value={String(uploadSemester)} onValueChange={(v) => setUploadSemester(Number(v))}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-[#d1d5db] rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={String(sem)}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#003366] uppercase">Branch</label>
              <Select value={uploadBranch} onValueChange={setUploadBranch}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-[#d1d5db] rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#003366] uppercase">Section</label>
              <Select value={uploadSection} onValueChange={(v) => setUploadSection(v as Section)}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-[#d1d5db] rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      Section {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Upload Button */}
            <div>
              <input
                ref={adminUploadInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAdminListUpload(f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                onClick={() => adminUploadInputRef.current?.click()}
                className="h-8 gap-1.5 cursor-pointer bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs rounded-[2px]"
              >
                <Upload className="size-3.5" /> Upload Student List (CSV/Excel)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Staff Self-Claim Subject System (Automated Workflow) */}
      {isEmployee && userApprovedClaims.length === 0 ? (
        <SubjectClaimPanel
          onSelectApproved={(e, s, sub) => {
            setExam(e);
            setSection(s);
            setSubjectFilter(sub);
          }}
        />
      ) : (
        <>
          {/* Quick-Access Authorized Subjects Banner for Staff */}
          {isEmployee && userApprovedClaims.length > 0 && (
            <div className="p-3 rounded-[2px] border border-[#15803d]/40 bg-[#f0fdf4] flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#15803d] flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#15803d]" />
                  <span>Authorized Evaluation Courses:</span>
                </span>
                {userApprovedClaims.map((ac) => {
                  const isActive =
                    exam === ac.examType && section === ac.section && subjectFilter === ac.subject;
                  return (
                    <Button
                      key={ac.id}
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      onClick={() => {
                        setExam(ac.examType);
                        setSection(ac.section);
                        setSubjectFilter(ac.subject);
                      }}
                      className={`h-7 text-xs gap-1.5 cursor-pointer font-bold rounded-[2px] ${
                        isActive
                          ? "bg-[#003366] hover:bg-[#002244] text-white shadow-xs"
                          : "bg-white border-[#d1d5db] text-[#003366] hover:bg-slate-50"
                      }`}
                    >
                      <span>
                        {ac.subject} ({ac.section})
                      </span>
                      <span className="text-[10px] opacity-80 uppercase font-mono">
                        [{EXAM_LABELS[ac.examType]}]
                      </span>
                    </Button>
                  );
                })}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowClaimModal(true)}
                className="h-7 text-xs text-[#003366] hover:text-[#002244] hover:bg-[#003366]/10 cursor-pointer font-bold rounded-[2px]"
              >
                + Claim Another Course
              </Button>
            </div>
          )}

          {/* 4. Filter & Selection Bar (Strict Filter Gate: Exam Type, Section, Subject) */}
          <Card className="border border-[#d1d5db] bg-white rounded-[2px] shadow-xs">
            <CardContent className="p-3.5 flex flex-wrap items-center gap-4">
              {/* Exam Type Selector (Mid Sem vs PUT) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider">
                    1. Exam Type
                  </span>
                  <span className="text-[10px] text-[#15803d] font-bold">
                    ✓ {EXAM_LABELS[exam]}
                  </span>
                </div>
                <Tabs value={exam} onValueChange={(v) => setExam(v as ExamType)}>
                  <TabsList className="h-8 bg-slate-200 p-0.5 rounded-[2px]">
                    {EXAMS.map((e) => (
                      <TabsTrigger key={e} value={e} className="text-xs font-bold px-3 h-7 rounded-[2px] data-[state=active]:bg-[#003366] data-[state=active]:text-white cursor-pointer">
                        {EXAM_LABELS[e]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="h-8 w-px bg-[#d1d5db] hidden md:block mt-3" />

              {/* Section Selector (Mandatory, No "All" Option) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider">
                    2. Section
                  </span>
                  {section ? (
                    <span className="text-[10px] text-[#15803d] font-bold">
                      ✓ Section {section}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 px-1 text-[#b91c1c] border-[#b91c1c]/40 font-bold rounded-[2px]">
                      Required
                    </Badge>
                  )}
                </div>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger
                    className={`w-[150px] h-8 text-xs bg-white cursor-pointer rounded-[2px] font-medium ${
                      !section ? "border-[#b91c1c] ring-1 ring-[#b91c1c]/30" : "border-[#d1d5db]"
                    }`}
                  >
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => {
                      const hasAuthorized =
                        isEmployee &&
                        userApprovedClaims.some((c) => c.section === s && c.examType === exam);
                      return (
                        <SelectItem key={s} value={s} className="cursor-pointer text-xs">
                          <span>Section {s}</span>
                          {hasAuthorized && (
                            <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              (✓)
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-8 w-px bg-border hidden md:block mt-3" />

              {/* Subject Selector (Mandatory, No "All" Option) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    3. Subject
                  </span>
                  {subjectFilter ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[150px]">
                      ✓ {subjectFilter}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-600 border-amber-500/40">
                      Required
                    </Badge>
                  )}
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger
                    className={`w-[240px] h-9 text-xs bg-background cursor-pointer ${
                      !subjectFilter ? "border-amber-500/60 ring-1 ring-amber-500/30" : "border-border"
                    }`}
                  >
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => {
                      const isAuth =
                        isEmployee &&
                        userApprovedClaims.some(
                          (c) => c.subject === s && c.section === section && c.examType === exam
                        );
                      return (
                        <SelectItem key={s} value={s} className="cursor-pointer text-xs">
                          <span className="font-semibold">{s}</span> — {SUBJECT_NAMES[s]}
                          {isAuth && (
                            <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              (✓ Authorized)
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input (Active when filters are ready) */}
              {isFilterReady && (
                <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Search Students
                  </span>
                  <div className="relative">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by student name or roll..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 text-xs bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Reset / Change Filter button if both are chosen */}
              {isFilterReady && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSection("");
                    setSubjectFilter("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground h-9 mt-auto cursor-pointer"
                >
                  Change Filters
                </Button>
              )}

              {/* Info Badges */}
              <div className="flex items-center gap-2 mt-auto pb-0.5 ml-auto">
                <Badge variant="secondary" className="gap-1.5 h-8">
                  <Save className="size-3 text-emerald-500" /> Auto-save active
                </Badge>
                <Badge variant="outline" className="h-8">
                  Max: {cfg.maxMarks} · Pass: {cfg.passPct}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 7. Strict Filter Gate: Empty State vs Unauthorized Lock vs Student Marks Table */}
          {!isFilterReady ? (
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-8 sm:p-14 text-center shadow-xs">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="inline-flex size-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm mx-auto">
                  <BookOpen className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Please select Exam Type, Section, and Subject to enter marks
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Marks entry is strictly gated by Section and Subject to ensure clean data entry and prevent accidental cross-subject edits.
                  </p>
                </div>

                {/* Visual Step Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left text-xs">
                  <div className="p-3.5 rounded-xl border bg-background flex flex-col gap-1 border-emerald-500/40 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground text-[11px]">1. Exam Type</span>
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </div>
                    <span className="font-bold text-foreground">{EXAM_LABELS[exam]}</span>
                    <span className="text-[10px] text-muted-foreground">Ready</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border bg-background flex flex-col gap-1 shadow-xs transition-colors ${
                      section
                        ? "border-emerald-500/40"
                        : "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground text-[11px]">2. Section</span>
                      {section ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-amber-500" />
                      )}
                    </div>
                    <span className="font-bold text-foreground">
                      {section ? `Section ${section}` : "Pending"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {section ? "Selected" : "Choose Section above"}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border bg-background flex flex-col gap-1 shadow-xs transition-colors ${
                      subjectFilter
                        ? "border-emerald-500/40"
                        : "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground text-[11px]">3. Subject</span>
                      {subjectFilter ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-amber-500" />
                      )}
                    </div>
                    <span className="font-bold text-foreground truncate">
                      {subjectFilter ? `${subjectFilter}` : "Pending"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {subjectFilter ? "Selected" : "Choose Subject above"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ) : !isAuthorized ? (
            <Card className="border-dashed border-2 border-amber-500/40 bg-amber-50/10 dark:bg-amber-950/20 p-8 sm:p-14 text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-3.5">
                <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    Subject Access Restricted
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    You are not authorized to enter marks for <strong>{subjectFilter}</strong> (
                    {SUBJECT_NAMES[subjectFilter as Subject]}) in <strong>Section {section}</strong>.
                    Only authorized faculty members can input marks for this course.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={() => setShowClaimModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 cursor-pointer gap-1.5 shadow-sm"
                  >
                    <BookOpen className="size-4" />
                    <span>Claim Access for {subjectFilter} (Section {section})</span>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            /* Focused Student Marks Table with ONLY ONE single editable marks column */
            <Card className="overflow-hidden shadow-xs border border-[#d1d5db] bg-white rounded-[2px]">
              {/* Active Scope Summary Banner */}
              <div className="px-4 py-2.5 border-b border-[#d1d5db] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-[#003366] text-white font-mono text-[11px] rounded-[2px] font-bold">Section {section}</Badge>
                  <span className="text-slate-400">·</span>
                  <span className="font-serif font-bold text-[#003366] text-sm">
                    {subjectFilter} — {SUBJECT_NAMES[subjectFilter as Subject]}
                  </span>
                  <span className="text-slate-400">·</span>
                  <Badge variant="outline" className="text-[11px] border-[#d1d5db] rounded-[2px]">
                    {EXAM_LABELS[exam]} (Max: {cfg.maxMarks})
                  </Badge>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 font-medium">{filtered.length} candidates registered</span>
                </div>

                <Button
                  onClick={handleSaveAndSubmitMarks}
                  size="sm"
                  className="bg-[#15803d] hover:bg-[#166534] text-white gap-1.5 h-8 text-xs font-bold rounded-[2px] cursor-pointer shadow-xs"
                >
                  <Send className="size-3.5" /> Save / Submit Marks
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-[#003366] text-white font-serif uppercase tracking-wider sticky top-0 border-b border-[#002244]">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-bold w-12 border-r border-[#002244]">Sr.</th>
                      <th className="text-left px-3 py-2.5 font-bold min-w-[110px] border-r border-[#002244]">Roll No</th>
                      <th className="text-left px-3 py-2.5 font-bold min-w-[170px] border-r border-[#002244]">Student Name</th>
                      <th className="text-center px-3 py-2.5 font-bold w-16 border-r border-[#002244]">Sec</th>

                      {/* ONLY ONE EDITABLE MARKS COLUMN */}
                      <th className="text-center px-4 py-2.5 font-bold min-w-[140px] bg-[#b91c1c] text-white border-x-2 border-[#990000]">
                        <div className="font-bold text-white text-xs">
                          {subjectFilter} Marks
                        </div>
                        <div className="text-[10px] font-normal normal-case text-amber-200">
                          {SUBJECT_NAMES[subjectFilter as Subject]} (Max {cfg.maxMarks})
                        </div>
                      </th>

                      <th className="text-center px-3 py-2.5 font-bold border-r border-[#002244] min-w-[65px]">Total</th>
                      <th className="text-center px-3 py-2.5 font-bold border-r border-[#002244] min-w-[60px]">%</th>
                      <th className="text-center px-3 py-2.5 font-bold border-r border-[#002244] min-w-[55px]">Grade</th>
                      <th className="text-center px-3 py-2.5 font-bold border-r border-[#002244] min-w-[65px]">Status</th>
                      <th className="text-center px-3 py-2.5 font-bold min-w-[70px]">Sec Rank</th>
                      {isAdmin && <th className="text-center px-2 py-2.5 font-bold w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1d5db]">
                    {filtered.map((r, idx) => (
                      <tr key={r.student.id} className="odd:bg-white even:bg-[#f9fafb] hover:bg-[#e6eef5] transition-colors">
                        {/* Sr. No */}
                        <td className="px-3 py-2 text-slate-500 tabular-nums font-mono text-xs border-r border-[#e2e8f0]">{idx + 1}</td>

                        {/* Student Roll No (Strictly Read-Only) */}
                        <td className="px-3 py-2 font-mono text-xs font-bold text-[#003366] border-r border-[#e2e8f0]">
                          <Badge variant="outline" className="font-mono text-xs rounded-[2px] border-[#cbd5e1]">
                            {r.student.roll}
                          </Badge>
                        </td>

                        {/* Student Name: Strictly Read-Only */}
                        <td className="px-3 py-2 border-r border-[#e2e8f0]">
                          <span className="font-bold text-[#111827] text-xs">{r.student.name}</span>
                        </td>

                        {/* Section: Strictly Read-Only */}
                        <td className="px-2 py-2 text-center border-r border-[#e2e8f0]">
                          <Badge variant="secondary" className="font-mono text-[11px] rounded-[2px]">
                            {r.student.section}
                          </Badge>
                        </td>

                        {/* Single Subject Marks Column (Editable) */}
                        <MarkCell
                          examType={exam}
                          studentId={r.student.id}
                          subject={subjectFilter as Subject}
                          value={r.marks[subjectFilter as Subject] ?? null}
                          max={cfg.maxMarks}
                          user={profile?.email ?? "employee"}
                          rowIndex={idx}
                          colIndex={0}
                        />

                        {/* Results Metrics */}
                        <td className="text-center font-bold tabular-nums text-[#003366] border-r border-[#e2e8f0]">{r.total}</td>
                        <td className="text-center tabular-nums font-semibold border-r border-[#e2e8f0]">{r.pct.toFixed(1)}%</td>
                        <td className="text-center border-r border-[#e2e8f0]">
                          <Badge variant={r.grade === "F" ? "destructive" : "secondary"} className="text-[10px] rounded-[2px] font-bold">
                            {r.grade}
                          </Badge>
                        </td>
                        <td className="text-center border-r border-[#e2e8f0]">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] ${
                              r.pass
                                ? "bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/30"
                                : "bg-[#b91c1c]/10 text-[#b91c1c] border border-[#b91c1c]/30"
                            }`}
                          >
                            {r.pass ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td className="text-center font-bold tabular-nums text-[#003366]">#{r.sectionRank}</td>

                        {/* Admin Only Delete Row */}
                        {isAdmin && (
                          <td className="text-center px-2 py-2">
                            <button
                              type="button"
                              title="Delete student"
                              onClick={() => {
                                if (confirm(`Delete student ${r.student.name} (${r.student.roll})?`)) {
                                  examStore.deleteStudent(r.student.id);
                                  void logAuditEvent("STUDENT_DELETE", { roll: r.student.roll, name: r.student.name });
                                  toast.success("Student removed");
                                }
                              }}
                              className="p-1 rounded hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={isAdmin ? 11 : 10}
                          className="text-center py-12 text-muted-foreground text-sm"
                        >
                          No students found in Section {section} matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Claim Modal for Staff */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subject Access Request</DialogTitle>
          </DialogHeader>
          <SubjectClaimPanel
            onSelectApproved={(e, s, sub) => {
              setExam(e);
              setSection(s);
              setSubjectFilter(sub);
              setShowClaimModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarkCell({
  examType,
  studentId,
  subject,
  value,
  max,
  user,
  rowIndex,
  colIndex,
}: {
  examType: ExamType;
  studentId: string;
  subject: Subject;
  value: MarkValue | null;
  max: number;
  user: string;
  rowIndex: number;
  colIndex: number;
}) {
  const [draft, setDraft] = useState<string>(value === null ? "" : String(value));
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft(value === null ? "" : String(value));
  }, [value]);

  const commitValue = (valToCommit: string) => {
    const trimmed = valToCommit.trim().toUpperCase();
    if (trimmed === "") {
      examStore.setMark(examType, studentId, subject, null, user);
      setError(false);
      return;
    }
    if (trimmed === "A") {
      examStore.setMark(examType, studentId, subject, "A", user);
      setError(false);
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n) || n < 0 || n > max) {
      setError(true);
      toast.error(`Marks 0–${max} ya 'A' hone chahiye`);
      setDraft(value === null ? "" : String(value));
      setTimeout(() => setError(false), 1200);
      return;
    }
    examStore.setMark(examType, studentId, subject, n, user);
    setError(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const upper = raw.toUpperCase().trim();
    if (upper === "" || raw === "") {
      setDraft("");
      commitValue("");
      return;
    }
    // Instant 'A' support if 'A' is typed anywhere
    if (upper.includes("A")) {
      setDraft("A");
      commitValue("A");
      return;
    }
    // Only allow digits
    const digitsOnly = upper.replace(/\D/g, "");
    if (digitsOnly) {
      let n = Number(digitsOnly);
      if (n > max) {
        // If typing over existing value, check if last 2 digits or last 1 digit fit
        const lastTwo = Number(digitsOnly.slice(-2));
        const lastOne = Number(digitsOnly.slice(-1));
        if (lastTwo <= max) {
          n = lastTwo;
        } else if (lastOne <= max) {
          n = lastOne;
        } else {
          toast.error(`Marks 0–${max} ke beech hone chahiye`);
          return;
        }
      }
      const valStr = String(n);
      setDraft(valStr);
      commitValue(valStr);
      return;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Instant 'A' support on direct key press
    if (e.key === "a" || e.key === "A") {
      e.preventDefault();
      setDraft("A");
      commitValue("A");
      return;
    }
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      commitValue(draft);
      const target = document.querySelector<HTMLInputElement>(
        `input[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`
      );
      if (target) {
        target.focus();
        target.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      commitValue(draft);
      const target = document.querySelector<HTMLInputElement>(
        `input[data-row="${rowIndex - 1}"][data-col="${colIndex}"]`
      );
      if (target) {
        target.focus();
        target.select();
      }
    } else if (e.key === "ArrowRight") {
      const input = e.currentTarget;
      if (
        input.selectionStart === input.value.length ||
        (input.selectionStart === 0 && input.selectionEnd === input.value.length)
      ) {
        const target = document.querySelector<HTMLInputElement>(
          `input[data-row="${rowIndex}"][data-col="${colIndex + 1}"]`
        );
        if (target) {
          e.preventDefault();
          target.focus();
          target.select();
        }
      }
    } else if (e.key === "ArrowLeft") {
      const input = e.currentTarget;
      if (
        input.selectionStart === 0 ||
        (input.selectionStart === 0 && input.selectionEnd === input.value.length)
      ) {
        const target = document.querySelector<HTMLInputElement>(
          `input[data-row="${rowIndex}"][data-col="${colIndex - 1}"]`
        );
        if (target) {
          e.preventDefault();
          target.focus();
          target.select();
        }
      }
    }
  };

  const isAbsent = draft.trim().toUpperCase() === "A";

  return (
    <td
      className="p-1 text-center cursor-pointer"
      onClick={() => {
        const target = document.querySelector<HTMLInputElement>(
          `input[data-row="${rowIndex}"][data-col="${colIndex}"]`
        );
        if (target) {
          target.focus();
          target.select();
        }
      }}
    >
      <input
        type="text"
        inputMode="text"
        data-row={rowIndex}
        data-col={colIndex}
        data-subject={subject}
        value={draft}
        onClick={(e) => {
          e.stopPropagation();
          e.currentTarget.select();
        }}
        onFocus={(e) => e.currentTarget.select()}
        onChange={handleChange}
        onBlur={() => commitValue(draft)}
        onKeyDown={handleKeyDown}
        className={`w-16 h-8 text-center px-1.5 py-1 rounded-[2px] border tabular-nums text-xs font-bold transition cursor-pointer focus:cursor-text focus:outline-none focus:ring-1 ${
          isAbsent
            ? "text-[#b91c1c] font-black bg-rose-50 border-[#b91c1c] focus:ring-[#b91c1c]"
            : error
            ? "border-[#b91c1c] ring-1 ring-[#b91c1c] bg-white"
            : "bg-white border-[#cbd5e1] hover:border-[#003366] focus:border-[#003366] focus:ring-[#003366] text-[#003366]"
        }`}
      />
    </td>
  );
}

function ConfigDialog({ exam }: { exam: ExamType }) {
  const cfg = useExamStore((s) => s.config[exam]);
  const [maxMarks, setMaxMarks] = useState(cfg.maxMarks);
  const [passPct, setPassPct] = useState(cfg.passPct);
  const [open, setOpen] = useState(false);

  const save = () => {
    if (maxMarks <= 0 || passPct < 0 || passPct > 100) {
      toast.error("Invalid values");
      return;
    }
    examStore.setMaxMarks(exam, maxMarks);
    examStore.setPassPct(exam, passPct);
    void logAuditEvent("CONFIG_UPDATE", { exam, maxMarks, passPct });
    toast.success("Settings updated · results recalculated");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setMaxMarks(cfg.maxMarks);
          setPassPct(cfg.passPct);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
          <Settings2 className="size-4" /> Exam Config
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{EXAM_LABELS[exam]} Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Max marks per subject</label>
            <Input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Total max = {maxMarks * SUBJECTS.length} across {SUBJECTS.length} subjects
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pass percentage</label>
            <Input
              type="number"
              value={passPct}
              onChange={(e) => setPassPct(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Students need ≥ {((passPct / 100) * maxMarks).toFixed(1)} in every subject AND overall {passPct}%
            </p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-xs">
            <AlertCircle className="size-4 text-warning-foreground shrink-0 mt-0.5" />
            <span>Changing config instantly recalculates every result, grade, and rank.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full cursor-pointer"
            onClick={() => {
              examStore.reseed();
              void logAuditEvent("RESEED_STUDENTS", { count: 100 });
              toast.success("Reset 100 students with fresh data");
              setOpen(false);
            }}
          >
            <RotateCcw className="size-4 mr-1.5" /> Reseed 100 random students
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={save} className="cursor-pointer">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextCell({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  const commit = () => {
    const t = draft.trim();
    if (!t) {
      setDraft(value);
      return;
    }
    if (t !== value) onCommit(t);
  };
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onClick={(e) => e.currentTarget.select()}
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
      className={`px-2 py-1 rounded border border-border/50 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background focus:outline-none text-sm cursor-pointer focus:cursor-text ${
        className ?? ""
      }`}
    />
  );
}

function AddStudentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [section, setSection] = useState<Section>("B1");

  const save = () => {
    if (!name.trim() || !roll.trim()) {
      toast.error("Name and Roll No are required");
      return;
    }
    const ok = examStore.addStudent({
      name: name.trim(),
      roll: roll.trim(),
      enrollment: enrollment.trim() || roll.trim(),
      semester: 2,
      section,
      branch: "CSE",
      course: "B.Tech CSE",
    });
    if (!ok) {
      toast.error("Roll Number already exists");
      return;
    }
    void logAuditEvent("STUDENT_ADD", { name: name.trim(), roll: roll.trim(), section });
    toast.success("Student added successfully");
    setName("");
    setRoll("");
    setEnrollment("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-4 mr-1.5" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Roll No</label>
            <Input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. B1-105" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Enrollment</label>
            <Input value={enrollment} onChange={(e) => setEnrollment(e.target.value)} placeholder="e.g. 0246AL2510105" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Section</label>
            <Select value={section} onValueChange={(v) => setSection(v as Section)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    Section {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Add Student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}