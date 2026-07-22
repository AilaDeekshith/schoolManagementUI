// pages/Fees.jsx
import { useState, useEffect } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
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
  studentId: f.student?.id,
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
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // row whose Collect was clicked
  const [templates, setTemplates] = useState([]); // available receipt templates
  const [profile, setProfile] = useState({}); // school profile for receipt header
  const [receipt, setReceipt] = useState(null); // payment data for receipt modal

  // ── fetch ──────────────────────────────────────────────────
  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    try {
      const [feeData, summaryData] = await Promise.all([
        feesAPI.getAll(),
        feesAPI.getSummary(),
      ]);
      setFees(feeData.map(toRow));
      setSummary({
        totalCollected: Number(summaryData.totalCollected || 0),
        totalOutstanding: Number(summaryData.totalOutstanding || 0),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFees();
    // Load receipt templates + school profile for the printable receipt.
    configAPI.getReceiptTemplates().then(setTemplates).catch(() => {});
    configAPI.getProfile().then(setProfile).catch(() => {});
  }, []);

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
      alert("Payment failed: " + err.message);
    }
  };

  // ── derived stats ──────────────────────────────────────────
  const paidCount = fees.filter((f) => f.status === "Paid").length;
  const overdueCount = fees.filter((f) => f.status === "Overdue").length;

  // ── table columns ──────────────────────────────────────────
  const columns = [
    { key: "studentId", label: "Student ID" },
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
        ) : (
          <span style={{ color: theme.muted, fontSize: 12 }}>—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Fee Management" />

      {/* Stat cards — values come from live API */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total Collected"
          value={`₹${(summary.totalCollected / 1000).toFixed(1)}K`}
          icon="💰"
          color={theme.green}
        />
        <StatCard
          label="Outstanding"
          value={`₹${(summary.totalOutstanding / 1000).toFixed(1)}K`}
          icon="⚠️"
          color={theme.red}
        />
        <StatCard
          label="Fully Paid"
          value={`${paidCount} / ${fees.length}`}
          icon="✅"
          color={theme.blue}
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon="🚨"
          color={theme.accent}
        />
      </div>

      <CardWrapper>
        {loading && <LoadingSpinner message="Loading fees…" />}
        {error && <ErrorMessage message={error} onRetry={fetchFees} />}
        {!loading && !error && <DataTable columns={columns} data={fees} />}
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
