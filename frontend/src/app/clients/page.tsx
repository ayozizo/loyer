"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type Client = {
  id: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
};

const CLIENT_TYPES = [
  { value: "INDIVIDUAL", label: "فرد" },
  { value: "COMPANY", label: "شركة" },
  { value: "GOVERNMENT", label: "جهة حكومية" },
];

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "INDIVIDUAL",
    nationalId: "",
    commercialRegistration: "",
    email: "",
    phone: "",
    notes: "",
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
        const res = await fetch(`${API_BASE}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (!res.ok) {
          setError("تعذر تحميل العملاء. حاول مرة أخرى.");
          return;
        }

        const data = await res.json();
        setClients(data ?? []);
      } catch (e) {
        setError("تعذر تحميل العملاء. حاول مرة أخرى.");
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

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        nationalId: form.nationalId || undefined,
        commercialRegistration: form.commercialRegistration || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
      };

      const res = await fetch(`${API_BASE}/clients`, {
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
          : (data?.message as string | undefined) ?? "تعذر إنشاء العميل.";
        setFormError(msg);
        return;
      }

      const created: Client = await res.json();
      setClients((prev) => [created, ...prev]);
      setForm({
        name: "",
        type: "INDIVIDUAL",
        nationalId: "",
        commercialRegistration: "",
        email: "",
        phone: "",
        notes: "",
      });
    } catch (e) {
      setFormError("حدث خطأ غير متوقع أثناء إنشاء العميل.");
    } finally {
      setCreating(false);
    }
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  function goToClients() {
    router.push("/clients");
  }

  function goToClient(id: string) {
    router.push(`/clients/${id}`);
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              إدارة العملاء
            </h1>
            <p className="text-sm text-slate-600">
              إنشاء وإدارة ملفات العملاء وربطهم بالقضايا.
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
              تحديث القائمة
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
                إنشاء عميل جديد
              </h2>
              <form
                onSubmit={handleCreateClient}
                className="grid gap-3 text-right md:grid-cols-2"
              >
                <div className="space-y-1 md:col-span-1">
                  <label className="block text-xs font-medium text-slate-700">
                    اسم العميل
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-xs font-medium text-slate-700">
                    نوع العميل
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {CLIENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    رقم الهوية
                  </label>
                  <input
                    value={form.nationalId}
                    onChange={(e) => handleChange("nationalId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    السجل التجاري
                  </label>
                  <input
                    value={form.commercialRegistration}
                    onChange={(e) =>
                      handleChange("commercialRegistration", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    رقم الجوال
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    ملاحظات
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
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
                    {creating ? "جاري الحفظ..." : "حفظ العميل"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                قائمة العملاء
              </h2>

              {clients.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا يوجد عملاء مسجلون حتى الآن.
                </p>
              ) : (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => goToClient(client.id)}
                      className="w-full text-right rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {client.name}
                        </span>
                        <span className="text-xs text-slate-600">
                          {client.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                        <span>{client.email}</span>
                        <span>{client.phone}</span>
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
