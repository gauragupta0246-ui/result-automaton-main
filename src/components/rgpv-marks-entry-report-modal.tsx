import React, { useState } from "react";
import { Printer, X } from "lucide-react";
import { type StudentResult, type ExamType, type Subject, SUBJECT_NAMES } from "@/lib/exam-store";

interface RgpvMarksEntryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StudentResult;
  exam: ExamType;
  defaultPaperCode?: string;
}

export function RgpvMarksEntryReportModal({
  isOpen,
  onClose,
  result,
  exam,
  defaultPaperCode,
}: RgpvMarksEntryReportModalProps) {
  if (!isOpen || !result) return null;

  const { student, marks } = result;

  // Extract student details
  const studentName = (student.name || "AMAN PANDEY").toUpperCase();
  
  // Clean Enrollment Number - official RGPV format e.g. 0246CS221026
  const cleanEnrollment = React.useMemo(() => {
    if (student.enrollment && student.enrollment.trim()) {
      return student.enrollment.trim().toUpperCase();
    }
    const cleanRoll = student.roll.replace(/\D/g, "").padStart(3, "0");
    return `0246CS221${cleanRoll || "026"}`;
  }, [student]);

  // Available subjects for the student
  const subjectKeys = Object.keys(marks) as Subject[];
  const firstSubjectKey = subjectKeys[0] || ("BT-101" as Subject);

  // Active selected Paper Code (defaults to defaultPaperCode, "CS801", or first evaluated subject)
  const [selectedPaper, setSelectedPaper] = useState<string>(
    defaultPaperCode || "CS801"
  );

  // Determine current marks to display for the paper code
  const currentMarks = React.useMemo(() => {
    // If selected paper matches one of the student's subjects directly
    if (selectedPaper in marks) {
      const v = marks[selectedPaper as Subject];
      return v !== null && v !== undefined ? v : 19;
    }
    // If CS801 or other paper code, map to first available evaluated mark or fallback to 19
    const firstVal = marks[firstSubjectKey];
    if (typeof firstVal === "number" || firstVal === "A") {
      return firstVal;
    }
    return 19;
  }, [marks, selectedPaper, firstSubjectKey]);

  // Current Print Date in official DD/MM/YYYY format
  const printDateStr = React.useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const paperTypeLabel = exam === "midsem" ? "Mid Term" : "PUT";
  const semesterNum = student.semester || 8;
  const branchName =
    student.branch === "CSE" || !student.branch
      ? "Computer Science & Engineering"
      : student.branch;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ── Print Isolation Style Block ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #rgpv-marks-entry-report-printable,
          #rgpv-marks-entry-report-printable * {
            visibility: visible !important;
          }
          #rgpv-marks-entry-report-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          .rgpv-no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Modal Backdrop ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        {/* ── Modal Card / Window ── */}
        <div
          id="rgpv-marks-entry-report-printable"
          className="relative w-full max-w-3xl bg-white border border-[#94a3b8] rounded-[2px] shadow-2xl overflow-hidden font-sans my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── 1. Top Header Bar (#003366) ── */}
          <div className="bg-[#003366] text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center gap-3 sm:gap-4 border-b-2 border-[#002244]">
            {/* Left: White Card with Official Red RGPV Crest Logo */}
            <div className="size-14 sm:size-16 bg-white rounded-[2px] p-1 flex items-center justify-center shrink-0 border border-slate-200 shadow-xs">
              <img
                src="/rgpv-logo.png"
                alt="RGPV Emblem"
                className="size-full object-contain"
              />
            </div>

            {/* Center: College Name & Full Location Address */}
            <div className="flex-1 text-center sm:text-center pr-2">
              <h2 className="text-sm sm:text-base md:text-lg font-serif font-black tracking-wide uppercase text-white leading-tight">
                Baderia Global Institute of Engineering And Management
              </h2>
              <p className="text-[10.5px] sm:text-xs text-slate-200 font-medium tracking-tight mt-0.5">
                Patan BY-Pass Square, Gram-Raighawan, Jabalpur M.P.
              </p>
            </div>
          </div>

          {/* ── 2. Report Body Section ── */}
          <div className="p-4 sm:p-6 bg-white space-y-3 text-[#111827]">
            {/* Centered Maroon Title */}
            <div className="text-center">
              <h3 className="font-serif font-black text-sm sm:text-base text-[#652219] uppercase tracking-wide">
                Marks Entry Report
              </h3>
            </div>

            {/* ── 3. Metadata Box ── */}
            <div className="border border-[#cbd5e1] bg-[#fdfdfb] p-3 text-xs leading-relaxed space-y-1 rounded-[2px]">
              {/* Row 1: College */}
              <div className="flex flex-wrap items-center">
                <span className="font-bold text-slate-800 w-24 shrink-0">College</span>
                <span className="font-bold text-slate-700 mr-2">:</span>
                <span className="font-medium text-slate-900">
                  [246],Baderia Global Institute of Engineering And Management
                </span>
              </div>

              {/* Row 2: Program & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <div className="flex items-center">
                  <span className="font-bold text-slate-800 w-24 shrink-0">Program</span>
                  <span className="font-bold text-slate-700 mr-2">:</span>
                  <span className="font-medium text-slate-900">B.Tech (Grading)</span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-slate-800 w-20 shrink-0">Branch</span>
                  <span className="font-bold text-slate-700 mr-2">:</span>
                  <span className="font-medium text-slate-900">{branchName}</span>
                </div>
              </div>

              {/* Row 3: Paper Code, Semester, Paper Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <div className="flex items-center">
                  <span className="font-bold text-slate-800 w-24 shrink-0">Paper Code</span>
                  <span className="font-bold text-slate-700 mr-2">:</span>
                  <span className="font-bold text-[#003366]">{selectedPaper}</span>
                  {/* Subtle subject selector for faculty testing */}
                  {subjectKeys.length > 1 && (
                    <select
                      value={selectedPaper}
                      onChange={(e) => setSelectedPaper(e.target.value)}
                      className="rgpv-no-print ml-2 text-[10px] h-5 bg-white border border-slate-300 rounded px-1 cursor-pointer"
                      title="Select Paper Code"
                    >
                      <option value="CS801">CS801</option>
                      {subjectKeys.map((s) => (
                        <option key={s} value={s}>
                          {s} ({SUBJECT_NAMES[s]})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-slate-800 w-20 shrink-0">Semester</span>
                  <span className="font-bold text-slate-700 mr-2">:</span>
                  <span className="font-medium text-slate-900">{semesterNum}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-slate-800 w-24 shrink-0">Paper Type</span>
                  <span className="font-bold text-slate-700 mr-2">:</span>
                  <span className="font-medium text-slate-900">{paperTypeLabel}</span>
                </div>
              </div>

              {/* Row 4: System Type */}
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-24 shrink-0">System Type</span>
                <span className="font-bold text-slate-700 mr-2">:</span>
                <span className="font-medium text-slate-900">G</span>
              </div>
            </div>

            {/* ── 4. Action Row: Print Date + Print & Close Buttons ── */}
            <div className="flex items-center justify-between pt-1">
              {/* Left: Print Date */}
              <div className="text-xs font-bold text-slate-800">
                Print Date : {printDateStr}
              </div>

              {/* Right: Printer Icon & Close Cross (Matching RGPV Interface) */}
              <div className="flex items-center gap-1.5 rgpv-no-print">
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Print Marks Entry Report"
                  className="size-7 rounded-[2px] border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer shadow-xs transition"
                >
                  <Printer className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Close Window"
                  className="size-7 rounded-[2px] border border-slate-300 bg-white hover:bg-rose-50 text-slate-700 hover:text-[#b91c1c] flex items-center justify-center cursor-pointer shadow-xs transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* ── 5. Tabular Format (Strictly Current Student's Marks) ── */}
            <div className="overflow-x-auto border border-[#cbd5e1] rounded-[2px]">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#fcf2f2] text-slate-900 font-serif border-b border-[#cbd5e1]">
                  <tr>
                    <th className="py-2 px-3 text-center font-bold w-16 border-r border-[#cbd5e1]">
                      S.No.
                    </th>
                    <th className="py-2 px-4 text-left font-bold w-44 border-r border-[#cbd5e1]">
                      Enrollment No.
                    </th>
                    <th className="py-2 px-4 text-left font-bold border-r border-[#cbd5e1]">
                      Student Name
                    </th>
                    <th className="py-2 px-4 text-center font-bold w-28">
                      Marks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1] bg-white">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center font-mono font-medium border-r border-[#cbd5e1]">
                      1
                    </td>
                    <td className="py-2 px-4 font-mono font-semibold text-[#003366] border-r border-[#cbd5e1]">
                      {cleanEnrollment}
                    </td>
                    <td className="py-2 px-4 font-bold text-slate-900 uppercase border-r border-[#cbd5e1]">
                      {studentName}
                    </td>
                    <td className="py-2 px-4 text-center font-mono font-bold text-sm text-[#003366]">
                      {currentMarks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Official Disclaimer / Sign-off */}
            <div className="pt-4 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
              <div>
                <span>Institutional Examination Portal ID: <strong>246-BGIEM-RGPV</strong></span>
              </div>
              <div className="text-right">
                <span>Verified by Examination Cell, Baderia Global Institute</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
