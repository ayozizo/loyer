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

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo: User;
  client?: Client;
  legalCase?: Case;
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<
    {
      userId: string;
      fullName?: string;
      openTasks: number;
      completedTasks: number;
      overdueTasks: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    assignedToId: "",
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
        const [tasksRes, clientsRes, casesRes, usersRes, meRes, statsRes] =
          await Promise.all([
            fetch(`${API_BASE}/tasks`, {
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
            fetch(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_BASE}/tasks/stats/users`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        if (
          tasksRes.status === 401 ||
          clientsRes.status === 401 ||
          casesRes.status === 401 ||
          usersRes.status === 401 ||
          meRes.status === 401 ||
          statsRes.status === 401
        ) {
          window.localStorage.removeItem("qid_token");
          router.replace("/");
          return;
        }

        if (
          !tasksRes.ok ||
          !clientsRes.ok ||
          !casesRes.ok ||
          !usersRes.ok ||
          !meRes.ok ||
          !statsRes.ok
        ) {
          setError("تعذر تحميل بيانات المهام. حاول مرة أخرى.");
          return;
        }

        const [tasksData, clientsData, casesData, usersData, meData, statsData] =
          await Promise.all([
            tasksRes.json(),
            clientsRes.json(),
            casesRes.json(),
            usersRes.json(),
            meRes.json(),
            statsRes.json(),
          ]);

        setTasks(tasksData ?? []);
        setClients(clientsData ?? []);
        setCases(casesData ?? []);
        setUsers(usersData ?? []);
        setMe(meData?.user ?? null);
        setUserStats(statsData ?? []);
      } catch (e) {
        setError("تعذر تحميل بيانات المهام. حاول مرة أخرى.");
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

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("qid_token");
    if (!token) {
      router.replace("/");
      return;
    }

    if (!form.title) {
      setFormError("يجب إدخال عنوان المهمة.");
      return;
    }

    const assignedToId = form.assignedToId || me?.id;
    if (!assignedToId) {
      setFormError("يجب اختيار المستخدم المسؤول عن المهمة.");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assignedToId,
        createdById: me?.id,
        clientId: form.clientId || undefined,
        caseId: form.caseId || undefined,
      };

      const res = await fetch(`${API_BASE}/tasks`, {
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
          : (data?.message as string | undefined) ?? "تعذر إنشاء المهمة.";
        setFormError(msg);
        return;
      }

      const created: Task = await res.json();
      setTasks((prev) => [created, ...prev]);
      setForm({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: "",
        assignedToId: "",
        clientId: "",
        caseId: "",
      });
    } catch (e) {
      setFormError("حدث خطأ غير متوقع أثناء إنشاء المهمة.");
    } finally {
      setCreating(false);
    }
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  const myTasks = tasks.filter((t) => t.assignedTo?.id === me?.id);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-semibold text-slate-900">
              إدارة المهام والفريق
            </h1>
            <p className="text-sm text-slate-600">
              توزيع المهام بين المحامين والمساعدين ومتابعة الإنجاز اليومي.
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
          <div className="grid gap-6 lg:grid-cols-[1.6fr,1.4fr]">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                مهامي الحالية
              </h2>
              {myTasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد مهام مسندة إليك حاليًا.
                </p>
              ) : (
                <div className="space-y-2">
                  {myTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {task.title}
                        </span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                          {task.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <span>{task.client?.name}</span>
                        <span>{task.legalCase?.caseNumber}</span>
                        <span>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString("ar-SA")
                            : ""}
                        </span>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-xs text-slate-600">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <h2 className="mt-6 mb-3 text-sm font-medium text-slate-800 text-right">
                أداء الفريق
              </h2>
              {userStats.length === 0 ? (
                <p className="text-sm text-slate-500 text-right">
                  لا توجد بيانات مهام للفريق بعد.
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
                      {userStats.map((row) => (
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
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-medium text-slate-800 text-right">
                إنشاء مهمة جديدة
              </h2>
              <form
                onSubmit={handleCreateTask}
                className="grid gap-3 text-right"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    عنوان المهمة
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
                    وصف مختصر
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      الحالة
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="TODO">قيد التنفيذ</option>
                      <option value="IN_PROGRESS">جاري العمل</option>
                      <option value="DONE">مكتملة</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      الأولوية
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => handleChange("priority", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="LOW">منخفضة</option>
                      <option value="MEDIUM">متوسطة</option>
                      <option value="HIGH">مرتفعة</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    الموعد النهائي (اختياري)
                  </label>
                  <input
                    value={form.dueDate}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                    placeholder="مثال: 2025-01-01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    المسؤول عن المهمة
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) => handleChange("assignedToId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">المستخدم الحالي ({me?.fullName})</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.id}
                      </option>
                    ))}
                  </select>
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

                {formError && (
                  <div className="text-xs text-red-600">{formError}</div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creating ? "جاري الحفظ..." : "حفظ المهمة"}
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
