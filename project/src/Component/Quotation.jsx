import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Printer,
  Save,
  MessageCircle,
  Check,
  AlertCircle,
  Mail,
} from "lucide-react";

/* ------------------------------------------------------------------
  FIXED CONTENT. Edit once here, it appears on every quotation PDF.
------------------------------------------------------------------- */
const LOGO = "/pegal-logo.png"; // put your logo in public/pegal-logo.png
const BUSINESS = {
  name: "Pegal Agency",
  tagline: "Websites, SEO and digital growth",
  address: "Your business address, City, State, PIN",
  email: "hello@pegal.in",
  phone: "+91 98765 43210",
  gstin: "",
};
const VALID_DAYS = 15;
const GST_RATE = 18;
const INTRO =
  "Thank you for considering Pegal Agency. Based on our discussion, we are pleased to share the scope of work and pricing for your project below.";
const PAYMENT_TERMS = [
  "50% advance to begin the work, 50% on completion and before final handover.",
  "Payment by bank transfer or UPI. Bank and UPI details will be shared on the invoice.",
];
const TERMS = [
  "This quotation is valid for 15 days from the date of issue.",
  "The scope is limited to the items listed. Additional work is quoted separately.",
  "Timelines depend on timely feedback, content and approvals from the client.",
  "Third-party costs such as domains, hosting, plugins and paid tools are not included unless listed.",
  "Work begins after written acceptance and receipt of the advance payment.",
];

const API = "http://localhost:5000/api";

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
        month: "long",
        year: "numeric",
      })
    : "";

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

const Row = ({ l, v }) => (
  <div className="flex justify-between gap-3">
    <span className="text-slate-500">{l}</span>
    <span className="font-medium text-slate-900">{v}</span>
  </div>
);

export default function Quotation({ onSave }) {
  const [number, setNumber] = useState(
    `PEG-QTN-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100,
    )}`,
  );

  const [date, setDate] = useState(today());

  const [client, setClient] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    clientId: "",
  });

  const [clients, setClients] = useState([]);
  const [project, setProject] = useState("");
  const [items, setItems] = useState([
    { id: 1, title: "", desc: "", price: "" },
  ]);
  const [gstOn, setGstOn] = useState(false);
  const [msg, setMsg] = useState(null);
  const [logoOk, setLogoOk] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState(null);

  const validUntil = addDays(date, VALID_DAYS);

  const t = useMemo(() => {
    const sub = items.reduce((s, i) => s + num(i.price), 0);
    const gst = gstOn ? Math.round((sub * GST_RATE) / 100) : 0;

    return {
      sub,
      gst,
      total: sub + gst,
    };
  }, [items, gstOn]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch(`${API}/clients`);

        if (!response.ok) {
          throw new Error("Failed to load clients");
        }

        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (error) {
        flash("err", error.message);
      }
    };

    loadClients();
  }, []);

  const setItem = (id, k, v) =>
    setItems((c) => c.map((i) => (i.id === id ? { ...i, [k]: v } : i)));

  const pickClient = (name) => {
    const value = name.trim().toLowerCase();

    const found = clients.find(
      (x) =>
        String(x.name || "")
          .trim()
          .toLowerCase() === value ||
        String(x.company || "")
          .trim()
          .toLowerCase() === value,
    );

    if (!found) {
      setClient((p) => ({
        ...p,
        name,
      }));
      return;
    }

    setClient({
      name: found.name || "",
      company: found.company || "",
      phone: found.phone || "",
      email: found.email || "",
      address: found.address || "",
      clientId: found._id || "",
    });
  };

  const valid = () => {
    if (!client.name.trim()) return "Enter the client name.";

    if (!project.trim()) return "Enter the project title.";

    if (!items.some((i) => i.title.trim() && num(i.price) > 0)) {
      return "Add at least one scope item with a price.";
    }

    return null;
  };

  const save = async () => {
    const err = valid();

    if (err) {
      flash("err", err);
      return null;
    }

    setSaving(true);

    try {
      const payload = {
        number,
        date,
        validUntil,
        client: {
          clientId: client.clientId || null,
          name: client.name,
          company: client.company || "",
          phone: client.phone || "",
          email: client.email || "",
          address: client.address || "",
        },
        project,
        items,
        gstOn,
        subtotal: t.sub,
        gst: t.gst,
        total: t.total,
      };

      const isExisting = Boolean(savedQuotationId);

      const response = await fetch(
        isExisting
          ? `${API}/quotations/${savedQuotationId}`
          : `${API}/quotations`,
        {
          method: isExisting ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save quotation");
      }

      setSavedQuotationId(data._id || savedQuotationId);

      onSave?.(data);

      flash(
        "ok",
        isExisting
          ? `Quotation ${number} updated.`
          : `Quotation ${number} saved.`,
      );

      return data;
    } catch (error) {
      flash("err", error.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    const err = valid();

    if (err) {
      flash("err", err);
      return;
    }

    window.print();
  };

  const share = async () => {
    const err = valid();

    if (err) {
      flash("err", err);
      return;
    }

    let phone = String(client.phone || "").replace(/\D/g, "");

    if (phone.length === 10) {
      phone = "91" + phone;
    }

    if (!phone) {
      flash("err", "Add the client's registered WhatsApp number first.");
      return;
    }

    const saved = await save();

    if (!saved) {
      return;
    }

    const text = `Hello ${client.name}, here is our quotation ${number} for ${project}. Total: ${inr(t.total)}${gstOn ? " (incl. GST)" : ""}. Valid until ${fmtDate(validUntil)}. The professional quotation PDF is ready to download from the system. – ${BUSINESS.name}`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const emailShare = async () => {
    const err = valid();

    if (err) {
      flash("err", err);
      return;
    }

    if (!client.email.trim()) {
      flash("err", "Add the client's registered email address first.");
      return;
    }

    const saved = await save();

    if (!saved) {
      return;
    }

    const subject = `${BUSINESS.name} Quotation ${number} - ${project}`;

    const body = `Hello ${client.name},

Please find the quotation details below.

Quotation: ${number}
Project: ${project}
Total: ${inr(t.total)}${gstOn ? " (including GST)" : ""}
Valid until: ${fmtDate(validUntil)}

The professional quotation PDF is available from the Business Management System.

Thank you,
${BUSINESS.name}`;

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(client.email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, "_blank");
  };

  const filled = items.filter((i) => i.title.trim() || num(i.price) > 0);

  return (
    <div className="min-w-0 text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight">New quotation</h1>

            <p className="text-xs text-slate-500">
              {number} · Total{" "}
              <strong className="text-slate-900">{inr(t.total)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={share}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-emerald-950 hover:brightness-95 disabled:opacity-60"
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>

            <button
              onClick={emailShare}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            >
              <Mail size={16} />
              Email
            </button>

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={download}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Printer size={16} />
              Download PDF
            </button>
          </div>
        </div>

        {msg && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              msg.type === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
            role="status"
          >
            {msg.type === "ok" ? (
              <Check size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {msg.text}
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-[1200px] min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* FORM */}
        <div className="min-w-0 space-y-5 print:hidden">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-[15px] font-semibold">Client and project</h3>

            <p className="mb-5 mt-0.5 text-xs text-slate-400">
              Your business details, terms and conditions are added
              automatically.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Client name *">
                <input
                  className={input}
                  list="quotation-clients"
                  value={client.name}
                  onChange={(e) => pickClient(e.target.value)}
                  placeholder="Full name"
                />

                <datalist id="quotation-clients">
                  {clients.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.company || c.email || ""}
                    </option>
                  ))}
                </datalist>
              </Field>

              <Field label="Company">
                <input
                  className={input}
                  value={client.company}
                  onChange={(e) =>
                    setClient({
                      ...client,
                      company: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="WhatsApp number">
                <input
                  className={input}
                  value={client.phone}
                  onChange={(e) =>
                    setClient({
                      ...client,
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
                  value={client.email}
                  onChange={(e) =>
                    setClient({
                      ...client,
                      email: e.target.value,
                    })
                  }
                  placeholder="client@example.com"
                />
              </Field>

              <Field label="Date">
                <input
                  type="date"
                  className={input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>

              <Field label="Project title *" className="sm:col-span-2">
                <input
                  className={input}
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. Website redesign and SEO setup"
                />
              </Field>

              <Field label="Quotation number">
                <input
                  className={input}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </Field>

              <Field label="Valid until">
                <input
                  className={`${input} bg-slate-50`}
                  value={fmtDate(validUntil)}
                  readOnly
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-[15px] font-semibold">Scope and price</h3>

            <p className="mb-5 mt-0.5 text-xs text-slate-400">
              Add each deliverable with its price.
            </p>

            <div className="space-y-3">
              {items.map((i, idx) => (
                <div
                  key={i.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px_auto]">
                    <Field label={`Scope ${idx + 1}`}>
                      <input
                        className={input}
                        value={i.title}
                        onChange={(e) => setItem(i.id, "title", e.target.value)}
                        placeholder="e.g. 5-page business website"
                      />
                    </Field>

                    <Field label="Price (₹)">
                      <input
                        type="number"
                        min="0"
                        className={input}
                        value={i.price}
                        onChange={(e) => setItem(i.id, "price", e.target.value)}
                      />
                    </Field>

                    <div className="flex items-end">
                      <button
                        onClick={() =>
                          setItems((c) => c.filter((x) => x.id !== i.id))
                        }
                        disabled={items.length === 1}
                        aria-label="Remove scope item"
                        className="rounded-lg p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <Field label="Details (optional)" className="mt-3">
                    <textarea
                      rows={2}
                      className={input}
                      value={i.desc}
                      onChange={(e) => setItem(i.id, "desc", e.target.value)}
                      placeholder="What is included in this item"
                    />
                  </Field>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setItems((c) => [
                  ...c,
                  {
                    id: Date.now(),
                    title: "",
                    desc: "",
                    price: "",
                  },
                ])
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Plus size={16} />
              Add scope item
            </button>
          </section>
        </div>

        {/* SUMMARY */}
        <div className="min-w-0 space-y-5 xl:sticky xl:top-24 print:static">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <h3 className="text-[15px] font-semibold">Summary</h3>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={gstOn}
                onChange={(e) => setGstOn(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />

              <span className="text-sm font-medium">Add GST {GST_RATE}%</span>
            </label>

            <div className="mt-4 space-y-2 text-sm">
              <Row l="Subtotal" v={inr(t.sub)} />

              {gstOn && <Row l={`GST (${GST_RATE}%)`} v={inr(t.gst)} />}
            </div>

            <div className="mt-4 rounded-xl bg-[#002F5F] p-4 text-white">
              <p className="text-xs text-sky-200">Total</p>

              <p className="mt-1 break-words text-2xl font-bold">
                {inr(t.total)}
              </p>

              <p className="mt-1 text-xs text-sky-200">{inWords(t.total)}</p>
            </div>
          </section>

          {/* Printed quotation only. Hidden on screen, shown by Download PDF. */}
          <div className="hidden print:block">
            <article
              id="quotation-sheet"
              className="w-full bg-white text-[13px] leading-relaxed text-slate-700"
            >
              <div className="h-2 bg-gradient-to-r from-[#002F5F] via-[#055C9C] to-[#68B9E3]" />

              <div className="p-8">
                <div className="flex items-start justify-between gap-6">
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
                        {BUSINESS.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {BUSINESS.tagline}
                      </p>

                      <p className="max-w-[260px] text-xs text-slate-500">
                        {BUSINESS.address}
                      </p>

                      <p className="text-xs text-slate-500">
                        {BUSINESS.email} | {BUSINESS.phone}
                      </p>

                      {BUSINESS.gstin && (
                        <p className="text-xs font-medium">
                          GSTIN {BUSINESS.gstin}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-2xl font-bold tracking-tight text-[#0F86D6]">
                      Quotation
                    </h2>

                    <p className="mt-1 font-semibold text-slate-900">
                      {number}
                    </p>

                    <p className="text-xs text-slate-500">
                      Date {fmtDate(date)}
                    </p>

                    <p className="text-xs text-slate-500">
                      Valid until {fmtDate(validUntil)}
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Prepared for
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {client.name}
                  </p>

                  {client.company && <p>{client.company}</p>}

                  {client.email && (
                    <p className="text-xs text-slate-500">{client.email}</p>
                  )}

                  {client.phone && (
                    <p className="text-xs text-slate-500">{client.phone}</p>
                  )}
                </div>

                <p className="mt-6 text-xs font-semibold text-slate-400">
                  Project
                </p>

                <p className="text-base font-bold text-[#002F5F]">{project}</p>

                <p className="mt-2">{INTRO}</p>

                <table className="mt-6 w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-[#002F5F] text-xs text-[#002F5F]">
                      <th className="w-10 py-2 font-semibold">No.</th>

                      <th className="py-2 font-semibold">Scope of work</th>

                      <th className="py-2 text-right font-semibold">Price</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filled.map((i, idx) => (
                      <tr
                        key={i.id}
                        className="border-b border-slate-100 align-top"
                      >
                        <td className="py-3 text-slate-400">{idx + 1}</td>

                        <td className="py-3 pr-4">
                          <span className="font-semibold text-slate-900">
                            {i.title}
                          </span>

                          {i.desc && (
                            <span className="mt-0.5 block whitespace-pre-line text-xs text-slate-500">
                              {i.desc}
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap py-3 text-right font-medium text-slate-900">
                          {inr(num(i.price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 ml-auto w-full max-w-[280px] space-y-1.5 text-sm">
                  <Row l="Subtotal" v={inr(t.sub)} />

                  {gstOn && <Row l={`GST (${GST_RATE}%)`} v={inr(t.gst)} />}

                  <div className="flex items-center justify-between rounded-lg bg-[#002F5F] px-3 py-2.5 text-white">
                    <span className="text-sm font-medium">Total</span>

                    <span className="text-lg font-bold">{inr(t.total)}</span>
                  </div>

                  <p className="text-right text-[11px] text-slate-500">
                    {inWords(t.total)}
                  </p>
                </div>

                <div className="mt-7 grid gap-6 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-slate-400">
                      Payment terms
                    </p>

                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {PAYMENT_TERMS.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-400">
                      Terms and conditions
                    </p>

                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {TERMS.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-10 text-xs">
                  <div>
                    <div className="border-b border-slate-400 pb-8" />

                    <p className="mt-1 font-semibold text-slate-900">
                      Client acceptance
                    </p>

                    <p className="text-slate-500">{client.name} · Date</p>
                  </div>

                  <div>
                    <div className="border-b border-slate-400 pb-8" />

                    <p className="mt-1 font-semibold text-slate-900">
                      For {BUSINESS.name}
                    </p>

                    <p className="text-slate-500">Authorised signatory</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          #quotation-sheet,
          #quotation-sheet * {
            visibility: visible;
          }

          #quotation-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
