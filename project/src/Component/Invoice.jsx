import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Printer,
  Save,
  MessageCircle,
  Mail,
  Check,
  AlertCircle,
} from "lucide-react";

/* Put your logo at public/pegal-logo.png (or change this path). */
const LOGO = "/pegal-logo.png";
//const STORE = "pegal_invoices";

/* Fixed details used on every invoice. Edit them once here. */
const BUSINESS = {
  name: "Pegal Agency",
  address: "Your business address",
  email: "hello@pegal.in",
  phone: "+91 98765 43210",
  gstin: "",
};
const PAY = {
  bank: "Account name: Pegal Agency\nAccount number: 0000000000\nIFSC: ABCD0000000",
  upi: "pegal@upi",
};
const NOTES = "Thank you for choosing Pegal Agency.";
const TERMS =
  "Payment is due by the due date. Late payments may attract a service charge.";

const inr = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v || 0);
const num = (v) => Math.max(0, Number(v) || 0);
const today = () => new Date().toLocaleDateString("en-CA");
const addDays = (d, k) => {
  const x = new Date(d);
  x.setDate(x.getDate() + k);
  return x.toLocaleDateString("en-CA");
};
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

// const load = () => {
//   try {
//     return JSON.parse(localStorage.getItem(STORE)) || [];
//   } catch {
//     return [];
//   }
// };

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
const two = (n) =>
  n < 20
    ? ones[n]
    : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
const three = (n) =>
  (n > 99
    ? ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " : "")
    : "") + (n % 100 ? two(n % 100) : "");
function inWords(value) {
  let n = Math.round(value);
  if (!n) return "Zero Rupees Only";
  const out = [];
  for (const [v, l] of [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ]) {
    if (n >= v) {
      out.push(three(Math.floor(n / v)) + " " + l);
      n %= v;
    }
  }
  if (n) out.push(three(n));
  return out.join(" ") + " Rupees Only";
}

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

const Card = ({ title, hint, children }) => (
  <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5">
      <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
    {children}
  </section>
);

export default function Invoice({ onSave }) {
  const [meta, setMeta] = useState(() => ({
    number: `PEG-${new Date().getFullYear()}-${Date.now()}`,
    issue: today(),
    due: addDays(today(), 7),
    status: "Unpaid",
  }));
  const business = BUSINESS,
    pay = PAY,
    notes = NOTES,
    terms = TERMS;

  const [client, setClient] = useState({
    clientId: "",
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      description: "Website design and development",
      hsn: "9983",
      qty: 1,
      price: 15000,
      gst: 18,
    },
  ]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("flat");
  const [gstOn, setGstOn] = useState(true);
  const [supply, setSupply] = useState("intra");
  const [msg, setMsg] = useState(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refunds, setRefunds] = useState([]);
  const [logoOk, setLogoOk] = useState(true);

  const [clients, setClients] = useState([]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/clients");

        if (!response.ok) {
          throw new Error("Failed to load registered clients");
        }

        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (error) {
        flash("err", error.message || "Failed to load clients");
      }
    };

    loadClients();
  }, []);

  const t = useMemo(() => {
    const lines = items.map((i) => ({
      ...i,
      amount: num(i.qty) * num(i.price),
    }));
    const sub = lines.reduce((s, l) => s + l.amount, 0);
    const disc = Math.min(
      sub,
      discountType === "percent"
        ? (sub * Math.min(100, num(discount))) / 100
        : num(discount),
    );
    const factor = sub ? (sub - disc) / sub : 0;
    const taxable = sub - disc;
    const gst = gstOn
      ? lines.reduce((s, l) => s + (l.amount * factor * num(l.gst)) / 100, 0)
      : 0;
    const raw = taxable + gst;
    const total = Math.round(raw);
    return { lines, sub, disc, taxable, gst, round: total - raw, total };
  }, [items, discount, discountType, gstOn]);

  const setItem = (id, k, v) =>
    setItems((c) => c.map((i) => (i.id === id ? { ...i, [k]: v } : i)));
  const valid = () => {
    if (!client.name.trim()) return "Enter the client name.";
    if (!items.some((i) => i.description.trim() && num(i.price) > 0))
      return "Add at least one item with a price.";
    if (meta.due < meta.issue)
      return "The due date cannot be before the issue date.";
    return null;
  };
  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const save = async () => {
    const err = valid();
    if (err) return flash("err", err);

    const invoice = {
      ...meta,
      client,
      items: t.lines,
      discount: t.disc,
      gstOn,
      supply,
      subtotal: t.sub,
      gst: t.gst,
      total: t.total,
      refundedAmount: 0,
      refunds: [],
    };

    const generateInvoiceNumber = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/invoices");

        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const invoices = await response.json();

        let maxNumber = 0;

        invoices.forEach((invoice) => {
          const match = String(invoice.number || "").match(/PEG-\d{4}-(\d+)/);

          if (match) {
            maxNumber = Math.max(maxNumber, Number(match[1]));
          }
        });

        return `PEG-${new Date().getFullYear()}-${String(
          maxNumber + 1,
        ).padStart(3, "0")}`;
      } catch (error) {
        return `PEG-${new Date().getFullYear()}-${Date.now()}`;
      }
    };

    try {
      const response = await fetch("http://localhost:5000/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save invoice");
      }

      onSave?.(data);
      setSavedInvoiceId(data._id);
      setRefunds(data.refunds || []);
      setMeta((prev) => ({
        ...prev,
        status: data.status,
      }));
      flash("ok", `Invoice ${meta.number} saved.`);
    } catch (error) {
      flash("err", error.message || "Failed to save invoice");
    }
  };

  const refund = async () => {
    if (!savedInvoiceId) {
      return flash("err", "Save the invoice before processing a refund.");
    }

    const amount = Number(refundAmount);

    if (!amount || amount <= 0) {
      return flash("err", "Enter a valid refund amount.");
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/invoices/${savedInvoiceId}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            reason: refundReason.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Refund failed");
      }

      setMeta((current) => ({
        ...current,
        status: data.status,
      }));

      setRefunds(data.refunds || []);
      setRefundAmount("");
      setRefundReason("");

      flash("ok", "Refund processed successfully.");
    } catch (error) {
      flash("err", error.message || "Refund failed.");
    }
  };

  const print = () => {
    const err = valid();
    if (err) return flash("err", err);
    window.print();
  };

  const share = () => {
    const err = valid();
    if (err) return flash("err", err);

    let p = client.phone.replace(/\D/g, "");

    if (p.length === 10) {
      p = "91" + p;
    }

    if (p.length < 10) {
      return flash("err", "Enter a valid WhatsApp number.");
    }

    const text = `Hello ${client.name}, here is invoice ${meta.number} from ${business.name} for ${inr(t.total)}. Due date: ${fmtDate(meta.due)}.${pay.upi ? ` Pay via UPI: ${pay.upi}.` : ""} Thank you.`;

    window.open(
      `https://wa.me/${p}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareEmail = () => {
    const err = valid();
    if (err) return flash("err", err);

    if (!client.email.trim()) {
      return flash("err", "Enter the client's email address.");
    }

    const subject = `Invoice ${meta.number} - ${business.name}`;

    const body = `Hello ${client.name},

Please find the invoice details below:

Invoice Number: ${meta.number}
Amount: ${inr(t.total)}
Issue Date: ${fmtDate(meta.issue)}
Due Date: ${fmtDate(meta.due)}

Thank you,
${business.name}`;

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(client.email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const half = gstOn ? t.gst / 2 : 0;
  const stamp = {
    Paid: "text-emerald-600 border-emerald-600",
    Overdue: "text-rose-600 border-rose-600",
  }[meta.status];

  return (
    <div className="invoice-page min-w-0 text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight">New invoice</h1>
            <p className="text-xs text-slate-500">
              {meta.number} · Total{" "}
              <strong className="text-slate-900">{inr(t.total)}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={share}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-emerald-950 hover:brightness-95"
            >
              <MessageCircle size={16} /> WhatsApp
            </button>

            <button
              onClick={shareEmail}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Mail size={16} /> Email
            </button>

            <button
              onClick={print}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer size={16} /> Print / PDF
            </button>
            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Save size={16} /> Save invoice
            </button>
          </div>
        </div>
        {msg && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
            role="status"
          >
            {msg.type === "ok" ? (
              <Check size={16} />
            ) : (
              <AlertCircle size={16} />
            )}{" "}
            {msg.text}
          </div>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* EDITOR */}
        <div className="min-w-0 space-y-5 print:hidden">
          <Card title="Invoice details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Invoice number">
                <input
                  className={input}
                  value={meta.number}
                  onChange={(e) => setMeta({ ...meta, number: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className={input}
                  value={meta.status}
                  onChange={(e) => setMeta({ ...meta, status: e.target.value })}
                >
                  {["Unpaid", "Paid", "Partially paid", "Overdue", "Draft"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Issue date">
                <input
                  type="date"
                  className={input}
                  value={meta.issue ? meta.issue.slice(0, 10) : ""}
                  onChange={(e) => setMeta({ ...meta, issue: e.target.value })}
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  min={meta.issue}
                  className={input}
                  value={meta.due ? meta.due.slice(0, 10) : ""}
                  onChange={(e) => setMeta({ ...meta, due: e.target.value })}
                />
                <div className="mt-2 flex gap-1.5">
                  {[7, 15, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setMeta({ ...meta, due: addDays(meta.issue, d) })
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Net {d}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <Card
            title="Client"
            hint="Select a registered client or enter details manually"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Select registered client">
                <select
                  className={input}
                  value={client.clientId}
                  onChange={(e) => {
                    const selected = clients.find(
                      (c) => c._id === e.target.value,
                    );

                    if (selected) {
                      setClient({
                        clientId: selected._id,
                        name: selected.name || "",
                        company: selected.company || "",
                        email: selected.email || "",
                        phone: selected.phone || "",
                        address: selected.address || "",
                        gstin: selected.gstin || "",
                      });
                    } else {
                      setClient({
                        clientId: "",
                        name: "",
                        company: "",
                        email: "",
                        phone: "",
                        address: "",
                        gstin: "",
                      });
                    }
                  }}
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.company ? `- ${c.company}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Client name *">
                <input
                  className={input}
                  value={client.name}
                  onChange={(e) =>
                    setClient({ ...client, name: e.target.value })
                  }
                  placeholder="Full name"
                />
              </Field>

              <Field label="Company">
                <input
                  className={input}
                  value={client.company}
                  onChange={(e) =>
                    setClient({ ...client, company: e.target.value })
                  }
                />
              </Field>

              <Field label="WhatsApp / phone">
                <input
                  className={input}
                  value={client.phone}
                  onChange={(e) =>
                    setClient({ ...client, phone: e.target.value })
                  }
                  placeholder="98765 43210"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  className={input}
                  value={client.email}
                  onChange={(e) =>
                    setClient({ ...client, email: e.target.value })
                  }
                />
              </Field>

              <Field label="Billing address" className="sm:col-span-2">
                <textarea
                  rows={2}
                  className={input}
                  value={client.address}
                  onChange={(e) =>
                    setClient({ ...client, address: e.target.value })
                  }
                />
              </Field>

              <Field label="Client GSTIN (optional)" className="sm:col-span-2">
                <input
                  className={input}
                  value={client.gstin}
                  onChange={(e) =>
                    setClient({
                      ...client,
                      gstin: e.target.value.toUpperCase(),
                    })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card title="Items and services">
            <div className="space-y-3">
              {items.map((i, idx) => (
                <div
                  key={i.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                    <Field
                      label={`Item ${idx + 1}`}
                      className="col-span-2 sm:col-span-4"
                    >
                      <input
                        className={input}
                        value={i.description}
                        onChange={(e) =>
                          setItem(i.id, "description", e.target.value)
                        }
                        placeholder="Service description"
                      />
                    </Field>
                    <Field
                      label="HSN / SAC"
                      className="col-span-2 sm:col-span-2"
                    >
                      <input
                        className={input}
                        value={i.hsn}
                        onChange={(e) => setItem(i.id, "hsn", e.target.value)}
                      />
                    </Field>
                    <Field label="Qty">
                      <input
                        type="number"
                        min="0"
                        className={input}
                        value={i.qty}
                        onChange={(e) => setItem(i.id, "qty", e.target.value)}
                      />
                    </Field>
                    <Field label="Rate (₹)" className="sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        className={input}
                        value={i.price}
                        onChange={(e) => setItem(i.id, "price", e.target.value)}
                      />
                    </Field>
                    <Field label="GST %">
                      <select
                        className={input}
                        value={i.gst}
                        disabled={!gstOn}
                        onChange={(e) =>
                          setItem(i.id, "gst", Number(e.target.value))
                        }
                      >
                        {[0, 5, 12, 18, 28].map((g) => (
                          <option key={g} value={g}>
                            {g}%
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="col-span-2 flex items-end justify-between sm:col-span-1 sm:justify-end sm:gap-2">
                      <span className="pb-2.5 text-sm font-semibold sm:hidden">
                        {inr(num(i.qty) * num(i.price))}
                      </span>
                      <button
                        onClick={() =>
                          setItems((c) => c.filter((x) => x.id !== i.id))
                        }
                        disabled={items.length === 1}
                        aria-label="Remove item"
                        className="rounded-lg p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setItems((c) => [
                  ...c,
                  {
                    id: Date.now(),
                    description: "",
                    hsn: "9983",
                    qty: 1,
                    price: 0,
                    gst: 18,
                  },
                ])
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Plus size={16} /> Add item
            </button>
          </Card>

          <Card title="Tax and discount">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Discount">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    className={input}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  <select
                    className={`${input} w-28 shrink-0`}
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="flat">₹ flat</option>
                    <option value="percent">% off</option>
                  </select>
                </div>
              </Field>
              <Field label="Supply type">
                <select
                  className={input}
                  value={supply}
                  disabled={!gstOn}
                  onChange={(e) => setSupply(e.target.value)}
                >
                  <option value="intra">Same state (CGST + SGST)</option>
                  <option value="inter">Other state (IGST)</option>
                </select>
              </Field>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={gstOn}
                  onChange={(e) => setGstOn(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-medium">
                  Charge GST on this invoice
                </span>
              </label>
            </div>
          </Card>
        </div>

        <Card title="Refund">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Refund amount (₹)">
              <input
                type="number"
                min="0"
                className={input}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
              />
            </Field>

            <Field label="Reason">
              <input
                className={input}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Refund reason"
              />
            </Field>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={refund}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                Process refund
              </button>
            </div>
          </div>

          {refunds.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>

                <tbody>
                  {refunds.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100">
                      <td className="py-2 pr-3">{fmtDate(item.date)}</td>
                      <td className="py-2 pr-3 font-medium">
                        {inr(item.amount)}
                      </td>
                      <td className="py-2">{item.reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* LIVE PREVIEW */}
        <div className="min-w-0 space-y-5 xl:sticky xl:top-24 print:static">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <h3 className="text-[15px] font-semibold text-slate-900">
              Summary
            </h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row l="Subtotal" v={inr(t.sub)} />
              {t.disc > 0 && <Row l="Discount" v={`- ${inr(t.disc)}`} />}
              {gstOn &&
                (supply === "intra" ? (
                  <>
                    <Row l="CGST" v={inr(half)} />
                    <Row l="SGST" v={inr(half)} />
                  </>
                ) : (
                  <Row l="IGST" v={inr(t.gst)} />
                ))}
              {Math.abs(t.round) > 0.004 && (
                <Row l="Round off" v={inr(t.round)} />
              )}
            </div>
            <div className="mt-4 rounded-xl bg-[#002F5F] p-4 text-white">
              <p className="text-xs text-sky-200">Total payable</p>
              <p className="mt-1 break-words text-2xl font-bold">
                {inr(t.total)}
              </p>
              <p className="mt-1 text-xs text-sky-200">{inWords(t.total)}</p>
            </div>
          </section>
          {/* Printed invoice only. Hidden on screen, shown by Print / PDF. */}
          <div className="hidden print:block">
            <article
              id="invoice-sheet"
              className="relative mx-auto w-full max-w-[794px] overflow-hidden rounded-xl bg-white text-[13px] leading-relaxed text-slate-700 shadow-xl ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0"
            >
              <div className="h-2 bg-gradient-to-r from-[#002F5F] via-[#055C9C] to-[#68B9E3]" />
              <div className="p-7 sm:p-10">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="flex items-start gap-3">
                    {logoOk ? (
                      <img
                        src={LOGO}
                        alt=""
                        className="h-14 w-14 object-contain"
                        onError={() => setLogoOk(false)}
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#055C9C] text-xl font-bold text-white">
                        P
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-[#002F5F]">
                        {business.name || "Your business"}
                      </p>
                      <p className="max-w-[260px] whitespace-pre-line text-xs text-slate-500">
                        {business.address}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[business.email, business.phone]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                      {business.gstin && (
                        <p className="text-xs font-medium text-slate-600">
                          GSTIN {business.gstin}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold tracking-tight text-[#0F86D6]">
                      {gstOn ? "Tax invoice" : "Invoice"}
                    </h2>
                    <p className="mt-1 font-semibold text-slate-900">
                      {meta.number}
                    </p>
                    <p className="text-xs text-slate-500">
                      Issued {fmtDate(meta.issue)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Due {fmtDate(meta.due)}
                    </p>
                  </div>
                </div>

                {stamp && (
                  <div
                    className={`absolute right-10 top-36 -rotate-12 rounded-md border-2 px-3 py-1 text-lg font-bold opacity-70 ${stamp}`}
                  >
                    {meta.status.toUpperCase()}
                  </div>
                )}

                <div className="mt-8 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Billed to
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {client.name || "Client name"}
                  </p>
                  {client.company && <p>{client.company}</p>}
                  <p className="whitespace-pre-line text-xs text-slate-500">
                    {client.address}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[client.email, client.phone].filter(Boolean).join(" | ")}
                  </p>
                  {client.gstin && (
                    <p className="text-xs font-medium">GSTIN {client.gstin}</p>
                  )}
                </div>

                <div className="mt-7 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left">
                    <thead>
                      <tr className="border-b-2 border-[#002F5F] text-xs text-[#002F5F]">
                        <th className="py-2 pr-2 font-semibold">Description</th>
                        <th className="px-2 py-2 text-right font-semibold">
                          Qty
                        </th>
                        <th className="px-2 py-2 text-right font-semibold">
                          Rate
                        </th>
                        {gstOn && (
                          <th className="px-2 py-2 text-right font-semibold">
                            GST
                          </th>
                        )}
                        <th className="py-2 pl-2 text-right font-semibold">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.lines.map((l) => (
                        <tr
                          key={l.id}
                          className="border-b border-slate-100 align-top"
                        >
                          <td className="py-2.5 pr-2">
                            <span className="font-medium text-slate-900">
                              {l.description || "Item"}
                            </span>
                            {l.hsn && (
                              <span className="block text-[11px] text-slate-400">
                                HSN/SAC {l.hsn}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            {num(l.qty)}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            {inr(num(l.price))}
                          </td>
                          {gstOn && (
                            <td className="px-2 py-2.5 text-right">{l.gst}%</td>
                          )}
                          <td className="py-2.5 pl-2 text-right font-medium text-slate-900">
                            {inr(l.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
                  <div className="min-w-[200px] max-w-xs flex-1 text-xs">
                    <p className="font-semibold text-slate-400">
                      Amount in words
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {inWords(t.total)}
                    </p>
                  </div>
                  <div className="w-full max-w-[280px] space-y-1.5 text-sm">
                    <Row l="Subtotal" v={inr(t.sub)} />
                    {t.disc > 0 && <Row l="Discount" v={`- ${inr(t.disc)}`} />}
                    {gstOn &&
                      (supply === "intra" ? (
                        <>
                          <Row l="CGST" v={inr(half)} />
                          <Row l="SGST" v={inr(half)} />
                        </>
                      ) : (
                        <Row l="IGST" v={inr(t.gst)} />
                      ))}
                    {Math.abs(t.round) > 0.004 && (
                      <Row l="Round off" v={inr(t.round)} />
                    )}
                    <div className="flex items-center justify-between rounded-lg bg-[#002F5F] px-3 py-2.5 text-white">
                      <span className="text-sm font-medium">Total due</span>
                      <span className="text-lg font-bold">{inr(t.total)}</span>
                    </div>
                  </div>
                </div>

                {(pay.bank || pay.upi) && (
                  <div className="mt-7 border-t border-slate-100 pt-4 text-xs">
                    <p className="font-semibold text-slate-400">
                      Payment details
                    </p>
                    <p className="mt-1 whitespace-pre-line">{pay.bank}</p>
                    {pay.upi && (
                      <p className="mt-1 font-medium">UPI: {pay.upi}</p>
                    )}
                  </div>
                )}
                {(notes || terms) && (
                  <div className="mt-5 grid gap-4 text-xs text-slate-500 sm:grid-cols-2">
                    {notes && (
                      <div>
                        <p className="font-semibold text-slate-400">Notes</p>
                        <p className="mt-1 whitespace-pre-line">{notes}</p>
                      </div>
                    )}
                    {terms && (
                      <div>
                        <p className="font-semibold text-slate-400">Terms</p>
                        <p className="mt-1 whitespace-pre-line">{terms}</p>
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-8 text-center text-[11px] text-slate-400">
                  This is a computer-generated invoice.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #invoice-sheet, #invoice-sheet * { visibility: visible; }
          #invoice-sheet { position: absolute; left: 0; top: 0; width: 100%; max-width: none; }
        }
      `}</style>
    </div>
  );
}

const Row = ({ l, v }) => (
  <div className="flex justify-between gap-3">
    <span className="text-slate-500">{l}</span>
    <span className="font-medium text-slate-900">{v}</span>
  </div>
);
