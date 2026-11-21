import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../api";
import {
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  X,
  Wallet,
  Receipt,
  Layers,
  Hash,
} from "lucide-react";

//const STORE = "pegal_expenses";
const API = `${API_URL}/api/expenses`;

const CATEGORIES = {
  Rent: { chip: "bg-violet-50 text-violet-700", bar: "bg-violet-500" },
  "Software and tools": {
    chip: "bg-blue-50 text-blue-700",
    bar: "bg-blue-500",
  },
  "Hosting and domains": { chip: "bg-sky-50 text-sky-700", bar: "bg-sky-500" },
  Marketing: { chip: "bg-pink-50 text-pink-700", bar: "bg-pink-500" },
  Freelancers: { chip: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  Travel: { chip: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  Utilities: { chip: "bg-orange-50 text-orange-700", bar: "bg-orange-500" },
  "Office supplies": { chip: "bg-teal-50 text-teal-700", bar: "bg-teal-500" },
  "Professional fees": {
    chip: "bg-indigo-50 text-indigo-700",
    bar: "bg-indigo-500",
  },
  Other: { chip: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
};

const METHODS = ["UPI", "Bank transfer", "Card", "Cash", "Cheque"];
const GST_RATES = [0, 5, 12, 18, 28];

const inr = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v || 0);

const today = () => new Date().toLocaleDateString("en-CA");

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const monthLabel = (m) =>
  new Date(`${m}-01`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

const total = (e) => Number(e.amount || 0) + Number(e.gst || 0);

// const load = () => {
//   try {
//     return JSON.parse(localStorage.getItem(STORE)) || [];
//   } catch {
//     return [];
//   }
// };

const input =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const Field = ({ label, children, className = "" }) => (
  <label className={`block min-w-0 ${className}`}>
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
      {label}
    </span>
    {children}
  </label>
);

function Stat({ title, value, note, icon: Icon, tone }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2.5 truncate text-xl font-semibold tracking-tight text-slate-900 xl:text-2xl">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>
      <p className="mt-3 truncate text-xs text-slate-400">{note}</p>
    </div>
  );
}

const blank = () => ({
  date: today(),
  vendor: "",
  category: "Software and tools",
  amount: "",
  rate: 18,
  method: "UPI",
  notes: "",
  clientId: "",
  projectId: "",
});

function ExpenseForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || blank());
  const [err, setErr] = useState("");
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingRelations, setLoadingRelations] = useState(true);

  const amt = Number(f.amount) || 0;
  const gst = Math.round((amt * f.rate) / 100);

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        setLoadingRelations(true);

        const [clientsResponse, projectsResponse] = await Promise.all([
          fetch(`${API_URL}/api/clients`),
          fetch(`${API_URL}/api/projects`),
        ]);

        if (!clientsResponse.ok || !projectsResponse.ok) {
          throw new Error("Failed to load clients or projects");
        }

        const clientsData = await clientsResponse.json();
        const projectsData = await projectsResponse.json();

        setClients(Array.isArray(clientsData) ? clientsData : []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (error) {
        console.error("Failed to load clients/projects:", error);
      } finally {
        setLoadingRelations(false);
      }
    };

    fetchRelations();
  }, []);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const submit = () => {
    if (!f.vendor.trim()) return setErr("Enter the vendor or payee.");
    if (amt <= 0) return setErr("Enter an amount greater than zero.");
    if (!f.date) return setErr("Choose a date.");

    onSave({
      ...f,
      vendor: f.vendor.trim(),
      amount: amt,
      gst,
      clientId: f.clientId || null,
      projectId: f.projectId || null,
      _id: f._id,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Expense form"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            {f._id ? "Edit expense" : "Add expense"}
          </h2>

          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vendor or payee *" className="sm:col-span-2">
            <input
              autoFocus
              className={input}
              value={f.vendor}
              onChange={(e) => setF({ ...f, vendor: e.target.value })}
              placeholder="e.g. GoDaddy"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              className={input}
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
            />
          </Field>

          <Field label="Category">
            <select
              className={input}
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value })}
            >
              {Object.keys(CATEGORIES).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Amount before GST (₹) *">
            <input
              type="number"
              min="0"
              className={input}
              value={f.amount}
              onChange={(e) => setF({ ...f, amount: e.target.value })}
            />
          </Field>

          <Field label="GST rate">
            <select
              className={input}
              value={f.rate}
              onChange={(e) => setF({ ...f, rate: Number(e.target.value) })}
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>
                  {r === 0 ? "No GST" : `${r}%`}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Paid by">
            <select
              className={input}
              value={f.method}
              onChange={(e) => setF({ ...f, method: e.target.value })}
            >
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>

          <div className="flex items-end justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
            <span className="text-slate-500">Total with GST</span>
            <strong className="text-slate-900">{inr(amt + gst)}</strong>
          </div>

          <Field label="Notes (optional)" className="sm:col-span-2">
            <textarea
              rows={2}
              className={input}
              value={f.notes}
              onChange={(e) => setF({ ...f, notes: e.target.value })}
            />
          </Field>

          <Field label="Client">
            <select
              className={input}
              value={f.clientId || ""}
              onChange={(e) =>
                setF({
                  ...f,
                  clientId: e.target.value,
                })
              }
              disabled={loadingRelations}
            >
              <option value="">No client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                  {client.company ? ` - ${client.company}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Project">
            <select
              className={input}
              value={f.projectId || ""}
              onChange={(e) =>
                setF({
                  ...f,
                  projectId: e.target.value,
                })
              }
              disabled={loadingRelations}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {err && (
          <p
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
            role="alert"
          >
            {err}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {f._id ? "Save changes" : "Add expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [month, setMonth] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setApiError("");

        const response = await fetch(API);

        if (!response.ok) {
          throw new Error("Failed to fetch expenses");
        }

        const data = await response.json();

        const mappedExpenses = data.map((expense) => ({
          ...expense,
          id: expense._id,
          vendor: expense.vendor || expense.title || "",
          notes: expense.notes || expense.description || "",
          rate: expense.rate || 0,
          gst: expense.gst || 0,
          method: expense.method || "UPI",
          clientId: expense.clientId || null,
          projectId: expense.projectId || null,
        }));

        setItems(mappedExpenses);
      } catch (error) {
        console.error("Failed to load expenses:", error);
        setApiError(error.message || "Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const months = useMemo(() => {
    const s = new Set(items.map((e) => e.date.slice(0, 7)));
    s.add(today().slice(0, 7));
    return [...s].sort().reverse();
  }, [items]);

  const inMonth = useMemo(
    () => items.filter((e) => month === "all" || e.date.startsWith(month)),
    [items, month],
  );

  const rows = useMemo(
    () =>
      inMonth
        .filter((e) => cat === "all" || e.category === cat)
        .filter((e) =>
          [e.vendor, e.category, e.notes, e.method]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [inMonth, cat, q],
  );

  const spend = inMonth.reduce((s, e) => s + total(e), 0);

  const gstPaid = inMonth.reduce((s, e) => s + Number(e.gst || 0), 0);

  const byCat = useMemo(() => {
    const m = {};

    inMonth.forEach((e) => (m[e.category] = (m[e.category] || 0) + total(e)));

    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [inMonth]);

  const top = byCat[0];

  const saveExpense = async (e) => {
    try {
      const payload = {
        vendor: e.vendor,
        amount: Number(e.amount),
        category: e.category,
        date: e.date,
        notes: e.notes || "",
        gst: Number(e.gst) || 0,
        rate: Number(e.rate) || 0,
        method: e.method || "UPI",
        clientId: e.clientId || null,
        projectId: e.projectId || null,
      };

      const isEdit = Boolean(e._id);

      const response = await fetch(isEdit ? `${API}/${e._id}` : API, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save expense");
      }

      const saved = await response.json();

      const mappedExpense = {
        ...saved,
        id: saved._id,
        vendor: saved.vendor || saved.title || "",
        notes: saved.notes || saved.description || "",
        rate: saved.rate || 0,
        gst: saved.gst || 0,
        method: saved.method || "UPI",
        clientId: saved.clientId || null,
        projectId: saved.projectId || null,
      };

      setItems((current) =>
        isEdit
          ? current.map((item) => (item.id === e.id ? mappedExpense : item))
          : [...current, mappedExpense],
      );

      setForm(null);
    } catch (error) {
      console.error("Failed to save expense:", error);
      setApiError(error.message || "Failed to save expense");
    }
  };

  const remove = async (e) => {
    if (
      !window.confirm(`Delete the ${inr(total(e))} expense for ${e.vendor}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`${API}/${e.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete expense");
      }

      setItems((current) => current.filter((item) => item.id !== e.id));
    } catch (error) {
      console.error("Failed to delete expense:", error);
      setApiError(error.message || "Failed to delete expense");
    }
  };

  const exportCsv = () => {
    const head = [
      "Date",
      "Vendor",
      "Category",
      "Amount",
      "GST",
      "Total",
      "Paid by",
      "Notes",
    ];

    const body = rows.map((e) => [
      e.date,
      e.vendor,
      e.category,
      e.amount,
      e.gst,
      total(e),
      e.method,
      e.notes,
    ]);

    const csv = [head, ...body]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      }),
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = `pegal-expenses-${month}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">
              Expenses
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Track what your agency spends and the GST you pay on it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Period"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400"
            >
              <option value="all">All time</option>

              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>

            <button
              onClick={exportCsv}
              disabled={!rows.length}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <Download size={16} />
              Export
            </button>

            <button
              onClick={() => setForm({})}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 hover:bg-blue-700"
            >
              <Plus size={17} />
              Add expense
            </button>
          </div>
        </section>

        {apiError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {apiError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            title="Total spend"
            value={inr(spend)}
            note="Including GST"
            icon={Wallet}
            tone="bg-blue-50 text-blue-600"
          />

          <Stat
            title="GST paid"
            value={inr(gstPaid)}
            note="Input tax credit you can claim"
            icon={Receipt}
            tone="bg-emerald-50 text-emerald-600"
          />

          <Stat
            title="Top category"
            value={top ? top[0] : "None yet"}
            note={top ? inr(top[1]) : "Add an expense to see this"}
            icon={Layers}
            tone="bg-violet-50 text-violet-600"
          />

          <Stat
            title="Entries"
            value={String(inMonth.length)}
            note={month === "all" ? "All time" : monthLabel(month)}
            icon={Hash}
            tone="bg-orange-50 text-orange-600"
          />
        </section>

        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search vendor, category or notes"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-300"
                />
              </div>

              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                aria-label="Category"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400"
              >
                <option value="all">All categories</option>

                {Object.keys(CATEGORIES).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-slate-400">Loading expenses...</p>
              </div>
            ) : rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-semibold text-slate-500">
                      <th className="px-5 py-3.5">Vendor</th>

                      <th className="px-3 py-3.5">Category</th>

                      <th className="px-3 py-3.5">Date</th>

                      <th className="px-3 py-3.5 text-right">GST</th>

                      <th className="px-3 py-3.5 text-right">Total</th>

                      <th className="px-3 py-3.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.map((e) => (
                      <tr
                        key={e._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-slate-800">
                            {e.vendor}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {e.method}
                            {e.notes ? ` · ${e.notes}` : ""}
                          </p>
                        </td>

                        <td className="px-3 py-3.5">
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                              CATEGORIES[e.category]?.chip ||
                              CATEGORIES.Other.chip
                            }`}
                          >
                            {e.category}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-500">
                          {fmtDate(e.date)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3.5 text-right text-sm text-slate-500">
                          {inr(e.gst)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3.5 text-right text-sm font-semibold text-slate-900">
                          {inr(total(e))}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3.5 text-right">
                          <button
                            onClick={() => setForm(e)}
                            aria-label={`Edit ${e.vendor}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => remove(e)}
                            aria-label={`Delete ${e.vendor}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Wallet size={22} />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-800">
                  {items.length
                    ? "No expenses match these filters"
                    : "No expenses recorded yet"}
                </p>

                <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
                  {items.length
                    ? "Try a different period, category or search."
                    : "Add rent, software, hosting or any other business spend to start tracking."}
                </p>

                {!items.length && (
                  <button
                    onClick={() => setForm({})}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add your first expense
                  </button>
                )}
              </div>
            )}

            {rows.length > 0 && (
              <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500">
                <span>
                  Showing {rows.length} of {inMonth.length}
                </span>

                <span>
                  Filtered total{" "}
                  <strong className="text-slate-900">
                    {inr(rows.reduce((s, e) => s + total(e), 0))}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <aside className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <h3 className="text-base font-semibold">Spend by category</h3>

            <p className="mt-1 text-sm text-slate-400">
              {month === "all" ? "All time" : monthLabel(month)}
            </p>

            {byCat.length ? (
              <ul className="mt-5 space-y-4">
                {byCat.map(([name, value]) => (
                  <li key={name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-600">{name}</span>

                      <span className="shrink-0 font-semibold text-slate-900">
                        {inr(value)}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          CATEGORIES[name]?.bar || "bg-slate-400"
                        }`}
                        style={{
                          width: `${Math.max(3, (value / spend) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-slate-400">
                Your category breakdown appears here once you add expenses.
              </p>
            )}
          </aside>
        </section>
      </div>

      {form && (
        <ExpenseForm
          initial={form._id ? form : null}
          onSave={saveExpense}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
