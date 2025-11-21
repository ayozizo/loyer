"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type Client = {
  id: string;
  name: string;
};

type Case = {
  id: string;
  caseNumber: string;
};

type User = {
  id: string;
  fullName?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt?: string;
  isAllDay: boolean;
  location?: string;
  description?: string;
  client?: Client;
  legalCase?: Case;
  assignedTo?: User;
};

const EVENT_TYPES = [
  { value: "SESSION", label: "جلسة" },
  { value: "MEETING", label: "اجتماع" },
  { value: "DEADLINE", label: "موعد نهائي" },
  { value: "OTHER", label: "أخرى" },
];

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "SESSION",
    startAt: "",
    endAt: "",
    isAllDay: false,
    location: "",
    description: "",
    clientId: "",
    caseId: "",
    assignedToId: "",
  });

  const [suggestDate, setSuggestDate] = useState("");
  const [suggestSlots, setSuggestSlots] = useState<
    { startAt: string; endAt: string }[]
  >([]);

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
        const [eventsRes, clientsRes, casesRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/calendar`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          eventsRes.status === 401 ||
          clientsRes.status === 401 ||
          casesRes.status === 401 ||
          usersRes.status === 401
        ) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (
          !eventsRes.ok ||
          !clientsRes.ok ||
          !casesRes.ok ||
          !usersRes.ok
        ) {
          setError("تعذر تحميل بيانات التقويم. حاول مرة أخرى.");
          return;
        }

        const [eventsData, clientsData, casesData, usersData] =
          await Promise.all([
            eventsRes.json(),
            clientsRes.json(),
            casesRes.json(),
            usersRes.json(),
          ]);

        setEvents(eventsData ?? []);
        setClients(clientsData ?? []);
        setCases(casesData ?? []);
        setUsers(usersData ?? []);
      } catch (e) {
        setError("تعذر تحميل بيانات التقويم. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  function handleChange(
    field: keyof typeof form,
    value: string | boolean,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    if (!form.startAt) {
      setFormError("يجب إدخال وقت البداية.");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        startAt: form.startAt,
        endAt: form.endAt || undefined,
        isAllDay: form.isAllDay,
        location: form.location || undefined,
        description: form.description || undefined,
        clientId: form.clientId || undefined,
        caseId: form.caseId || undefined,
        assignedToId: form.assignedToId || undefined,
      };

      const res = await fetch(`${API_BASE}/calendar`, {
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
          : (data?.message as string | undefined) ?? "تعذر إنشاء الحدث.";
        setFormError(msg);
        return;
      }

      const created: CalendarEvent = await res.json();
      setEvents((prev) => [created, ...prev]);
      setForm({
        title: "",
        type: "SESSION",
        startAt: "",
        endAt: "",
        isAllDay: false,
        location: "",
        description: "",
        clientId: "",
        caseId: "",
        assignedToId: "",
      });
    } catch (e) {
      setFormError("حدث خطأ غير متوقع أثناء إنشاء الحدث.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSuggestSlots() {
    if (!suggestDate) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const url = new URL(`${API_BASE}/calendar/suggest/slots`);
      url.searchParams.set("date", suggestDate);
      if (form.assignedToId) {
        url.searchParams.set("assignedToId", form.assignedToId);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { startAt: string; endAt: string }[];
      setSuggestSlots(data ?? []);
    } catch {
      // تجاهل
    }
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              التقويم والمواعيد
            </h1>
            <p className="text-sm text-slate-600">
              متابعة الجلسات، الاجتماعات، والمواعيد النهائية للمكتب.
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
            جاري تحميل البيانات...
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 lg:grid-cols-[2fr,1.4fr]">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                جدول المواعيد
              </h2>

              {events.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد مواعيد مسجلة حتى الآن.
                </p>
              ) : (
                <div className="space-y-2 text-right">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {ev.title}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                          {ev.type}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                        <span>
                          {new Date(ev.startAt).toLocaleString("ar-SA")}
                          {ev.endAt
                            ? ` - ${new Date(ev.endAt).toLocaleTimeString("ar-SA")}`
                            : ""}
                        </span>
                        <span>{ev.location}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                        <span>{ev.client?.name}</span>
                        <span>{ev.legalCase?.caseNumber}</span>
                        <span>{ev.assignedTo?.fullName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-right text-xs text-slate-600">
                <p className="font-medium text-slate-800 mb-1">
                  اقتراح مواعيد متاحة في يوم محدد
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={suggestDate}
                    onChange={(e) => setSuggestDate(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <select
                    value={form.assignedToId}
                    onChange={(e) => handleChange("assignedToId", e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">أي محامٍ</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.id}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSuggestSlots}
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                  >
                    اقتراح مواعيد
                  </button>
                </div>
                {suggestSlots.length > 0 && (
                  <ul className="mt-2 list-disc pr-5 space-y-1">
                    {suggestSlots.map((s, idx) => (
                      <li key={idx}>
                        {new Date(s.startAt).toLocaleTimeString("ar-SA")} -
                        {" "}
                        {new Date(s.endAt).toLocaleTimeString("ar-SA")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                إضافة موعد / جلسة جديدة
              </h2>
              <form
                onSubmit={handleCreateEvent}
                className="grid gap-3 text-right"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    عنوان الموعد
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    نوع الموعد
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    وقت البداية (مثال: 2025-01-01T10:00)
                  </label>
                  <input
                    value={form.startAt}
                    onChange={(e) => handleChange("startAt", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    وقت النهاية (اختياري)
                  </label>
                  <input
                    value={form.endAt}
                    onChange={(e) => handleChange("endAt", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 text-xs text-slate-700">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={form.isAllDay}
                      onChange={(e) => handleChange("isAllDay", e.target.checked)}
                    />
                    <span>طوال اليوم</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    الموقع
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    العميل (اختياري)
                  </label>
                  <select
                    value={form.clientId}
                    onChange={(e) => handleChange("clientId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">بدون</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    القضية (اختياري)
                  </label>
                  <select
                    value={form.caseId}
                    onChange={(e) => handleChange("caseId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">بدون</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.caseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    المحامي المسؤول (اختياري)
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) => handleChange("assignedToId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">بدون</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    ملاحظات
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {formError && (
                  <div className="text-xs text-red-600">{formError}</div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creating ? "جاري الحفظ..." : "حفظ الموعد"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
