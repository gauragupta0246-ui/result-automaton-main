import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Smart Exam Result Management System" },
      { name: "description", content: "Sign in to manage college examination results and student marks." },
      { property: "og:title", content: "Smart Exam Result System Login" },
    ],
  }),
  component: LoginPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, signInWithGoogle, signUp } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await signInWithPassword(email, password);
      if (res.success) {
        toast.success(
          `Welcome back! Logged in as ${res.role === "admin" ? "Teacher (Admin)" : "Staff (Employee)"}`,
        );
        toast.info(`Security login alert sent to ${email.trim()}`);
        navigate({ to: "/dashboard" });
      } else {
        toast.error(res.error || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error("Google Authentication failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) {
      toast.error("Please fill in all fields (Full Name, Email, Password)");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setLoading(true);
    try {
      // Backend enforces role = 'employee' strictly for all self-registrations
      const res = await signUp(email, password, fullName);
      if (res.success) {
        toast.success("Account created successfully as Staff (Employee)!");
        toast.info(`Security confirmation email dispatched to ${email.trim()}`);
        navigate({ to: "/dashboard" });
      } else {
        toast.error(res.error || "Sign up failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-2xl bg-primary/20 border border-primary/40 backdrop-blur items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="size-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Smart Exam Result System
          </h1>
          <p className="text-sm text-slate-400">
            Institutional Examination & Merit Management Portal
          </p>
        </div>

        {/* Main Auth Card */}
        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-3">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/80">
                <TabsTrigger value="login" className="text-xs cursor-pointer">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs cursor-pointer">
                  Create Account
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {/* Google Authentication Button */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-11 bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-white font-medium flex items-center justify-center gap-3 cursor-pointer shadow-sm transition"
              >
                <GoogleIcon className="size-5" />
                <span>
                  {activeTab === "login" ? "Sign in with Google" : "Sign up with Google"}
                </span>
              </Button>

              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold absolute">
                  or continue with credentials
                </span>
              </div>
            </div>

            {/* Email / Password Forms */}
            {activeTab === "login" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="e.g. faculty@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-slate-800/60 border-slate-700 text-white text-sm focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 bg-slate-800/60 border-slate-700 text-white text-sm focus:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white cursor-pointer h-10 font-semibold"
                >
                  {loading ? "Authenticating…" : "Sign In to Portal"}
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="e.g. Prof. Priya Verma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 bg-slate-800/60 border-slate-700 text-white text-sm focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Official Email</label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="e.g. staff@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-slate-800/60 border-slate-700 text-white text-sm focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 bg-slate-800/60 border-slate-700 text-white text-sm focus:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Institutional Security Notice (Automated First-User Super Admin) */}
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-800/50 flex items-start gap-2 text-slate-300 text-xs">
                  <ShieldCheck className="size-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Automated Role Provisioning</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The very first user who registers or signs in automatically receives Super Admin (Teacher) privileges. Subsequent users receive Staff (Employee) permissions.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white cursor-pointer h-10 font-semibold"
                >
                  {loading ? "Registering…" : "Create Faculty Account"}
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </form>
            )}

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-500">
                Secured with Google Cloud & Supabase Row-Level Security (RLS)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Student Portal shortcut ── */}
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.08] p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="size-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
            <GraduationCap className="size-5 text-sky-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-sm font-semibold text-white">Are you a student?</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              No login needed · Select exam, section &amp; roll number to view your result instantly
            </div>
          </div>
          <Link
            to="/student"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-sm shadow-sky-600/20"
          >
            Check My Result <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}