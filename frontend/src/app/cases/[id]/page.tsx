"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type Client = {
  id: string;
  name: string;
};

type CaseSession = {
  id: string;
  date: string;
  location?: string;
  result?: string;
  notes?: string;
};

type Case = {
  id: string;
  caseNumber: string;
  title?: string;
  type: string;
  court?: string;
  stage: string;
  status: string;
  description?: string;
  client?: Client;
  createdAt?: string;
  updatedAt?: string;
  sessions?: CaseSession[];
};

export default function CaseDetailsPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const caseId = params?.id ?? "";

  const [legalCase, setLegalCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionForm, setSessionForm] = useState({
    date: "",
    location: "",
    result: "",
    notes: "",
  });
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/cases/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (!res.ok) {
          setError("تعذر تحميل بيانات القضية.");
          return;
        }

        const data: Case = await res.json();
        setLegalCase(data);
      } catch (e) {
        setError("حدث خطأ أثناء تحميل بيانات القضية.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [caseId, router]);

  async function handleAddSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSessionError(null);

    if (!caseId) return;
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    if (!sessionForm.date) {
      setSessionError("يجب تحديد تاريخ الجلسة.");
      return;
    }

    setSavingSession(true);
    try {
      const body = {
        date: sessionForm.date,
        location: sessionForm.location || undefined,
        result: sessionForm.result || undefined,
        notes: sessionForm.notes || undefined,
      };

      const res = await fetch(`${API_BASE}/cases/${caseId}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const msg = Array.isArray(data?.message)
          ? (data.message as string[]).join("، ")
          : (data?.message as string | undefined) ?? "تعذر إضافة الجلسة.";
        setSessionError(msg);
        return;
      }

      const created: CaseSession = await res.json();
      setLegalCase((prev) =>
        prev
          ? {
              ...prev,
              sessions: [created, ...(prev.sessions ?? [])],
            }
          : prev,
      );

      setSessionForm({
        date: "",
        location: "",
        result: "",
        notes: "",
      });
    } catch (e) {
      setSessionError("حدث خطأ غير متوقع أثناء إضافة الجلسة.");
    } finally {
      setSavingSession(false);
    }
  }

  function goToCases() {
    router.push("/cases");
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
              تفاصيل القضية
            </h1>
            {legalCase && (
              <p className="text-sm text-slate-600">
                {legalCase.title || legalCase.caseNumber}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={goToDashboard}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              لوحة التحكم
            </button>
            <button
              onClick={goToCases}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              كل القضايا
            </button>
          </div>
        </header>

        {loading && (
          <div className="text-center text-sm text-slate-600">
            جاري تحميل بيانات القضية...
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && !legalCase && (
          <div className="text-center text-sm text-slate-600">
            لم يتم العثور على القضية المطلوبة.
          </div>
        )}

        {!loading && !error && legalCase && (
          <>
            <section className="rounded-2xl bg-white p-4 shadow-sm text-right space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="text-slate-500">رقم القضية</p>
                  <p className="font-medium text-slate-900">
                    {legalCase.caseNumber}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">نوع القضية</p>
                  <p className="text-slate-800">{legalCase.type}</p>
                </div>
                <div>
                  <p className="text-slate-500">المرحلة</p>
                  <p className="text-slate-800">{legalCase.stage}</p>
                </div>
                <div>
                  <p className="text-slate-500">الحالة</p>
                  <p className="text-slate-800">{legalCase.status}</p>
                </div>
              </div>

              <div className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <p className="text-slate-500">المحكمة</p>
                  <p className="text-slate-800">
                    {legalCase.court || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">العميل</p>
                  <p className="text-slate-800">
                    {legalCase.client?.name || "—"}
                  </p>
                </div>
              </div>

              {legalCase.description && (
                <div className="pt-2 text-sm">
                  <p className="text-slate-500">وصف القضية</p>
                  <p className="mt-1 whitespace-pre-line text-slate-800">
                    {legalCase.description}
                  </p>
                </div>
              )}
            </section>

            <section className="grid gap-6 md:grid-cols-[1.4fr,1.6fr]">
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <h2 className="mb-3 text-sm font-medium text-slate-800">
                  إضافة جلسة جديدة
                </h2>
                <form onSubmit={handleAddSession} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      تاريخ ووقت الجلسة
                    </label>
                    <input
                      type="datetime-local"
                      value={sessionForm.date}
                      onChange={(e) =>
                        setSessionForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      مكان الجلسة
                    </label>
                    <input
                      value={sessionForm.location}
                      onChange={(e) =>
                        setSessionForm((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      نتيجة الجلسة
                    </label>
                    <input
                      value={sessionForm.result}
                      onChange={(e) =>
                        setSessionForm((prev) => ({
                          ...prev,
                          result: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      ملاحظات
                    </label>
                    <textarea
                      value={sessionForm.notes}
                      onChange={(e) =>
                        setSessionForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  {sessionError && (
                    <div className="text-xs text-red-600">{sessionError}</div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSession}
                      className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingSession ? "جاري الحفظ..." : "حفظ الجلسة"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <h2 className="mb-3 text-sm font-medium text-slate-800">
                  سجل الجلسات
                </h2>
                {(!legalCase.sessions || legalCase.sessions.length === 0) && (
                  <p className="text-sm text-slate-500">
                    لا توجد جلسات مسجلة لهذه القضية حتى الآن.
                  </p>
                )}

                {legalCase.sessions && legalCase.sessions.length > 0 && (
                  <div className="space-y-2">
                    {legalCase.sessions
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .map((session) => (
                        <div
                          key={session.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900">
                              {new Date(session.date).toLocaleString("ar-SA")}
                            </span>
                            {session.result && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                                {session.result}
                              </span>
                            )}
                          </div>
                          {session.location && (
                            <p className="mt-1 text-slate-700">
                              المكان: {session.location}
                            </p>
                          )}
                          {session.notes && (
                            <p className="mt-1 text-slate-700 whitespace-pre-line">
                              {session.notes}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
