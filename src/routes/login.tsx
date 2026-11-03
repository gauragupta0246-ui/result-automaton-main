import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Phone,
  Landmark,
  FileCheck2,
  GraduationCap,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  RgpvTopBar,
  RgpvBrandHeader,
  RgpvNavbar,
  RgpvHeroBanner,
  RgpvWelcomeHeader,
  RgpvNotificationTicker,
  RgpvFooter,
} from "@/components/rgpv-portal-layout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Faculty & Officer Login — Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV)" },
      {
        name: "description",
        content:
          "Official Examination & Faculty Authentication Portal. Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal (M.P.).",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const {
    signInWithPassword,
    sendEmailOtp,
    verifyEmailOtp,
    signUp,
    loginAsAdmin,
    loginAsStaff,
  } = useAuth();

  // Mode: "otp" (Default & recommended) | "password" | "signup"
  const [authMode, setAuthMode] = useState<"otp" | "password" | "signup">("otp");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP specific states
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [lastDispatchedOtp, setLastDispatchedOtp] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Instant Demo Logins
  const handleInstantDemoAdmin = () => {
    loginAsAdmin();
    toast.success("Authenticated as Super Admin (Controller of Examinations)!");
    navigate({ to: "/dashboard" });
  };

  const handleInstantDemoStaff = () => {
    loginAsStaff();
    toast.success("Authenticated as Faculty Evaluator (Staff)!");
    navigate({ to: "/dashboard" });
  };

  const handleAutofillAdmin = () => {
    setEmail("gauragupta0246@gmail.com");
    setPassword("admin123");
    toast.info("Auto-filled Super Admin credentials");
  };

  const handleAutofillStaff = () => {
    setEmail("staff@smart.edu");
    setPassword("staff123");
    toast.info("Auto-filled Faculty credentials");
  };

  // ─── Step 1: Send 6-Digit Email Verification Code (OTP) ─────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid official/institutional email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res.success && res.code) {
        setOtpSent(true);
        setCountdown(60);
        setLastDispatchedOtp(res.code);
        toast.success(
          `Verification code sent to ${cleanEmail}! Check your inbox or use code: ${res.code}`,
          { duration: 10000 }
        );
      } else {
        toast.error(res.error || "Failed to dispatch verification code.");
      }
    } catch {
      toast.error("Failed to dispatch verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify 6-Digit Code & Sign In ───────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otpCode.trim()) {
      toast.error("Please enter both email and the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailOtp(email, otpCode);
      if (res.success) {
        toast.success(
          `Welcome to RGPV Portal! Authenticated as ${
            res.role === "admin"
              ? "Super Admin (Controller of Examinations)"
              : "Faculty Evaluator (Staff)"
          }`
        );
        navigate({ to: "/dashboard" });
      } else {
        toast.error(res.error || "Invalid verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Traditional Password Sign In ──────────────────────────────────────────
  const handleSignInPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both official email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await signInWithPassword(email, password);
      if (res.success) {
        toast.success(
          `Authenticated successfully as ${
            res.role === "admin"
              ? "Controller of Examinations (Admin)"
              : "Faculty Evaluator (Staff)"
          }`
        );
        navigate({ to: "/dashboard" });
      } else {
        toast.error(res.error || "Authentication failed. Please check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Faculty Account Registration ──────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) {
      toast.error("Please fill in all fields (Full Name, Official Email, Password)");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setLoading(true);
    try {
      const res = await signUp(email, password, fullName);
      if (res.success) {
        toast.success("Faculty account created and authenticated successfully!");
        navigate({ to: "/dashboard" });
      } else {
        toast.error(res.error || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#0f172a] flex flex-col font-sans">
      {/* ── Official RGPV Header Suite ── */}
      <RgpvTopBar />
      <RgpvBrandHeader />
      <RgpvNavbar activeRoute="login" />
      <RgpvNotificationTicker />
      <RgpvHeroBanner />
      <RgpvWelcomeHeader title="Welcome to Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV)" />

      {/* ── Main Login Container ── */}
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg space-y-4">
          
          {/* Quick Demo Credentials Panel */}
          <div className="bg-white border border-[#cbd5e1] rounded-[4px] p-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
              <span className="text-xs font-bold text-[#002147] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#b45309]" />
                Instant Demo Access (Testing Mode)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.5 rounded-[2px]">
                Instant Login
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleInstantDemoAdmin}
                className="h-9 bg-[#002147] hover:bg-[#003875] text-white text-xs font-semibold rounded-[4px] cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="size-3.5 text-amber-300" />
                <span>1-Click Controller of Exams</span>
              </Button>

              <Button
                type="button"
                onClick={handleInstantDemoStaff}
                className="h-9 bg-[#334155] hover:bg-[#1e293b] text-white text-xs font-semibold rounded-[4px] cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <User className="size-3.5 text-sky-300" />
                <span>1-Click Faculty Evaluator</span>
              </Button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-1.5 text-[11px] text-[#475569]">
              <span>Auto-fill test credentials:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAutofillAdmin}
                  className="text-[#002147] hover:underline font-semibold cursor-pointer"
                >
                  Admin
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleAutofillStaff}
                  className="text-[#334155] hover:underline font-semibold cursor-pointer"
                >
                  Faculty
                </button>
              </div>
            </div>
          </div>

          {/* ── Main Authentication Card ── */}
          <Card className="bg-white border border-[#cbd5e1] rounded-[4px] shadow-sm border-t-4 border-t-[#002147]">
            {/* Header Title inside card */}
            <div className="p-4 sm:p-5 pb-3 border-b border-[#cbd5e1] bg-[#fafbfd]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-lg text-[#002147]">
                    {authMode === "otp"
                      ? "SECURE EMAIL OTP VERIFICATION"
                      : authMode === "password"
                      ? "FACULTY & OFFICER PASSWORD SIGN IN"
                      : "FACULTY ACCOUNT REGISTRATION"}
                  </h2>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Authorized examination personnel and faculty evaluators of RGPV Bhopal.
                  </p>
                </div>
                <FileCheck2 className="size-8 text-[#002147] opacity-80" />
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-3 gap-1 mt-4 p-1 bg-[#e2e8f0] rounded-[4px]">
                <button
                  type="button"
                  onClick={() => setAuthMode("otp")}
                  className={`py-1.5 text-xs font-bold rounded-[3px] transition cursor-pointer text-center ${
                    authMode === "otp"
                      ? "bg-white text-[#002147] shadow-xs"
                      : "text-[#475569] hover:text-[#002147]"
                  }`}
                >
                  Email OTP Code
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("password")}
                  className={`py-1.5 text-xs font-bold rounded-[3px] transition cursor-pointer text-center ${
                    authMode === "password"
                      ? "bg-white text-[#002147] shadow-xs"
                      : "text-[#475569] hover:text-[#002147]"
                  }`}
                >
                  Portal Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`py-1.5 text-xs font-bold rounded-[3px] transition cursor-pointer text-center ${
                    authMode === "signup"
                      ? "bg-white text-[#002147] shadow-xs"
                      : "text-[#475569] hover:text-[#002147]"
                  }`}
                >
                  New Faculty
                </button>
              </div>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* ── TAB 1: EMAIL OTP AUTHENTICATION (DEFAULT) ── */}
              {authMode === "otp" && (
                <div className="space-y-4">
                  {/* Step 1: Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#002147] uppercase tracking-wider">
                      Official Institutional Email *
                    </label>
                    <div className="relative">
                      <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="e.g. gauragupta0246@gmail.com or faculty@univ.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={otpSent && loading}
                        className="pl-9 bg-white border-[#cbd5e1] text-[#0f172a] text-sm rounded-[4px] h-10 focus:border-[#002147] focus:ring-1 focus:ring-[#002147]"
                        required
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    /* Send OTP Button */
                    <Button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading || !email.trim()}
                      className="w-full bg-[#002147] hover:bg-[#003875] text-white cursor-pointer h-10 rounded-[4px] font-bold text-sm tracking-wide shadow-sm"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="size-4 animate-spin" />
                          Sending Verification Code…
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="size-4 text-amber-300" />
                          Send 6-Digit Verification Code to Email
                        </span>
                      )}
                    </Button>
                  ) : (
                    /* Step 2: Verification Code Input & Submit */
                    <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                      {/* Alert banner displaying code */}
                      <div className="p-3 rounded-[4px] border border-emerald-300 bg-emerald-50 text-xs text-emerald-950 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          <span>Verification Code Dispatched!</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          A 6-digit login verification code was sent to{" "}
                          <strong>{email}</strong>.
                        </p>
                        {lastDispatchedOtp && (
                          <div className="mt-1 pt-1 border-t border-emerald-200 flex items-center justify-between text-[11px]">
                            <span>Direct Test Verification Code:</span>
                            <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">
                              {lastDispatchedOtp}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 6-Digit OTP Code Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#002147] uppercase tracking-wider">
                            Enter 6-Digit Code *
                          </label>
                          <span className="text-[11px] text-[#475569]">
                            {countdown > 0 ? (
                              <span>Resend in {countdown}s</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendOtp()}
                                className="text-[#002147] hover:underline font-bold cursor-pointer"
                              >
                                Resend Code
                              </button>
                            )}
                          </span>
                        </div>

                        <div className="relative">
                          <KeyRound className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="text"
                            maxLength={6}
                            placeholder="e.g. 123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                            className="pl-9 font-mono tracking-widest text-base font-bold bg-white border-[#cbd5e1] text-[#0f172a] rounded-[4px] h-11 focus:border-[#002147] focus:ring-1 focus:ring-[#002147]"
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode("");
                          }}
                          className="h-10 text-xs border-[#cbd5e1] text-[#475569] rounded-[4px]"
                        >
                          Change Email
                        </Button>

                        <Button
                          type="submit"
                          disabled={loading || otpCode.length < 4}
                          className="flex-1 bg-[#002147] hover:bg-[#003875] text-white cursor-pointer h-10 rounded-[4px] font-bold text-sm tracking-wide shadow-sm"
                        >
                          {loading ? "Verifying Code…" : "Verify Code & Sign In"}
                          <ArrowRight className="size-4 ml-1.5" />
                        </Button>
                      </div>
                    </form>
                  )}

                  <div className="text-[11px] text-[#475569] bg-slate-50 p-2.5 rounded-[4px] border border-slate-200">
                    ℹ️ <strong>RGPV Security Note:</strong> No password is required. The 1st verified user is automatically assigned <strong>Controller of Examinations (Super Admin)</strong>. Subsequent faculty are provisioned as <strong>Evaluator (Staff)</strong>.
                  </div>
                </div>
              )}

              {/* ── TAB 2: TRADITIONAL PASSWORD SIGN IN ── */}
              {authMode === "password" && (
                <form onSubmit={handleSignInPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#002147] uppercase tracking-wider">
                      Official Email ID *
                    </label>
                    <div className="relative">
                      <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="e.g. gauragupta0246@gmail.com or staff@smart.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 bg-white border-[#cbd5e1] text-[#0f172a] text-sm rounded-[4px] h-10 focus:border-[#002147] focus:ring-1 focus:ring-[#002147]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#002147] uppercase tracking-wider">
                        Portal Password *
                      </label>
                      <span className="text-[11px] text-[#475569]">Default: admin123 / staff123</span>
                    </div>
                    <div className="relative">
                      <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9 bg-white border-[#cbd5e1] text-[#0f172a] text-sm rounded-[4px] h-10 focus:border-[#002147] focus:ring-1 focus:ring-[#002147]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#002147] hover:bg-[#003875] text-white cursor-pointer h-10 rounded-[4px] font-bold text-sm tracking-wide shadow-sm"
                  >
                    {loading ? "Authenticating Against Portal…" : "Sign In to Examination Portal"}
                    <ArrowRight className="size-4 ml-1.5" />
                  </Button>
                </form>
              )}

              {/* ── TAB 3: NEW FACULTY REGISTRATION ── */}
              {authMode === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#002147] uppercase tracking-wider">
                      Full Name &amp; Academic Designation *
                    </label>
                    <div className="relative">
                      <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="e.g. Prof. Priya Verma (Assistant Professor)"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 bg-white border-[#cbd5e1] text-[#0f172a] text-sm rounded-[4px] h-10 focus:border-[#002147] focus:ring-1 focus:ring-[#002147]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#002147] uppercase tracking-wider">
                      Official Institutional Email *
                    </label>
                    <div className="relative">
                      <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="e.g. priya.verma@institution.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 bg-white border-[#cbd5e1] text-[#0f172a] text-sm rounded-[4px] h-10 focus:border-[#002147] focus:ring-1 focus:ring-[#002147]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#002147] uppercase tracking-wider">
                      Create Password (Minimum 6 characters) *
                    </label>
                    <div className="relative">
                      <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9 bg-white border-[#cbd5e1] text-[#0f172a] text-sm rounded-[4px] h-10 focus:border-[#002147] focus:ring-1 focus:ring-[#002147]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#002147] hover:bg-[#003875] text-white cursor-pointer h-10 rounded-[4px] font-bold text-sm tracking-wide shadow-sm"
                  >
                    {loading ? "Registering Faculty Account…" : "Register Faculty Account"}
                    <ArrowRight className="size-4 ml-1.5" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* ── Student Portal Callout Box ── */}
          <div className="bg-white border-2 border-dashed border-[#002147] rounded-[4px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="size-10 rounded-[4px] bg-[#e8eef6] border border-[#cbd5e1] flex items-center justify-center shrink-0">
                <GraduationCap className="size-5 text-[#002147]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#002147] font-serif">
                  Are You a Student Looking for Your Result?
                </div>
                <div className="text-[11px] text-[#475569]">
                  No login required · Live camera snapshot verification gate · Individual scorecard
                </div>
              </div>
            </div>

            <Link
              to="/student"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Go to Student Portal <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Security Disclaimer */}
          <div className="text-center text-[11px] text-[#64748b] space-y-1">
            <p>
              🔒 <strong>Audit Notice:</strong> Unauthorized access attempts are flagged and logged under statutory university examination cybersecurity guidelines.
            </p>
            <p>
              Rajiv Gandhi Proudyogiki Vishwavidyalaya · Office of the Controller of Examinations, Bhopal
            </p>
          </div>
        </div>
      </main>

      {/* Official Footer */}
      <RgpvFooter />
    </div>
  );
}