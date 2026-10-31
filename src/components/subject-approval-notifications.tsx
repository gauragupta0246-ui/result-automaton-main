import { useState } from "react";
import {
  Bell,
  Check,
  X,
  CheckCheck,
  ShieldCheck,
  Clock,
  Sparkles,
  BookOpen,
  UserCheck,
  Layers,
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

  const adminEmail = profile?.email ?? "admin@smart.edu";

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
          className="relative h-9 px-3 gap-2 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 cursor-pointer shadow-sm transition"
          title="Subject Access Approvals"
        >
          <div className="relative">
            <Bell className={`size-4 ${pendingCount > 0 ? "text-amber-400" : "text-slate-400"}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-rose-500"></span>
              </span>
            )}
          </div>

          <span className="hidden sm:inline text-xs font-semibold">Approvals</span>

          {pendingCount > 0 ? (
            <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-mono text-[10px] px-1.5 py-0 h-4 rounded-full">
              {pendingCount}
            </Badge>
          ) : (
            <span className="text-[10px] text-slate-500">0</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] sm:w-[440px] p-0 bg-slate-950 border-slate-800 text-slate-100 shadow-2xl rounded-xl overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight text-white">Subject Access Requests</h4>
                <p className="text-[11px] text-slate-400">Faculty self-claim access authorization</p>
              </div>
            </div>

            {pendingCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs font-bold">
                {pendingCount} Pending
              </Badge>
            )}
          </div>

          {/* Master 1-Click Approve All Button */}
          {pendingCount > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                Authorize all valid claims immediately:
              </span>
              <Button
                size="sm"
                onClick={handleApproveAll}
                disabled={processing}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
                <span>Approve All ({pendingCount})</span>
              </Button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="px-4 pt-2 border-b border-slate-800 bg-slate-900/30">
            <TabsList className="bg-slate-900 h-8 p-0.5">
              <TabsTrigger value="pending" className="text-xs px-3 h-7 cursor-pointer">
                Pending Requests ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs px-3 h-7 cursor-pointer">
                Active Assignments ({approvedClaims.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Pending Requests */}
          <TabsContent value="pending" className="m-0 p-0 max-h-[380px] overflow-y-auto">
            {pending.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="size-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="size-5" />
                </div>
                <h5 className="font-semibold text-sm text-slate-200">All Caught Up!</h5>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  No pending subject access claims. When staff members request access for a class or subject, they will appear here for 1-click approval.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {pending.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 hover:bg-slate-900/50 transition flex flex-col gap-2.5"
                  >
                    {/* Top: Faculty Name + Time */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-sky-500/15 text-sky-400 font-bold text-xs flex items-center justify-center border border-sky-500/30">
                          {req.staffName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white leading-tight">
                            {req.staffName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {req.staffEmail}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <Clock className="size-3" />
                        <span>{formatRelativeTime(req.requestedAt)}</span>
                      </div>
                    </div>

                    {/* Middle: Target Subject & Section Badges */}
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <BookOpen className="size-3.5 text-indigo-400" />
                          <span>{req.subject}</span>
                          <span className="font-normal text-slate-400 text-[11px]">
                            ({SUBJECT_NAMES[req.subject]})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-sky-400 border-sky-500/30">
                            Section {req.section}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-indigo-400 border-indigo-500/30">
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
                        className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer"
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
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer gap-1"
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
          <TabsContent value="history" className="m-0 p-0 max-h-[380px] overflow-y-auto">
            {approvedClaims.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-400">
                No active approved subject assignments yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {approvedClaims.map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <UserCheck className="size-3.5 text-emerald-400" />
                        <span>{item.staffName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-indigo-300 font-bold">{item.subject}</span> · Section {item.section} · {EXAM_LABELS[item.examType]}
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
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
