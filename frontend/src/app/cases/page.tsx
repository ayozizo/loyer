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
  title?: string;
  type: string;
  court?: string;
  stage: string;
  status: string;
  description?: string;
  client?: Client;
};

type Me = {
  id: string;
  fullName?: string;
};

const CASE_TYPES = [
  { value: "CRIMINAL", label: "جنائي" },
  { value: "COMMERCIAL", label: "تجاري" },
  { value: "PERSONAL_STATUS", label: "أحوال شخصية" },
  { value: "ADMINISTRATIVE", label: "إداري" },
  { value: "LABOR", label: "عمالي" },
  { value: "OTHER", label: "أخرى" },
];

const CASE_STAGES = [
  { value: "PRE_TRIAL", label: "ما قبل المحاكمة" },
  { value: "FIRST_INSTANCE", label: "درجة أولى" },
  { value: "APPEAL", label: "استئناف" },
  { value: "SUPREME", label: "عليا" },
  { value: "EXECUTION", label: "تنفيذ" },
];

const CASE_STATUSES = [
  { value: "OPEN", label: "مفتوحة" },
  { value: "PENDING", label: "معلقة" },
  { value: "SUSPENDED", label: "موقوفة" },
  { value: "CLOSED", label: "مغلقة" },
];

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    caseNumber: "",
    title: "",
    type: "OTHER",
    court: "",
    stage: "PRE_TRIAL",
    status: "OPEN",
    description: "",
    clientId: "",
  });

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
        const [casesRes, clientsRes, meRes] = await Promise.all([
          fetch(`${API_BASE}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          casesRes.status === 401 ||
          clientsRes.status === 401 ||
          meRes.status === 401
        ) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        const casesData = await casesRes.json();
        const clientsData = await clientsRes.json();
        const meData = await meRes.json();

        setCases(casesData ?? []);
        setClients(clientsData ?? []);
        setMe(meData ?? null);
      } catch (e) {
        setError("تعذر تحميل القضايا. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    if (!form.clientId) {
      setFormError("يجب اختيار العميل المرتبط بالقضية.");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        caseNumber: form.caseNumber,
        title: form.title || undefined,
        type: form.type,
        court: form.court || undefined,
        stage: form.stage,
        status: form.status,
        description: form.description || undefined,
        clientId: form.clientId,
      };

      if (me?.id) {
        body.responsibleLawyerId = me.id;
      }

      const res = await fetch(`${API_BASE}/cases`, {
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
          : (data?.message as string | undefined) ?? "تعذر إنشاء القضية.";
        setFormError(msg);
        return;
      }

      const created: Case = await res.json();
      setCases((prev) => [created, ...prev]);
      setForm({
        caseNumber: "",
        title: "",
        type: "OTHER",
        court: "",
        stage: "PRE_TRIAL",
        status: "OPEN",
        description: "",
        clientId: "",
      });
    } catch (e) {
      setFormError("حدث خطأ غير متوقع أثناء إنشاء القضية.");
    } finally {
      setCreating(false);
    }
  }

  function handleChange(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function goToCase(id: string) {
    router.push(`/cases/${id}`);
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  function goToClients() {
    router.push("/clients");
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              إدارة القضايا
            </h1>
            <p className="text-sm text-slate-600">
              إنشاء وعرض القضايا وربطها بالعملاء والجلسات.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={goToDashboard}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              لوحة التحكم
            </button>
            <button
              onClick={goToClients}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              إدارة العملاء
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
                إنشاء قضية جديدة
              </h2>
              <form
                onSubmit={handleCreateCase}
                className="grid gap-3 text-right md:grid-cols-2"
              >
                <div className="space-y-1 md:col-span-1">
                  <label className="block text-xs font-medium text-slate-700">
                    رقم القضية
                  </label>
                  <input
                    value={form.caseNumber}
                    onChange={(e) => handleChange("caseNumber", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-xs font-medium text-slate-700">
                    عنوان مختصر
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    نوع القضية
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {CASE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    المحكمة
                  </label>
                  <input
                    value={form.court}
                    onChange={(e) => handleChange("court", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    المرحلة القضائية
                  </label>
                  <select
                    value={form.stage}
                    onChange={(e) => handleChange("stage", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {CASE_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    حالة القضية
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {CASE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    العميل المرتبط
                  </label>
                  <select
                    value={form.clientId}
                    onChange={(e) => handleChange("clientId", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">اختر العميل</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    وصف القضية
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {formError && (
                  <div className="md:col-span-2 text-xs text-red-600">
                    {formError}
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creating ? "جاري الحفظ..." : "حفظ القضية"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                قائمة القضايا
              </h2>

              {cases.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد قضايا مسجلة حتى الآن.
                </p>
              ) : (
                <div className="space-y-2">
                  {cases.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToCase(item.id)}
                      className="w-full text-right rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {item.title || item.caseNumber}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                        <span>{item.client?.name}</span>
                        <span>{item.type}</span>
                      </div>
                    </button>
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
