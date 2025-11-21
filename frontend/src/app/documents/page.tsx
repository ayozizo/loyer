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

type Document = {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  description?: string;
  client?: Client;
  legalCase?: Case;
};

const DOCUMENT_TYPES = [
  { value: "PLEADING", label: "مذكرة" },
  { value: "JUDGMENT", label: "حكم" },
  { value: "POWER_OF_ATTORNEY", label: "تفويض" },
  { value: "CONTRACT", label: "عقد" },
  { value: "CORRESPONDENCE", label: "مراسلة" },
  { value: "OTHER", label: "أخرى" },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "OTHER",
    fileUrl: "",
    description: "",
    clientId: "",
    caseId: "",
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
        const [docsRes, clientsRes, casesRes] = await Promise.all([
          fetch(`${API_BASE}/documents`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          docsRes.status === 401 ||
          clientsRes.status === 401 ||
          casesRes.status === 401
        ) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (!docsRes.ok || !clientsRes.ok || !casesRes.ok) {
          setError("تعذر تحميل البيانات. حاول مرة أخرى.");
          return;
        }

        const [docsData, clientsData, casesData] = await Promise.all([
          docsRes.json(),
          clientsRes.json(),
          casesRes.json(),
        ]);
        setDocuments(docsData ?? []);
        setClients(clientsData ?? []);
        setCases(casesData ?? []);
      } catch (e) {
        setError("تعذر تحميل البيانات. حاول مرة أخرى.");
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

  async function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    if (!form.fileUrl) {
      setFormError("يجب إدخال رابط الملف أو مساره.");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        fileUrl: form.fileUrl,
        description: form.description || undefined,
        clientId: form.clientId || undefined,
        caseId: form.caseId || undefined,
      };

      const res = await fetch(`${API_BASE}/documents`, {
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
          : (data?.message as string | undefined) ?? "تعذر إنشاء المستند.";
        setFormError(msg);
        return;
      }

      const created: Document = await res.json();
      setDocuments((prev) => [created, ...prev]);
      setForm({
        title: "",
        type: "OTHER",
        fileUrl: "",
        description: "",
        clientId: "",
        caseId: "",
      });
    } catch (e) {
      setFormError("حدث خطأ غير متوقع أثناء إنشاء المستند.");
    } finally {
      setCreating(false);
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(term) ||
      doc.description?.toLowerCase().includes(term) ||
      doc.client?.name?.toLowerCase().includes(term) ||
      doc.legalCase?.caseNumber?.toLowerCase().includes(term)
    );
  });

  function goToDashboard() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              إدارة المستندات والعقود
            </h1>
            <p className="text-sm text-slate-600">
              مكتبة مركزية لحفظ مذكرات القضايا والعقود والتفويضات.
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-slate-800 text-right">
                  قائمة المستندات
                </h2>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث في العنوان أو العميل أو رقم القضية"
                  className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                />
              </div>

              {filteredDocuments.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد مستندات مسجلة حتى الآن.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100 text-right"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {doc.title}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                          {doc.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                        <span>{doc.client?.name}</span>
                        <span>{doc.legalCase?.caseNumber}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                إضافة مستند جديد
              </h2>
              <form
                onSubmit={handleCreateDocument}
                className="grid gap-3 text-right"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    عنوان المستند
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
                    نوع المستند
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    رابط الملف أو المسار
                  </label>
                  <input
                    value={form.fileUrl}
                    onChange={(e) => handleChange("fileUrl", e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    العميل المرتبط (اختياري)
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
                    القضية المرتبطة (اختياري)
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
                    {creating ? "جاري الحفظ..." : "حفظ المستند"}
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
