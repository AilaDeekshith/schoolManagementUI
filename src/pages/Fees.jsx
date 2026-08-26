// pages/Fees.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import CardWrapper from "../components/CardWrapper";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import CollectFeeForm from "../components/forms/CollectFeeForm";
import PaymentReceipt from "../components/PaymentReceipt";
import { feesAPI, configAPI } from "../api/apiService";

// backend enum → readable label
const prettyEnum = (s) =>
  s ? s.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ") : "";

// School academic year for "now" (April–March), e.g. "2026-27"
const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
};

const fedLabel = { fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 };
const fedInput = {
  padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${theme.border}`,
  background: theme.card, color: theme.text, fontSize: 13, outline: "none",
  fontFamily: "'DM Sans', sans-serif", minWidth: 140,
};

// ── helpers ───────────────────────────────────────────────────
const mapFeeStatus = (s) =>
  s === "PAID" ? "Paid" : s === "OVERDUE" ? "Overdue" : "Pending";

// UI label → backend enum
const PAYMENT_METHOD_MAP = {
  Cash: "CASH",
  Cheque: "CHEQUE",
  "Online Transfer": "ONLINE_TRANSFER",
  UPI: "UPI",
  "Demand Draft": "DEMAND_DRAFT",
};

const toRow = (f) => ({
  id: f.id,
  // Show the same student identifier as the Students page (the generated student code, not the DB id).
  studentId: f.student?.studentCode,
  name: f.student?.name || "—",
  class: f.student?.className || "—",
  total: Number(f.totalAmount || 0),
  paid: Number(f.paidAmount || 0),
  due: Number(f.dueAmount || 0),
  status: mapFeeStatus(f.feeStatus),
  year: f.academicYear || "—",
});

// ── Page ──────────────────────────────────────────────────────
export default function Fees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // row whose Collect was clicked
  const [templates, setTemplates] = useState([]); // available receipt templates
  const [profile, setProfile] = useState({}); // school profile for receipt header
  const [receipt, setReceipt] = useState(null); // payment data for receipt modal
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PAID | PENDING | OVERDUE
  const [classes, setClasses] = useState([]);              // class dropdown options
  const [className, setClassName] = useState("");          // selected class
  const [academicYears, setAcademicYears] = useState([]);  // academic-year dropdown options
  const [academicYear, setAcademicYear] = useState("");    // selected academic year
  const [search, setSearch] = useState("");                // student name (typed)
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── fetch (all filtering happens on the backend) ───────────
  const fetchFees = async () => {
    if (!className) return; // wait until the default class is known
    setLoading(true);
    setError(null);
    try {
      const feeData = await feesAPI.search({ className, academicYear, status: statusFilter, name: debouncedSearch });
      setFees(feeData.map(toRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load filter options once. Only the default class is fetched initially —
  // the full fee list is never loaded up front.
  useEffect(() => {
    (async () => {
      const [grades, cfgYears, prof] = await Promise.all([
        configAPI.getGrades().catch(() => []),
        configAPI.getAcademicYears().catch(() => []),
        configAPI.getProfile().catch(() => ({})),
      ]);
      // Class options come from the configured grades & sections.
      const classNames = (grades || []).flatMap(g => (g.sections ?? []).map(s => `${g.name}-${s.letter}`));
      // Year options come only from Configuration → Academic Years.
      const yearList = (cfgYears || []).map(y => y.year);
      const activeYear = (cfgYears || []).find(y => y.active)?.year;
      const profAY = (prof?.academicYear || "").trim();
      const curAY = activeYear || (yearList.includes(profAY) ? profAY : "") || yearList[0] || profAY || currentAcademicYear();
      setClasses(classNames);
      setAcademicYears(Array.from(new Set([curAY, ...yearList])).filter(Boolean));
      setAcademicYear(curAY);
      setProfile(prof || {});
      if (classNames.length) setClassName(classNames[0]);
    })();
    configAPI.getReceiptTemplates().then(setTemplates).catch(() => {});
  }, []);

  // Debounce the typed name so we don't hit the backend on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Re-fetch whenever any filter changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className, academicYear, statusFilter, debouncedSearch]);

  // ── collect payment ────────────────────────────────────────
  const handleCollect = async ({ feeId, amount, method, txnId, date }) => {
    try {
      const updated = await feesAPI.collectPayment(
        feeId,
        amount,
        PAYMENT_METHOD_MAP[method] || "CASH",
        txnId || null,
      );
      // Build the receipt for this payment and show it to the collector.
      setReceipt({
        receiptNo: `RCPT-${feeId}-${new Date().getTime().toString().slice(-6)}`,
        date: date || new Date().toISOString().split("T")[0],
        studentName: selected?.name,
        studentClass: selected?.class,
        academicYear: updated?.academicYear,
        feeType: prettyEnum(updated?.feeType),
        paymentMethod: method,
        transactionId: txnId,
        amountPaid: Number(amount),
        totalAmount: Number(updated?.totalAmount || 0),
        paidToDate: Number(updated?.paidAmount || 0),
        dueAmount: Number(updated?.dueAmount || 0),
      });
      fetchFees();
    } catch (err) {
      toast.error("Payment failed: " + err.message);
    }
  };

  const [reminding, setReminding] = useState(null); // fee id currently being reminded
  const [remindingAll, setRemindingAll] = useState(false);

  const handleRemind = async (row) => {
    setReminding(row.id);
    try {
      await feesAPI.remind(row.id);
      toast.success(`Reminder emailed for ${row.name}`);
    } catch (err) {
      toast.error("Failed to send reminder: " + err.message);
    } finally {
      setReminding(null);
    }
  };

  const handleRemindAll = async () => {
    setRemindingAll(true);
    try {
      const res = await feesAPI.remindAll(academicYear);
      const sent = res?.sent ?? 0;
      toast.success(sent > 0
        ? `${sent} reminder${sent === 1 ? "" : "s"} emailed`
        : "No outstanding fees with an email on file");
    } catch (err) {
      toast.error("Failed to send reminders: " + err.message);
    } finally {
      setRemindingAll(false);
    }
  };

  // ── table columns ──────────────────────────────────────────
  const columns = [
    { key: "studentId", label: "Student ID", render: (v) => v || "—" },
    { key: "name", label: "Name" },
    { key: "class", label: "Class" },
    { key: "year", label: "Year" },
    {
      key: "total",
      label: "Total",
      render: (v) => `₹${v.toLocaleString()}`,
    },
    {
      key: "paid",
      label: "Paid",
      render: (v) => (
        <span style={{ color: theme.green, fontWeight: 700 }}>
          ₹{v.toLocaleString()}
        </span>
      ),
    },
    {
      key: "due",
      label: "Due",
      render: (v) => (
        <span
          style={{
            color: v > 0 ? theme.red : theme.muted,
            fontWeight: v > 0 ? 700 : 400,
          }}
        >
          ₹{v.toLocaleString()}
        </span>
      ),
    },
    { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
    {
      key: "action",
      label: "Action",
      render: (_, row) =>
        row.due > 0 ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setSelected(row)}
              style={{
                background: theme.accent + "18",
                color: theme.accent,
                border: `1px solid ${theme.accent}33`,
                borderRadius: 6,
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Collect
            </button>
            <button
              onClick={() => handleRemind(row)}
              disabled={reminding === row.id}
              title="Email a payment reminder"
              style={{
                background: theme.orange + "18",
                color: theme.orange,
                border: `1px solid ${theme.orange}33`,
                borderRadius: 6,
                padding: "4px 12px",
                cursor: reminding === row.id ? "default" : "pointer",
                fontSize: 11,
                fontWeight: 700,
                opacity: reminding === row.id ? 0.6 : 1,
              }}
            >
              {reminding === row.id ? "…" : "Remind"}
            </button>
          </div>
        ) : (
          <span style={{ color: theme.muted, fontSize: 12 }}>—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fee Management"
        actionLabel={remindingAll ? "Sending…" : "Send Reminders"}
        onAction={remindingAll ? undefined : handleRemindAll}
      />

      {/* Class + Academic Year + name search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={fedLabel}>Class</div>
          <select value={className} onChange={(e) => setClassName(e.target.value)} style={fedInput}>
            {classes.length === 0 && <option value="">No classes</option>}
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={fedLabel}>Academic Year</div>
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={fedInput}>
            {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: "auto", minWidth: 260 }}>
          <div style={fedLabel}>Search student</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", lineHeight: 1 }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a student name…"
              style={{ ...fedInput, width: "100%", padding: "9px 32px 9px 34px", boxSizing: "border-box" }}
            />
            {search && (
              <button onClick={() => setSearch("")} title="Clear" style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: theme.muted,
                fontSize: 16, lineHeight: 1, padding: 0, display: "flex", alignItems: "center",
              }}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[
          ["ALL", "All", theme.accent],
          ["PAID", "Paid", theme.green],
          ["PENDING", "Pending", theme.orange || "#F59E0B"],
          ["OVERDUE", "Overdue", theme.red],
        ].map(([value, label, color]) => {
          const active = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={{
                padding: "8px 18px", borderRadius: 20, cursor: "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                border: `1.5px solid ${active ? color : theme.border}`,
                background: active ? color + "18" : theme.card,
                color: active ? color : theme.muted,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <CardWrapper>
        {loading && <LoadingSpinner message="Loading fees…" />}
        {error && <ErrorMessage message={error} onRetry={fetchFees} />}
        {!loading && !error && (
          fees.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: theme.muted }}>
              {debouncedSearch
                ? `No students match “${debouncedSearch}” in ${className || "this class"}.`
                : `No fee records found for ${className || "this class"}${academicYear ? ` (${academicYear})` : ""}.`}
            </div>
          ) : (
            <DataTable columns={columns} data={fees} />
          )
        )}
      </CardWrapper>

      {/* Collect payment modal */}
      {selected && (
        <CollectFeeForm
          student={selected}
          onClose={() => setSelected(null)}
          onCollect={handleCollect}
        />
      )}

      {/* Printable receipt shown after a successful payment */}
      {receipt && (
        <PaymentReceipt
          templates={templates}
          profile={profile}
          payment={receipt}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
