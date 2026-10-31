import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auth";
import type { ExamType, Section, Subject } from "@/lib/exam-store";
import { SUBJECT_NAMES, EXAM_LABELS } from "@/lib/exam-store";

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface SubjectClaim {
  id: string;
  staffId: string;
  staffEmail: string;
  staffName: string;
  examType: ExamType;
  section: Section;
  subject: Subject;
  status: ClaimStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const STORAGE_KEY = "exam_subject_claims_v2";

// Initial demo claims if store is fresh
const INITIAL_DEMO_CLAIMS: SubjectClaim[] = [
  {
    id: "claim-demo-1",
    staffId: "00000000-0000-0000-0000-000000000002",
    staffEmail: "staff@smart.edu",
    staffName: "Prof. Priya Verma",
    examType: "midsem",
    section: "B1",
    subject: "BT205",
    status: "approved",
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    reviewedAt: new Date(Date.now() - 1800000).toISOString(),
    reviewedBy: "admin@smart.edu",
  },
];

function loadStoredClaims(): SubjectClaim[] {
  if (typeof window === "undefined") return INITIAL_DEMO_CLAIMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_DEMO_CLAIMS;
}

let claimsState: SubjectClaim[] = loadStoredClaims();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function persistClaims(claims: SubjectClaim[]) {
  claimsState = claims;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    } catch {}
  }
  notify();
}

// Background sync with Supabase if table exists
async function syncRemoteClaims() {
  try {
    const { data, error } = await supabase
      .from("subject_claims")
      .select("*")
      .order("requested_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped: SubjectClaim[] = data.map((item: any) => ({
        id: item.id,
        staffId: item.staff_id,
        staffEmail: item.staff_email,
        staffName: item.staff_name,
        examType: item.exam_type as ExamType,
        section: item.section as Section,
        subject: item.subject as Subject,
        status: item.status as ClaimStatus,
        requestedAt: item.requested_at,
        reviewedAt: item.reviewed_at,
        reviewedBy: item.reviewed_by,
      }));
      persistClaims(mapped);
    }
  } catch (err) {
    // If table doesn't exist yet, local state remains fully functional
    console.warn("Remote subject_claims sync fallback:", err);
  }
}

if (typeof window !== "undefined") {
  void syncRemoteClaims();
}

export const subjectClaimsStore = {
  getClaims(): SubjectClaim[] {
    return claimsState;
  },

  getPendingClaims(): SubjectClaim[] {
    return claimsState.filter((c) => c.status === "pending");
  },

  getClaimsForUser(userEmailOrId?: string): SubjectClaim[] {
    if (!userEmailOrId) return [];
    const q = userEmailOrId.trim().toLowerCase();
    return claimsState.filter(
      (c) => c.staffEmail.toLowerCase() === q || c.staffId.toLowerCase() === q
    );
  },

  getApprovedClaimsForUser(userEmailOrId?: string): SubjectClaim[] {
    if (!userEmailOrId) return [];
    const q = userEmailOrId.trim().toLowerCase();
    return claimsState.filter(
      (c) =>
        c.status === "approved" &&
        (c.staffEmail.toLowerCase() === q || c.staffId.toLowerCase() === q)
    );
  },

  isSubjectApprovedForUser(
    userEmailOrId: string | undefined,
    examType: ExamType,
    section: Section | string,
    subject: Subject | string
  ): boolean {
    if (!userEmailOrId) return false;
    const q = userEmailOrId.trim().toLowerCase();
    return claimsState.some(
      (c) =>
        c.status === "approved" &&
        (c.staffEmail.toLowerCase() === q || c.staffId.toLowerCase() === q) &&
        c.examType === examType &&
        c.section === section &&
        c.subject === subject
    );
  },

  // Check if a combination is claimed and approved by anyone
  findAssignment(
    examType: ExamType,
    section: Section | string,
    subject: Subject | string
  ): { isAssigned: boolean; assignedClaim?: SubjectClaim } {
    const existing = claimsState.find(
      (c) =>
        c.status === "approved" &&
        c.examType === examType &&
        c.section === section &&
        c.subject === subject
    );
    if (existing) {
      return { isAssigned: true, assignedClaim: existing };
    }
    return { isAssigned: false };
  },

  // Check if current user already has a pending or approved claim for this combination
  getUserClaimStatus(
    userEmailOrId: string | undefined,
    examType: ExamType,
    section: Section | string,
    subject: Subject | string
  ): ClaimStatus | null {
    if (!userEmailOrId) return null;
    const q = userEmailOrId.trim().toLowerCase();
    const claim = claimsState.find(
      (c) =>
        (c.staffEmail.toLowerCase() === q || c.staffId.toLowerCase() === q) &&
        c.examType === examType &&
        c.section === section &&
        c.subject === subject
    );
    return claim ? claim.status : null;
  },

  // Staff Requests access to a subject
  async requestClaim(params: {
    staffId: string;
    staffEmail: string;
    staffName: string;
    examType: ExamType;
    section: Section;
    subject: Subject;
  }): Promise<{ success: boolean; error?: string; claim?: SubjectClaim }> {
    const { staffId, staffEmail, staffName, examType, section, subject } = params;

    // Check duplicate: already approved for someone else
    const checkAssignment = this.findAssignment(examType, section, subject);
    if (checkAssignment.isAssigned) {
      const assigned = checkAssignment.assignedClaim!;
      if (assigned.staffEmail.toLowerCase() === staffEmail.toLowerCase()) {
        return { success: false, error: "You are already authorized for this subject!" };
      }
      return {
        success: false,
        error: `This subject is already assigned to ${assigned.staffName} (${assigned.staffEmail}).`,
      };
    }

    // Check if user already has pending request for this exact combination
    const existingUserClaim = claimsState.find(
      (c) =>
        c.staffEmail.toLowerCase() === staffEmail.toLowerCase() &&
        c.examType === examType &&
        c.section === section &&
        c.subject === subject &&
        c.status === "pending"
    );
    if (existingUserClaim) {
      return {
        success: false,
        error: "You already have a pending request for this subject. Awaiting Admin approval.",
      };
    }

    const newClaim: SubjectClaim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      staffId,
      staffEmail,
      staffName,
      examType,
      section,
      subject,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    const nextClaims = [newClaim, ...claimsState];
    persistClaims(nextClaims);

    // Try Supabase insert
    try {
      await supabase.from("subject_claims").insert({
        id: newClaim.id,
        staff_id: newClaim.staffId,
        staff_email: newClaim.staffEmail,
        staff_name: newClaim.staffName,
        exam_type: newClaim.examType,
        section: newClaim.section,
        subject: newClaim.subject,
        status: "pending",
        requested_at: newClaim.requestedAt,
      });
    } catch {}

    void logAuditEvent("SUBJECT_CLAIM_REQUEST", {
      claimId: newClaim.id,
      staffEmail,
      staffName,
      examType,
      section,
      subject,
      subjectName: SUBJECT_NAMES[subject],
    });

    return { success: true, claim: newClaim };
  },

  // Admin approves a single claim
  async approveClaim(claimId: string, adminEmail: string): Promise<boolean> {
    const claim = claimsState.find((c) => c.id === claimId);
    if (!claim) return false;

    const reviewedAt = new Date().toISOString();
    const updated = claimsState.map((c) =>
      c.id === claimId ? { ...c, status: "approved" as ClaimStatus, reviewedAt, reviewedBy: adminEmail } : c
    );
    persistClaims(updated);

    // Update Supabase
    try {
      await supabase
        .from("subject_claims")
        .update({ status: "approved", reviewed_at: reviewedAt, reviewed_by: adminEmail })
        .eq("id", claimId);
    } catch {}

    void logAuditEvent("SUBJECT_CLAIM_APPROVE", {
      claimId,
      staffEmail: claim.staffEmail,
      staffName: claim.staffName,
      subject: claim.subject,
      section: claim.section,
      examType: claim.examType,
      approvedBy: adminEmail,
    });

    return true;
  },

  // Admin rejects a single claim
  async rejectClaim(claimId: string, adminEmail: string): Promise<boolean> {
    const claim = claimsState.find((c) => c.id === claimId);
    if (!claim) return false;

    const reviewedAt = new Date().toISOString();
    const updated = claimsState.map((c) =>
      c.id === claimId ? { ...c, status: "rejected" as ClaimStatus, reviewedAt, reviewedBy: adminEmail } : c
    );
    persistClaims(updated);

    try {
      await supabase
        .from("subject_claims")
        .update({ status: "rejected", reviewed_at: reviewedAt, reviewed_by: adminEmail })
        .eq("id", claimId);
    } catch {}

    void logAuditEvent("SUBJECT_CLAIM_REJECT", {
      claimId,
      staffEmail: claim.staffEmail,
      subject: claim.subject,
      section: claim.section,
      examType: claim.examType,
      rejectedBy: adminEmail,
    });

    return true;
  },

  // Admin 1-Click Approve All master button
  async approveAllPendingClaims(adminEmail: string): Promise<number> {
    const pending = claimsState.filter((c) => c.status === "pending");
    if (pending.length === 0) return 0;

    const reviewedAt = new Date().toISOString();
    const updated = claimsState.map((c) =>
      c.status === "pending"
        ? { ...c, status: "approved" as ClaimStatus, reviewedAt, reviewedBy: adminEmail }
        : c
    );
    persistClaims(updated);

    try {
      await supabase
        .from("subject_claims")
        .update({ status: "approved", reviewed_at: reviewedAt, reviewed_by: adminEmail })
        .eq("status", "pending");
    } catch {}

    void logAuditEvent("SUBJECT_CLAIMS_APPROVE_ALL", {
      count: pending.length,
      approvedBy: adminEmail,
      claims: pending.map((p) => ({
        id: p.id,
        staff: p.staffEmail,
        subject: p.subject,
        section: p.section,
      })),
    });

    return pending.length;
  },
};

export function useSubjectClaims() {
  const claims = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => claimsState,
    () => claimsState
  );

  const pending = claims.filter((c) => c.status === "pending");

  return {
    claims,
    pending,
    pendingCount: pending.length,
    getClaimsForUser: (emailOrId?: string) => subjectClaimsStore.getClaimsForUser(emailOrId),
    getApprovedClaimsForUser: (emailOrId?: string) =>
      subjectClaimsStore.getApprovedClaimsForUser(emailOrId),
    isSubjectApprovedForUser: (
      emailOrId: string | undefined,
      exam: ExamType,
      section: Section | string,
      subject: Subject | string
    ) => subjectClaimsStore.isSubjectApprovedForUser(emailOrId, exam, section, subject),
    findAssignment: (exam: ExamType, section: Section | string, subject: Subject | string) =>
      subjectClaimsStore.findAssignment(exam, section, subject),
    getUserClaimStatus: (
      emailOrId: string | undefined,
      exam: ExamType,
      section: Section | string,
      subject: Subject | string
    ) => subjectClaimsStore.getUserClaimStatus(emailOrId, exam, section, subject),
    requestClaim: subjectClaimsStore.requestClaim.bind(subjectClaimsStore),
    approveClaim: subjectClaimsStore.approveClaim.bind(subjectClaimsStore),
    rejectClaim: subjectClaimsStore.rejectClaim.bind(subjectClaimsStore),
    approveAllPendingClaims: subjectClaimsStore.approveAllPendingClaims.bind(subjectClaimsStore),
  };
}
