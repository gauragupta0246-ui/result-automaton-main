import { useState, useMemo } from "react";
import {
  Send,
  ShieldAlert,
  ShieldCheck,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useSubjectClaims } from "@/lib/subject-claims";
import {
  SECTIONS,
  SUBJECTS,
  SUBJECT_NAMES,
  EXAM_LABELS,
  type ExamType,
  type Section,
  type Subject,
} from "@/lib/exam-store";

export function SubjectClaimPanel({
  onSelectApproved,
}: {
  onSelectApproved?: (exam: ExamType, section: Section, subject: Subject) => void;
}) {
  const { profile } = useAuth();
  const {
    claims,
    getClaimsForUser,
    getApprovedClaimsForUser,
    findAssignment,
    getUserClaimStatus,
    requestClaim,
  } = useSubjectClaims();

  const userEmail = profile?.email ?? "staff@smart.edu";
  const userId = profile?.id ?? "employee-001";
  const userName = profile?.full_name ?? userEmail;

  const [claimExam, setClaimExam] = useState<ExamType>("midsem");
  const [claimSection, setClaimSection] = useState<Section>("B1");
  const [claimSubject, setClaimSubject] = useState<Subject>("BT205");
  const [submitting, setSubmitting] = useState(false);

  // User's own claims
  const userClaims = useMemo(
    () => getClaimsForUser(userEmail),
    [claims, userEmail, getClaimsForUser]
  );
  const approvedClaims = useMemo(
    () => getApprovedClaimsForUser(userEmail),
    [claims, userEmail, getApprovedClaimsForUser]
  );

  // Check assignment status for currently chosen combination
  const assignmentInfo = useMemo(() => {
    return findAssignment(claimExam, claimSection, claimSubject);
  }, [claimExam, claimSection, claimSubject, findAssignment, claims]);

  const userStatusForCombination = useMemo(() => {
    return getUserClaimStatus(userEmail, claimExam, claimSection, claimSubject);
  }, [claimExam, claimSection, claimSubject, userEmail, getUserClaimStatus, claims]);

  const isAssignedToOther =
    assignmentInfo.isAssigned &&
    assignmentInfo.assignedClaim?.staffEmail.toLowerCase() !== userEmail.toLowerCase();

  const isAlreadyApprovedForMe = userStatusForCombination === "approved";
  const isPendingForMe = userStatusForCombination === "pending";

  const canSubmit = !isAssignedToOther && !isAlreadyApprovedForMe && !isPendingForMe && !submitting;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await requestClaim({
        staffId: userId,
        staffEmail: userEmail,
        staffName: userName,
        examType: claimExam,
        section: claimSection,
        subject: claimSubject,
      });

      if (res.success) {
        toast.success(
          `Subject access requested for ${claimSubject} (Section ${claimSection})!`,
          {
            description: "Notification sent to Teacher/Admin for 1-click authorization.",
          }
        );
      } else {
        toast.error(res.error || "Failed to submit subject claim request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <Card className="border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-xs">
              <BookOpen className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold text-white">
                  Claim My Assigned Subjects
                </CardTitle>
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-xs">
                  Automated Staff Workflow
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-300 mt-1">
                Select the classes and subjects you have been assigned to evaluate. Once approved by the Teacher (Admin), your marks entry grid unlocks automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Claim Form */}
          <form
            onSubmit={handleRequest}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Exam Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">1. Exam Type</label>
                <Tabs value={claimExam} onValueChange={(v) => setClaimExam(v as ExamType)}>
                  <TabsList className="w-full grid grid-cols-2 bg-slate-800 h-9">
                    <TabsTrigger value="midsem" className="text-xs font-medium cursor-pointer">
                      Mid Sem
                    </TabsTrigger>
                    <TabsTrigger value="put" className="text-xs font-medium cursor-pointer">
                      PUT
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* 2. Section */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">2. Section</label>
                <Select value={claimSection} onValueChange={(v) => setClaimSection(v as Section)}>
                  <SelectTrigger className="w-full h-9 text-xs bg-slate-800 border-slate-700 text-white cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-56">
                    {SECTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer text-xs">
                        Section {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">3. Subject</label>
                <Select value={claimSubject} onValueChange={(v) => setClaimSubject(v as Subject)}>
                  <SelectTrigger className="w-full h-9 text-xs bg-slate-800 border-slate-700 text-white cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer text-xs">
                        <span className="font-semibold">{s}</span> — {SUBJECT_NAMES[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Availability / Conflict Status Feedback */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                {isAssignedToOther ? (
                  <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                    <XCircle className="size-4 shrink-0" />
                    <span>
                      Already Assigned to{" "}
                      <span className="font-semibold text-white">
                        {assignmentInfo.assignedClaim?.staffName}
                      </span>{" "}
                      ({assignmentInfo.assignedClaim?.staffEmail})
                    </span>
                  </div>
                ) : isAlreadyApprovedForMe ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>You are already authorized for this subject!</span>
                  </div>
                ) : isPendingForMe ? (
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <Clock className="size-4 shrink-0" />
                    <span>Request Pending — awaiting Teacher (Admin) approval</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Available to claim for Section {claimSection}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={!canSubmit}
                className={`h-9 px-5 text-xs font-bold gap-1.5 transition cursor-pointer ${
                  canSubmit
                    ? "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }`}
              >
                <Send className="size-3.5" />
                <span>
                  {submitting
                    ? "Submitting…"
                    : isPendingForMe
                    ? "Pending Approval"
                    : isAlreadyApprovedForMe
                    ? "Already Authorized"
                    : isAssignedToOther
                    ? "Already Assigned"
                    : "Request Subject Access"}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* User's Claimed Subjects & Active Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>My Subject Access Status</span>
            <Badge variant="outline" className="text-xs">
              {userClaims.length} Total Requested
            </Badge>
          </h3>
          {approvedClaims.length > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
              {approvedClaims.length} Active Authorizations
            </Badge>
          )}
        </div>

        {userClaims.length === 0 ? (
          <Card className="p-6 text-center text-xs text-muted-foreground border-dashed">
            No subject access requests submitted yet. Use the form above to claim your class section and subject.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userClaims.map((claim) => {
              const isApproved = claim.status === "approved";
              const isPending = claim.status === "pending";
              const isRejected = claim.status === "rejected";

              return (
                <Card
                  key={claim.id}
                  className={`p-4 border transition-all ${
                    isApproved
                      ? "border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-xs"
                      : isPending
                      ? "border-amber-500/40 bg-amber-50/10 dark:bg-amber-950/20"
                      : "border-rose-500/40 bg-rose-50/10 dark:bg-rose-950/20 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                        <BookOpen className="size-4 text-primary" />
                        <span>{claim.subject}</span>
                        <span className="text-xs font-normal text-muted-foreground truncate max-w-[160px]">
                          {SUBJECT_NAMES[claim.subject]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[11px] font-mono font-semibold">
                          Section {claim.section}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {EXAM_LABELS[claim.examType]}
                        </Badge>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isApproved && (
                        <Badge className="bg-emerald-600 text-white gap-1 text-[11px]">
                          <CheckCircle2 className="size-3" />
                          <span>Authorized</span>
                        </Badge>
                      )}
                      {isPending && (
                        <Badge className="bg-amber-600/90 text-white gap-1 text-[11px]">
                          <Clock className="size-3" />
                          <span>Pending Admin</span>
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge className="bg-rose-600 text-white gap-1 text-[11px]">
                          <XCircle className="size-3" />
                          <span>Rejected</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* If Approved, Quick Enter button */}
                  {isApproved && onSelectApproved && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Marks Entry Unlocked
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          onSelectApproved(claim.examType, claim.section, claim.subject)
                        }
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold cursor-pointer"
                      >
                        <span>Open Marks Entry</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
