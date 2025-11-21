"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type Document = {
  id: string;
  title: string;
};

export default function AiAssistantPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"summary" | "memo" | "document">("summary");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [textToSummarize, setTextToSummarize] = useState("");
  const [summaryResult, setSummaryResult] = useState("");

  const [caseSummary, setCaseSummary] = useState("");
  const [memoResult, setMemoResult] = useState<string | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [documentSummary, setDocumentSummary] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    async function loadDocs() {
      try {
        setLoadingDocs(true);
        const res = await fetch(`${API_BASE}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as Document[];
        setDocuments(data ?? []);
      } catch {
        // تجاهل حالياً
      } finally {
        setLoadingDocs(false);
      }
    }

    void loadDocs();
  }, [router]);

  async function handleSummarizeText(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!textToSummarize.trim()) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/ai/summarize-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: textToSummarize }),
      });

      if (!res.ok) {
        setError("تعذر تلخيص النص الآن.");
        return;
      }

      const body = (await res.json()) as { summary: string };
      setSummaryResult(body.summary ?? "");
    } catch {
      setError("تعذر تلخيص النص الآن.");
    }
  }

  async function handleGenerateMemo(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!caseSummary.trim()) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/ai/generate-case-memo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseSummary }),
      });

      if (!res.ok) {
        setError("تعذر توليد مسودة المذكرة الآن.");
        return;
      }

      const body = (await res.json()) as {
        sections: { title: string; body: string }[];
      };
      setMemoResult(
        body.sections
          ?.map((s) => `# ${s.title}\n\n${s.body}`)
          .join("\n\n") ?? null,
      );
    } catch {
      setError("تعذر توليد مسودة المذكرة الآن.");
    }
  }

  async function handleSummarizeDocument(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!selectedDocumentId) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/ai/summarize-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId: selectedDocumentId }),
      });

      if (!res.ok) {
        setError("تعذر تلخيص المستند الآن.");
        return;
      }

      const body = (await res.json()) as { summary: string };
      setDocumentSummary(body.summary ?? "");
    } catch {
      setError("تعذر تلخيص المستند الآن.");
    }
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              المساعد القانوني الذكي
            </h1>
            <p className="text-sm text-slate-600">
              أدوات ذكية لتلخيص النصوص، وتوليد مسودات مذكرات، ومراجعة المستندات.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={goToDashboard}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              لوحة التحكم
            </button>
          </div>
        </header>

        {error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTab("summary")}
              className={`rounded-full px-3 py-1 ${
                tab === "summary"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              تلخيص نص
            </button>
            <button
              type="button"
              onClick={() => setTab("memo")}
              className={`rounded-full px-3 py-1 ${
                tab === "memo"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              مسودة مذكرة قضية
            </button>
            <button
              type="button"
              onClick={() => setTab("document")}
              className={`rounded-full px-3 py-1 ${
                tab === "document"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              تلخيص مستند من النظام
            </button>
          </div>

          {tab === "summary" && (
            <div className="space-y-3 text-right">
              <form onSubmit={handleSummarizeText} className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  أدخل نصًا قانونيًا طويلًا وسيقوم النظام بتلخيصه:
                </label>
                <textarea
                  value={textToSummarize}
                  onChange={(e) => setTextToSummarize(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    تلخيص النص
                  </button>
                </div>
              </form>
              {summaryResult && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-right text-slate-800 whitespace-pre-wrap">
                  {summaryResult}
                </div>
              )}
            </div>
          )}

          {tab === "memo" && (
            <div className="space-y-3 text-right">
              <form onSubmit={handleGenerateMemo} className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  أدخل ملخصًا مختصرًا لوقائع القضية والنقاط الرئيسية:
                </label>
                <textarea
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    توليد مسودة مذكرة
                  </button>
                </div>
              </form>
              {memoResult && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-right text-slate-800 whitespace-pre-wrap">
                  {memoResult}
                </div>
              )}
            </div>
          )}

          {tab === "document" && (
            <div className="space-y-3 text-right">
              <form onSubmit={handleSummarizeDocument} className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  اختر مستندًا من النظام لتلخيصه (يتطلب أن يحتوي على نص مستخرج):
                </label>
                <select
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">
                    {loadingDocs
                      ? "جاري تحميل المستندات..."
                      : "اختر المستند"}
                  </option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    تلخيص المستند
                  </button>
                </div>
              </form>
              {documentSummary && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-right text-slate-800 whitespace-pre-wrap">
                  {documentSummary}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
