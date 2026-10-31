import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auth";

export interface StudentAccessLogEntry {
  id: string;
  rollNo: string;
  section: string;
  examType: string;
  studentName?: string;
  photoData?: string;
  timestamp: string;
  userAgent?: string;
}

const STORAGE_KEY = "exam_student_access_logs_v1";

function loadLocalLogs(): StudentAccessLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function logStudentAccess(entry: {
  rollNo: string;
  section: string;
  examType: string;
  studentName?: string;
  photoData?: string;
}): Promise<StudentAccessLogEntry> {
  const logItem: StudentAccessLogEntry = {
    id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    rollNo: entry.rollNo,
    section: entry.section,
    examType: entry.examType,
    studentName: entry.studentName,
    photoData: entry.photoData,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  // 1. Save to local storage for fast audit inspection & offline support
  if (typeof window !== "undefined") {
    try {
      const existing = loadLocalLogs();
      const updated = [logItem, ...existing.slice(0, 99)]; // keep latest 100
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  // 2. Insert into Supabase student_access_logs table
  try {
    await supabase.from("student_access_logs").insert({
      roll_no: entry.rollNo,
      section: entry.section,
      exam_type: entry.examType,
      student_name: entry.studentName,
      photo_data: entry.photoData,
      timestamp: logItem.timestamp,
      user_agent: logItem.userAgent,
    });
  } catch (err) {
    console.warn("Could not insert to remote student_access_logs:", err);
  }

  // 3. Register unified audit log event
  void logAuditEvent("STUDENT_PORTAL_ACCESS", {
    rollNo: entry.rollNo,
    section: entry.section,
    examType: entry.examType,
    studentName: entry.studentName,
    hasPhoto: Boolean(entry.photoData),
    timestamp: logItem.timestamp,
  });

  return logItem;
}

export function getStudentAccessLogs(): StudentAccessLogEntry[] {
  return loadLocalLogs();
}
