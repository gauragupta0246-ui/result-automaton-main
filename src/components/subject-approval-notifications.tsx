import { useState } from "react";
import {
  Bell,
  Check,
  X,
  CheckCheck,
  ShieldCheck,
  Clock,
  BookOpen,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSubjectClaims } from "@/lib/subject-claims";
import { useAuth } from "@/lib/auth";
import { EXAM_LABELS, SUBJECT_NAMES } from "@/lib/exam-store";

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Recently";
  }
}

export function SubjectApprovalNotificationCenter() {
  const { profile, isAdmin } = useAuth();
  const {
    claims,
    pending,
    pendingCount,
    approveClaim,
    rejectClaim,
    approveAllPendingClaims,
  } = useSubjectClaims();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [processing, setProcessing] = useState(false);

  if (!isAdmin) return null;

  const adminEmail = profile?.email ?? "gauragupta0246@gmail.com";

  const handleApprove = async (claimId: string, staffName: string, subject: string, sec: string) => {
    setProcessing(true);
    try {
      await approveClaim(claimId, adminEmail);
      toast.success(`Authorized ${staffName} for ${subject} (${sec})!`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (claimId: string, staffName: string, subject: string) => {
    setProcessing(true);
    try {
      await rejectClaim(claimId, adminEmail);
      toast.info(`Request for ${subject} rejected.`);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    setProcessing(true);
    try {
      const count = await approveAllPendingClaims(adminEmail);
      toast.success(`Authorized all ${count} pending subject access requests in 1-click!`);
    } finally {
      setProcessing(false);
    }
  };

  const approvedClaims = claims.filter((c) => c.status === "approved");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-8 px-2.5 gap-1.5 border-[#d1d5db] bg-white hover:bg-[#f1f5f9] text-[#003366] cursor-pointer shadow-xs rounded-[2px] font-bold text-xs"
          title="Subject Access Approvals"
        >
          <div className="relative">
            <Bell className={`size-3.5 ${pendingCount > 0 ? "text-[#b91c1c]" : "text-[#003366]"}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b91c1c] opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-[#b91c1c]"></span>
              </span>
            )}
          </div>

          <span>Approvals</span>

          {pendingCount > 0 ? (
            <Badge className="bg-[#b91c1c] hover:bg-[#990000] text-white font-mono text-[9px] px-1 py-0 h-4 rounded-[2px] font-bold">
              {pendingCount}
            </Badge>
          ) : (
            <span className="text-[10px] text-slate-500 font-mono">0</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] sm:w-[440px] p-0 bg-white border border-[#cbd5e1] text-[#111827] shadow-xl rounded-[2px] overflow-hidden z-50 font-sans"
      >
        {/* Header - Official RGPV Royal Blue */}
        <div className="p-3.5 border-b border-[#002244] bg-[#003366] text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-[2px] bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs tracking-wide uppercase text-white">
                  Controller of Exams — Subject Approvals
                </h4>
                <p className="text-[10px] text-blue-100">Faculty self-claim access authorization</p>
              </div>
            </div>

            {pendingCount > 0 && (
              <Badge className="bg-[#b91c1c] text-white border-0 text-[10px] font-bold rounded-[2px]">
                {pendingCount} Pending
              </Badge>
            )}
          </div>

          {/* Master 1-Click Approve All Button */}
          {pendingCount > 0 && (
            <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between gap-2">
              <span className="text-[10px] text-blue-100">
                Authorize all pending claims in 1-click:
              </span>
              <Button
                size="sm"
                onClick={handleApproveAll}
                disabled={processing}
                className="h-7 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-[11px] gap-1 shadow-xs cursor-pointer rounded-[2px]"
              >
                <CheckCheck className="size-3" />
                <span>Approve All ({pendingCount})</span>
              </Button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="px-3 pt-2 border-b border-[#d1d5db] bg-[#f8f9fa]">
            <TabsList className="bg-slate-200 h-7 p-0.5 rounded-[2px]">
              <TabsTrigger value="pending" className="text-xs px-2.5 h-6 rounded-[2px] data-[state=active]:bg-[#003366] data-[state=active]:text-white font-bold cursor-pointer">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs px-2.5 h-6 rounded-[2px] data-[state=active]:bg-[#003366] data-[state=active]:text-white font-bold cursor-pointer">
                Active Assignments ({approvedClaims.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Pending Requests */}
          <TabsContent value="pending" className="m-0 p-0 max-h-[360px] overflow-y-auto">
            {pending.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1.5">
                <div className="size-8 rounded-[2px] bg-[#15803d]/10 border border-[#15803d]/20 text-[#15803d] flex items-center justify-center mx-auto">
                  <Check className="size-4" />
                </div>
                <h5 className="font-bold text-xs text-[#003366]">All Caught Up!</h5>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  No pending subject access claims. When staff members request access for a class or subject, they will appear here for 1-click authorization.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e2e8f0]">
                {pending.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 hover:bg-[#f8f9fa] transition flex flex-col gap-2"
                  >
                    {/* Top: Faculty Name + Time */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-[2px] bg-[#003366] text-white font-bold text-[10px] flex items-center justify-center">
                          {req.staffName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#003366] leading-tight">
                            {req.staffName}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px] font-mono">
                            {req.staffEmail}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                        <Clock className="size-3" />
                        <span>{formatRelativeTime(req.requestedAt)}</span>
                      </div>
                    </div>

                    {/* Middle: Target Subject & Section Badges */}
                    <div className="p-2 rounded-[2px] bg-[#f8f9fa] border border-[#d1d5db] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#111827] flex items-center gap-1.5">
                          <BookOpen className="size-3 text-[#003366]" />
                          <span>{req.subject}</span>
                          <span className="font-normal text-slate-600 text-[11px]">
                            ({SUBJECT_NAMES[req.subject]})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono font-bold text-[#003366] border-[#003366]/40 rounded-[2px]">
                            Section {req.section}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-bold text-[#b91c1c] border-[#b91c1c]/40 rounded-[2px]">
                            {EXAM_LABELS[req.examType]}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Individual Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(req.id, req.staffName, req.subject)}
                        disabled={processing}
                        className="h-6 text-[11px] text-[#b91c1c] hover:text-[#990000] hover:bg-rose-50 cursor-pointer rounded-[2px]"
                      >
                        <X className="size-3 mr-1" />
                        <span>Reject</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleApprove(req.id, req.staffName, req.subject, req.section)
                        }
                        disabled={processing}
                        className="h-6 text-[11px] bg-[#15803d] hover:bg-[#166534] text-white font-bold cursor-pointer gap-1 rounded-[2px]"
                      >
                        <Check className="size-3" />
                        <span>Approve</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Active / Approved Assignments */}
          <TabsContent value="history" className="m-0 p-0 max-h-[360px] overflow-y-auto">
            {approvedClaims.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500">
                No active approved subject assignments yet.
              </div>
            ) : (
              <div className="divide-y divide-[#e2e8f0]">
                {approvedClaims.map((item) => (
                  <div key={item.id} className="p-2.5 text-xs flex items-center justify-between gap-2 hover:bg-[#f8f9fa]">
                    <div>
                      <div className="font-bold text-[#003366] flex items-center gap-1.5">
                        <UserCheck className="size-3 text-[#15803d]" />
                        <span>{item.staffName}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        <span className="font-mono text-[#003366] font-bold">{item.subject}</span> · Section {item.section} · {EXAM_LABELS[item.examType]}
                      </div>
                    </div>
                    <Badge className="bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/30 text-[9px] font-bold rounded-[2px]">
                      Authorized
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
