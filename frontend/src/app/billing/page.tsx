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

type Invoice = {
  id: string;
  client: Client;
  legalCase?: Case;
  totalAmount: number;
  currency: string;
  status: string;
};

const BILLING_MODELS = [
  { value: "HOURLY", label: "بالساعة" },
  { value: "FIXED", label: "مبلغ ثابت" },
  { value: "CONTINGENCY", label: "نسبة" },
];

const CURRENCIES = [
  { value: "SAR", label: "ريال" },
  { value: "USD", label: "دولار" },
  { value: "EGP", label: "جنيه" },
  { value: "EUR", label: "يورو" },
];

export default function BillingPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<{
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
    overdue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    caseId: "",
    billingModel: "HOURLY",
    totalAmount: "",
    currency: "SAR",
    description: "",
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
        const [clientsRes, casesRes, invoicesRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/billing/invoices`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/billing/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          clientsRes.status === 401 ||
          casesRes.status === 401 ||
          invoicesRes.status === 401 ||
          summaryRes.status === 401
        ) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (
          !clientsRes.ok ||
          !casesRes.ok ||
          !invoicesRes.ok ||
          !summaryRes.ok
        ) {
          setError("تعذر تحميل البيانات المالية. حاول مرة أخرى.");
          return;
        }

        const [clientsData, casesData, invoicesData, summaryData] =
          await Promise.all([
            clientsRes.json(),
            casesRes.json(),
            invoicesRes.json(),
            summaryRes.json(),
          ]);

        setClients(clientsData ?? []);
        setCases(casesData ?? []);
        setInvoices(invoicesData ?? []);
        setSummary(summaryData ?? null);
      } catch (e) {
        setError("تعذر تحميل البيانات المالية. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  function handleChange(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    if (!form.clientId) {
      setFormError("يجب اختيار العميل.");
      return;
    }

    const amount = Number(form.totalAmount || "0");
    if (!amount || amount <= 0) {
      setFormError("يجب إدخال قيمة أتعاب صحيحة.");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        clientId: form.clientId,
        caseId: form.caseId || undefined,
        billingModel: form.billingModel,
        totalAmount: amount,
        currency: form.currency,
        description: form.description || undefined,
      };

      const res = await fetch(`${API_BASE}/billing/invoices`, {
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
          : (data?.message as string | undefined) ?? "تعذر إنشاء الفاتورة.";
        setFormError(msg);
        return;
      }

      const created: Invoice = await res.json();
      setInvoices((prev) => [created, ...prev]);
      setForm({
        clientId: "",
        caseId: "",
        billingModel: "HOURLY",
        totalAmount: "",
        currency: "SAR",
        description: "",
      });
    } catch (e) {
      setFormError("حدث خطأ غير متوقع أثناء إنشاء الفاتورة.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRecordPayment(invoiceId: string) {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    const amountStr = window.prompt("قيمة الدفعة:");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!amount || amount <= 0) return;

    try {
      const body = {
        amount,
        currency: "SAR",
        paidAt: new Date().toISOString(),
      };

      const res = await fetch(
        `${API_BASE}/billing/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) return;

      // تحديث مختصر: إعادة تحميل الفواتير والملخص
      const [invoicesRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/billing/invoices`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/billing/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (invoicesRes.ok) {
        setInvoices((await invoicesRes.json()) ?? []);
      }
      if (summaryRes.ok) {
        setSummary((await summaryRes.json()) ?? null);
      }
    } catch {
      // تجاهل الخطأ في هذه المرحلة
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
              إدارة الأتعاب والفواتير
            </h1>
            <p className="text-sm text-slate-600">
              تسجيل الأتعاب، إصدار الفواتير، ومتابعة المدفوعات والمتأخرات.
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
          <div className="grid gap-6 lg:grid-cols-[1.4fr,2fr]">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                ملخص مالي
              </h2>
              {summary ? (
                <div className="grid gap-3 text-right sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">إجمالي الفواتير</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {summary.totalInvoiced.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">إجمالي المدفوع</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-700">
                      {summary.totalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">الرصيد المستحق</p>
                    <p className="mt-1 text-lg font-semibold text-amber-700">
                      {summary.outstanding.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">المتأخر</p>
                    <p className="mt-1 text-lg font-semibold text-red-700">
                      {summary.overdue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  لا توجد بيانات مالية بعد.
                </p>
              )}

              <h2 className="mt-6 mb-3 text-sm font-medium text-slate-800 text-right">
                إنشاء فاتورة جديدة
              </h2>
              <form
                onSubmit={handleCreateInvoice}
                className="grid gap-3 text-right"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    العميل
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
                    نموذج الأتعاب
                  </label>
                  <select
                    value={form.billingModel}
                    onChange={(e) => handleChange("billingModel", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {BILLING_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      قيمة الأتعاب
                    </label>
                    <input
                      value={form.totalAmount}
                      onChange={(e) => handleChange("totalAmount", e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      العملة
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    وصف مختصر
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
                    {creating ? "جاري الحفظ..." : "حفظ الفاتورة"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                قائمة الفواتير
              </h2>
              {invoices.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد فواتير مسجلة حتى الآن.
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {inv.client?.name}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                          {inv.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          {inv.totalAmount} {inv.currency}
                        </span>
                        <span>{inv.legalCase?.caseNumber}</span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRecordPayment(inv.id)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          تسجيل دفعة
                        </button>
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
