import { useState, useMemo } from "react";
import {
  Send,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
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

  const userEmail = profile?.email ?? "faculty@rgpv.ac.in";
  const userId = profile?.id ?? "faculty-001";
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
          `Subject evaluation claimed for ${claimSubject} (Section ${claimSection})!`,
          {
            description: "Notification dispatched to Controller of Examinations for authorization.",
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
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Official Institutional Banner */}
      <Card className="border border-[#d1d5db] bg-white shadow-xs rounded-[2px] overflow-hidden">
        <CardHeader className="bg-[#003366] text-white py-3 px-5 border-b border-[#002244]">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-[2px] bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm sm:text-base font-serif font-bold text-white tracking-wide uppercase">
                  Faculty Valuation &amp; Subject Claim Register
                </CardTitle>
                <Badge className="bg-[#b91c1c] text-white border-0 text-[10px] font-bold rounded-[2px]">
                  RGPV Evaluation Cell
                </Badge>
              </div>
              <CardDescription className="text-xs text-blue-100 mt-0.5">
                Select your assigned course and section. Upon Controller approval, your marks entry register unlocks automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {/* Claim Form */}
          <form
            onSubmit={handleRequest}
            className="p-4 rounded-[2px] bg-[#f8f9fa] border border-[#d1d5db] space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Exam Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#003366] uppercase">1. Examination Type</label>
                <Tabs value={claimExam} onValueChange={(v) => setClaimExam(v as ExamType)}>
                  <TabsList className="w-full grid grid-cols-2 bg-slate-200 h-9 p-0.5 rounded-[2px]">
                    <TabsTrigger value="midsem" className="text-xs font-bold cursor-pointer rounded-[2px] data-[state=active]:bg-[#003366] data-[state=active]:text-white">
                      Mid Sem
                    </TabsTrigger>
                    <TabsTrigger value="put" className="text-xs font-bold cursor-pointer rounded-[2px] data-[state=active]:bg-[#003366] data-[state=active]:text-white">
                      PUT
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* 2. Section */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#003366] uppercase">2. Class Section</label>
                <Select value={claimSection} onValueChange={(v) => setClaimSection(v as Section)}>
                  <SelectTrigger className="w-full h-9 text-xs bg-white border-[#d1d5db] text-[#111827] cursor-pointer rounded-[2px] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#d1d5db] text-[#111827] max-h-56">
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
                <label className="text-xs font-bold text-[#003366] uppercase">3. Subject Code &amp; Title</label>
                <Select value={claimSubject} onValueChange={(v) => setClaimSubject(v as Subject)}>
                  <SelectTrigger className="w-full h-9 text-xs bg-white border-[#d1d5db] text-[#111827] cursor-pointer rounded-[2px] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#d1d5db] text-[#111827]">
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer text-xs">
                        <span className="font-bold text-[#003366]">{s}</span> — {SUBJECT_NAMES[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Availability / Conflict Status Feedback */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#d1d5db]">
              <div className="flex items-center gap-2 text-xs">
                {isAssignedToOther ? (
                  <div className="flex items-center gap-1.5 text-[#b91c1c] font-bold">
                    <XCircle className="size-4 shrink-0" />
                    <span>
                      Already Allocated to:{" "}
                      <span className="underline">
                        {assignmentInfo.assignedClaim?.staffName}
                      </span>{" "}
                      ({assignmentInfo.assignedClaim?.staffEmail})
                    </span>
                  </div>
                ) : isAlreadyApprovedForMe ? (
                  <div className="flex items-center gap-1.5 text-[#15803d] font-bold">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>You are authorized for this course section!</span>
                  </div>
                ) : isPendingForMe ? (
                  <div className="flex items-center gap-1.5 text-[#b45309] font-bold">
                    <Clock className="size-4 shrink-0" />
                    <span>Awaiting Controller of Examinations verification</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#15803d] font-bold">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Available to claim for Section {claimSection}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={!canSubmit}
                className={`h-9 px-5 text-xs font-bold gap-1.5 transition cursor-pointer rounded-[2px] ${
                  canSubmit
                    ? "bg-[#003366] hover:bg-[#002244] text-white shadow-xs"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed border border-[#d1d5db]"
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
                    ? "Course Unavailable"
                    : "Submit Subject Claim"}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* User's Claimed Subjects & Active Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-serif font-bold text-[#003366] uppercase tracking-wide flex items-center gap-2">
            <span>My Evaluation Authorizations</span>
            <Badge variant="outline" className="text-xs font-mono rounded-[2px] border-[#d1d5db]">
              {userClaims.length} Total Registered
            </Badge>
          </h3>
          {approvedClaims.length > 0 && (
            <Badge className="bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/30 text-xs font-bold rounded-[2px]">
              {approvedClaims.length} Active Authorizations
            </Badge>
          )}
        </div>

        {userClaims.length === 0 ? (
          <Card className="p-6 text-center text-xs text-slate-500 border border-[#d1d5db] bg-white rounded-[2px]">
            No evaluation claims recorded. Use the form above to register your section and subject.
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
                  className={`p-3.5 border rounded-[2px] transition-all bg-white ${
                    isApproved
                      ? "border-[#15803d]/50 shadow-xs"
                      : isPending
                      ? "border-[#b45309]/40 bg-amber-50/20"
                      : "border-[#b91c1c]/40 bg-rose-50/20 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-[#003366]">
                        <BookOpen className="size-4 text-[#003366]" />
                        <span>{claim.subject}</span>
                        <span className="text-xs font-normal text-slate-600 truncate max-w-[160px]">
                          {SUBJECT_NAMES[claim.subject]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] font-mono font-bold text-[#003366] border-[#003366]/40 rounded-[2px]">
                          Section {claim.section}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-bold text-[#b91c1c] border-[#b91c1c]/40 rounded-[2px]">
                          {EXAM_LABELS[claim.examType]}
                        </Badge>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isApproved && (
                        <Badge className="bg-[#15803d] text-white gap-1 text-[10px] font-bold rounded-[2px]">
                          <CheckCircle2 className="size-3" />
                          <span>Authorized</span>
                        </Badge>
                      )}
                      {isPending && (
                        <Badge className="bg-[#b45309] text-white gap-1 text-[10px] font-bold rounded-[2px]">
                          <Clock className="size-3" />
                          <span>Pending Admin</span>
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge className="bg-[#b91c1c] text-white gap-1 text-[10px] font-bold rounded-[2px]">
                          <XCircle className="size-3" />
                          <span>Rejected</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* If Approved, Quick Enter button */}
                  {isApproved && onSelectApproved && (
                    <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between">
                      <span className="text-[11px] text-[#15803d] font-bold">
                        ✓ Evaluation Ledger Unlocked
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          onSelectApproved(claim.examType, claim.section, claim.subject)
                        }
                        className="h-7 text-xs bg-[#003366] hover:bg-[#002244] text-white gap-1 font-bold cursor-pointer rounded-[2px]"
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
