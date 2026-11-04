import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Pencil,
  FileBarChart,
  ClipboardList,
  Languages,
  LogOut,
  ShieldCheck,
  UserCheck,
  Edit2,
  Mail,
  Phone,
  Landmark,
  FlaskConical,
  Atom,
} from "lucide-react";

import { useT, useLang, langStore, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth, syncUserRoleFromDatabase } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SubjectApprovalNotificationCenter } from "@/components/subject-approval-notifications";
import { useExamStore, examStore, type FirstYearGroup } from "@/lib/exam-store";
import {
  RgpvTopBar,
  RgpvBrandHeader,
  RgpvNavbar,
  RgpvNotificationTicker,
  RgpvFooter,
} from "@/components/rgpv-portal-layout";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

// Official University Emblem SVG
function UniversityEmblem({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="#ffffff" strokeWidth="3" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="41" stroke="#f1b82d" strokeWidth="2.5" />
      <path
        d="M50 18L58 26H70V38L78 46L70 54V66H58L50 74L42 66H30V54L22 46L30 38V26H42L50 18Z"
        fill="#ffffff"
        fillOpacity="0.08"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <circle cx="50" cy="46" r="16" stroke="#f1b82d" strokeWidth="2" fill="#0b2545" />
      <path
        d="M40 43C44 41 48 42 50 44C52 42 56 41 60 43V53C56 51 52 52 50 54C48 52 44 51 40 53V43Z"
        fill="#f1b82d"
      />
      <line x1="50" y1="44" x2="50" y2="54" stroke="#0b2545" strokeWidth="1.5" />
      <path d="M32 74C40 70 60 70 68 74L64 78C56 75 44 75 36 78L32 74Z" fill="#f1b82d" />
    </svg>
  );
}

function AdminEmailSettingsDialog() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState(profile?.email || "");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile?.email) setNewEmail(profile.email);
  }, [profile?.email]);

  const handleChangeAdminEmail = async (newEmailInput: string) => {
    const cleanNewEmail = newEmailInput.trim().toLowerCase();
    if (!cleanNewEmail || !cleanNewEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data: sessionData } = await supabase.auth.getSession();
      user = sessionData?.session?.user ?? null;
    }

    if (!user || !cleanNewEmail) {
      alert("No active authenticated user found.");
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Update the email in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        email: cleanNewEmail,
      });

      if (authError) {
        alert("Error updating auth email: " + authError.message);
        return;
      }

      // 2. Update the email in public.profiles table to retain the admin role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email: cleanNewEmail })
        .eq("id", user.id);

      if (profileError) {
        alert("Error updating profile record: " + profileError.message);
        return;
      }

      alert(
        "Admin email updated successfully! A confirmation link has been sent to the new email address. Please verify it, then sign in with the new email."
      );

      // 3. Optional: Sign out and redirect to login
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err: any) {
      alert("Unexpected error: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleChangeAdminEmail(newEmail);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Change Admin Email"
          className="text-[10px] text-[#0b2545] hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
        >
          <Edit2 className="size-2.5" />
          <span>Change Email</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white border border-[#cbd5e1] rounded-[4px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-serif font-bold text-[#0b2545]">
            <ShieldCheck className="size-5 text-[#0b2545]" />
            Super Admin Profile &amp; Email Settings
          </DialogTitle>
          <p className="text-xs text-[#475569] mt-1">
            Configure the Super Admin email. This account has full Controller of Examinations privileges.
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0b2545] uppercase">New Super Admin Email *</label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. newadmin@rgpv.ac.in"
                className="pl-9 font-mono text-sm bg-white border-[#cbd5e1] rounded-[4px]"
                disabled={isUpdating}
                required
              />
            </div>
            <p className="text-[11px] text-[#475569]">
              Current email: <code className="text-[#0b2545] font-bold">{profile?.email || "Not set"}</code>
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isUpdating}
              className="text-xs border-[#cbd5e1] rounded-[4px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isUpdating || !newEmail.trim()}
              className="bg-[#0b2545] hover:bg-[#133966] text-white text-xs font-bold rounded-[4px] cursor-pointer"
            >
              {isUpdating ? "Updating Email…" : "Update Admin Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ALL_NAV = [
  { to: "/dashboard", key: "nav.dashboard" as TKey, icon: LayoutDashboard, adminOnly: false },
  { to: "/marks", key: "nav.marks" as TKey, icon: Pencil, adminOnly: false },
  { to: "/results", key: "nav.results" as TKey, icon: FileBarChart, adminOnly: false },
  { to: "/audit", key: "nav.audit" as TKey, icon: ClipboardList, adminOnly: true },
] as const;

function LangSwitch({ className }: { className?: string }) {
  const lang = useLang();
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-[3px] border border-[#cbd5e1] bg-white p-0.5", className)}>
      <Languages className="mx-1 size-3 text-[#475569]" />
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => langStore.set(l)}
          className={cn(
            "rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer",
            lang === l ? "bg-[#0b2545] text-white" : "text-[#475569] hover:bg-slate-100",
          )}
        >
          {l === "en" ? "EN" : "HI"}
        </button>
      ))}
    </div>
  );
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const t = useT();
  const { profile, isAuthenticated, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<"admin" | "faculty">("admin");
  const [isLoadingRole, setIsLoadingRole] = useState<boolean>(true);
  const activeGroup = useExamStore((s) => s.activeGroup ?? "chemistry");
  const activeSemester = useExamStore((s) => s.activeSemester ?? 1);

  useEffect(() => {
    setMounted(true);
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData?.role) {
        setRole(profileData.role === "admin" ? "admin" : "faculty");
        void syncUserRoleFromDatabase(
          session.user.id,
          session.user.email || "",
          (session.user.user_metadata?.full_name as string)
        );
      } else {
        setRole("admin");
        void syncUserRoleFromDatabase(
          session.user.id,
          session.user.email || "",
          (session.user.user_metadata?.full_name as string)
        );
      }
      setIsLoadingRole(false);
    };
    fetchRole();
  }, []);

  const isEffectiveAdmin = role === "admin";

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      toast.error("Please login to continue");
      navigate({ to: "/login" });
    }
  }, [mounted, isAuthenticated, navigate]);

  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen bg-[#f4f6f9]" />;
  }

  const visibleNav = ALL_NAV.filter((n) => !n.adminOnly || isEffectiveAdmin);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#111827] font-sans">
      {/* ── Official RGPV Portal Layout Header Suite ── */}
      <RgpvTopBar />
      <RgpvBrandHeader />
      <RgpvNavbar activeRoute="dashboard" />
      <RgpvNotificationTicker />

      {/* Main Examination Workspace */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop Sidebar with Sharp 2px Corners & Royal Blue (#003366) Styling */}
        <aside className="hidden md:flex w-60 flex-col bg-white border-r border-[#d1d5db] shrink-0 shadow-xs">
          {/* User Status Bar */}
          <div className="p-3 border-b border-[#d1d5db] bg-[#f9fafb] space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-[2px] bg-[#003366] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {isEffectiveAdmin ? <ShieldCheck className="size-4 text-amber-300" /> : <UserCheck className="size-4 text-sky-200" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-[#003366]">
                  {profile?.full_name || profile?.email || "User"}
                </div>
                <div className="text-[10px] text-slate-500 truncate font-mono">{profile?.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Badge
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.2 rounded-[2px]",
                  isEffectiveAdmin
                    ? "bg-[#b91c1c] text-white border-[#990000]"
                    : "bg-[#003366] text-white border-[#002244]"
                )}
              >
                {isEffectiveAdmin ? "Controller of Exams" : "Faculty Evaluator"}
              </Badge>

              {isEffectiveAdmin && <AdminEmailSettingsDialog />}
            </div>

            {isEffectiveAdmin && (
              <div className="pt-2 border-t border-[#d1d5db] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#003366]">Faculty Claims:</span>
                <SubjectApprovalNotificationCenter />
              </div>
            )}
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-2.5 space-y-1">
            {visibleNav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer border",
                    active
                      ? "bg-[#003366] text-white border-[#002244] shadow-xs"
                      : "text-slate-700 hover:bg-[#e6eef5] hover:text-[#003366] border-transparent",
                  )}
                >
                  <n.icon className="size-4 shrink-0" />
                  <span>{t(n.key)}</span>
                  {n.adminOnly && (
                    <span className="ml-auto text-[8px] bg-[#b91c1c] text-white px-1 py-0.2 rounded-[2px] font-mono font-bold">
                      ADMIN
                    </span>
                  )}
                </Link>
              );
            })}

            {/* First Year Subject Groups Section */}
            <div className="pt-3 pb-1 border-t border-[#d1d5db] mt-2 space-y-1">
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider">
                  First Year Groups
                </span>
                <span className="text-[9px] bg-slate-100 text-[#003366] border border-[#d1d5db] px-1 py-0.2 rounded-[2px] font-mono font-bold">
                  5 SUB
                </span>
              </div>

              {/* Semester quick selector */}
              <div className="px-2 pb-1.5 flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-500 font-bold">Semester:</span>
                <div className="inline-flex rounded-[2px] border border-[#d1d5db] bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => examStore.setActiveSemester(1)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-[2px] cursor-pointer transition-colors",
                      activeSemester === 1
                        ? "bg-[#003366] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#003366]"
                    )}
                  >
                    Sem 1
                  </button>
                  <button
                    type="button"
                    onClick={() => examStore.setActiveSemester(2)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-[2px] cursor-pointer transition-colors",
                      activeSemester === 2
                        ? "bg-[#003366] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#003366]"
                    )}
                  >
                    Sem 2
                  </button>
                </div>
              </div>

              {/* Chemistry Group Button */}
              <button
                type="button"
                onClick={() => {
                  examStore.setActiveGroup("chemistry");
                  if (pathname !== "/marks") navigate({ to: "/marks" });
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer border text-left",
                  activeGroup === "chemistry" && pathname === "/marks"
                    ? "bg-[#003366] text-white border-[#002244] shadow-xs"
                    : "text-slate-700 hover:bg-[#e6eef5] hover:text-[#003366] border-transparent"
                )}
              >
                <FlaskConical className={cn("size-4 shrink-0", activeGroup === "chemistry" && pathname === "/marks" ? "text-amber-300" : "text-[#003366]")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">Chemistry Group</div>
                  <div className={cn("text-[9px] font-normal", activeGroup === "chemistry" && pathname === "/marks" ? "text-blue-100" : "text-slate-500")}>
                    First Year (5 Subjects)
                  </div>
                </div>
                {activeGroup === "chemistry" && pathname === "/marks" && (
                  <span className="text-[8px] bg-[#15803d] text-white px-1 py-0.2 rounded-[2px] font-mono font-bold">
                    ACTIVE
                  </span>
                )}
              </button>

              {/* Physics Group Button */}
              <button
                type="button"
                onClick={() => {
                  examStore.setActiveGroup("physics");
                  if (pathname !== "/marks") navigate({ to: "/marks" });
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer border text-left",
                  activeGroup === "physics" && pathname === "/marks"
                    ? "bg-[#003366] text-white border-[#002244] shadow-xs"
                    : "text-slate-700 hover:bg-[#e6eef5] hover:text-[#003366] border-transparent"
                )}
              >
                <Atom className={cn("size-4 shrink-0", activeGroup === "physics" && pathname === "/marks" ? "text-sky-300" : "text-[#003366]")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">Physics Group</div>
                  <div className={cn("text-[9px] font-normal", activeGroup === "physics" && pathname === "/marks" ? "text-blue-100" : "text-slate-500")}>
                    First Year (5 Subjects)
                  </div>
                </div>
                {activeGroup === "physics" && pathname === "/marks" && (
                  <span className="text-[8px] bg-[#15803d] text-white px-1 py-0.2 rounded-[2px] font-mono font-bold">
                    ACTIVE
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Quick link to student portal */}
          <div className="p-3 border-t border-[#d1d5db] bg-[#f9fafb]">
            <Link
              to="/student"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#003366] bg-white border border-[#003366] rounded-[2px] hover:bg-[#003366] hover:text-white transition cursor-pointer"
            >
              <span>Student Verification Gate →</span>
            </Link>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#d1d5db] grid shadow-lg"
        style={{ gridTemplateColumns: `repeat(${visibleNav.length}, minmax(0,1fr))` }}
      >
        {visibleNav.map((n) => {
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center py-2 text-[10px] gap-1 cursor-pointer font-bold",
                active ? "text-[#003366] bg-[#e6eef5]" : "text-slate-600",
              )}
            >
              <n.icon className="size-4" />
              {t(n.key).split(" ")[0]}
            </Link>
          );
        })}
      </div>

      {/* ── Official RGPV Footer ── */}
      <RgpvFooter />
    </div>
  );
}
