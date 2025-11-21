"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type Client = {
  id: string;
  name: string;
  type: string;
  nationalId?: string;
  commercialRegistration?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

type Case = {
  id: string;
  caseNumber: string;
  title?: string;
  status: string;
  type: string;
};

export default function ClientDetailsPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const clientId = params?.id ?? "";

  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    async function load() {
      try {
        setLoading(true);

        const [clientRes, casesRes] = await Promise.all([
          fetch(`${API_BASE}/clients/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (clientRes.status === 401 || casesRes.status === 401) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (!clientRes.ok) {
          setError("تعذر تحميل بيانات العميل.");
          return;
        }

        const clientData: Client = await clientRes.json();
        const casesData: Case[] = await casesRes.json();

        setClient(clientData);
        setCases(
          (casesData ?? []).filter(
            // @ts-expect-error: backend يرسل كائن عميل داخل القضية
            (c) => c.client && c.client.id === clientData.id,
          ),
        );
      } catch (e) {
        setError("حدث خطأ أثناء تحميل بيانات العميل.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [clientId, router]);

  function goToClients() {
    router.push("/clients");
  }

  function goToCase(id: string) {
    router.push(`/cases/${id}`);
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              بيانات العميل
            </h1>
            {client && (
              <p className="text-sm text-slate-600">{client.name}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={goToClients}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              كل العملاء
            </button>
          </div>
        </header>

        {loading && (
          <div className="text-center text-sm text-slate-600">
            جاري تحميل بيانات العميل...
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && !client && (
          <div className="text-center text-sm text-slate-600">
            لم يتم العثور على العميل المطلوب.
          </div>
        )}

        {!loading && !error && client && (
          <>
            <section className="rounded-2xl bg-white p-4 shadow-sm text-right space-y-2 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-slate-500">اسم العميل</p>
                  <p className="font-medium text-slate-900">{client.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">نوع العميل</p>
                  <p className="text-slate-800">{client.type}</p>
                </div>
                <div>
                  <p className="text-slate-500">رقم الهوية</p>
                  <p className="text-slate-800">
                    {client.nationalId || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">السجل التجاري</p>
                  <p className="text-slate-800">
                    {client.commercialRegistration || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">البريد الإلكتروني</p>
                  <p className="text-slate-800">{client.email || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">رقم الجوال</p>
                  <p className="text-slate-800">{client.phone || "—"}</p>
                </div>
              </div>

              {client.notes && (
                <div className="pt-2">
                  <p className="text-slate-500">ملاحظات</p>
                  <p className="mt-1 whitespace-pre-line text-slate-800">
                    {client.notes}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm text-right">
              <h2 className="mb-3 text-sm font-medium text-slate-800">
                القضايا المرتبطة بهذا العميل
              </h2>

              {cases.length === 0 ? (
                <p className="text-sm text-slate-500">
                  لا توجد قضايا مرتبطة بهذا العميل.
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
                      <div className="mt-1 text-xs text-slate-600">
                        {item.type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
