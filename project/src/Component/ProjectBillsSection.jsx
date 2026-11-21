import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import {
  Search,
  ArrowUpRight,
  ChevronDown,
  FileText,
  Plus,
} from "lucide-react";

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function EmptyState() {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        <FileText size={22} className="text-slate-400" />
      </div>

      <p className="text-sm font-semibold text-slate-700">No projects found</p>

      <p className="mt-1 text-xs text-slate-400">
        Your actual project records will appear here.
      </p>
    </div>
  );
}

function ProjectCard({ project, open, onToggle, onOpen }) {
  const bills = project.bills || [];

  const billed = bills.reduce(
    (sum, bill) => sum + (Number(bill.amount) || 0),
    0,
  );

  const collected = bills
    .filter((bill) => bill.status === "Paid")
    .reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);

  const expenses = Number(project.expenses) || 0;
  const payroll = Number(project.payroll) || 0;
  const profit = billed - expenses - payroll;

  const margin = billed > 0 ? (profit / billed) * 100 : 0;

  const collectedPct = billed > 0 ? (collected / billed) * 100 : 0;

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => onOpen(project._id || project.id)}
              className="truncate text-left text-sm font-semibold text-slate-900 hover:text-blue-600"
            >
              {project.name || "Untitled project"}
            </button>

            <p className="mt-1 text-xs text-slate-400">
              {project.client?.name || project.clientName || "No client"}
              {" · "}
              {project.projectId || project._id || project.id}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
              profit < 0
                ? "bg-rose-50 text-rose-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {billed > 0 ? `${margin.toFixed(0)}% margin` : "No billing"}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Net profit</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(profit)}
            </p>
          </div>

          <p className="pb-1 text-xs text-slate-400">
            {formatCurrency(billed)} billed
          </p>
        </div>

        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
          {billed > 0 && (
            <>
              <div
                className="bg-violet-500"
                style={{ width: `${Math.min((payroll / billed) * 100, 100)}%` }}
              />
              <div
                className="bg-orange-400"
                style={{
                  width: `${Math.min((expenses / billed) * 100, 100)}%`,
                }}
              />
              <div
                className="bg-emerald-500"
                style={{
                  width: `${Math.max(0, Math.min((profit / billed) * 100, 100))}%`,
                }}
              />
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Payroll {formatCurrency(payroll)}</span>
          <span>Expenses {formatCurrency(expenses)}</span>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60">
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left sm:px-6"
        >
          <span className="text-xs font-medium text-slate-600">
            {bills.length} {bills.length === 1 ? "bill" : "bills"} ·{" "}
            {collectedPct.toFixed(0)}% collected
          </span>

          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <ul className="divide-y divide-slate-100 border-t border-slate-100 bg-white">
            {bills.length > 0 ? (
              bills.map((bill) => (
                <li
                  key={bill._id || bill.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(bill.amount)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {bill.invoiceNumber || bill.id || "Invoice"}
                      {bill.date &&
                        ` · ${new Date(bill.date).toLocaleDateString("en-IN")}`}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      bill.status === "Paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : bill.status === "Overdue"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {bill.status || "Pending"}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-5 py-8 text-center text-xs text-slate-400">
                No bills available.
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function ProjectBillsSection() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    projectId: "",
    clientName: "",
    payroll: 0,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setApiError("");

        const response = await fetch(`${API_URL}/api/projects`);

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        setApiError(error.message || "Unable to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [openIds, setOpenIds] = useState(new Set());

  const list = useMemo(() => {
    return projects.filter((project) => {
      const bills = project.bills || [];

      const billed = bills.reduce(
        (sum, bill) => sum + (Number(bill.amount) || 0),
        0,
      );

      const expenses = Number(project.expenses) || 0;
      const payroll = Number(project.payroll) || 0;
      const profit = billed - expenses - payroll;
      const margin = billed ? (profit / billed) * 100 : 0;

      const overdue = bills.some((bill) => bill.status === "Overdue");

      const matchesTab =
        tab === "All" ||
        (tab === "Profitable" && margin >= 30) ||
        (tab === "At risk" && (margin < 30 || overdue));

      const matchesSearch = [
        project.name,
        project.client?.name,
        project.clientName,
        project.projectId,
        project._id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [projects, tab, search]);

  const totals = useMemo(() => {
    return projects.reduce(
      (result, project) => {
        const bills = project.bills || [];

        const billed = bills.reduce(
          (sum, bill) => sum + (Number(bill.amount) || 0),
          0,
        );

        const collected = bills
          .filter((bill) => bill.status === "Paid")
          .reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);

        const profit =
          billed -
          (Number(project.expenses) || 0) -
          (Number(project.payroll) || 0);

        result.billed += billed;
        result.profit += profit;
        result.out += billed - collected;

        return result;
      },
      { billed: 0, profit: 0, out: 0 },
    );
  }, [projects]);

  const toggle = (id) => {
    setOpenIds((current) => {
      const next = new Set(current);

      next.has(id) ? next.delete(id) : next.add(id);

      return next;
    });
  };

  const saveProject = async (e) => {
    e.preventDefault();

    try {
      setApiError("");

      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectForm.name.trim(),
          projectId: projectForm.projectId.trim(),
          clientName: projectForm.clientName.trim(),
          payroll: Number(projectForm.payroll) || 0,
          bills: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create project");
      }

      setProjects((current) => [data, ...current]);

      setProjectForm({
        name: "",
        projectId: "",
        clientName: "",
        payroll: 0,
      });

      setShowForm(false);
    } catch (error) {
      setApiError(error.message || "Unable to create project");
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {showForm && (
        <div className="border-b border-slate-200 bg-white p-5 sm:p-6">
          <form
            onSubmit={saveProject}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Project name
              </label>

              <input
                required
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter project name"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Project ID
              </label>

              <input
                value={projectForm.projectId}
                onChange={(e) =>
                  setProjectForm((current) => ({
                    ...current,
                    projectId: e.target.value,
                  }))
                }
                placeholder="Enter project ID"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Client name
              </label>

              <input
                value={projectForm.clientName}
                onChange={(e) =>
                  setProjectForm((current) => ({
                    ...current,
                    clientName: e.target.value,
                  }))
                }
                placeholder="Enter client name"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Payroll
              </label>

              <input
                type="number"
                min="0"
                value={projectForm.payroll}
                onChange={(e) =>
                  setProjectForm((current) => ({
                    ...current,
                    payroll: e.target.value,
                  }))
                }
                placeholder="0"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <button
                type="submit"
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save project
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Project profit & recent bills
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Monitor actual project revenue and expenses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-300 sm:w-56"
              />
            </div>

            <button
              onClick={() => navigate("/projects")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              View all <ArrowUpRight size={15} />
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} /> New project
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {["All", "Profitable", "At risk"].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium ${
                  tab === item
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400">Billed</dt>
              <dd className="mt-0.5 text-sm font-semibold">
                {formatCurrency(totals.billed)}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400">Profit kept</dt>
              <dd className="mt-0.5 text-sm font-semibold text-emerald-600">
                {formatCurrency(totals.profit)}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400">Yet to collect</dt>
              <dd className="mt-0.5 text-sm font-semibold text-amber-600">
                {formatCurrency(totals.out)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 bg-slate-50/50 p-4 sm:p-6 xl:grid-cols-2">
        {list.map((project) => (
          <ProjectCard
            key={project._id || project.id}
            project={project}
            open={openIds.has(project._id || project.id)}
            onToggle={() => toggle(project._id || project.id)}
            onOpen={(id) => navigate(`/projects?open=${id}`)}
          />
        ))}

        {list.length === 0 && <EmptyState />}
      </div>

      <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:px-6">
        Showing {list.length} of {projects.length} projects
      </div>
    </section>
  );
}
