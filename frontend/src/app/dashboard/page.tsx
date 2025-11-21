"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type Client = {
  id: string;
  name: string;
  type: string;
};

type Case = {
  id: string;
  caseNumber: string;
  title?: string;
  status: string;
  stage: string;
  type: string;
  client?: Client;
};

export default function DashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
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
        const [casesRes, clientsRes] = await Promise.all([
          fetch(`${API_BASE}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (casesRes.status === 401 || clientsRes.status === 401) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        const casesData = await casesRes.json();
        const clientsData = await clientsRes.json();
        setCases(casesData ?? []);
        setClients(clientsData ?? []);
      } catch (e) {
        setError("تعذر تحميل البيانات. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("qid_token");
    }
    router.replace("/");
  }

  const openCases = cases.filter((c) => c.status === "OPEN");

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              لوحة القضايا - قيد
            </h1>
            <p className="text-sm text-slate-600">
              رؤية سريعة لحالة القضايا والعملاء في مكتب المحاماة
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/cases")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              إدارة القضايا
            </button>
            <button
              onClick={() => router.push("/clients")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              إدارة العملاء
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              تسجيل الخروج
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
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <p className="text-xs text-slate-500">إجمالي القضايا</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {cases.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <p className="text-xs text-slate-500">القضايا المفتوحة</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {openCases.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <p className="text-xs text-slate-500">عدد العملاء</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {clients.length}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                  أحدث القضايا
                </h2>
                <div className="space-y-2 text-right">
                  {cases.length === 0 && (
                    <p className="text-sm text-slate-500">
                      لا توجد قضايا مسجلة حتى الآن.
                    </p>
                  )}
                  {cases.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
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
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                  قائمة العملاء
                </h2>
                <div className="space-y-2 text-right">
                  {clients.length === 0 && (
                    <p className="text-sm text-slate-500">
                      لا يوجد عملاء مسجلون حتى الآن.
                    </p>
                  )}
                  {clients.slice(0, 8).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-900">
                        {client.name}
                      </span>
                      <span className="text-xs text-slate-600">
                        {client.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
