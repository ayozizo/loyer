"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type CasesOverview = {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byStage: Record<string, number>;
};

type FinancialOverview = {
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  overdue: number;
};

type TeamPerformanceRow = {
  userId: string;
  fullName?: string;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
};

type TopCaseType = {
  type: string;
  total: number;
};

type ClientProfitabilityRow = {
  clientId: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
};

type DashboardResponse = {
  casesOverview: CasesOverview;
  financialOverview: FinancialOverview;
  teamPerformance: TeamPerformanceRow[];
  topCaseTypes: TopCaseType[];
  clientProfitability: ClientProfitabilityRow[];
};

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
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
        const res = await fetch(`${API_BASE}/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (!res.ok) {
          setError("تعذر تحميل التقارير. حاول مرة أخرى.");
          return;
        }

        const body = (await res.json()) as DashboardResponse;
        setData(body);
      } catch (e) {
        setError("تعذر تحميل التقارير. حاول مرة أخرى.");
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
              التقارير والتحليلات
            </h1>
            <p className="text-sm text-slate-600">
              رؤية شاملة لأداء القضايا، المالية، والعمل الجماعي في المكتب.
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
            جاري تحميل التقارير...
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <p className="text-xs text-slate-500">إجمالي القضايا</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.casesOverview.total}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <p className="text-xs text-slate-500">إجمالي الفواتير</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.financialOverview.totalInvoiced.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <p className="text-xs text-slate-500">إجمالي المدفوع</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-700">
                  {data.financialOverview.totalPaid.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm text-right">
                <p className="text-xs text-slate-500">الرصيد المستحق</p>
                <p className="mt-2 text-2xl font-semibold text-amber-700">
                  {data.financialOverview.outstanding.toFixed(2)}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                  توزيع القضايا حسب النوع
                </h2>
                {Object.keys(data.casesOverview.byType).length === 0 ? (
                  <p className="text-sm text-slate-500 text-right">
                    لا توجد قضايا كافية لعرض هذا التقرير.
                  </p>
                ) : (
                  <ul className="space-y-1 text-right text-xs text-slate-700">
                    {Object.entries(data.casesOverview.byType).map(
                      ([type, count]) => (
                        <li key={type} className="flex items-center justify-between">
                          <span>{type}</span>
                          <span className="font-medium text-slate-900">
                            {count as number}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                  أنواع القضايا الأكثر ربحية
                </h2>
                {data.topCaseTypes.length === 0 ? (
                  <p className="text-sm text-slate-500 text-right">
                    لا توجد بيانات مالية كافية.
                  </p>
                ) : (
                  <ul className="space-y-1 text-right text-xs text-slate-700">
                    {data.topCaseTypes.map((row) => (
                      <li
                        key={row.type}
                        className="flex items-center justify-between"
                      >
                        <span>{row.type}</span>
                        <span className="font-medium text-slate-900">
                          {row.total.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                  أداء الفريق (المهام)
                </h2>
                {data.teamPerformance.length === 0 ? (
                  <p className="text-sm text-slate-500 text-right">
                    لا توجد بيانات مهام للفريق.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2 py-1 font-medium text-slate-700">
                            المستخدم
                          </th>
                          <th className="px-2 py-1 font-medium text-slate-700">
                            مهام مفتوحة
                          </th>
                          <th className="px-2 py-1 font-medium text-slate-700">
                            مكتملة
                          </th>
                          <th className="px-2 py-1 font-medium text-slate-700">
                            متأخرة
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.teamPerformance.map((row) => (
                          <tr key={row.userId} className="border-b border-slate-100">
                            <td className="px-2 py-1 text-slate-800">
                              {row.fullName || row.userId}
                            </td>
                            <td className="px-2 py-1 text-slate-800">
                              {row.openTasks}
                            </td>
                            <td className="px-2 py-1 text-emerald-700">
                              {row.completedTasks}
                            </td>
                            <td className="px-2 py-1 text-red-700">
                              {row.overdueTasks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                  ربحية العملاء
                </h2>
                {data.clientProfitability.length === 0 ? (
                  <p className="text-sm text-slate-500 text-right">
                    لا توجد بيانات مالية كافية.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2 py-1 font-medium text-slate-700">
                            العميل
                          </th>
                          <th className="px-2 py-1 font-medium text-slate-700">
                            إجمالي الفواتير
                          </th>
                          <th className="px-2 py-1 font-medium text-slate-700">
                            المدفوع
                          </th>
                          <th className="px-2 py-1 font-medium text-slate-700">
                            المستحق
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.clientProfitability.map((row) => (
                          <tr
                            key={row.clientId}
                            className="border-b border-slate-100"
                          >
                            <td className="px-2 py-1 text-slate-800">
                              {row.clientName}
                            </td>
                            <td className="px-2 py-1 text-slate-800">
                              {row.totalInvoiced.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-emerald-700">
                              {row.totalPaid.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-amber-700">
                              {row.outstanding.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
