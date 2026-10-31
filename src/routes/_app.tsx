import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Pencil,
  FileBarChart,
  GraduationCap,
  ClipboardList,
  Languages,
  LogOut,
  ShieldCheck,
  UserCheck,
  Edit2,
  Mail,
} from "lucide-react";

import { useT, useLang, langStore, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
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

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AdminEmailSettingsDialog() {
  const { profile, updateAdminEmail } = useAuth();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState(profile?.email || "");

  useEffect(() => {
    if (profile?.email) setNewEmail(profile.email);
  }, [profile?.email]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    const ok = updateAdminEmail(newEmail.trim());
    if (ok) {
      toast.success(`Admin email successfully updated to: ${newEmail.trim()}`);
      setOpen(false);
    } else {
      toast.error("Failed to update admin email");
    }
  };

  const handleResetDefault = () => {
    const ok = updateAdminEmail("gauragupta0246@gmail.com");
    if (ok) {
      setNewEmail("gauragupta0246@gmail.com");
      toast.success("Admin email reset to default: gauragupta0246@gmail.com");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Change Admin Email"
          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
        >
          <Edit2 className="size-2.5" />
          <span>Change Email / बदलें</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-5 text-emerald-500" />
            Super Admin Profile &amp; Email Settings
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Configure the Super Admin email. This account has full privileges (editing all marks, merit list export, system resets).
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Super Admin Email Address</label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="gauragupta0246@gmail.com"
                className="pl-9 font-mono text-sm"
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Configured default: <code className="text-emerald-500 font-semibold">gauragupta0246@gmail.com</code>
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefault}
              className="text-xs"
            >
              Reset to Default
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              Save Email / सुरक्षित करें
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
    <div className={cn("inline-flex items-center gap-1 rounded-md border border-border p-0.5", className)}>
      <Languages className="mx-1 size-3.5 text-muted-foreground" />
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => langStore.set(l)}
          className={cn(
            "rounded px-2 py-1 text-[11px] font-medium transition-colors",
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {l === "en" ? "English" : "हिन्दी"}
        </button>
      ))}
    </div>
  );
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const t = useT();
  const { profile, isAdmin, isAuthenticated, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      toast.error("Please login to continue");
      navigate({ to: "/login" });
    }
  }, [mounted, isAuthenticated, navigate]);

  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen bg-muted/40" />;
  }

  // Role-based navigation: Employees cannot see "Audit Log"
  const visibleNav = ALL_NAV.filter((n) => !n.adminOnly || isAdmin);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-sm">{t("app.title")}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.subtitle")}</div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <n.icon className="size-4 shrink-0" />
                <span>{t(n.key)}</span>
                {n.adminOnly && (
                  <span className="ml-auto text-[9px] bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded font-mono">
                    ADMIN
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card in Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {isAdmin ? <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" /> : <UserCheck className="size-4 text-sky-600 dark:text-sky-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate text-sidebar-foreground">
                {profile?.full_name || profile?.email || "User"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{profile?.email}</div>
              {isAdmin && (
                <div className="mt-1">
                  <AdminEmailSettingsDialog />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-medium px-2 py-0.5",
                isAdmin
                  ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  : "border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/10"
              )}
            >
              {isAdmin ? "Teacher (Admin)" : "Staff (Employee)"}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              title="Logout"
            >
              <LogOut className="size-3.5 mr-1" />
              <span>Logout</span>
            </Button>
          </div>

          <div className="pt-2 border-t border-sidebar-border">
            <div className="px-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{t("lang.label")}</div>
            <LangSwitch className="w-full justify-start" />
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-2">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <GraduationCap className="size-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-xs truncate max-w-[120px]">{t("app.title")}</span>
        
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] px-1.5 py-0.2 shrink-0 font-medium",
            isAdmin
              ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
              : "border-sky-500/40 text-sky-600 bg-sky-500/10"
          )}
        >
          {isAdmin ? "Teacher (Admin)" : "Staff (Employee)"}
        </Badge>

        <div className="ml-auto flex items-center gap-1.5">
          {isAdmin && <AdminEmailSettingsDialog />}
          {isAdmin && <SubjectApprovalNotificationCenter />}
          <LangSwitch />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="size-8 text-muted-foreground hover:text-destructive cursor-pointer"
            title="Logout"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14 flex flex-col">
        {/* Desktop Top Header Bar with user & role */}
        <header className="hidden md:flex h-16 border-b border-border bg-background/80 backdrop-blur px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Badge
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-full border shadow-xs",
                isAdmin
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30"
              )}
            >
              {isAdmin ? "Teacher (Admin) Active" : "Staff (Employee) Active"}
            </Badge>

            <span className="text-xs text-muted-foreground">
              {isAdmin
                ? "Full administrative control: upload students, reconfigure exams, and access audit logs"
                : "Restricted mode: view-only dashboards, single-subject marks entry enabled"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && <SubjectApprovalNotificationCenter />}
            <div className="text-right">
              <div className="text-xs font-semibold leading-tight text-foreground flex items-center justify-end gap-1.5">
                <span>{profile?.full_name || profile?.email}</span>
                {isAdmin && <AdminEmailSettingsDialog />}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">{profile?.email}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-8 text-xs gap-1.5 hover:text-destructive hover:border-destructive/40 cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Logout</span>
            </Button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <div
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-sidebar border-t border-sidebar-border grid"
          style={{ gridTemplateColumns: `repeat(${visibleNav.length}, minmax(0,1fr))` }}
        >
          {visibleNav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center py-2 text-[10px] gap-1 cursor-pointer",
                  active ? "text-primary font-semibold" : "text-muted-foreground",
                )}
              >
                <n.icon className="size-4" />
                {t(n.key).split(" ")[0]}
              </Link>
            );
          })}
        </div>

        <div className="md:p-8 p-4 md:pb-8 pb-20 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
