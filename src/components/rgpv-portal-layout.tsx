import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Phone,
  BookOpen,
  Calendar,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  HelpCircle,
  FileText,
  Building2,
  Award,
  Bell,
  Clock,
  FileCheck,
  Layers,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Official Circular Red & Gold RGPV Crest Logo ─────────────────────────────
export function RgpvEmblem({ className = "size-16" }: { className?: string }) {
  return (
    <img
      src="/rgpv-logo.png"
      alt="Rajiv Gandhi Proudyogiki Vishwavidyalaya Official Crest"
      className={`${className} object-contain`}
    />
  );
}

// ─── Top Thin Ribbon Utility Bar ──────────────────────────────────────────────
export function RgpvTopBar() {
  return (
    <div className="bg-[#002244] text-white text-[11px] border-b border-[#001830] select-none">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left Links */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="text-slate-300 hover:text-white hover:underline transition-colors focus:outline-none"
          >
            Skip to main content
          </a>

          <span className="text-slate-600">|</span>

          {/* Student Verification Quick Link */}
          <Link
            to="/student"
            className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 transition"
          >
            <GraduationCap className="size-3" />
            <span>Student Verification Gate</span>
          </Link>

          <span className="text-slate-600">|</span>

          {/* Create Your ABC ID Badge */}
          <a
            href="https://www.abc.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#003366] hover:bg-[#004080] text-white px-2 py-0.5 rounded-[2px] border border-sky-600/40 text-[10.5px] font-semibold transition"
          >
            <span className="size-3 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold">
              ID
            </span>
            <span>Create Your ABC ID</span>
            <span className="bg-[#b91c1c] text-white font-black text-[8px] px-1 rounded-[2px] leading-tight">
              NEW
            </span>
          </a>
        </div>

        {/* Right Links & Official Services */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Green Mobile App Badge */}
          <div className="inline-flex items-center gap-1 bg-[#15803d] hover:bg-[#166534] text-white px-2 py-0.5 rounded-[2px] font-bold text-[10.5px] shadow-xs cursor-pointer">
            <span className="text-yellow-200">मेरी दिनचर्या</span>
            <span className="text-white font-normal">@ RGPV Mobile App</span>
          </div>

          {/* YouTube Link */}
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition"
          >
            <span className="size-3.5 rounded-xs bg-red-600 text-white flex items-center justify-center font-bold text-[8px]">
              ▶
            </span>
            <span>YouTube</span>
          </a>

          <span className="text-slate-600">|</span>

          <Link
            to="/student"
            className="text-slate-200 hover:text-amber-300 font-medium transition"
          >
            Academic Record Verification
          </Link>

          <span className="text-slate-600">|</span>

          <div className="text-slate-300 flex items-center gap-1">
            <Phone className="size-2.5 text-amber-300" />
            <span>Helpdesk: <strong>1800-200-3926</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── University Brand Main Header ─────────────────────────────────────────────
export function RgpvBrandHeader() {
  const { profile, isAdmin, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="bg-white border-b border-[#d1d5db] py-3.5 px-4 shadow-xs">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Official Crest & Title */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <Link to="/dashboard" className="shrink-0 flex items-center justify-center">
            <RgpvEmblem className="size-16 sm:size-20 drop-shadow-xs" />
          </Link>

          <div className="space-y-0.5">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-widest font-black text-[#b91c1c]">
              STATE TECHNICAL UNIVERSITY OF MADHYA PRADESH
            </div>
            <h1 className="text-lg sm:text-2xl font-serif font-black tracking-tight text-[#003366] leading-tight">
              Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV)
            </h1>
            <div className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
              OFFICE OF THE CONTROLLER OF EXAMINATIONS &amp; EVALUATION AUTHORITY
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-2 pt-0.5">
              <span className="font-semibold text-[#003366]">Accredited with &apos;A&apos; Grade by NAAC</span>
              <span>·</span>
              <span>Airport Road, Gandhi Nagar, Bhopal (M.P.) - 462033</span>
            </div>
          </div>
        </div>

        {/* Right: Action Hub & Session Info */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 text-xs">
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="inline-flex items-center gap-1.5 bg-[#003366] text-white px-2.5 py-1 rounded-[2px] font-mono text-[11px] font-bold">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              SESSION: 2025–2026 (EVEN SEM)
            </span>
            <span className="text-[10.5px] text-slate-500 font-medium">
              Examination Cell Portal ID: <strong>RGPV-EXAM-V2</strong>
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#003366] truncate max-w-[150px]">
                  {profile?.full_name || profile?.email}
                </div>
                <Badge className="text-[9px] font-bold px-1.5 py-0 rounded-[2px] bg-[#b91c1c] text-white">
                  {isAdmin ? "Controller (Admin)" : "Faculty Evaluator"}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="h-8 px-2.5 text-xs text-[#b91c1c] border-[#b91c1c] hover:bg-[#b91c1c] hover:text-white rounded-[2px] font-bold cursor-pointer"
              >
                <LogOut className="size-3.5 mr-1" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/student"
                className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-bold bg-[#15803d] hover:bg-[#166534] text-white rounded-[2px] shadow-xs transition"
              >
                <GraduationCap className="size-3.5" />
                <span>Student Result Gate</span>
              </Link>
              <Link
                to="/login"
                className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-bold bg-[#003366] hover:bg-[#002244] text-white rounded-[2px] shadow-xs transition"
              >
                <ShieldCheck className="size-3.5 text-amber-300" />
                <span>Faculty Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Solid Royal Blue Navigation Bar With Crimson Maroon Highlights ──────────
export function RgpvNavbar({ activeRoute = "home" }: { activeRoute?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin, isAuthenticated } = useAuth();

  return (
    <nav className="bg-[#003366] text-white shadow-md relative z-20 border-b border-[#002244]">
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4 flex items-center justify-between">
        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center flex-wrap">
          {/* Home Tab - Maroon highlight when active */}
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-r border-[#002244] ${
              activeRoute === "home" || activeRoute === "dashboard"
                ? "bg-[#b91c1c] text-white shadow-inner"
                : "text-slate-100 hover:bg-[#002244]"
            }`}
          >
            <Home className="size-3.5" />
            <span>Home</span>
          </Link>

          {/* Marks Assessment Tab */}
          <Link
            to="/marks"
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-r border-[#002244] ${
              activeRoute === "marks"
                ? "bg-[#b91c1c] text-white shadow-inner"
                : "text-slate-100 hover:bg-[#002244]"
            }`}
          >
            <FileText className="size-3.5" />
            <span>Marks Entry &amp; Valuation</span>
          </Link>

          {/* Results Tab */}
          <Link
            to="/results"
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-r border-[#002244] ${
              activeRoute === "results"
                ? "bg-[#b91c1c] text-white shadow-inner"
                : "text-slate-100 hover:bg-[#002244]"
            }`}
          >
            <FileCheck className="size-3.5" />
            <span>Results &amp; Broad Sheet</span>
          </Link>

          {/* Student Gate Tab */}
          <Link
            to="/student"
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-r border-[#002244] ${
              activeRoute === "student"
                ? "bg-[#b91c1c] text-white shadow-inner"
                : "text-emerald-300 hover:bg-[#002244]"
            }`}
          >
            <GraduationCap className="size-3.5" />
            <span>Student Verification Gate</span>
          </Link>

          {/* Audit Logs Tab (Admin only) */}
          {isAdmin && (
            <Link
              to="/audit"
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-r border-[#002244] ${
                activeRoute === "audit"
                  ? "bg-[#b91c1c] text-white shadow-inner"
                  : "text-amber-300 hover:bg-[#002244]"
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>Audit Trail (Admin)</span>
            </Link>
          )}

          {/* The University Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-slate-100 hover:bg-[#002244] transition-colors font-medium border-r border-[#002244] cursor-pointer"
            >
              <span>The University</span>
              <ChevronDown className="size-3 opacity-70" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full w-60 bg-white text-[#111827] shadow-xl border border-slate-300 py-1 rounded-b-[2px] z-50">
              <div className="rgpv-category-header px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                Statutory Information
              </div>
              <div className="rgpv-sublink px-3 py-1.5">About RGPV Bhopal</div>
              <div className="rgpv-sublink px-3 py-1.5">Executive Council &amp; VC Desk</div>
              <div className="rgpv-sublink px-3 py-1.5">Statutes &amp; Academic Ordinances</div>
              <div className="rgpv-sublink px-3 py-1.5">NAAC &apos;A&apos; Grade Accreditation</div>
            </div>
          </div>

          {/* Academics Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-slate-100 hover:bg-[#002244] transition-colors font-medium border-r border-[#002244] cursor-pointer"
            >
              <span>Academics</span>
              <ChevronDown className="size-3 opacity-70" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full w-64 bg-white text-[#111827] shadow-xl border border-slate-300 py-1 rounded-b-[2px] z-50">
              <div className="rgpv-category-header px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                Programmes &amp; Evaluation
              </div>
              <Link to="/results" className="rgpv-sublink px-3 py-1.5">
                Grading System &amp; Schemes
              </Link>
              <Link to="/marks" className="rgpv-sublink px-3 py-1.5">
                Faculty Marks Entry Portal
              </Link>
              <div className="rgpv-sublink px-3 py-1.5">University Academic Calendar</div>
              <div className="rgpv-sublink px-3 py-1.5">B.Tech / B.Pharm Syllabus</div>
            </div>
          </div>

          {/* Admissions Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-slate-100 hover:bg-[#002244] transition-colors font-medium border-r border-[#002244] cursor-pointer"
            >
              <span>Admissions</span>
              <ChevronDown className="size-3 opacity-70" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full w-60 bg-white text-[#111827] shadow-xl border border-slate-300 py-1 rounded-b-[2px] z-50">
              <div className="rgpv-category-header px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                Enrollment &amp; Intake
              </div>
              <div className="rgpv-sublink px-3 py-1.5">DTE Online Counseling Portal</div>
              <div className="rgpv-sublink px-3 py-1.5">Centralized Seat Allotment</div>
              <div className="rgpv-sublink px-3 py-1.5">Eligibility Verification</div>
            </div>
          </div>

          {/* Student's Life Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-slate-100 hover:bg-[#002244] transition-colors font-medium border-r border-[#002244] cursor-pointer"
            >
              <span>Student&apos;s Life</span>
              <ChevronDown className="size-3 opacity-70" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full w-64 bg-white text-[#111827] shadow-xl border border-slate-300 py-1 rounded-b-[2px] z-50">
              <div className="rgpv-category-header px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                Student Examination Wing
              </div>
              <Link to="/student" className="rgpv-sublink px-3 py-1.5">
                Student Scorecard Verification Gate
              </Link>
              <div className="rgpv-sublink px-3 py-1.5">Examination Time Table &amp; Scheme</div>
              <div className="rgpv-sublink px-3 py-1.5">Admit Card &amp; Hall Ticket</div>
              <div className="rgpv-sublink px-3 py-1.5">2-Tier Grievance &amp; Re-Evaluation</div>
            </div>
          </div>

          {/* Governance Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-slate-100 hover:bg-[#002244] transition-colors font-medium border-r border-[#002244] cursor-pointer"
            >
              <span>Governance</span>
              <ChevronDown className="size-3 opacity-70" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full w-60 bg-white text-[#111827] shadow-xl border border-slate-300 py-1 rounded-b-[2px] z-50">
              <div className="rgpv-category-header px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                University Authority
              </div>
              <div className="rgpv-sublink px-3 py-1.5">Chancellor&apos;s Secretariat</div>
              <div className="rgpv-sublink px-3 py-1.5">Vice Chancellor&apos;s Desk</div>
              <div className="rgpv-sublink px-3 py-1.5">Office of Controller of Exams</div>
            </div>
          </div>

          {/* Affiliated Institutions Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-slate-100 hover:bg-[#002244] transition-colors font-medium border-r border-[#002244] cursor-pointer"
            >
              <span>Affiliated Institutions</span>
              <ChevronDown className="size-3 opacity-70" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full w-72 bg-white text-[#111827] shadow-xl border border-slate-300 py-1 rounded-b-[2px] z-50">
              <div className="rgpv-category-header px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                Engineering Colleges [Code 246]
              </div>
              <div className="rgpv-sublink px-3 py-1.5">Baderia Global Institute, Jabalpur</div>
              <div className="rgpv-sublink px-3 py-1.5">College Portal &amp; Sessional Status</div>
              <div className="rgpv-sublink px-3 py-1.5">Institutional Affiliation Search</div>
            </div>
          </div>
        </div>

        {/* Right Contact button */}
        <div className="flex items-center gap-2 py-1.5">
          <a
            href="mailto:exam-cell@univ.ac.in"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold rounded-[2px] transition cursor-pointer shadow-xs"
          >
            <Phone className="size-3" />
            <span>Contact Examination Cell</span>
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-white hover:bg-[#002244] rounded-[2px]"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#002244] border-t border-[#001830] px-4 py-3 space-y-2 text-xs">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-white font-bold border-b border-slate-700"
          >
            Home / Dashboard
          </Link>
          <Link
            to="/marks"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 border-b border-slate-700"
          >
            Marks Assessment
          </Link>
          <Link
            to="/results"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 border-b border-slate-700"
          >
            Published Results
          </Link>
          <Link
            to="/student"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-emerald-300 font-bold border-b border-slate-700"
          >
            🎓 Student Scorecard Verification Gate
          </Link>
          {isAdmin && (
            <Link
              to="/audit"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-amber-300 font-bold border-b border-slate-700"
            >
              🔒 Audit Trail (Admin)
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

// ─── RGPV-Style Solid Rectangular Quick Access 4-Tile Action Grid ─────────────
export function RgpvQuickAccessTiles() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
      {/* Tile 1: Examination Notification (Royal Blue #003366) */}
      <div className="bg-[#003366] text-white p-4 rounded-[2px] shadow-sm flex items-center justify-between border border-[#002244] hover:brightness-105 transition cursor-pointer">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-sky-200">
            OFFICIAL CIRCULAR
          </div>
          <div className="text-sm font-bold font-serif leading-tight">
            Examination Notification
          </div>
          <div className="text-[11px] text-slate-200">
            Mid-Sem &amp; PUT Session 2025–26
          </div>
        </div>
        <div className="size-11 rounded-[2px] bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <Bell className="size-6 text-white" />
        </div>
      </div>

      {/* Tile 2: Time Table / Scheme (Maroon Red #b91c1c) */}
      <div className="bg-[#b91c1c] text-white p-4 rounded-[2px] shadow-sm flex items-center justify-between border border-[#990000] hover:brightness-105 transition cursor-pointer">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-red-200">
            SCHEDULE &amp; DATES
          </div>
          <div className="text-sm font-bold font-serif leading-tight">
            Time Table / Scheme
          </div>
          <div className="text-[11px] text-red-100">
            B.Tech IV / VI Sem Schedule
          </div>
        </div>
        <div className="size-11 rounded-[2px] bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <Clock className="size-6 text-white" />
        </div>
      </div>

      {/* Tile 3: Results / Marksheet (Deep Navy #002244) */}
      <Link
        to="/results"
        className="bg-[#002244] text-white p-4 rounded-[2px] shadow-sm flex items-center justify-between border border-[#001830] hover:brightness-105 transition cursor-pointer"
      >
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
            INSTITUTIONAL GRADES
          </div>
          <div className="text-sm font-bold font-serif leading-tight">
            Results / Marksheet
          </div>
          <div className="text-[11px] text-slate-300">
            Broadsheet, Pass/Fail &amp; Rank
          </div>
        </div>
        <div className="size-11 rounded-[2px] bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <FileCheck className="size-6 text-amber-300" />
        </div>
      </Link>

      {/* Tile 4: Faculty & Valuation Portal (Crimson #990000) */}
      <Link
        to="/marks"
        className="bg-[#990000] text-white p-4 rounded-[2px] shadow-sm flex items-center justify-between border border-[#770000] hover:brightness-105 transition cursor-pointer"
      >
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
            MARKS ASSESSMENT
          </div>
          <div className="text-sm font-bold font-serif leading-tight">
            Faculty &amp; Valuation Portal
          </div>
          <div className="text-[11px] text-red-100">
            Enter Theory &amp; Sessional Marks
          </div>
        </div>
        <div className="size-11 rounded-[2px] bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <Layers className="size-6 text-amber-200" />
        </div>
      </Link>
    </div>
  );
}

// ─── Notice Board & Tabular Layout Split Container (RGPV Pattern) ────────────
export function RgpvNoticeBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {/* Left Container: IMPORTANT NOTICE (Maroon Header) */}
      <div className="bg-white border border-[#d1d5db] rounded-[2px] shadow-xs overflow-hidden">
        <div className="bg-[#b91c1c] text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-xs uppercase tracking-wider">
            <span className="size-2 rounded-full bg-white animate-ping" />
            <span>Important University Notices</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-[2px] font-mono">
            UPDATED TODAY
          </span>
        </div>

        <div className="p-3 divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-start gap-2 hover:bg-slate-50 transition cursor-pointer">
            <span className="text-[#b91c1c] font-black text-sm shrink-0">►</span>
            <div>
              <div className="font-bold text-[#003366] hover:underline">
                Order regarding submission of Mid-Sem &amp; PUT internal assessment marks for Session 2025–26.
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Date: 03 Nov 2026</span>
                <span>·</span>
                <span className="text-[#b91c1c] font-bold">Controller of Examinations</span>
              </div>
            </div>
          </div>

          <div className="py-2.5 flex items-start gap-2 hover:bg-slate-50 transition cursor-pointer">
            <span className="text-[#b91c1c] font-black text-sm shrink-0">►</span>
            <div>
              <div className="font-bold text-[#003366] hover:underline">
                Mandatory Live Camera Verification active for student scorecard access on university portal.
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Date: 02 Nov 2026</span>
                <span>·</span>
                <span>IT &amp; Examination Security Wing</span>
              </div>
            </div>
          </div>

          <div className="py-2.5 flex items-start gap-2 hover:bg-slate-50 transition cursor-pointer">
            <span className="text-[#b91c1c] font-black text-sm shrink-0">►</span>
            <div>
              <div className="font-bold text-[#003366] hover:underline">
                Notification regarding 2-Tier grievance redressal for totaling and re-evaluation requests.
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Date: 01 Nov 2026</span>
                <span>·</span>
                <span>Examination Appellate Body</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Container: EXAMINATION PORTAL LINKS (Navy Header) */}
      <div className="bg-white border border-[#d1d5db] rounded-[2px] shadow-xs overflow-hidden">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-xs uppercase tracking-wider">
            <Building2 className="size-4 text-amber-300" />
            <span>Examination Portal Links</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-[2px] font-mono">
            QUICK ACCESS
          </span>
        </div>

        <div className="p-3 divide-y divide-slate-100 text-xs">
          <Link
            to="/student"
            className="py-2.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[2px] bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                🎓
              </span>
              <div>
                <div className="font-bold text-[#003366]">Student Result Verification Gate</div>
                <div className="text-[10px] text-slate-500">Live selfie capture &amp; individual grade transcript</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
          </Link>

          <Link
            to="/marks"
            className="py-2.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[2px] bg-blue-100 text-[#003366] flex items-center justify-center font-bold text-xs">
                📝
              </span>
              <div>
                <div className="font-bold text-[#003366]">Faculty Marks Entry &amp; Approval</div>
                <div className="text-[10px] text-slate-500">Subject assignment, Excel import &amp; lock evaluation</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
          </Link>

          <Link
            to="/results"
            className="py-2.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[2px] bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                📊
              </span>
              <div>
                <div className="font-bold text-[#003366]">Broad Sheet &amp; Tabulation Register</div>
                <div className="text-[10px] text-slate-500">Section-wise pass/fail compilation &amp; toppers</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── 4 Campus Carousel Slides ────────────────────────────────────────────────
const CAMPUS_CAROUSEL_SLIDES = [
  {
    id: 1,
    src: "/campus-slide-1.png",
    alt: "Baderia Global Institute Campus Front Elevation",
  },
  {
    id: 2,
    src: "/campus-slide-2.jpg",
    alt: "University Campus Academic Block and Green Grounds",
  },
  {
    id: 3,
    src: "/campus-slide-3.png",
    alt: "Global Technical Campus Wide Panoramic View",
  },
  {
    id: 4,
    src: "/campus-slide-4.png",
    alt: "Global Engineering Institutional Building Complex",
  },
];

// ─── Panoramic Campus Hero Banner With Auto-Sliding 4-Image Carousel ──────────
export function RgpvHeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-scroll to the next slide every 3 seconds automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAMPUS_CAROUSEL_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAMPUS_CAROUSEL_SLIDES.length) % CAMPUS_CAROUSEL_SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAMPUS_CAROUSEL_SLIDES.length);
  };

  return (
    <div className="relative w-full bg-[#1b324f] overflow-hidden select-none border-b border-[#cbd5e1] group/hero">
      <div className="relative h-[220px] sm:h-[300px] md:h-[380px] lg:h-[430px] w-full overflow-hidden bg-slate-900">
        {/* Slides Horizontal Sliding Track */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {CAMPUS_CAROUSEL_SLIDES.map((slide, index) => (
            <div key={slide.id} className="w-full h-full shrink-0 relative bg-slate-900">
              <img
                src={slide.src}
                alt={slide.alt}
                loading={index === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}
        </div>

        {/* Previous Slide Arrow Control */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="opacity-0 group-hover/hero:opacity-100 transition-opacity absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center cursor-pointer z-20 backdrop-blur-xs border border-white/30 shadow-md"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Next Slide Arrow Control */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next Slide"
          className="opacity-0 group-hover/hero:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center cursor-pointer z-20 backdrop-blur-xs border border-white/30 shadow-md"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Clickable Carousel Pagination Dots With Active Highlight */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-900/65 backdrop-blur-xs px-3.5 py-1.5 rounded-full z-20 border border-white/20">
          {CAMPUS_CAROUSEL_SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === index
                  ? "w-7 bg-white shadow-xs ring-2 ring-white/60"
                  : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Left Red Vertical Tab: "HELP AND SUPPORT" ── */}
      <a
        href="tel:18002003926"
        title="Help and Support Helpline"
        className="fixed left-0 top-1/2 -translate-y-1/2 bg-[#b91c1c] hover:bg-[#990000] text-white text-[11px] font-bold py-3 px-1.5 rounded-r-[2px] shadow-lg flex flex-col items-center gap-2 cursor-pointer z-40 transition-transform hover:scale-105"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        <HelpCircle className="size-4 rotate-90" />
        <span className="tracking-wider uppercase">HELP AND SUPPORT</span>
      </a>

      {/* ── Right Magenta Vertical Tab: "DIARY / CALENDAR" ── */}
      <div
        title="University Academic Diary & Calendar"
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#9d174d] hover:bg-[#831843] text-white text-[11px] font-bold py-3 px-1.5 rounded-l-[2px] shadow-lg flex flex-col items-center gap-2 cursor-pointer z-40 transition-transform hover:scale-105"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        <Calendar className="size-4 -rotate-90" />
        <span className="tracking-wider uppercase">DIARY / CALENDAR</span>
      </div>

      {/* ── Bottom Right Accessibility Circle: "Ctrl+F2" ── */}
      <button
        type="button"
        title="Accessibility Settings (Press Ctrl+F2)"
        onClick={() => {
          document.body.classList.toggle("high-contrast-mode");
        }}
        className="fixed right-4 bottom-5 z-40 size-11 rounded-full bg-[#003366] hover:bg-[#002244] text-white flex flex-col items-center justify-center shadow-xl border-2 border-white cursor-pointer transition transform hover:scale-110"
      >
        <span className="text-[14px] leading-none">♿</span>
        <span className="text-[8px] font-bold font-mono tracking-tighter leading-tight mt-0.5">
          Ctrl+F2
        </span>
      </button>
    </div>
  );
}

// ─── Section Welcome Header With Wing Lines ──────────────────────────────────
export function RgpvWelcomeHeader({ title = "Welcome to Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV)" }: { title?: string }) {
  return (
    <div className="py-3 px-4 bg-white border-b border-[#d1d5db] text-center">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#003366] to-[#b91c1c]" />

        <h2 className="font-serif text-sm sm:text-lg md:text-xl font-black text-[#003366] tracking-tight shrink-0 px-2 uppercase">
          {title}
        </h2>

        <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-[#003366] to-[#b91c1c]" />
      </div>
    </div>
  );
}

// ─── Official Notification Marquee Ticker ────────────────────────────────────
export function RgpvNotificationTicker() {
  return (
    <div className="bg-[#fffbeb] border-y border-[#fde68a] text-[#92400e] text-xs font-semibold py-1.5 px-4 flex items-center gap-3 overflow-hidden shadow-xs">
      <span className="bg-[#b91c1c] text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-[2px] shrink-0 tracking-wider">
        URGENT NOTICE
      </span>
      <div className="truncate text-[11.5px]">
        📢 Academic Session 2025–2026: Mid-Sem and Pre-University Test (PUT) marks entry portal is active. All evaluators must finalize theory and sessional assessments. Live camera snapshot verification active on student scorecard portal.
      </div>
    </div>
  );
}

// ─── Official University Footer ──────────────────────────────────────────────
export function RgpvFooter() {
  return (
    <footer className="bg-[#002244] text-slate-300 border-t-4 border-[#b91c1c] pt-6 pb-4 mt-auto text-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-700">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <RgpvEmblem className="size-8 shrink-0" />
              <span>RGPV Bhopal</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rajiv Gandhi Proudyogiki Vishwavidyalaya, Airport Road, Gandhi Nagar, Bhopal (M.P.) - 462033.
              Statutory State Technological University established under M.P. Act No. 13 of 1998.
            </p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="text-white font-bold uppercase tracking-wider text-xs">
              Examination Cell
            </div>
            <div className="text-slate-400">Office of the Controller of Examinations</div>
            <div className="text-slate-400">Toll Free: 1800-200-3926</div>
            <div className="text-slate-400">Email: exam-cell@univ.ac.in</div>
            <div className="text-slate-400">2-Tier Grievance &amp; Re-Evaluation Portal</div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="text-white font-bold uppercase tracking-wider text-xs">
              Quick Portals
            </div>
            <div>
              <Link to="/student" className="text-amber-400 hover:underline">
                Student Result Verification Gate
              </Link>
            </div>
            <div>
              <Link to="/login" className="text-slate-300 hover:underline">
                Faculty &amp; Evaluator Login
              </Link>
            </div>
            <div>
              <Link to="/results" className="text-slate-300 hover:underline">
                Broadsheet &amp; Published Results
              </Link>
            </div>
            <div>
              <a href="https://www.abc.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:underline">
                Academic Bank of Credits (ABC)
              </a>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="text-white font-bold uppercase tracking-wider text-xs">
              Statutory Compliance
            </div>
            <div className="text-slate-400">NAAC &apos;A&apos; Accredited State University</div>
            <div className="text-slate-400">AICTE Approved Programmes</div>
            <div className="text-slate-400">Cyber Audit &amp; Data Security ISO 27001</div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV), Bhopal. All Rights Reserved.
          </div>
          <div className="flex gap-3">
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Use</span>
            <span>·</span>
            <span>Hyperlinking Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
