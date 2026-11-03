import { useState, useMemo } from "react";
import {
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileQuestion,
  ChevronDown,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { StudentResult, ExamType } from "@/lib/exam-store";
import { SUBJECTS, SUBJECT_NAMES, EXAM_LABELS } from "@/lib/exam-store";
import {
  submitStudentGrievance,
  getStudentGrievances,
  countSubjectGrievanceAttempts,
  type GrievanceCategory,
  type GrievanceTicket,
} from "@/lib/student-grievance";

interface StudentAiGrievanceWidgetProps {
  result: StudentResult;
  allResults: StudentResult[];
  examType: ExamType;
}

export function StudentAiGrievanceWidget({
  result,
  allResults,
  examType,
}: StudentAiGrievanceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"explainer" | "grievance" | "tickets">("explainer");

  // Grievance Form State
  const [selectedSubject, setSelectedSubject] = useState<any>(SUBJECTS[0]);
  const [category, setCategory] = useState<GrievanceCategory>("Totaling Error");
  const [otherText, setOtherText] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<GrievanceTicket[]>(() =>
    getStudentGrievances(result.student.roll, examType)
  );

  // Chat Q&A state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { sender: "user" | "ai"; text: string; time: string }[]
  >([]);

  // 1. Calculate Analytics for AI Explainer
  const analysis = useMemo(() => {
    // Find lowest subject
    let lowestSub = SUBJECTS[0];
    let lowestMark = 999;
    SUBJECTS.forEach((sub) => {
      const mark = result.marks[sub];
      if (typeof mark === "number" && mark < lowestMark) {
        lowestMark = mark;
        lowestSub = sub;
      }
    });

    // Calculate Percentile: (% of students scored strictly below this student)
    const totalStudents = allResults.length;
    const lowerCount = allResults.filter((r) => r.total < result.total).length;
    const percentile = totalStudents > 1 ? Math.round((lowerCount / (totalStudents - 1)) * 100) : 100;

    return {
      lowestSub,
      lowestSubName: SUBJECT_NAMES[lowestSub],
      lowestMark,
      percentile,
      isPass: result.pass,
      percentage: result.pct,
    };
  }, [result, allResults]);

  // Check attempt count for currently selected subject
  const currentAttempts = useMemo(() => {
    return countSubjectGrievanceAttempts(result.student.roll, examType, selectedSubject);
  }, [result.student.roll, examType, selectedSubject, tickets]);

  const nextTier = currentAttempts >= 1 ? "Tier-2" : "Tier-1";

  // Handle Grievance Submission
  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please enter specific details regarding your dispute.");
      return;
    }
    if (category === "Other" && !otherText.trim()) {
      toast.error("Please specify your dispute category.");
      return;
    }

    setSubmitting(true);
    try {
      const fullDescription =
        category === "Other"
          ? `[Category: ${otherText.trim()}] ${description.trim()}`
          : description.trim();

      const newTicket = await submitStudentGrievance({
        rollNo: result.student.roll,
        studentName: result.student.name,
        section: result.student.section,
        examType,
        subjectCode: selectedSubject,
        category,
        description: fullDescription,
      });

      setTickets(getStudentGrievances(result.student.roll, examType));
      setDescription("");
      setOtherText("");
      setActiveTab("tickets");

      if (newTicket.attemptNumber >= 2) {
        toast.warning(
          `Repeat Query Submitted: Automatically ESCALATED to Controller of Examinations (Tier-2)! Ticket: ${newTicket.id}`
        );
      } else {
        toast.success(
          `Grievance registered and routed to Subject Evaluator (Tier-1)! Ticket: ${newTicket.id}`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Q&A Handlers
  const handleQuickQuestion = (q: string) => {
    let answer = "";
    if (q.includes("lowest")) {
      answer = `Your lowest score is in ${analysis.lowestSub} (${analysis.lowestSubName}) with ${analysis.lowestMark} marks. You need to focus on core concepts, previous year question papers, and numerical problems in this paper. You can also apply for re-evaluation if you suspect totaling errors.`;
    } else if (q.includes("Percentile") || q.includes("percentile")) {
      answer = `Your class percentile is ${analysis.percentile}th percentile. This means your score of ${result.total}/${result.maxTotal} (${analysis.percentage.toFixed(1)}%) is equal to or higher than ${analysis.percentile}% of students in this examination cohort!`;
    } else if (q.includes("Passing") || q.includes("passing")) {
      answer = `The statutory university passing requirement is a minimum of 33% marks in each individual subject theory and 40% aggregate overall. ${
        analysis.isPass
          ? "Congratulations! You have satisfied all passing criteria."
          : "You currently have ATKT / Fail in 1 or more subjects. You are eligible for improvement / supplementary examination."
      }`;
    } else {
      answer = `For examination queries, grading rubrics, or totaling disputes, you can use the 'Raise Mark Query' tab. Queries are handled by the course teacher in Tier-1 and escalate to the Controller of Examinations if unresolved.`;
    }

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", text: q, time },
      { sender: "ai", text: answer, time },
    ]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput("");
    handleQuickQuestion(q);
  };

  return (
    <>
      {/* ── Bottom Right Floating Action Trigger ── */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#003366] hover:bg-[#002244] text-white border-2 border-[#b91c1c] rounded-[2px] px-3.5 py-2.5 shadow-xl flex items-center gap-2 cursor-pointer transition transform active:scale-95"
        >
          <Sparkles className="size-4 text-amber-300" />
          <span className="text-xs font-bold tracking-wide">
            AI Explainer &amp; Grievance Cell
          </span>
          {tickets.length > 0 && (
            <span className="bg-[#b91c1c] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {tickets.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Slide-up / Popover Dialog ── */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[460px] max-h-[85vh] flex flex-col bg-white border-2 border-[#003366] rounded-[2px] shadow-2xl overflow-hidden font-sans">
          {/* Official Top Bar */}
          <div className="bg-[#003366] text-white p-3.5 flex items-center justify-between border-b-2 border-[#b91c1c]">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-[2px] bg-[#b91c1c] text-white flex items-center justify-center font-bold text-xs">
                🏛️
              </div>
              <div>
                <h3 className="font-serif font-bold text-xs sm:text-sm tracking-wide text-white leading-tight">
                  ACADEMIC ADVISOR &amp; GRIEVANCE CELL
                </h3>
                <div className="text-[10px] text-slate-300">
                  Roll: {result.student.roll} · {result.student.name}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-[2px] cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 bg-[#e8eef6] border-b border-[#cbd5e1] p-1 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("explainer")}
              className={`py-1.5 rounded-[3px] text-center transition cursor-pointer ${
                activeTab === "explainer"
                  ? "bg-white text-[#0b2545] shadow-xs"
                  : "text-[#475569] hover:text-[#0b2545]"
              }`}
            >
              🤖 AI Explainer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("grievance")}
              className={`py-1.5 rounded-[3px] text-center transition cursor-pointer ${
                activeTab === "grievance"
                  ? "bg-white text-[#0b2545] shadow-xs"
                  : "text-[#475569] hover:text-[#0b2545]"
              }`}
            >
              ⚖️ Raise Query
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tickets")}
              className={`py-1.5 rounded-[3px] text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "tickets"
                  ? "bg-white text-[#0b2545] shadow-xs"
                  : "text-[#475569] hover:text-[#0b2545]"
              }`}
            >
              <span>📋 My Tickets</span>
              {tickets.length > 0 && (
                <span className="bg-[#0b2545] text-white text-[9px] px-1.5 rounded-full">
                  {tickets.length}
                </span>
              )}
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4 max-h-[55vh] text-xs">
            {/* ── TAB 1: AI EXPLAINER ── */}
            {activeTab === "explainer" && (
              <div className="space-y-3.5">
                {/* 1. Lowest Mark Diagnosis Card */}
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[4px] p-3 text-[#92400e] space-y-1">
                  <div className="flex items-center justify-between font-bold text-xs text-[#78350f]">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 text-[#b45309]" />
                      Lowest Scored Subject Analysis
                    </span>
                    <Badge variant="outline" className="border-[#b45309] text-[#b45309] text-[10px]">
                      {analysis.lowestSub}
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    You obtained <strong>{analysis.lowestMark} marks</strong> in{" "}
                    <strong>{analysis.lowestSubName}</strong>. If you feel there was an omission in evaluation or totaling discrepancy, you can raise an official query through the Grievance tab.
                  </p>
                </div>

                {/* 2. Percentile & Passing Encouragement */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[4px] p-2.5">
                    <div className="text-[10px] uppercase font-bold text-[#166534]">Class Percentile</div>
                    <div className="text-xl font-bold text-[#15803d] font-mono mt-0.5">
                      {analysis.percentile}th %ile
                    </div>
                    <div className="text-[9px] text-[#166534] mt-0.5">Ahead of {analysis.percentile}% students</div>
                  </div>

                  <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[4px] p-2.5">
                    <div className="text-[10px] uppercase font-bold text-[#1e40af]">Passing Status</div>
                    <div
                      className={`text-xl font-bold font-mono mt-0.5 ${
                        analysis.isPass ? "text-[#15803d]" : "text-[#b91c1c]"
                      }`}
                    >
                      {analysis.isPass ? "QUALIFIED" : "ATKT / SUPP"}
                    </div>
                    <div className="text-[9px] text-[#1e40af] mt-0.5">
                      {analysis.isPass ? "All subjects cleared ✓" : "Requires Re-evaluation"}
                    </div>
                  </div>
                </div>

                {/* 3. Encouragement Advice */}
                <div className="p-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-[4px] text-[11px] text-[#334155] leading-relaxed">
                  🎓 <strong>Academic Encouragement:</strong> Your aggregate score of{" "}
                  <strong>{analysis.percentage.toFixed(1)}%</strong> demonstrates solid fundamental grasp. Maintaining consistent daily revision and strengthening practical application will propel your rank into the top tier for upcoming university examinations.
                </div>

                {/* 4. Quick Explainer Questions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                    Ask Academic Advisor:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Explain my lowest subject score",
                      "How is my class percentile calculated?",
                      "What are the official passing criteria?",
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickQuestion(q)}
                        className="text-[10px] bg-[#e8eef6] hover:bg-[#d0e0f2] text-[#0b2545] px-2 py-1 rounded-[3px] border border-[#cbd5e1] font-medium cursor-pointer transition text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Chat History */}
                {chatHistory.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#cbd5e1]">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-[4px] ${
                          msg.sender === "user"
                            ? "bg-[#e2e8f0] text-[#0f172a] ml-4 font-semibold"
                            : "bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] mr-4 leading-relaxed"
                        }`}
                      >
                        <div className="text-[9px] opacity-70 mb-0.5">
                          {msg.sender === "user" ? "You" : "🤖 University Advisor"} · {msg.time}
                        </div>
                        <div>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1">
                  <Input
                    type="text"
                    placeholder="Ask a question regarding your scorecard…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="h-8 text-xs bg-white border-[#cbd5e1] rounded-[4px]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-3 bg-[#0b2545] hover:bg-[#133966] text-white rounded-[4px] cursor-pointer"
                  >
                    <Send className="size-3" />
                  </Button>
                </form>
              </div>
            )}

            {/* ── TAB 2: RAISE MARK QUERY (TWO-TIER GRIEVANCE) ── */}
            {activeTab === "grievance" && (
              <form onSubmit={handleSubmitGrievance} className="space-y-3">
                {/* Two-Tier Routing Notice Banner */}
                <div
                  className={`p-2.5 rounded-[4px] border text-xs ${
                    nextTier === "Tier-2"
                      ? "bg-[#fef2f2] border-[#fecaca] text-[#991b1b]"
                      : "bg-[#f0f9ff] border-[#bae6fd] text-[#0369a1]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {nextTier === "Tier-2" ? (
                      <ShieldAlert className="size-4 text-[#991b1b]" />
                    ) : (
                      <CheckCircle2 className="size-4 text-[#0284c7]" />
                    )}
                    <span>
                      {nextTier === "Tier-2"
                        ? "ESCALATION TIER-2: Controller of Examinations"
                        : "DISPUTE ROUTING TIER-1: Assigned Subject Evaluator"}
                    </span>
                  </div>
                  <p className="text-[10px] mt-1 leading-snug">
                    {nextTier === "Tier-2"
                      ? `You have previously submitted ${currentAttempts} query for this subject. This dispute will be escalated directly to the Controller of Examinations for statutory investigation.`
                      : `Initial queries route directly to the designated faculty evaluator for prompt score re-verification.`}
                  </p>
                </div>

                {/* Subject Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0b2545] uppercase">
                    Select Subject for Dispute *
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as any)}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#cbd5e1] rounded-[4px] font-medium text-[#0f172a]"
                  >
                    {SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub} — {SUBJECT_NAMES[sub]} (Marks: {result.marks[sub] ?? "—"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5 Standard University Dispute Categories */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0b2545] uppercase">
                    Dispute Category (5 Standard Categories) *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#cbd5e1] rounded-[4px] font-medium text-[#0f172a]"
                  >
                    <option value="Totaling Error">1. Totaling Error (टोटलिंग त्रुटि)</option>
                    <option value="Re-evaluation">2. Re-evaluation (पुनर्मूल्यांकन)</option>
                    <option value="Marked Absent">3. Marked Absent (अनुपस्थित दर्ज)</option>
                    <option value="Sessional Marks Missing">4. Sessional Marks Missing (सेशनल अंक अनुपलब्ध)</option>
                    <option value="Wrong Subject">5. Wrong Subject (गलत विषय आवंटन)</option>
                    <option value="Other">6. Other (अन्य कारण)</option>
                  </select>
                </div>

                {/* Other details text input if Other is picked */}
                {category === "Other" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#0b2545]">
                      Specify Other Category *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Practical viva marks not reflected"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      className="h-8 text-xs bg-white border-[#cbd5e1] rounded-[4px]"
                      required
                    />
                  </div>
                )}

                {/* Description Textarea */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0b2545] uppercase">
                    Description &amp; Specific Question Details *
                  </label>
                  <Textarea
                    placeholder="Provide specific details (e.g. Question 3 totaling omitted, answered in supplementary sheet, etc.)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="text-xs bg-white border-[#cbd5e1] rounded-[4px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className={`w-full h-9 text-xs font-bold rounded-[4px] text-white cursor-pointer ${
                    nextTier === "Tier-2"
                      ? "bg-[#991b1b] hover:bg-[#7f1d1d]"
                      : "bg-[#0b2545] hover:bg-[#133966]"
                  }`}
                >
                  {submitting
                    ? "Dispatching Ticket…"
                    : nextTier === "Tier-2"
                    ? "Escalate Query to Controller (Tier-2)"
                    : "Submit Query to Faculty (Tier-1)"}
                </Button>
              </form>
            )}

            {/* ── TAB 3: TICKETS AUDIT LOG ── */}
            {activeTab === "tickets" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#cbd5e1]">
                  <span className="text-xs font-bold text-[#0b2545]">
                    Your Submitted Grievance Tickets
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    {tickets.length} total logged
                  </span>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 space-y-1">
                    <BookOpen className="size-8 mx-auto opacity-40 text-[#0b2545]" />
                    <p className="font-semibold text-xs text-[#0f172a]">No Grievances Raised</p>
                    <p className="text-[10px]">
                      If you notice any marks totaling or assessment error, use the 'Raise Query' tab.
                    </p>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      className="border border-[#cbd5e1] rounded-[4px] p-2.5 bg-white space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-[#0b2545]">
                          {t.id}
                        </span>
                        <Badge
                          className={`text-[9px] px-1.5 py-0.2 font-bold ${
                            t.tier.includes("Tier-2")
                              ? "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"
                              : "bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]"
                          }`}
                        >
                          {t.tier}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-[#0f172a] font-semibold">
                        {t.subjectCode} ({t.category})
                      </div>

                      <div className="text-[10px] text-[#475569] leading-tight line-clamp-2">
                        {t.description}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#f1f5f9] text-[9px] text-[#64748b]">
                        <span>Assigned: <strong>{t.assignedToName}</strong></span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-[#f8fafc] border-t border-[#cbd5e1] text-[10px] text-[#64748b] text-center">
            Official University Examination Grievance Regulation · Redressal SLA: 48-72 Hours
          </div>
        </div>
      )}
    </>
  );
}
