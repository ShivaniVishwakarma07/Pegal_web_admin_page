import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api";
import {
  User,
  ShieldCheck,
  Landmark,
  QrCode,
  ReceiptText,
  Bell,
  Camera,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Star,
  Download,
  X,
  Check,
  Upload,
  Laptop,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react";

const KEY = "pegal-settings-v1";

const uid = () => Math.random().toString(36).slice(2, 9);

const defaults = {
  profile: {
    name: "Pegal Admin",
    email: "admin@pegal.in",
    phone: "",
    role: "Administrator",
    avatar: "",
  },
  business: {
    name: "Pegal Agency",
    gstin: "",
    pan: "",
    address: "",
    website: "",
  },
  banks: [],
  qrs: [],
  invoice: {
    prefix: "INV-2026-",
    next: 25,
    dueDays: 7,
    gst: 18,
    terms: "Payment is due within 7 days of the invoice date.",
    showBank: true,
    showQr: true,
  },
  notify: {
    paid: true,
    overdue: true,
    weekly: false,
    payroll: true,
  },
  twoFA: false,
};

const mergeSettings = (saved = {}) => ({
  ...defaults,
  ...saved,
  profile: {
    ...defaults.profile,
    ...(saved.profile || {}),
  },
  business: {
    ...defaults.business,
    ...(saved.business || {}),
  },
  banks: Array.isArray(saved.banks) ? saved.banks : [],
  qrs: Array.isArray(saved.qrs) ? saved.qrs : [],
  invoice: {
    ...defaults.invoice,
    ...(saved.invoice || {}),
  },
  notify: {
    ...defaults.notify,
    ...(saved.notify || {}),
  },
});

const inp =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const btnP =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const btnS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const box = "rounded-2xl border border-slate-200/80 bg-white";

const Field = ({ label, error, hint, children }) => (
  <label className="block min-w-0">
    <span className="mb-1.5 block text-xs font-medium text-slate-500">
      {label}
    </span>
    {children}
    {error ? (
      <span className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
        <AlertCircle size={12} />
        {error}
      </span>
    ) : (
      hint && (
        <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
      )
    )}
  </label>
);

const Card = ({ title, desc, children, action }) => (
  <section className={`${box} p-5 sm:p-6`}>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {desc && <p className="mt-1 text-sm text-slate-400">{desc}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

function Toggle({ on, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-slate-400">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          on ? "bg-blue-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const readImage = (file, max = 1.5) =>
  new Promise((res, rej) => {
    if (!file) return rej("No file selected");

    if (!file.type.startsWith("image/")) {
      return rej("Please choose an image file");
    }

    if (file.size > max * 1024 * 1024) {
      return rej(`Image must be under ${max} MB`);
    }

    const r = new FileReader();

    r.onload = () => res(r.result);
    r.onerror = () => rej("Could not read file");
    r.readAsDataURL(file);
  });

const mask = (n) => "•••• •••• " + String(n).slice(-4);

const TABS = [
  ["profile", "Profile", User],
  ["security", "Security", ShieldCheck],
  ["banks", "Banks", Landmark],
  ["qr", "Payment QR", QrCode],
  ["invoice", "Invoicing", ReceiptText],
  ["notify", "Notifications", Bell],
];

export default function Settings({ onChangePassword }) {
  const [s, setS] = useState(defaults);
  const [tab, setTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const flash = (msg, bad = false) => {
    setToast({ msg, bad });
    setTimeout(() => setToast(null), 2600);
  };

  const loadSettings = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(`${API_URL}/api/settings`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load settings");
      }

      if (data.settings) {
        setS(mergeSettings(data.settings));
      } else {
        let oldSettings = null;

        try {
          oldSettings = JSON.parse(localStorage.getItem(KEY));
        } catch {
          oldSettings = null;
        }

        const initial = mergeSettings(oldSettings || {});

        if (oldSettings) {
          const saveResponse = await fetch(`${API_URL}/api/settings`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(initial),
          });

          const saveData = await saveResponse.json();

          if (!saveResponse.ok) {
            throw new Error(
              saveData.message || "Could not migrate saved settings",
            );
          }

          setS(mergeSettings(saveData.settings || initial));
        } else {
          setS(initial);
        }
      }
    } catch (error) {
      setLoadError(error.message || "Could not load settings");
      flash(error.message || "Could not load settings", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const commit = async (next, msg = "Changes saved") => {
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(next),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save settings");
      }

      setS(mergeSettings(data.settings || next));
      flash(msg);
    } catch (error) {
      flash(error.message || "Could not save settings", true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Loading settings...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-[1100px] rounded-2xl border border-rose-200 bg-white p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-rose-500" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Unable to load settings
        </h2>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        <button className={`${btnP} mt-5`} onClick={loadSettings}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 text-slate-900">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">
              Settings
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your profile, security, payment details and invoice
              defaults.
            </p>
          </div>

          {saving && (
            <span className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </span>
          )}
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
          >
            {TABS.map(([k, l, I]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                aria-current={tab === k}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  tab === k
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <I size={18} strokeWidth={1.8} />
                {l}
              </button>
            ))}
          </nav>

          <div className="min-w-0 space-y-6">
            {tab === "profile" && (
              <ProfileTab s={s} commit={commit} flash={flash} />
            )}

            {tab === "security" && (
              <SecurityTab
                s={s}
                commit={commit}
                flash={flash}
                onChangePassword={onChangePassword}
              />
            )}

            {tab === "banks" && <BanksTab s={s} commit={commit} />}

            {tab === "qr" && <QrTab s={s} commit={commit} flash={flash} />}

            {tab === "invoice" && <InvoiceTab s={s} commit={commit} />}

            {tab === "notify" && (
              <Card
                title="Notifications"
                desc="Choose what Pegal should tell you about."
              >
                <div className="divide-y divide-slate-100">
                  {[
                    [
                      "paid",
                      "Payment received",
                      "When a client pays an invoice.",
                    ],
                    [
                      "overdue",
                      "Overdue invoices",
                      "A reminder when an invoice passes its due date.",
                    ],
                    [
                      "payroll",
                      "Payroll due",
                      "Before salaries are due each month.",
                    ],
                    [
                      "weekly",
                      "Weekly summary",
                      "Revenue, expenses and profit every Monday.",
                    ],
                  ].map(([k, l, d]) => (
                    <Toggle
                      key={k}
                      label={l}
                      desc={d}
                      on={s.notify[k]}
                      onChange={(v) =>
                        commit(
                          {
                            ...s,
                            notify: {
                              ...s.notify,
                              [k]: v,
                            },
                          },
                          "Preference updated",
                        )
                      }
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${
            toast.bad ? "bg-rose-600" : "bg-slate-900"
          }`}
        >
          {toast.bad ? (
            <AlertCircle size={16} />
          ) : (
            <Check size={16} className="text-emerald-400" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ---------- profile ---------- */

function ProfileTab({ s, commit, flash }) {
  const [p, setP] = useState(s.profile);
  const [b, setB] = useState(s.business);
  const [err, setErr] = useState({});
  const file = useRef();

  const initials =
    p.name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P";

  const dirty =
    JSON.stringify([p, b]) !== JSON.stringify([s.profile, s.business]);

  const pick = async (e) => {
    try {
      setP({
        ...p,
        avatar: await readImage(e.target.files[0], 1),
      });
    } catch (m) {
      flash(m, true);
    }

    e.target.value = "";
  };

  const save = () => {
    const er = {};

    if (!p.name.trim()) {
      er.name = "Name is required";
    }

    if (!/^\S+@\S+\.\S+$/.test(p.email)) {
      er.email = "Enter a valid email";
    }

    if (p.phone && !/^[6-9]\d{9}$/.test(p.phone)) {
      er.phone = "Enter a 10-digit mobile number";
    }

    if (b.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(b.gstin)) {
      er.gstin = "GSTIN format looks incorrect";
    }

    if (b.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(b.pan)) {
      er.pan = "PAN format looks incorrect";
    }

    setErr(er);

    if (Object.keys(er).length) return;

    commit(
      {
        ...s,
        profile: p,
        business: b,
      },
      "Profile saved",
    );
  };

  return (
    <>
      <Card
        title="Your profile"
        desc="This appears on invoices and in the sidebar."
      >
        <div className="mb-6 flex items-center gap-5">
          <div className="relative">
            {p.avatar ? (
              <img
                src={p.avatar}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700">
                {initials}
              </div>
            )}

            <button
              onClick={() => file.current.click()}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white hover:bg-blue-700"
            >
              <Camera size={14} />
            </button>

            <input
              ref={file}
              type="file"
              accept="image/*"
              hidden
              onChange={pick}
            />
          </div>

          <div>
            <p className="text-sm font-semibold">{p.name || "Your name"}</p>
            <p className="text-xs text-slate-400">{p.role}</p>

            {p.avatar && (
              <button
                onClick={() => setP({ ...p, avatar: "" })}
                className="mt-1.5 text-xs font-medium text-rose-600 hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={err.name}>
            <input
              className={inp}
              value={p.name}
              onChange={(e) => setP({ ...p, name: e.target.value })}
            />
          </Field>

          <Field label="Role">
            <input
              className={inp}
              value={p.role}
              onChange={(e) => setP({ ...p, role: e.target.value })}
            />
          </Field>

          <Field label="Email" error={err.email}>
            <input
              type="email"
              className={inp}
              value={p.email}
              onChange={(e) => setP({ ...p, email: e.target.value })}
            />
          </Field>

          <Field label="Mobile" error={err.phone}>
            <input
              inputMode="numeric"
              maxLength={10}
              className={inp}
              placeholder="9876543210"
              value={p.phone}
              onChange={(e) =>
                setP({
                  ...p,
                  phone: e.target.value.replace(/\D/g, ""),
                })
              }
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Business details"
        desc="Printed on your invoices and quotations."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agency name">
            <input
              className={inp}
              value={b.name}
              onChange={(e) => setB({ ...b, name: e.target.value })}
            />
          </Field>

          <Field label="Website">
            <input
              className={inp}
              placeholder="https://"
              value={b.website}
              onChange={(e) => setB({ ...b, website: e.target.value })}
            />
          </Field>

          <Field label="GSTIN" error={err.gstin}>
            <input
              className={inp}
              maxLength={15}
              placeholder="27ABCDE1234F1Z5"
              value={b.gstin}
              onChange={(e) =>
                setB({
                  ...b,
                  gstin: e.target.value.toUpperCase(),
                })
              }
            />
          </Field>

          <Field label="PAN" error={err.pan}>
            <input
              className={inp}
              maxLength={10}
              placeholder="ABCDE1234F"
              value={b.pan}
              onChange={(e) =>
                setB({
                  ...b,
                  pan: e.target.value.toUpperCase(),
                })
              }
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Address">
              <textarea
                rows={3}
                className={`${inp} h-auto py-3`}
                value={b.address}
                onChange={(e) => setB({ ...b, address: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className={btnS}
            disabled={!dirty}
            onClick={() => {
              setP(s.profile);
              setB(s.business);
              setErr({});
            }}
          >
            Discard
          </button>

          <button className={btnP} disabled={!dirty} onClick={save}>
            Save changes
          </button>
        </div>
      </Card>
    </>
  );
}

/* ---------- security ---------- */

function SecurityTab({ s, commit, flash, onChangePassword }) {
  const [f, setF] = useState({
    cur: "",
    next: "",
    conf: "",
  });

  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState({});

  const rules = [
    ["8+ characters", f.next.length >= 8],
    ["Upper & lowercase", /[a-z]/.test(f.next) && /[A-Z]/.test(f.next)],
    ["A number", /\d/.test(f.next)],
    ["A symbol", /[^A-Za-z0-9]/.test(f.next)],
  ];

  const score = rules.filter((r) => r[1]).length;

  const label = ["Too weak", "Weak", "Fair", "Good", "Strong"][score];

  const col = [
    "bg-slate-200",
    "bg-rose-500",
    "bg-orange-400",
    "bg-amber-400",
    "bg-emerald-500",
  ][score];

  const submit = async (e) => {
    e.preventDefault();

    const er = {};

    if (!f.cur) {
      er.cur = "Enter your current password";
    }

    if (score < 3) {
      er.next = "Choose a stronger password";
    }

    if (f.next === f.cur && f.next) {
      er.next = "New password must differ from the current one";
    }

    if (f.conf !== f.next) {
      er.conf = "Passwords do not match";
    }

    setErr(er);

    if (Object.keys(er).length) return;

    if (!onChangePassword) {
      setErr({
        cur: "Password change is not connected to an authentication API yet.",
      });
      return;
    }

    setBusy(true);

    try {
      await onChangePassword(f.cur, f.next);

      setF({
        cur: "",
        next: "",
        conf: "",
      });

      flash("Password updated");
      setErr({});
    } catch (x) {
      setErr({
        cur: x?.message || "Could not update password",
      });
    } finally {
      setBusy(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <>
      <Card
        title="Change password"
        desc="Use a unique password you don't use anywhere else."
      >
        <form onSubmit={submit} className="max-w-md space-y-4">
          <Field label="Current password" error={err.cur}>
            <input
              type={type}
              autoComplete="current-password"
              className={inp}
              value={f.cur}
              onChange={(e) => setF({ ...f, cur: e.target.value })}
            />
          </Field>

          <Field label="New password" error={err.next}>
            <div className="relative">
              <input
                type={type}
                autoComplete="new-password"
                className={`${inp} pr-11`}
                value={f.next}
                onChange={(e) => setF({ ...f, next: e.target.value })}
              />

              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide passwords" : "Show passwords"}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {f.next && (
            <div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i <= score ? col : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-500">{label}</p>

              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {rules.map(([t, ok]) => (
                  <span
                    key={t}
                    className={`flex items-center gap-1.5 text-xs ${
                      ok ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <Check size={12} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Field label="Confirm new password" error={err.conf}>
            <input
              type={type}
              autoComplete="new-password"
              className={inp}
              value={f.conf}
              onChange={(e) => setF({ ...f, conf: e.target.value })}
            />
          </Field>

          <button className={btnP} disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            Update password
          </button>
        </form>
      </Card>

      <Card
        title="Two-factor authentication"
        desc="Add a second step when signing in."
      >
        <Toggle
          label="Authenticator app"
          desc="Requires backend support to enforce. This stores your preference."
          on={s.twoFA}
          onChange={(v) =>
            commit(
              {
                ...s,
                twoFA: v,
              },
              v ? "2FA preference enabled" : "2FA preference disabled",
            )
          }
        />
      </Card>

      <Card
        title="Active sessions"
        desc="Devices currently signed in to your account."
      >
        <ul className="divide-y divide-slate-100">
          {[
            [Laptop, "MacBook · Chrome", "Pune, India · This device", true],
            [Smartphone, "iPhone · Safari", "Pune, India · 2 days ago", false],
          ].map(([I, n, d, cur]) => (
            <li
              key={n}
              className="flex items-center justify-between gap-3 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <I size={18} />
                </span>

                <div>
                  <p className="text-sm font-medium">{n}</p>
                  <p className="text-xs text-slate-400">{d}</p>
                </div>
              </div>

              {cur ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Current
                </span>
              ) : (
                <button
                  className={btnS}
                  onClick={() =>
                    flash(
                      "Session management is not connected to the authentication API.",
                      true,
                    )
                  }
                >
                  Sign out
                </button>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-slate-400">
          Sample sessions. Connect your auth provider for live devices.
        </p>
      </Card>
    </>
  );
}

/* ---------- banks ---------- */

const emptyBank = {
  holder: "",
  bank: "",
  account: "",
  ifsc: "",
  branch: "",
  upi: "",
  type: "Current",
};

function BanksTab({ s, commit }) {
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [reveal, setReveal] = useState({});

  const upsert = (b) => {
    let banks = b.id
      ? s.banks.map((x) => (x.id === b.id ? b : x))
      : [...s.banks, { ...b, id: uid() }];

    if (!banks.some((x) => x.default)) {
      banks = banks.map((x, i) => ({
        ...x,
        default: i === 0,
      }));
    }

    commit({ ...s, banks }, b.id ? "Bank updated" : "Bank added");

    setEdit(null);
  };

  const remove = () => {
    let banks = s.banks.filter((x) => x.id !== del.id);

    if (banks.length && !banks.some((x) => x.default)) {
      banks[0] = {
        ...banks[0],
        default: true,
      };
    }

    commit({ ...s, banks }, "Bank deleted");
    setDel(null);
  };

  const makeDefault = (id) =>
    commit(
      {
        ...s,
        banks: s.banks.map((x) => ({
          ...x,
          default: x.id === id,
        })),
      },
      "Default bank changed",
    );

  return (
    <>
      <Card
        title="Bank accounts"
        desc="Shown on invoices so clients know where to pay. The default account is used automatically."
        action={
          <button
            className={btnP}
            onClick={() => setEdit({ ...emptyBank, id: "" })}
          >
            <Plus size={16} />
            Add bank
          </button>
        }
      >
        {s.banks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Landmark size={22} />
            </span>

            <p className="mt-4 text-sm font-semibold">No bank account yet</p>

            <p className="mt-1 text-sm text-slate-400">
              Add one to print payment details on your invoices.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {s.banks.map((b) => (
              <article
                key={b.id}
                className={`rounded-2xl border p-5 ${
                  b.default
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Landmark size={18} />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{b.bank}</p>
                      <p className="truncate text-xs text-slate-400">
                        {b.type} account · {b.holder}
                      </p>
                    </div>
                  </div>

                  {b.default && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                      <Star size={11} />
                      Default
                    </span>
                  )}
                </div>

                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Account no.</dt>

                    <dd className="flex items-center gap-2 font-medium tabular-nums">
                      {reveal[b.id] ? b.account : mask(b.account)}

                      <button
                        onClick={() =>
                          setReveal({
                            ...reveal,
                            [b.id]: !reveal[b.id],
                          })
                        }
                        aria-label="Toggle account number"
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {reveal[b.id] ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">IFSC</dt>
                    <dd className="font-medium">{b.ifsc}</dd>
                  </div>

                  {b.branch && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-400">Branch</dt>
                      <dd className="truncate font-medium">{b.branch}</dd>
                    </div>
                  )}

                  {b.upi && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-400">UPI</dt>
                      <dd className="truncate font-medium">{b.upi}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {!b.default && (
                    <button className={btnS} onClick={() => makeDefault(b.id)}>
                      <Star size={14} />
                      Make default
                    </button>
                  )}

                  <button className={btnS} onClick={() => setEdit(b)}>
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    className={`${btnS} text-rose-600 hover:bg-rose-50`}
                    onClick={() => setDel(b)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {edit && (
        <BankForm init={edit} onSave={upsert} onClose={() => setEdit(null)} />
      )}

      {del && (
        <Modal title="Delete bank account?" onClose={() => setDel(null)}>
          <p className="text-sm text-slate-500">
            {del.bank} ending {String(del.account).slice(-4)} will be removed.
            Existing invoices keep the details they were created with.
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <button className={btnS} onClick={() => setDel(null)}>
              Cancel
            </button>

            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
              onClick={remove}
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function BankForm({ init, onSave, onClose }) {
  const [f, setF] = useState(init);
  const [err, setErr] = useState({});

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.value,
    });

  const go = () => {
    const er = {};

    if (!f.holder.trim()) {
      er.holder = "Required";
    }

    if (!f.bank.trim()) {
      er.bank = "Required";
    }

    if (!/^\d{9,18}$/.test(f.account)) {
      er.account = "Enter 9–18 digits";
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc)) {
      er.ifsc = "Invalid IFSC (e.g. HDFC0001234)";
    }

    if (f.upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(f.upi)) {
      er.upi = "Invalid UPI ID";
    }

    setErr(er);

    if (!Object.keys(er).length) {
      onSave(f);
    }
  };

  return (
    <Modal
      title={init.id ? "Edit bank account" : "Add bank account"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field label="Account holder name" error={err.holder}>
          <input
            autoFocus
            className={inp}
            value={f.holder}
            onChange={set("holder")}
          />
        </Field>

        <Field label="Bank name" error={err.bank}>
          <input
            className={inp}
            placeholder="HDFC Bank"
            value={f.bank}
            onChange={set("bank")}
          />
        </Field>

        <Field label="Account number" error={err.account}>
          <input
            inputMode="numeric"
            className={inp}
            value={f.account}
            onChange={(e) =>
              setF({
                ...f,
                account: e.target.value.replace(/\D/g, ""),
              })
            }
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="IFSC" error={err.ifsc}>
            <input
              className={inp}
              maxLength={11}
              value={f.ifsc}
              onChange={(e) =>
                setF({
                  ...f,
                  ifsc: e.target.value.toUpperCase(),
                })
              }
            />
          </Field>

          <Field label="Account type">
            <select className={inp} value={f.type} onChange={set("type")}>
              <option>Current</option>
              <option>Savings</option>
            </select>
          </Field>
        </div>

        <Field label="Branch (optional)">
          <input className={inp} value={f.branch} onChange={set("branch")} />
        </Field>

        <Field label="UPI ID (optional)" error={err.upi}>
          <input
            className={inp}
            placeholder="name@bank"
            value={f.upi}
            onChange={set("upi")}
          />
        </Field>

        <button className={`${btnP} w-full`} onClick={go}>
          {init.id ? "Save changes" : "Add bank account"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- payment QR ---------- */

function QrTab({ s, commit, flash }) {
  const [label, setLabel] = useState("");
  const [upi, setUpi] = useState("");
  const [img, setImg] = useState("");
  const [err, setErr] = useState("");
  const file = useRef();

  const pick = async (e) => {
    try {
      setImg(await readImage(e.target.files[0]));
      setErr("");
    } catch (m) {
      flash(m, true);
    }

    e.target.value = "";
  };

  const add = () => {
    if (!img) {
      return setErr("Upload your QR image first");
    }

    if (upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi)) {
      return setErr("Invalid UPI ID");
    }

    const qrs = [
      ...s.qrs,
      {
        id: uid(),
        label: label.trim() || "Payment QR",
        upi,
        image: img,
        default: s.qrs.length === 0,
      },
    ];

    commit({ ...s, qrs }, "QR added");

    setLabel("");
    setUpi("");
    setImg("");
    setErr("");
  };

  const remove = (id) => {
    let qrs = s.qrs.filter((q) => q.id !== id);

    if (qrs.length && !qrs.some((q) => q.default)) {
      qrs[0] = {
        ...qrs[0],
        default: true,
      };
    }

    commit({ ...s, qrs }, "QR deleted");
  };

  const dl = (q) => {
    const a = document.createElement("a");
    a.href = q.image;
    a.download = `${q.label.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <>
      <Card
        title="Add payment QR"
        desc="Upload the QR from GPay, PhonePe, Paytm or your bank app. It prints on invoices."
      >
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <button
            onClick={() => file.current.click()}
            className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition hover:border-blue-300 hover:text-blue-600"
            aria-label="Upload QR image"
          >
            {img ? (
              <img
                src={img}
                alt="QR preview"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-xs font-medium">
                <Upload size={22} />
                Upload QR
              </span>
            )}
          </button>

          <input
            ref={file}
            type="file"
            accept="image/*"
            hidden
            onChange={pick}
          />

          <div className="space-y-4">
            <Field label="Label">
              <input
                className={inp}
                placeholder="GPay business"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </Field>

            <Field label="UPI ID (optional)" error={err}>
              <input
                className={inp}
                placeholder="pegal@okhdfcbank"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
              />
            </Field>

            <button className={btnP} onClick={add}>
              <Plus size={16} />
              Save QR
            </button>
          </div>
        </div>
      </Card>

      <Card
        title="Saved QR codes"
        desc={
          s.qrs.length
            ? "The default QR is printed on new invoices."
            : "Nothing saved yet."
        }
      >
        {s.qrs.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {s.qrs.map((q) => (
              <article
                key={q.id}
                className={`rounded-2xl border p-4 ${
                  q.default
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-slate-200"
                }`}
              >
                <div className="flex aspect-square items-center justify-center rounded-xl bg-white p-3">
                  <img
                    src={q.image}
                    alt={q.label}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{q.label}</p>
                    <p className="truncate text-xs text-slate-400">
                      {q.upi || "No UPI ID"}
                    </p>
                  </div>

                  {q.default && (
                    <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Default
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  {!q.default && (
                    <button
                      className={btnS}
                      onClick={() =>
                        commit(
                          {
                            ...s,
                            qrs: s.qrs.map((x) => ({
                              ...x,
                              default: x.id === q.id,
                            })),
                          },
                          "Default QR changed",
                        )
                      }
                      aria-label="Make default"
                    >
                      <Star size={14} />
                    </button>
                  )}

                  <button className={`${btnS} flex-1`} onClick={() => dl(q)}>
                    <Download size={14} />
                    Download
                  </button>

                  <button
                    className={`${btnS} text-rose-600 hover:bg-rose-50`}
                    onClick={() => remove(q.id)}
                    aria-label="Delete QR"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ---------- invoicing ---------- */

function InvoiceTab({ s, commit }) {
  const [v, setV] = useState(s.invoice);

  const dirty = JSON.stringify(v) !== JSON.stringify(s.invoice);

  const n = (k) => (e) =>
    setV({
      ...v,
      [k]: Math.max(0, Number(e.target.value) || 0),
    });

  return (
    <Card
      title="Invoice defaults"
      desc="Applied to every new invoice. You can still change them per invoice."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice prefix">
          <input
            className={inp}
            value={v.prefix}
            onChange={(e) => setV({ ...v, prefix: e.target.value })}
          />
        </Field>

        <Field label="Next number">
          <input
            type="number"
            className={inp}
            value={v.next}
            onChange={n("next")}
          />
        </Field>

        <Field label="Default due (days)">
          <input
            type="number"
            className={inp}
            value={v.dueDays}
            onChange={n("dueDays")}
          />
        </Field>

        <Field label="Default GST (%)">
          <input
            type="number"
            className={inp}
            value={v.gst}
            onChange={n("gst")}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Preview" hint="Your next invoice will be numbered:">
            <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-800">
              {v.prefix}
              {String(v.next).padStart(3, "0")}
            </p>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Terms & notes">
            <textarea
              rows={3}
              className={`${inp} h-auto py-3`}
              value={v.terms}
              onChange={(e) => setV({ ...v, terms: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
        <Toggle
          label="Show bank details on invoices"
          desc="Uses your default bank account."
          on={v.showBank}
          onChange={(x) => setV({ ...v, showBank: x })}
        />

        <Toggle
          label="Show payment QR on invoices"
          desc="Uses your default QR code."
          on={v.showQr}
          onChange={(x) => setV({ ...v, showQr: x })}
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          className={btnS}
          disabled={!dirty}
          onClick={() => setV(s.invoice)}
        >
          Discard
        </button>

        <button
          className={btnP}
          disabled={!dirty}
          onClick={() =>
            commit(
              {
                ...s,
                invoice: v,
              },
              "Invoice settings saved",
            )
          }
        >
          Save changes
        </button>
      </div>
    </Card>
  );
}
