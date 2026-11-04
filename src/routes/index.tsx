import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/login";
        }
      } catch {
        window.location.href = "/login";
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9] text-[#0b2545]">
      <div className="animate-pulse text-sm font-serif font-bold">
        Connecting to Institutional Examination Portal…
      </div>
    </div>
  );
}
