import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Smart Exam Result Management System" },
    { name: "description", content: "Manage college examination marks and results for Mid Sem and PUT." },
    { property: "og:title", content: "Smart Exam Result Management System" },
    { property: "og:description", content: "Manage college examination marks and results for Mid Sem and PUT." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="animate-pulse text-sm">Loading Smart Exam Result System...</div>
    </div>
  );
}
