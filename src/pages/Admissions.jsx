// pages/Admissions.jsx
import { useState, useEffect } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import CardWrapper from "../components/CardWrapper";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddAdmissionForm from "../components/forms/AddAdmissionForm";
import { admissionAPI } from "../api/apiService";

// ── helpers ───────────────────────────────────────────────────
const FILTERS = ["All", "Approved", "Pending", "Under Review", "Rejected"];

const mapStatus = (s) =>
  s === "PENDING"
    ? "Pending"
    : s === "UNDER_REVIEW"
      ? "Under Review"
      : s === "APPROVED"
        ? "Approved"
        : s === "REJECTED"
          ? "Rejected"
          : s;

const toRow = (a) => ({
  id: a.id,
  name: a.applicantName,
  applyClass: a.applyClass,
  dob: a.dob || "—",
  gender: a.gender || "—",
  guardian: a.guardianName,
  contact: a.contactNumber,
  email: a.guardianEmail || "—",
  prevSchool: a.prevSchool || "—",
  date: a.appliedDate,
  status: mapStatus(a.status),
});

// ── Page ──────────────────────────────────────────────────────
export default function Admissions() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);

  // ── fetch ──────────────────────────────────────────────────
  const fetchAdmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await admissionAPI.getAll();
      setAdmissions(data.map(toRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdmissions();
  }, []);

  // ── add ────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      await admissionAPI.create({
        applicantName: formData.name,
        dob: formData.dob || null,
        gender: formData.gender || null,
        applyClass: formData.applyClass,
        guardianName: formData.guardian,
        contactNumber: formData.contact,
        guardianEmail: formData.email || null,
        prevSchool: formData.prevSchool || null,
        reason: formData.reason || null,
      });
      fetchAdmissions();
    } catch (err) {
      alert("Failed to submit application: " + err.message);
    }
  };

  // ── approve / reject ───────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await admissionAPI.approve(id);
      setAdmissions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Approved" } : a)),
      );
    } catch (err) {
      alert("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await admissionAPI.reject(id);
      setAdmissions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a)),
      );
    } catch (err) {
      alert("Failed to reject: " + err.message);
    }
  };

  // ── delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await admissionAPI.delete(id);
      setAdmissions((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  // ── filtered rows ──────────────────────────────────────────
  const filtered =
    activeFilter === "All"
      ? admissions
      : admissions.filter((a) => a.status === activeFilter);

  const columns = [
    { key: "id", label: "App. ID" },
    { key: "name", label: "Applicant Name" },
    { key: "applyClass", label: "Class Applied" },
    { key: "guardian", label: "Guardian" },
    { key: "contact", label: "Contact" },
    { key: "date", label: "Applied On" },
    { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          {row.status !== "Approved" && (
            <button
              onClick={() => handleApprove(row.id)}
              style={{
                background: theme.green + "18",
                color: theme.green,
                border: "none",
                borderRadius: 6,
                padding: "3px 9px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Approve
            </button>
          )}
          {row.status !== "Rejected" && (
            <button
              onClick={() => handleReject(row.id)}
              style={{
                background: theme.red + "18",
                color: theme.red,
                border: "none",
                borderRadius: 6,
                padding: "3px 9px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Reject
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            style={{
              background: theme.muted + "18",
              color: theme.muted,
              border: "none",
              borderRadius: 6,
              padding: "3px 9px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admissions"
        actionLabel="+ New Application"
        onAction={() => setAddOpen(true)}
      />

      {/* Filter tabs with live counts */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              background: activeFilter === f ? theme.accent : theme.card,
              color: activeFilter === f ? "#fff" : theme.muted,
              border: `1px solid ${activeFilter === f ? theme.accent : theme.border}`,
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            {f}
            {f !== "All" && (
              <span style={{ opacity: 0.7 }}>
                {" "}
                ({admissions.filter((a) => a.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <CardWrapper>
        {loading && <LoadingSpinner message="Loading admissions…" />}
        {error && <ErrorMessage message={error} onRetry={fetchAdmissions} />}
        {!loading && !error && <DataTable columns={columns} data={filtered} />}
      </CardWrapper>

      {addOpen && (
        <AddAdmissionForm onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
