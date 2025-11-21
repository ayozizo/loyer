"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type Notification = {
  id: string;
  channel: string;
  type: string;
  status: string;
  targetEmail?: string;
  targetPhone?: string;
  targetWhatsapp?: string;
  scheduledAt?: string;
  sentAt?: string;
};

type UpcomingSession = {
  sessionId: string;
  caseId?: string;
  caseNumber?: string;
  clientName?: string;
  date: string;
  location?: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const [notRes, previewRes] = await Promise.all([
          fetch(`${API_BASE}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/notifications/preview/case-sessions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (notRes.status === 401 || previewRes.status === 401) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (!notRes.ok || !previewRes.ok) {
          setError("تعذر تحميل الإشعارات. حاول مرة أخرى.");
          return;
        }

        const [notData, previewData] = await Promise.all([
          notRes.json(),
          previewRes.json(),
        ]);
        setNotifications(notData ?? []);
        setUpcomingSessions(previewData ?? []);
      } catch (e) {
        setError("تعذر تحميل الإشعارات. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  function goToDashboard() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              الإشعارات والتنبيهات
            </h1>
            <p className="text-sm text-slate-600">
              متابعة الإشعارات المسجلة في النظام ومعاينة الجلسات القادمة.
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

        {loading && (
          <div className="text-center text-sm text-slate-600">
            جاري تحميل الإشعارات...
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                إشعارات النظام
              </h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد إشعارات مسجلة حتى الآن.
                </p>
              ) : (
                <div className="space-y-2 text-right text-xs">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {n.type}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                          {n.channel} / {n.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-slate-600">
                        <span>{n.targetEmail || n.targetPhone || n.targetWhatsapp}</span>
                        <span>
                          {n.scheduledAt
                            ? new Date(n.scheduledAt).toLocaleString("ar-SA")
                            : ""}
                        </span>
                        <span>
                          {n.sentAt
                            ? new Date(n.sentAt).toLocaleString("ar-SA")
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                جلسات قادمة (خلال 24 ساعة)
              </h2>
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد جلسات قادمة خلال 24 ساعة.
                </p>
              ) : (
                <div className="space-y-2 text-right text-xs">
                  {upcomingSessions.map((s) => (
                    <div
                      key={s.sessionId}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {s.caseNumber}
                        </span>
                        <span className="text-slate-700">{s.clientName}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-slate-600">
                        <span>
                          {new Date(s.date).toLocaleString("ar-SA")}
                        </span>
                        <span>{s.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
