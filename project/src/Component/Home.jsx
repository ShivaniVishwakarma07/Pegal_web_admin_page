import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReceiptText,
  FileText,
  Wallet,
  Users,
  Plus,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  IndianRupee,
  TrendingUp,
  Clock3,
  RefreshCw,
} from "lucide-react";

import ProjectBillsSection from "./ProjectBillsSection";

const routes = {
  Invoices: "/invoice",
  Quotations: "/Quotation",
  Expenses: "/Expenses",
  Clients: "/Clients",
  Projects: "/projects",
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getReceivedAmount = (invoice) => {
  const total = Number(invoice?.total || 0);
  const refunded = Number(invoice?.refundedAmount || 0);
  const status = String(invoice?.status || "").toLowerCase();

  if (
    status === "paid" ||
    status === "partially refunded" ||
    status === "refunded"
  ) {
    return Math.max(0, total - refunded);
  }

  return 0;
};

const getOutstandingAmount = (invoice) => {
  const total = Number(invoice?.total || 0);
  const refunded = Number(invoice?.refundedAmount || 0);
  const status = String(invoice?.status || "").toLowerCase();

  if (
    status === "unpaid" ||
    status === "pending" ||
    status === "overdue" ||
    status === "partial"
  ) {
    return Math.max(0, total - refunded);
  }

  return 0;
};

function StatCard({ title, value, description, icon: Icon, iconColor }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
        >
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <FileText size={22} className="text-slate-400" />
      </div>

      <p className="text-sm font-semibold text-slate-700">{title}</p>

      <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [hosting, setHosting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [invoiceResponse, expenseResponse, hostingResponse] =
        await Promise.all([
          fetch("http://localhost:5000/api/invoices"),
          fetch("http://localhost:5000/api/expenses"),
          fetch("http://localhost:5000/api/hosting"),
        ]);

      const invoiceData = invoiceResponse.ok
        ? await invoiceResponse.json()
        : [];

      const expenseData = expenseResponse.ok
        ? await expenseResponse.json()
        : [];

      const hostingData = hostingResponse.ok
        ? await hostingResponse.json()
        : [];

      if (!invoiceResponse.ok && !expenseResponse.ok && !hostingResponse.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setHosting(Array.isArray(hostingData) ? hostingData : []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totals = useMemo(() => {
    const revenue = invoices.reduce(
      (sum, invoice) => sum + getReceivedAmount(invoice),
      0,
    );

    const invoiceValue = invoices.reduce(
      (sum, invoice) => sum + Number(invoice?.total || 0),
      0,
    );

    const refunded = invoices.reduce(
      (sum, invoice) => sum + Number(invoice?.refundedAmount || 0),
      0,
    );

    const expenseTotal = expenses.reduce(
      (sum, expense) => sum + Number(expense?.amount || 0),
      0,
    );

    const outstanding = invoices.reduce(
      (sum, invoice) => sum + getOutstandingAmount(invoice),
      0,
    );

    return {
      revenue,
      invoiceValue,
      refunded,
      expenseTotal,
      profit: revenue - expenseTotal,
      outstanding,
    };
  }, [invoices, expenses]);

  const invoiceStats = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let refunded = 0;

    invoices.forEach((invoice) => {
      const status = String(invoice?.status || "").toLowerCase();

      if (status === "paid") {
        paid += 1;
      }

      if (
        status === "unpaid" ||
        status === "pending" ||
        status === "overdue" ||
        status === "partial"
      ) {
        pending += 1;
      }

      if (status === "refunded" || status === "partially refunded") {
        refunded += 1;
      }
    });

    const collectionRate =
      totals.invoiceValue > 0
        ? Math.round((totals.revenue / totals.invoiceValue) * 100)
        : 0;

    return {
      total: invoices.length,
      paid,
      pending,
      refunded,
      collectionRate,
    };
  }, [invoices, totals]);

  const monthlyData = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-IN", {
          month: "short",
        }),
        revenue: 0,
        expense: 0,
      });
    }

    invoices.forEach((invoice) => {
      const date = new Date(invoice?.issue);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = months.find((item) => item.key === key);

      if (month) {
        month.revenue += getReceivedAmount(invoice);
      }
    });

    expenses.forEach((expense) => {
      const date = new Date(expense?.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = months.find((item) => item.key === key);

      if (month) {
        month.expense += Number(expense?.amount || 0);
      }
    });

    return months;
  }, [invoices, expenses]);

  const maxChartValue = Math.max(
    1,
    ...monthlyData.flatMap((item) => [item.revenue, item.expense]),
  );

  const upcomingHosting = useMemo(() => {
    const today = new Date();

    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);

    return hosting
      .filter((item) => {
        const due = new Date(item?.due);

        return !Number.isNaN(due.getTime()) && due >= today && due <= limit;
      })
      .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
      .slice(0, 5);
  }, [hosting]);

  const now = new Date();

  const hour = now.getHours();

  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayLabel = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const quickActions = [
    {
      title: "Create invoice",
      description: "Create a new client invoice.",
      icon: ReceiptText,
      color: "bg-blue-50 text-blue-600",
      page: "Invoices",
    },
    {
      title: "New quotation",
      description: "Prepare a project quotation.",
      icon: FileText,
      color: "bg-violet-50 text-violet-600",
      page: "Quotations",
    },
    {
      title: "Record expense",
      description: "Add a business expense.",
      icon: Wallet,
      color: "bg-orange-50 text-orange-600",
      page: "Expenses",
    },
    {
      title: "Manage clients",
      description: "View and manage client records.",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      page: "Clients",
    },
  ];

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysRemaining = (date) => {
    const today = new Date();
    const due = new Date(date);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-w-0 text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-7">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">{todayLabel}</p>

            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-[30px]">
              {greeting}, Admin
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Welcome to your finance dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              title="Refresh dashboard"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={() => navigate(routes.Invoices)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              New invoice
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total revenue"
            value={formatCurrency(totals.revenue)}
            description={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} recorded`}
            icon={IndianRupee}
            iconColor="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Total expenses"
            value={formatCurrency(totals.expenseTotal)}
            description={`${expenses.length} expense${expenses.length === 1 ? "" : "s"} recorded`}
            icon={CreditCard}
            iconColor="bg-orange-50 text-orange-600"
          />

          <StatCard
            title="Net profit"
            value={formatCurrency(totals.profit)}
            description="Revenue received minus expenses"
            icon={TrendingUp}
            iconColor="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Outstanding"
            value={formatCurrency(totals.outstanding)}
            description="Pending invoice amount"
            icon={Wallet}
            iconColor="bg-violet-50 text-violet-600"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Financial overview</h3>

                <p className="mt-1 text-sm text-slate-400">
                  Revenue received and expenses over the last six months.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <CalendarDays size={15} className="text-slate-400" />

                <span className="text-xs text-slate-500">Last 6 months</span>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                Loading financial data...
              </div>
            ) : invoices.length === 0 && expenses.length === 0 ? (
              <EmptyState
                title="No financial records yet"
                description="Create an invoice or record an expense to see your financial performance here."
              />
            ) : (
              <div className="mt-8">
                <div className="flex h-64 items-end gap-3 border-b border-slate-100 px-2 sm:gap-6">
                  {monthlyData.map((item) => {
                    const revenueHeight = (item.revenue / maxChartValue) * 100;

                    const expenseHeight = (item.expense / maxChartValue) * 100;

                    return (
                      <div
                        key={item.key}
                        className="flex h-full min-w-0 flex-1 items-end justify-center gap-1.5"
                      >
                        <div className="flex h-full w-full max-w-12 items-end justify-end">
                          <div
                            className="w-full rounded-t-md bg-blue-500 transition-all"
                            style={{
                              height: `${Math.max(
                                revenueHeight,
                                item.revenue > 0 ? 3 : 0,
                              )}%`,
                            }}
                            title={`Revenue: ${formatCurrency(item.revenue)}`}
                          />
                        </div>

                        <div className="flex h-full w-full max-w-12 items-end justify-start">
                          <div
                            className="w-full rounded-t-md bg-orange-400 transition-all"
                            style={{
                              height: `${Math.max(
                                expenseHeight,
                                item.expense > 0 ? 3 : 0,
                              )}%`,
                            }}
                            title={`Expenses: ${formatCurrency(item.expense)}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-3 sm:gap-6">
                  {monthlyData.map((item) => (
                    <div
                      key={item.key}
                      className="min-w-0 flex-1 text-center text-xs text-slate-400"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-slate-500">Revenue received</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                    <span className="text-slate-500">Expenses</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Invoice summary</h3>

                <p className="mt-1 text-sm text-slate-400">
                  Your payment overview.
                </p>
              </div>

              <button
                onClick={() => navigate(routes.Invoices)}
                aria-label="View invoices"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <ArrowUpRight size={18} />
              </button>
            </div>

            {loading ? (
              <div className="flex h-52 items-center justify-center text-sm text-slate-400">
                Loading invoice data...
              </div>
            ) : invoices.length === 0 ? (
              <EmptyState
                title="No invoice data"
                description="Invoice statistics will appear here once invoices are created."
              />
            ) : (
              <div className="mt-7 space-y-5">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Total invoice value</p>

                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatCurrency(totals.invoiceValue)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Paid</span>

                    <span className="font-semibold text-emerald-600">
                      {invoiceStats.paid}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Pending</span>

                    <span className="font-semibold text-amber-600">
                      {invoiceStats.pending}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Refunded</span>

                    <span className="font-semibold text-red-500">
                      {invoiceStats.refunded}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Collection rate</span>

                    <span className="font-semibold text-slate-700">
                      {invoiceStats.collectionRate}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(100, invoiceStats.collectionRate)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
                  Refunded amount:{" "}
                  <span className="font-medium text-red-500">
                    {formatCurrency(totals.refunded)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold">
                Hosting expiry reminders
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Hosting and maintenance plans expiring within 30 days.
              </p>
            </div>

            <button
              onClick={() => navigate("/Hosting")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              View hosting
              <ArrowUpRight size={15} />
            </button>
          </div>

          {upcomingHosting.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              No hosting plans are expiring within the next 30 days.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {upcomingHosting.map((item) => {
                const days = getDaysRemaining(item.due);

                return (
                  <div
                    key={item._id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {item.client || "Unknown client"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.domain || "No domain"} ·{" "}
                        {item.plan || "Hosting plan"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Expiry</p>

                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                          {formatDate(item.due)}
                        </p>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                          days <= 7
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <Clock3 size={13} />
                        {days === 0
                          ? "Today"
                          : days === 1
                            ? "1 day"
                            : `${days} days`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <ProjectBillsSection />

        <section>
          <div className="mb-4">
            <h3 className="text-base font-semibold">Quick actions</h3>

            <p className="mt-1 text-sm text-slate-400">
              Access your everyday tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map(
              ({ title, description, icon: Icon, color, page }) => (
                <button
                  key={title}
                  onClick={() => navigate(routes[page])}
                  className="group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 text-left transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon size={21} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {description}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-slate-300 transition group-hover:text-blue-600"
                  />
                </button>
              ),
            )}
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-slate-200/80 py-5 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>© {now.getFullYear()} Pegal Agency. Finance workspace.</p>

          <span>Finance dashboard</span>
        </footer>
      </div>
    </div>
  );
}
