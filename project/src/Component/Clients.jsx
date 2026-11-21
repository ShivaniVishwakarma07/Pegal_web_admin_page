import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../api";
import {
  Search,
  Users,
  UserPlus,
  IndianRupee,
  Clock3,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  FileText,
  Layers,
  Download,
  Printer,
  X,
} from "lucide-react";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateText = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const monthText = (value) => {
  const date = new Date(`${value}-01T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
};

const getRefunded = (invoice) => Number(invoice?.refundedAmount) || 0;

const getClientId = (invoice) => {
  const clientId = invoice?.client?.clientId || invoice?.clientId;

  if (clientId && typeof clientId === "object") {
    return String(clientId._id || "").toLowerCase();
  }

  return String(clientId || "").toLowerCase();
};

const getPaid = (invoice) => {
  if (Array.isArray(invoice?.payments) && invoice.payments.length) {
    return invoice.payments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0,
    );
  }

  const total = Number(invoice?.total) || 0;
  const status = String(invoice?.status || "").toLowerCase();

  if (
    status === "paid" ||
    status === "refunded" ||
    status === "partially refunded"
  ) {
    return Math.max(0, total - getRefunded(invoice));
  }

  return Number(invoice?.paidAmount) || 0;
};

const getDue = (invoice) => {
  const total = Number(invoice?.total) || 0;
  const paid = getPaid(invoice);

  return Math.max(0, total - paid);
};

const hasPartialPayments = (invoice) =>
  Array.isArray(invoice?.payments) &&
  invoice.payments.length > 0 &&
  getDue(invoice) > 0;

const invoiceNumber = (invoice, index = 0) =>
  invoice?.number ||
  invoice?.invoiceNo ||
  invoice?.no ||
  invoice?.id ||
  `Invoice ${index + 1}`;

const getPhoneLink = (phone) => {
  let number = String(phone || "").replace(/\D/g, "");

  if (number.length === 10) {
    number = `91${number}`;
  }

  return number ? `https://wa.me/${number}` : "";
};

function safeText(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function invoiceHtml(invoice, client) {
  const rows = Array.isArray(invoice.items) ? invoice.items : [];

  const itemsHtml = rows.length
    ? rows
        .map(
          (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${safeText(
          item.description || item.name || item.title || "Item",
        )}</td>
        <td>${safeText(item.quantity ?? item.qty ?? 1)}</td>
        <td>${money(item.rate ?? item.price ?? item.amount)}</td>
        <td>${money(
          item.total ??
            item.amount ??
            (Number(item.quantity ?? item.qty ?? 1) || 1) *
              (Number(item.rate ?? item.price) || 0),
        )}</td>
      </tr>`,
        )
        .join("")
    : `<tr><td colspan="5">Invoice details</td></tr>`;

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${safeText(invoiceNumber(invoice))}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#172033;margin:36px}
      h1{margin:0 0 6px;font-size:26px}
      .muted{color:#64748b}
      .top{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #0f355e;padding-bottom:20px}
      .details{display:flex;justify-content:space-between;gap:24px;margin:24px 0}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{padding:11px;border:1px solid #dbe2ea;text-align:left;font-size:13px}
      th{background:#f1f5f9}
      .totals{margin:22px 0 0 auto;width:280px}
      .totalrow{display:flex;justify-content:space-between;padding:7px 0}
      .grand{font-weight:bold;border-top:2px solid #172033;margin-top:6px;padding-top:12px}
      @media print{body{margin:18mm}}
    </style>
  </head>
  <body>
    <div class="top">
      <div>
        <h1>INVOICE</h1>
        <div class="muted">
          Invoice ${safeText(invoiceNumber(invoice))}
        </div>
      </div>

      <div>
        <strong>Date:</strong>
        ${safeText(dateText(invoice.issue || invoice.date))}
        <br>

        <strong>Status:</strong>
        ${safeText(invoice.status || (getDue(invoice) ? "Pending" : "Paid"))}
      </div>
    </div>

    <div class="details">
      <div>
        <strong>Bill To</strong><br>
        ${safeText(client?.name || invoice.client?.name || "Client")}<br>

        ${safeText(client?.company || invoice.client?.company || "")}<br>

        ${safeText(client?.phone || invoice.client?.phone || "")}<br>

        ${safeText(client?.email || invoice.client?.email || "")}<br>

        ${safeText(client?.address || invoice.client?.address || "")}<br>

        ${safeText(client?.gstin || invoice.client?.gstin || "")}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>

      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totalrow">
        <span>Subtotal / Total</span>
        <strong>${money(invoice.total)}</strong>
      </div>

      <div class="totalrow">
        <span>Received</span>
        <strong>${money(getPaid(invoice))}</strong>
      </div>

      <div class="totalrow grand">
        <span>Balance Due</span>
        <strong>${money(getDue(invoice))}</strong>
      </div>
    </div>

    ${
      invoice.notes
        ? `<p><strong>Notes:</strong> ${safeText(invoice.notes)}</p>`
        : ""
    }
  </body>
  </html>`;
}

function downloadInvoice(invoice, client) {
  const html = invoiceHtml(invoice, client);

  const blob = new Blob([html], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;

  anchor.download = `${String(invoiceNumber(invoice)).replace(
    /[^a-z0-9-_]/gi,
    "_",
  )}.html`;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}

function printInvoice(invoice, client) {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    window.alert("Please allow pop-ups to print the invoice.");

    return;
  }

  printWindow.document.open();

  printWindow.document.write(invoiceHtml(invoice, client));

  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

function shareInvoice(invoice, client) {
  const phone = getPhoneLink(client?.phone);

  if (!phone) {
    window.alert("No valid phone number is available for this client.");

    return;
  }

  const message = [
    `Hello ${client.name},`,
    `Here is your invoice ${invoiceNumber(invoice)}.`,
    `Invoice date: ${dateText(invoice.issue || invoice.date)}`,
    `Total: ${money(invoice.total)}`,
    `Received: ${money(getPaid(invoice))}`,
    `Balance due: ${money(getDue(invoice))}`,
    "Thank you.",
  ].join("\n");

  const url = `${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

function Stat({ title, value, note, icon: Icon, tone }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-2 truncate text-xl font-semibold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function InvoiceList({ client, invoices, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {client.name} — Invoices
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {invoices.length} invoice(s)
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {invoices.length ? (
          <div className="space-y-3">
            {invoices.map((invoice, index) => {
              const due = getDue(invoice);

              const status = String(invoice.status || "").toLowerCase();

              let displayStatus = "Unpaid";

              if (status === "refunded") {
                displayStatus = "Refunded";
              } else if (status === "partially refunded") {
                displayStatus = "Partially Refunded";
              } else if (due <= 0) {
                displayStatus = "Paid";
              } else if (getPaid(invoice) > 0) {
                displayStatus = "Partially paid";
              }

              return (
                <article
                  key={
                    invoice.id ||
                    invoice._id ||
                    `${invoiceNumber(invoice, index)}-${index}`
                  }
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {invoiceNumber(invoice, index)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {dateText(invoice.issue || invoice.date)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        displayStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : displayStatus === "Refunded"
                            ? "bg-slate-100 text-slate-700"
                            : displayStatus === "Partially Refunded"
                              ? "bg-blue-50 text-blue-700"
                              : getPaid(invoice) > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Total</p>

                      <p className="mt-1 font-semibold">
                        {money(invoice.total)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Received</p>

                      <p className="mt-1 font-semibold text-emerald-700">
                        {money(getPaid(invoice))}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Balance</p>

                      <p className="mt-1 font-semibold text-rose-600">
                        {money(due)}
                      </p>
                    </div>
                  </div>

                  {getRefunded(invoice) > 0 && (
                    <p className="mt-2 text-xs text-blue-700">
                      Refunded: {money(getRefunded(invoice))}
                    </p>
                  )}

                  {hasPartialPayments(invoice) && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-blue-700">
                      <Layers size={13} /> Multiple payments recorded
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadInvoice(invoice, client)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download size={14} /> Download
                    </button>

                    <button
                      onClick={() => printInvoice(invoice, client)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Printer size={14} /> Print
                    </button>

                    <button
                      onClick={() => shareInvoice(invoice, client)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            No invoices found for this client.
          </p>
        )}
      </div>
    </div>
  );
}

export default function Clients() {
  const [invoices, setInvoices] = useState([]);

  const [clientsData, setClientsData] = useState([]);

  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState("");

  const [month, setMonth] = useState("all");

  const [mode, setMode] = useState("billed");

  const [query, setQuery] = useState("");

  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError("");

        const [clientsResponse, invoicesResponse, expensesResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/clients`),
            fetch(`${API_URL}/api/invoices`),
            fetch(`${API_URL}/api/expenses`),
          ]);

        if (!clientsResponse.ok) {
          throw new Error("Failed to fetch clients");
        }

        if (!invoicesResponse.ok) {
          throw new Error("Failed to fetch invoices");
        }

        if (!expensesResponse.ok) {
          throw new Error("Failed to fetch expenses");
        }

        const clients = await clientsResponse.json();

        const invoices = await invoicesResponse.json();

        const expenses = await expensesResponse.json();

        setClientsData(Array.isArray(clients) ? clients : []);

        setInvoices(Array.isArray(invoices) ? invoices : []);

        setExpenses(Array.isArray(expenses) ? expenses : []);
      } catch (error) {
        setApiError(error.message || "Unable to load client data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      try {
        const [invoicesResponse, expensesResponse] = await Promise.all([
          fetch(`${API_URL}/api/invoices`),
          fetch(`${API_URL}/api/expenses`),
        ]);

        if (invoicesResponse.ok) {
          const data = await invoicesResponse.json();

          setInvoices(Array.isArray(data) ? data : []);
        }

        if (expensesResponse.ok) {
          const data = await expensesResponse.json();

          setExpenses(Array.isArray(data) ? data : []);
        }
      } catch {
        return;
      }
    };

    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const clients = useMemo(() => {
    const invoiceClients = new Map();

    invoices.forEach((invoice) => {
      const source = invoice?.client || {};

      const name = String(source.name || invoice.clientName || "").trim();

      if (!name) return;

      const id =
        getClientId(invoice) ||
        String(source.clientId || invoice.clientId || name).toLowerCase();

      const existing = invoiceClients.get(id);

      if (!existing) {
        invoiceClients.set(id, {
          joined: invoice.issue || invoice.date || "",
        });
      } else {
        const date = invoice.issue || invoice.date || "";

        if (date && (!existing.joined || date < existing.joined)) {
          existing.joined = date;
        }
      }
    });

    return clientsData
      .map((source) => {
        const name = String(source.name || "").trim();

        const id = String(source._id || name).toLowerCase();

        const invoiceInfo = invoiceClients.get(id);

        return {
          id,
          mongoId: source._id,
          name,
          company: source.company || "",
          phone: source.phone || "",
          email: source.email || "",
          address: source.address || "",
          gstin: source.gstin || "",
          joined: source.createdAt
            ? source.createdAt.slice(0, 10)
            : invoiceInfo?.joined || "",
        };
      })
      .filter((client) => client.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clientsData, invoices]);

  const months = useMemo(() => {
    const values = new Set();

    invoices.forEach((invoice) => {
      const date = invoice.issue || invoice.date || "";

      if (date.length >= 7) {
        values.add(date.slice(0, 7));
      }
    });

    return [...values].sort().reverse();
  }, [invoices]);

  const financials = useMemo(() => {
    const result = {};

    clients.forEach((client) => {
      result[client.id] = {
        revenue: 0,
        received: 0,
        refunded: 0,
        expenses: 0,
        profit: 0,
        pending: 0,
        count: 0,
      };
    });

    invoices.forEach((invoice) => {
      const invoiceClient = invoice?.client || {};

      const clientId = getClientId(invoice);

      if (!clientId || !result[clientId]) {
        return;
      }

      const total = Number(invoice.total || 0);

      const refunded = Number(invoice.refundedAmount || 0);

      const received = Math.max(0, total - refunded);

      const status = String(invoice.status || "").toLowerCase();

      result[clientId].revenue += total;

      result[clientId].refunded += refunded;

      result[clientId].count += 1;

      if (
        status === "paid" ||
        status === "partially refunded" ||
        status === "refunded"
      ) {
        result[clientId].received += received;
      }

      if (
        status === "unpaid" ||
        status === "pending" ||
        status === "overdue" ||
        status === "partially paid"
      ) {
        result[clientId].pending += received;
      }
    });

    expenses.forEach((expense) => {
      const clientId = String(expense.clientId || "").toLowerCase();

      if (clientId && result[clientId]) {
        result[clientId].expenses += Number(expense.amount || 0);
      }
    });

    Object.values(result).forEach((item) => {
      item.profit = item.received - item.expenses;
    });

    return result;
  }, [clients, invoices, expenses]);

  const billing = useMemo(() => {
    const result = {};

    invoices.forEach((invoice) => {
      const invoiceClient = invoice?.client || {};

      const id = getClientId(invoice);

      if (!id) return;

      const date = invoice.issue || invoice.date || "";

      if (mode === "billed" && month !== "all" && !date.startsWith(month)) {
        return;
      }

      if (!result[id]) {
        result[id] = {
          billed: 0,
          received: 0,
          due: 0,
          count: 0,
          partial: 0,
        };
      }

      result[id].billed += Number(invoice.total || 0);

      result[id].received += getPaid(invoice);

      result[id].due += getDue(invoice);

      result[id].count += 1;

      if (hasPartialPayments(invoice)) {
        result[id].partial += 1;
      }
    });

    return result;
  }, [invoices, month, mode]);

  const rows = useMemo(
    () =>
      clients.filter((client) => {
        if (month !== "all") {
          if (mode === "joined" && !(client.joined || "").startsWith(month)) {
            return false;
          }

          if (mode === "billed" && !(billing[client.id]?.count > 0)) {
            return false;
          }
        }

        const haystack = [
          client.name,
          client.company,
          client.phone,
          client.email,
          client.gstin,
          client.address,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query.trim().toLowerCase());
      }),
    [clients, month, mode, query, billing],
  );

  const totalBilled = rows.reduce(
    (sum, client) => sum + (billing[client.id]?.billed || 0),
    0,
  );

  const totalDue = rows.reduce(
    (sum, client) => sum + (billing[client.id]?.due || 0),
    0,
  );

  const currentMonth = new Date().toLocaleDateString("en-CA").slice(0, 7);

  const newThisMonth = clients.filter((client) =>
    (client.joined || "").startsWith(currentMonth),
  ).length;

  const invoicesForClient = (client) =>
    invoices.filter(
      (invoice) =>
        getClientId(invoice) === String(client.mongoId || "").toLowerCase(),
    );

  return (
    <div className="min-w-0 space-y-6 text-slate-900">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Clients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Client details and billing are automatically taken from saved
            invoices.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Total clients"
          value={String(clients.length)}
          note="Unique invoice clients"
          icon={Users}
          tone="bg-blue-50 text-blue-600"
        />

        <Stat
          title="New this month"
          value={String(newThisMonth)}
          note={monthText(currentMonth)}
          icon={UserPlus}
          tone="bg-emerald-50 text-emerald-600"
        />

        <Stat
          title="Total billed"
          value={money(totalBilled)}
          note={month === "all" ? "All time" : monthText(month)}
          icon={IndianRupee}
          tone="bg-violet-50 text-violet-600"
        />

        <Stat
          title="Outstanding"
          value={money(totalDue)}
          note="Remaining invoice balance"
          icon={Clock3}
          tone="bg-orange-50 text-orange-600"
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search client, phone, email or GSTIN"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex rounded-xl border border-slate-200 p-0.5">
          <button
            onClick={() => setMode("joined")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              mode === "joined" ? "bg-[#002F5F] text-white" : "text-slate-500"
            }`}
          >
            Joined in
          </button>

          <button
            onClick={() => setMode("billed")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              mode === "billed" ? "bg-[#002F5F] text-white" : "text-slate-500"
            }`}
          >
            Billed in
          </button>
        </div>

        <select
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
        >
          <option value="all">All months</option>

          {months.map((value) => (
            <option key={value} value={value}>
              {monthText(value)}
            </option>
          ))}
        </select>
      </section>

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-slate-500">Loading clients...</p>
        </section>
      ) : apiError ? (
        <section className="rounded-2xl border border-rose-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-rose-600">{apiError}</p>
        </section>
      ) : rows.length ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((client) => {
            const stats = billing[client.id] || {
              billed: 0,
              due: 0,
              count: 0,
              partial: 0,
            };

            const financial = financials[client.id] || {
              revenue: 0,
              received: 0,
              refunded: 0,
              expenses: 0,
              profit: 0,
              pending: 0,
            };

            const whatsapp = getPhoneLink(client.phone);

            return (
              <article
                key={client.mongoId || client.id}
                className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    {client.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{client.name}</h2>

                    <p className="truncate text-sm text-slate-500">
                      {client.company || "No company"}
                    </p>
                  </div>

                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp ${client.name}`}
                      className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} />
                      {client.phone}
                    </p>
                  )}

                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={14} />

                      <span className="truncate">{client.email}</span>
                    </p>
                  )}

                  {client.address && (
                    <p className="flex items-start gap-2">
                      <MapPin size={14} />

                      <span>{client.address}</span>
                    </p>
                  )}

                  {client.gstin && (
                    <p className="text-xs">GSTIN: {client.gstin}</p>
                  )}
                </div>

                {stats.partial > 0 && (
                  <p className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    <Layers size={12} /> Partial payments on {stats.partial}{" "}
                    invoice(s)
                  </p>
                )}

                <div className="mt-auto mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <p className="text-slate-400">Invoices</p>

                    <p className="mt-1 font-semibold">{stats.count}</p>
                  </div>

                  <div>
                    <p className="text-slate-400">Billed</p>

                    <p className="mt-1 font-semibold">{money(stats.billed)}</p>
                  </div>

                  <div>
                    <p className="text-slate-400">Outstanding</p>

                    <p
                      className={`mt-1 font-semibold ${
                        stats.due ? "text-rose-600" : ""
                      }`}
                    >
                      {money(stats.due)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <p className="text-slate-400">Project Revenue</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {money(financial.revenue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Received</p>

                    <p className="mt-1 font-semibold text-emerald-700">
                      {money(financial.received)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Expenses</p>

                    <p className="mt-1 font-semibold text-rose-600">
                      {money(financial.expenses)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Net Profit</p>

                    <p
                      className={`mt-1 font-semibold ${
                        financial.profit >= 0
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {money(financial.profit)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Refunded</p>

                    <p className="mt-1 font-semibold text-blue-700">
                      {money(financial.refunded)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Pending</p>

                    <p className="mt-1 font-semibold text-orange-600">
                      {money(financial.pending)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setViewing(client)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FileText size={15} /> View invoices
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <Users size={28} className="mx-auto text-slate-400" />

          <p className="mt-4 font-semibold text-slate-800">
            {invoices.length ? "No matching clients" : "No invoices found"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {invoices.length
              ? "Try another search or month."
              : "Create an invoice with a client name. The client will appear here automatically."}
          </p>
        </section>
      )}

      <footer className="border-t border-slate-200 py-4 text-xs text-slate-400">
        Showing {rows.length} of {clients.length} invoice clients
      </footer>

      {viewing && (
        <InvoiceList
          client={viewing}
          invoices={invoicesForClient(viewing)}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
