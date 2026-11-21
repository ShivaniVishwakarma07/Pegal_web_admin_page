import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Server,
  Wrench,
  IndianRupee,
  CalendarClock,
  AlertTriangle,
  MessageCircle,
  RefreshCw,
  Check,
  Globe,
  Mail,
} from "lucide-react";

const API = "http://localhost:5000/api";
const GST_RATE = 18;

const TYPES = {
  Hosting: {
    icon: Server,
    tone: "bg-sky-50 text-sky-700",
    plans: [
      "Starter Shared",
      "Business Shared",
      "WordPress Managed",
      "Cloud",
      "VPS",
      "Dedicated",
    ],
    detailLabel: "Server or provider",
    detailHint: "e.g. cPanel, Hostinger, AWS Mumbai",
  },
  Maintenance: {
    icon: Wrench,
    tone: "bg-violet-50 text-violet-700",
    plans: ["Basic care", "Standard care", "Premium care", "Custom"],
    detailLabel: "What is included",
    detailHint: "e.g. Updates, backups, security scan, 2 hrs support",
  },
};

const TENURES = [1, 3, 6, 12, 24, 36];
const REMIND = [30, 15, 7, 3];

const CHIP = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

const inr = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const parse = (s) => new Date(s + "T00:00:00");
const iso = (d) => d.toLocaleDateString("en-CA");
const today = () => iso(new Date());

const addM = (s, m) => {
  const d = parse(s);
  d.setMonth(d.getMonth() + m);
  return iso(d);
};

const daysLeft = (s) => Math.round((parse(s) - parse(today())) / 864e5);

const fmtDate = (d) =>
  parse(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const monthLabel = (m) =>
  parse(m + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

const gross = (s) =>
  s.amount + (s.gstOn ? Math.round((s.amount * GST_RATE) / 100) : 0);

const tenureLabel = (m) =>
  m % 12 === 0
    ? `${m / 12} year${m > 12 ? "s" : ""}`
    : `${m} month${m > 1 ? "s" : ""}`;

const waLink = (phone) => {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  return p ? `https://wa.me/${p}` : null;
};

function statusOf(s) {
  const left = daysLeft(s.due);

  if (s.paid) {
    return left < 0
      ? ["Expired", "rose"]
      : left <= s.remind
        ? ["Renewal soon", "amber"]
        : ["Active", "emerald"];
  }

  return left < 0 ? ["Overdue", "rose"] : ["Unpaid", "amber"];
}

const whenText = (s) => {
  const l = daysLeft(s.due);

  return l < 0
    ? `${-l} day${l < -1 ? "s" : ""} ago`
    : l === 0
      ? "today"
      : `in ${l} day${l > 1 ? "s" : ""}`;
};

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

const blank = (type = "Hosting") => ({
  type,
  client: "",
  clientId: "",
  phone: "",
  email: "",
  domain: "",
  plan: TYPES[type].plans[1] || TYPES[type].plans[0],
  detail: "",
  tenure: 12,
  amount: "",
  gstOn: true,
  billed: today(),
  due: addM(today(), 12),
  remind: 30,
  paid: false,
  notes: "",
});

function ServiceForm({ initial, clients, onSave, onClose }) {
  const [f, setF] = useState(initial || blank());
  const [err, setErr] = useState("");

  const T = TYPES[f.type];
  const amt = Number(f.amount) || 0;

  const total = amt + (f.gstOn ? Math.round((amt * GST_RATE) / 100) : 0);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();

    window.addEventListener("keydown", k);

    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const pickClient = (name) => {
    const c = clients.find(
      (x) => x.name.toLowerCase() === name.trim().toLowerCase(),
    );

    setF((p) => ({
      ...p,
      client: name,
      clientId: c?._id || c?.id || "",
      phone: c?.phone || p.phone || "",
      email: c?.email || p.email || "",
    }));
  };

  const submit = () => {
    if (!f.client.trim()) {
      return setErr("Enter the client name.");
    }

    if (!f.domain.trim()) {
      return setErr("Enter the domain or website.");
    }

    if (amt <= 0) {
      return setErr("Enter the amount for one billing period.");
    }

    if (f.due < f.billed) {
      return setErr("The due date cannot be before the billed date.");
    }

    onSave({
      ...f,
      client: f.client.trim(),
      domain: f.domain.trim(),
      amount: amt,
      remind: 30,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Service form"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            {f.id ? "Edit service" : "Add service"}
          </h2>

          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="mb-5 grid grid-cols-2 gap-2"
          role="group"
          aria-label="Service type"
        >
          {Object.entries(TYPES).map(([name, t]) => (
            <button
              key={name}
              type="button"
              aria-pressed={f.type === name}
              onClick={() =>
                setF({
                  ...f,
                  type: name,
                  plan: t.plans[0],
                })
              }
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                f.type === name
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <t.icon size={16} /> {name}
            </button>
          ))}
        </div>

        <datalist id="client-list">
          {clients.map((c) => (
            <option key={c._id} value={c.name} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client *">
            <input
              list="client-list"
              autoFocus
              className={input}
              value={f.client}
              onChange={(e) => pickClient(e.target.value)}
            />
          </Field>

          <Field label="WhatsApp number">
            <input
              className={input}
              value={f.phone}
              onChange={(e) =>
                setF({
                  ...f,
                  phone: e.target.value,
                })
              }
              placeholder="98765 43210"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              className={input}
              value={f.email}
              onChange={(e) =>
                setF({
                  ...f,
                  email: e.target.value,
                })
              }
              placeholder="client@example.com"
            />
          </Field>

          <Field label="Domain or website *">
            <input
              className={input}
              value={f.domain}
              onChange={(e) =>
                setF({
                  ...f,
                  domain: e.target.value,
                })
              }
              placeholder="example.com"
            />
          </Field>

          <Field label="Plan name">
            <select
              className={input}
              value={f.plan}
              onChange={(e) =>
                setF({
                  ...f,
                  plan: e.target.value,
                })
              }
            >
              {T.plans.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label={T.detailLabel} className="sm:col-span-2">
            <input
              className={input}
              value={f.detail}
              onChange={(e) =>
                setF({
                  ...f,
                  detail: e.target.value,
                })
              }
              placeholder={T.detailHint}
            />
          </Field>

          <Field label="Tenure">
            <select
              className={input}
              value={f.tenure}
              onChange={(e) => {
                const t = Number(e.target.value);

                setF({
                  ...f,
                  tenure: t,
                  due: addM(f.billed, t),
                });
              }}
            >
              {TENURES.map((t) => (
                <option key={t} value={t}>
                  {tenureLabel(t)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Amount per tenure, before GST (₹) *">
            <input
              type="number"
              min="0"
              className={input}
              value={f.amount}
              onChange={(e) =>
                setF({
                  ...f,
                  amount: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Billed date">
            <input
              type="date"
              className={input}
              value={f.billed}
              onChange={(e) =>
                setF({
                  ...f,
                  billed: e.target.value,
                  due: addM(e.target.value, f.tenure),
                })
              }
            />
          </Field>

          <Field label="Due date (renewal)">
            <input
              type="date"
              className={input}
              value={f.due}
              onChange={(e) =>
                setF({
                  ...f,
                  due: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Remind me before">
            <select
              className={input}
              value={f.remind}
              onChange={(e) =>
                setF({
                  ...f,
                  remind: Number(e.target.value),
                })
              }
            >
              {REMIND.map((r) => (
                <option key={r} value={r}>
                  {r} days
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-end justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
            <span className="text-slate-500">
              Total {f.gstOn ? "with GST" : ""}
            </span>

            <strong className="text-slate-900">{inr(total)}</strong>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={f.gstOn}
              onChange={(e) =>
                setF({
                  ...f,
                  gstOn: e.target.checked,
                })
              }
              className="h-4 w-4 accent-blue-600"
            />

            <span className="text-sm font-medium">Add GST {GST_RATE}%</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={f.paid}
              onChange={(e) =>
                setF({
                  ...f,
                  paid: e.target.checked,
                })
              }
              className="h-4 w-4 accent-blue-600"
            />

            <span className="text-sm font-medium">Payment received</span>
          </label>

          <Field label="Notes" className="sm:col-span-2">
            <textarea
              rows={2}
              className={input}
              value={f.notes}
              onChange={(e) =>
                setF({
                  ...f,
                  notes: e.target.value,
                })
              }
              placeholder="Login owner, renewal history, special terms"
            />
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
            {f.id ? "Save changes" : "Add service"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Hosting() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [note, setNote] = useState("");

  const flash = (t) => {
    setNote(t);
    setTimeout(() => setNote(""), 3500);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hostingRes, clientsRes] = await Promise.all([
          fetch(`${API}/hosting`),
          fetch(`${API}/clients`),
        ]);

        if (!hostingRes.ok || !clientsRes.ok) {
          const hostingError = !hostingRes.ok ? await hostingRes.text() : "";
          const clientsError = !clientsRes.ok ? await clientsRes.text() : "";

          throw new Error(
            hostingError || clientsError || "Failed to load data",
          );
        }

        const hostingData = await hostingRes.json();
        const clientsData = await clientsRes.json();

        setItems(
          hostingData.map((s) => ({
            ...s,
            id: s._id,
            clientId:
              typeof s.clientId === "object" ? s.clientId?._id : s.clientId,
            billed: s.billed ? String(s.billed).slice(0, 10) : today(),
            due: s.due ? String(s.due).slice(0, 10) : today(),
            amount: Number(s.amount) || 0,
            tenure: Number(s.tenure) || 12,
            remind: 30,
          })),
        );

        setClients(clientsData);
      } catch (error) {
        flash(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const months = useMemo(() => {
    const s = new Set(items.map((i) => i.due.slice(0, 7)));

    s.add(today().slice(0, 7));

    return [...s].sort();
  }, [items]);

  const counts = {
    All: items.length,
    Hosting: items.filter((i) => i.type === "Hosting").length,
    Maintenance: items.filter((i) => i.type === "Maintenance").length,
  };

  const rows = useMemo(
    () =>
      items
        .filter((i) => tab === "All" || i.type === tab)
        .filter((i) => status === "all" || statusOf(i)[0] === status)
        .filter((i) => month === "all" || i.due.startsWith(month))
        .filter((i) =>
          [i.client, i.domain, i.plan, i.detail, i.notes]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .sort((a, b) => (a.due < b.due ? -1 : 1)),
    [items, tab, status, month, q],
  );

  const live = items.filter(
    (i) => !["Expired", "Overdue"].includes(statusOf(i)[0]),
  );

  const yearly = live.reduce((s, i) => s + (gross(i) * 12) / i.tenure, 0);

  const soon = items.filter((i) => {
    const l = daysLeft(i.due);
    return l >= 0 && l <= 30;
  });

  const late = items.filter((i) =>
    ["Expired", "Overdue"].includes(statusOf(i)[0]),
  );

  const upcoming = [...items]
    .filter((i) => !i.paid || daysLeft(i.due) <= i.remind)
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, 5);

  const save = async (s) => {
    try {
      const isEdit = Boolean(s.id && s.id.length > 10);

      const payload = {
        type: s.type,
        client: s.client,
        clientId: s.clientId || null,
        phone: s.phone || "",
        email: s.email || "",
        domain: s.domain,
        plan: s.plan,
        detail: s.detail || "",
        tenure: Number(s.tenure),
        amount: Number(s.amount),
        gstOn: Boolean(s.gstOn),
        billed: s.billed,
        due: s.due,
        remind: 30,
        paid: Boolean(s.paid),
        notes: s.notes || "",
      };

      const response = await fetch(
        isEdit ? `${API}/hosting/${s.id}` : `${API}/hosting`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save service");
      }

      const mapped = {
        ...data,
        id: data._id,
        billed: String(data.billed).slice(0, 10),
        due: String(data.due).slice(0, 10),
        amount: Number(data.amount) || 0,
        tenure: Number(data.tenure) || 12,
        remind: 30,
      };

      setItems((current) =>
        isEdit
          ? current.map((item) => (item.id === s.id ? mapped : item))
          : [...current, mapped],
      );

      setForm(null);

      flash(
        isEdit
          ? "Service updated successfully."
          : "Service added successfully.",
      );
    } catch (error) {
      flash(error.message);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.plan} for ${s.domain}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API}/hosting/${s.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete service");
      }

      setItems((current) => current.filter((x) => x.id !== s.id));

      flash("Service deleted successfully.");
    } catch (error) {
      flash(error.message);
    }
  };

  const togglePaid = async (s) => {
    try {
      const response = await fetch(`${API}/hosting/${s.id}/paid`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paid: !s.paid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update payment");
      }

      setItems((current) =>
        current.map((x) =>
          x.id === s.id
            ? {
                ...x,
                paid: data.paid,
              }
            : x,
        ),
      );

      flash(
        data.paid ? "Payment marked as received." : "Payment marked as unpaid.",
      );
    } catch (error) {
      flash(error.message);
    }
  };

  const renew = async (s) => {
    const next = addM(s.due, s.tenure);

    if (
      !window.confirm(
        `Renew ${s.domain} until ${fmtDate(next)} and create an unpaid invoice for ${inr(gross(s))}?`,
      )
    ) {
      return;
    }

    try {
      const gst = s.gstOn ? Math.round((s.amount * GST_RATE) / 100) : 0;

      const invoicePayload = {
        number: `PEG-${new Date().getFullYear()}-${Date.now()
          .toString()
          .slice(-6)}`,
        issue: today(),
        due: s.due > today() ? s.due : today(),
        status: "Unpaid",
        client: {
          clientId: s.clientId || null,
          name: s.client,
          phone: s.phone || "",
          company: "",
          email: s.email || "",
          address: "",
          gstin: "",
        },
        items: [
          {
            id: 1,
            description: `${s.type}: ${s.plan} (${s.domain}), ${tenureLabel(s.tenure)}, ${fmtDate(s.due)} to ${fmtDate(next)}`,
            hsn: "998315",
            qty: 1,
            price: s.amount,
            gst: s.gstOn ? GST_RATE : 0,
            amount: s.amount,
          },
        ],
        discount: 0,
        gstOn: s.gstOn,
        supply: "intra",
        subtotal: s.amount,
        gst,
        total: s.amount + gst,
      };

      const invoiceResponse = await fetch(`${API}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoicePayload),
      });

      const invoiceData = await invoiceResponse.json();

      if (!invoiceResponse.ok) {
        throw new Error(invoiceData.message || "Failed to create invoice");
      }

      const hostingResponse = await fetch(`${API}/hosting/${s.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: s.type,
          client: s.client,
          clientId: s.clientId || null,
          phone: s.phone || "",
          email: s.email || "",
          domain: s.domain,
          plan: s.plan,
          detail: s.detail || "",
          tenure: s.tenure,
          amount: s.amount,
          gstOn: s.gstOn,
          billed: s.due,
          due: next,
          remind: 30,
          paid: false,
          notes: s.notes || "",
        }),
      });

      const hostingData = await hostingResponse.json();

      if (!hostingResponse.ok) {
        throw new Error(
          hostingData.message ||
            "Invoice created but hosting renewal update failed",
        );
      }

      const mapped = {
        ...hostingData,
        id: hostingData._id,
        billed: String(hostingData.billed).slice(0, 10),
        due: String(hostingData.due).slice(0, 10),
        amount: Number(hostingData.amount) || 0,
        tenure: Number(hostingData.tenure) || 12,
        remind: 30,
      };

      setItems((current) => current.map((x) => (x.id === s.id ? mapped : x)));

      flash(`Renewed ${s.domain} and created invoice ${invoiceData.number}.`);
    } catch (error) {
      flash(error.message);
    }
  };

  const remind = (s) => {
    const link = waLink(s.phone);

    if (!link) {
      return flash("Add a WhatsApp number for this client first.");
    }

    const text = `Hello ${s.client}, your ${s.plan} ${s.type.toLowerCase()} for ${s.domain} is due ${whenText(s)} (${fmtDate(s.due)}). Amount: ${inr(gross(s))}${s.gstOn ? " incl. GST" : ""} for ${tenureLabel(s.tenure)}. Please confirm to continue the service. - Pegal Agency`;

    window.open(`${link}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const emailRemind = (s) => {
    if (!s.email) {
      return flash("Add an email address for this client first.");
    }

    const subject = `${s.plan} ${s.type.toLowerCase()} renewal reminder - ${s.domain}`;

    const body = `Hello ${s.client},

Your ${s.plan} ${s.type.toLowerCase()} for ${s.domain} is due ${whenText(s)} (${fmtDate(s.due)}).

Amount: ${inr(gross(s))}${s.gstOn ? " incl. GST" : ""} for ${tenureLabel(s.tenure)}.

Please confirm to continue the service.

- Pegal Agency`;

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(s.email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, "_blank");
  };

  return (
    <div className="min-w-0 text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">
              Hosting and maintenance
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Plans you bill clients for, with billing dates, tenure and
              renewals.
            </p>
          </div>

          <button
            onClick={() => setForm({})}
            className="inline-flex h-11 items-center gap-2 self-start rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 hover:bg-blue-700 sm:self-auto"
          >
            <Plus size={17} />
            Add service
          </button>
        </section>

        {note && (
          <p
            className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
            role="status"
          >
            {note}
          </p>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            title="Services"
            value={String(items.length)}
            note={`${counts.Hosting} hosting, ${counts.Maintenance} maintenance`}
            icon={Server}
            tone="bg-blue-50 text-blue-600"
          />

          <Stat
            title="Yearly recurring revenue"
            value={inr(yearly)}
            note="Active and unpaid plans, with GST"
            icon={IndianRupee}
            tone="bg-emerald-50 text-emerald-600"
          />

          <Stat
            title="Due in 30 days"
            value={String(soon.length)}
            note={inr(soon.reduce((s, i) => s + gross(i), 0))}
            icon={CalendarClock}
            tone="bg-amber-50 text-amber-600"
          />

          <Stat
            title="Overdue or expired"
            value={String(late.length)}
            note={inr(late.reduce((s, i) => s + gross(i), 0))}
            icon={AlertTriangle}
            tone="bg-rose-50 text-rose-600"
          />
        </section>

        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div
              className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3"
              role="tablist"
            >
              {["All", "Hosting", "Maintenance"].map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold ${
                    tab === t
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t}{" "}
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {counts[t]}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search client, domain or plan"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-300"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Status"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400"
              >
                <option value="all">All statuses</option>

                {["Active", "Renewal soon", "Unpaid", "Overdue", "Expired"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="Due month"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400"
              >
                <option value="all">Any due month</option>

                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-semibold text-slate-500">
                      <th className="px-5 py-3.5">Client and domain</th>
                      <th className="px-3 py-3.5">Plan</th>
                      <th className="px-3 py-3.5">Tenure</th>
                      <th className="px-3 py-3.5 text-right">Amount</th>
                      <th className="px-3 py-3.5">Billed</th>
                      <th className="px-3 py-3.5">Due</th>
                      <th className="px-3 py-3.5">Status</th>
                      <th className="px-3 py-3.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.map((s) => {
                      const [label, color] = statusOf(s);

                      const T = TYPES[s.type];

                      return (
                        <tr
                          key={s.id}
                          className="align-top transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {s.client}
                            </p>

                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                              <Globe size={12} className="text-slate-400" />
                              {s.domain}
                            </p>
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${T.tone}`}
                            >
                              <T.icon size={12} />
                              {s.type}
                            </span>

                            <p className="mt-1.5 text-sm font-medium text-slate-800">
                              {s.plan}
                            </p>

                            {s.detail && (
                              <p
                                className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400"
                                title={s.detail}
                              >
                                {s.detail}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                            {tenureLabel(s.tenure)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {inr(gross(s))}
                            </p>

                            <p className="text-xs text-slate-400">
                              {s.gstOn ? `${inr(s.amount)} + GST` : "No GST"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                            {fmtDate(s.billed)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4">
                            <p className="text-sm font-medium text-slate-800">
                              {fmtDate(s.due)}
                            </p>

                            <p className="text-xs text-slate-400">
                              {whenText(s)}
                            </p>
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${CHIP[color]}`}
                            >
                              {label}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-right">
                            {s.paid ? (
                              <button
                                onClick={() => renew(s)}
                                className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                <RefreshCw size={13} />
                                Renew
                              </button>
                            ) : (
                              <button
                                onClick={() => togglePaid(s)}
                                className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <Check size={13} />
                                Mark paid
                              </button>
                            )}

                            <button
                              onClick={() => remind(s)}
                              aria-label={`Remind ${s.client} on WhatsApp`}
                              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                            >
                              <MessageCircle size={16} />
                            </button>

                            <button
                              onClick={() => emailRemind(s)}
                              aria-label={`Email ${s.client}`}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <Mail size={16} />
                            </button>

                            <button
                              onClick={() => setForm(s)}
                              aria-label={`Edit ${s.domain}`}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => remove(s)}
                              aria-label={`Delete ${s.domain}`}
                              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Server size={22} />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-800">
                  {items.length
                    ? "No services match these filters"
                    : "No hosting or maintenance plans yet"}
                </p>

                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
                  {items.length
                    ? "Try another tab, status or month."
                    : "Add a client's hosting or maintenance plan to track billing, tenure and renewals."}
                </p>

                {!items.length && (
                  <button
                    onClick={() => setForm({})}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add service
                  </button>
                )}
              </div>
            )}
          </div>

          <aside className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
            <h3 className="text-base font-semibold">Needs attention</h3>

            <p className="mt-1 text-sm text-slate-400">
              Unpaid or renewing soon
            </p>

            {upcoming.length ? (
              <ul className="mt-5 space-y-4">
                {upcoming.map((s) => {
                  const [label, color] = statusOf(s);

                  return (
                    <li
                      key={s.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {s.domain}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {s.client} · {s.plan}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Due {fmtDate(s.due)} ({whenText(s)})
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {inr(gross(s))}
                        </p>

                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${CHIP[color]}`}
                        >
                          {label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-slate-400">
                Nothing needs attention right now.
              </p>
            )}
          </aside>
        </section>
      </div>

      {form && (
        <ServiceForm
          initial={form.id ? form : null}
          clients={clients}
          onSave={save}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
