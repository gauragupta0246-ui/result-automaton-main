import { subjectClaimsStore } from "@/lib/subject-claims";
import { logAuditEvent, getConfiguredAdminEmail } from "@/lib/auth";
import type { ExamType, Section, Subject } from "@/lib/exam-store";
import { SUBJECT_NAMES } from "@/lib/exam-store";

export type GrievanceCategory =
  | "Totaling Error"
  | "Re-evaluation"
  | "Marked Absent"
  | "Sessional Marks Missing"
  | "Wrong Subject"
  | "Other";

export interface GrievanceTicket {
  id: string;
  rollNo: string;
  studentName: string;
  section: Section;
  examType: ExamType;
  subjectCode: Subject;
  subjectName: string;
  category: GrievanceCategory;
  description: string;
  attemptNumber: number; // 1 = Tier-1, 2+ = Tier-2
  tier: "Tier-1 (Faculty Evaluator)" | "Tier-2 (Controller of Examinations)";
  assignedToName: string;
  assignedToEmail: string;
  status: "Submitted (Faculty Review)" | "Escalated (Controller Review)" | "Resolved";
  createdAt: string;
}

const STORAGE_KEY = "exam_student_grievances_v1";

export function loadAllGrievances(): GrievanceTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function getStudentGrievances(rollNo: string, examType?: ExamType): GrievanceTicket[] {
  const all = loadAllGrievances();
  return all.filter((g) => {
    const matchRoll = g.rollNo.trim().toLowerCase() === rollNo.trim().toLowerCase();
    const matchExam = examType ? g.examType === examType : true;
    return matchRoll && matchExam;
  });
}

export function countSubjectGrievanceAttempts(
  rollNo: string,
  examType: ExamType,
  subjectCode: Subject
): number {
  const all = loadAllGrievances();
  return all.filter(
    (g) =>
      g.rollNo.trim().toLowerCase() === rollNo.trim().toLowerCase() &&
      g.examType === examType &&
      g.subjectCode === subjectCode
  ).length;
}

export async function submitStudentGrievance(params: {
  rollNo: string;
  studentName: string;
  section: Section;
  examType: ExamType;
  subjectCode: Subject;
  category: GrievanceCategory;
  description: string;
}): Promise<GrievanceTicket> {
  const previousAttempts = countSubjectGrievanceAttempts(
    params.rollNo,
    params.examType,
    params.subjectCode
  );
  const attemptNumber = previousAttempts + 1;

  // 1. Resolve Tier Level
  // Tier-1 (1st attempt): Directly to subject teacher/evaluator
  // Tier-2 (2nd or 3rd attempt): Escalated directly to Controller of Examinations / Admin
  const isTier2 = attemptNumber >= 2;

  let assignedToName = "Prof. Priya Verma (Faculty Evaluator)";
  let assignedToEmail = "staff@smart.edu";

  if (isTier2) {
    assignedToName = "Controller of Examinations / Super Admin";
    assignedToEmail = getConfiguredAdminEmail();
  } else {
    // Look up assigned teacher from claims store
    try {
      const { isAssigned, assignedClaim } = subjectClaimsStore.findAssignment(
        params.examType,
        params.section,
        params.subjectCode
      );
      if (isAssigned && assignedClaim) {
        assignedToName = assignedClaim.staffName;
        assignedToEmail = assignedClaim.staffEmail;
      }
    } catch {}
  }

  const ticket: GrievanceTicket = {
    id: `GRV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    rollNo: params.rollNo,
    studentName: params.studentName,
    section: params.section,
    examType: params.examType,
    subjectCode: params.subjectCode,
    subjectName: SUBJECT_NAMES[params.subjectCode] || params.subjectCode,
    category: params.category,
    description: params.description,
    attemptNumber,
    tier: isTier2 ? "Tier-2 (Controller of Examinations)" : "Tier-1 (Faculty Evaluator)",
    assignedToName,
    assignedToEmail,
    status: isTier2 ? "Escalated (Controller Review)" : "Submitted (Faculty Review)",
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const all = loadAllGrievances();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([ticket, ...all]));
    } catch {}
  }

  // Unified Audit Trail
  void logAuditEvent("STUDENT_GRIEVANCE_SUBMITTED", {
    ticketId: ticket.id,
    rollNo: ticket.rollNo,
    subject: ticket.subjectCode,
    category: ticket.category,
    tier: ticket.tier,
    assignedTo: ticket.assignedToEmail,
    attemptNumber,
  });

  return ticket;
}
