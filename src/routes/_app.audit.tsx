import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  LogIn,
  Edit3,
  Layers,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useExamStore, EXAM_LABELS } from "@/lib/exam-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log (Admin Only) — Smart Exam System" },
      { name: "description", content: "Review a chronological record of logins, student mark changes, and list uploads." },
      { property: "og:title", content: "Audit Log — Smart Exam System" },
      { property: "og:description", content: "Review a chronological record of student mark changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditPage,
});

interface UnifiedAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole?: string;
  action: "LOGIN" | "MARKS_UPDATE" | "LIST_UPLOAD" | "CONFIG_UPDATE" | string;
  details: {
    studentRoll?: string;
    studentName?: string;
    subject?: string;
    exam?: string;
    oldValue?: any;
    newValue?: any;
    count?: number;
    section?: string;
    branch?: string;
    method?: string;
    [key: string]: any;
  };
}

function AuditPage() {
  const { isAdmin, isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const localAudit = useExamStore((s) => s.audit);

  const [remoteLogs, setRemoteLogs] = useState<UnifiedAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");

  // Strict RBAC Route Guard: Block employee from accessing /audit
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      toast.error("Unauthorized Access: Audit Log is restricted to Admin only");
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Fetch Supabase audit logs
  const fetchSupabaseLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(300);

      if (!error && data && data.length > 0) {
        const mapped: UnifiedAuditEntry[] = data.map((item) => ({
          id: item.id,
          timestamp: item.timestamp,
          user: item.user_email || "System User",
          action: item.action || "UNKNOWN",
          details: (item.details as any) || {},
        }));
        setRemoteLogs(mapped);
      }
    } catch (err) {
      console.warn("Could not fetch remote audit logs from Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void fetchSupabaseLogs();
    }
  }, [isAdmin]);

  // Merge Supabase remote logs and examStore local audit entries
  const unifiedLogs: UnifiedAuditEntry[] = useMemo(() => {
    const list: UnifiedAuditEntry[] = [...remoteLogs];

    // Convert local store audit events to UnifiedAuditEntry if not duplicated
    localAudit.forEach((a, idx) => {
      list.push({
        id: `local-${a.ts}-${idx}`,
        timestamp: new Date(a.ts).toISOString(),
        user: a.user,
        action: "MARKS_UPDATE",
        details: {
          studentRoll: a.studentRoll,
          subject: a.subject,
          exam: a.exam,
          oldValue: a.oldValue,
          newValue: a.newValue,
        },
      });
    });

    // Deduplicate by timestamp + roll + subject
    const seen = new Set<string>();
    const unique = list.filter((item) => {
      const key = `${item.timestamp.slice(0, 19)}_${item.action}_${item.details?.studentRoll || ""}_${item.details?.subject || ""}_${item.details?.newValue || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort descending by timestamp
    return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [remoteLogs, localAudit]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return unifiedLogs.filter((entry) => {
      if (filterAction !== "ALL" && entry.action !== filterAction) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const str = `${entry.user} ${entry.action} ${entry.details.studentRoll ?? ""} ${entry.details.subject ?? ""} ${entry.details.exam ?? ""} ${entry.details.method ?? ""}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [unifiedLogs, filterAction, search]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <ShieldAlert className="size-16 text-destructive animate-pulse" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The Audit Log contains administrative and security records. Only accounts with the Teacher (Admin) role are permitted to view this page.
        </p>
        <Button onClick={() => navigate({ to: "/dashboard" })}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const renderActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-400/30 gap-1"><LogIn className="size-3" /> LOGIN</Badge>;
      case "MARKS_UPDATE":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-400/30 gap-1"><Edit3 className="size-3" /> MARKS UPDATE</Badge>;
      case "LIST_UPLOAD":
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-400/30 gap-1"><FileSpreadsheet className="size-3" /> LIST UPLOAD</Badge>;
      case "CONFIG_UPDATE":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-400/30 gap-1"><Layers className="size-3" /> CONFIG</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">System Audit Log</h1>
            <Badge className="bg-emerald-600/10 text-emerald-600 border border-emerald-500/30 font-mono text-[10px]">
              ADMIN ONLY
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Chronological log of logins, staff mark submissions, and student list batch uploads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSupabaseLogs}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        </div>
      </header>

      {/* Control Bar: Filters & Search */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs value={filterAction} onValueChange={setFilterAction} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-4 md:inline-flex">
              <TabsTrigger value="ALL" className="text-xs">All Events ({unifiedLogs.length})</TabsTrigger>
              <TabsTrigger value="MARKS_UPDATE" className="text-xs">Marks Update</TabsTrigger>
              <TabsTrigger value="LIST_UPLOAD" className="text-xs">List Uploads</TabsTrigger>
              <TabsTrigger value="LOGIN" className="text-xs">Logins</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search user, roll, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/40 py-3 px-5 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Audit Records</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredLogs.length} events recorded with user identity and exact details
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="size-3.5" />
            <span>Supabase RLS Protected</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm space-y-2">
              <Clock className="size-8 mx-auto text-muted-foreground/60" />
              <p>No audit log entries matching your current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((entry) => {
                const dateStr = new Date(entry.timestamp).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                });

                return (
                  <div
                    key={entry.id}
                    className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-sm hover:bg-muted/40 transition-colors"
                  >
                    {/* Timestamp & User */}
                    <div className="flex flex-wrap items-center gap-3 min-w-[280px]">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock className="size-3.5" />
                        <span>{dateStr}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <User className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{entry.user}</span>
                      </div>
                    </div>

                    {/* Action Badge */}
                    <div className="shrink-0">
                      {renderActionBadge(entry.action)}
                    </div>

                    {/* Details Container */}
                    <div className="flex flex-wrap items-center gap-2 text-xs min-w-[240px] flex-1 justify-end">
                      {entry.action === "MARKS_UPDATE" && (
                        <>
                          {entry.details.studentRoll && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              Roll: {entry.details.studentRoll}
                            </Badge>
                          )}
                          {entry.details.exam && (
                            <Badge variant="secondary" className="text-[10px]">
                              {EXAM_LABELS[entry.details.exam as keyof typeof EXAM_LABELS] || entry.details.exam}
                            </Badge>
                          )}
                          {entry.details.subject && (
                            <Badge variant="outline" className="font-semibold text-[10px] bg-primary/5">
                              {entry.details.subject}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1.5 ml-2 tabular-nums">
                            <span className="text-muted-foreground line-through">
                              {entry.details.oldValue ?? "—"}
                            </span>
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                              {entry.details.newValue ?? "—"}
                            </span>
                          </div>
                        </>
                      )}

                      {entry.action === "LIST_UPLOAD" && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {entry.details.section ? `Sec: ${entry.details.section}` : "All Sections"}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {entry.details.branch || "CSE"}
                          </Badge>
                          <span className="text-muted-foreground font-medium">
                            {entry.details.count ? `${entry.details.count} students inserted` : "Batch imported"}
                          </span>
                        </div>
                      )}

                      {entry.action === "LOGIN" && (
                        <div className="text-muted-foreground text-xs italic">
                          Method: {entry.details.method || "Standard Auth"}
                        </div>
                      )}

                      {entry.action === "CONFIG_UPDATE" && (
                        <div className="text-muted-foreground text-xs">
                          {entry.details.exam ? `${entry.details.exam.toUpperCase()} Max Marks updated` : "Settings adjusted"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}