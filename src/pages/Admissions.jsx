// pages/Admissions.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import DataTable from "../components/DataTable";
import CardWrapper from "../components/CardWrapper";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddAdmissionForm from "../components/forms/AddAdmissionForm";
import { admissionAPI, configAPI } from "../api/apiService";

// ── helpers ───────────────────────────────────────────────────
const FILTERS = ["All", "Approved", "Pending", "Under Review", "Rejected"];
// Readable filter label → backend enum for the status API.
const STATUS_ENUM = { Approved: "APPROVED", Pending: "PENDING", "Under Review": "UNDER_REVIEW", Rejected: "REJECTED" };

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
  const [classOptions, setClassOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [counts, setCounts] = useState({});

  // ── fetch (status filter + name search run on the backend) ──
  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const name = debouncedSearch.trim();
      let data;
      if (name) {
        // Search by applicant name, then narrow by the active status chip.
        data = await admissionAPI.search(name);
        if (activeFilter !== "All") {
          data = data.filter((a) => a.status === STATUS_ENUM[activeFilter]);
        }
      } else {
        data = activeFilter === "All"
          ? await admissionAPI.getAll()
          : await admissionAPI.getByStatus(STATUS_ENUM[activeFilter]);
      }
      setAdmissions(data.map(toRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chip counts come from the full set (kept in sync separately).
  const refreshCounts = async () => {
    const all = (await admissionAPI.getAll().catch(() => [])).map(toRow);
    const c = {};
    all.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    setCounts(c);
  };

  const refresh = () => { fetchList(); refreshCounts(); };

  // Debounce typing so we hit the backend once the user pauses.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Re-fetch whenever the status filter or the (debounced) search changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCounts();
    configAPI.getGrades().then(grades => {
      setClassOptions(grades.flatMap(g =>
        (g.sections ?? []).map(s => `${g.name}-${s.letter}`)
      ));
    }).catch(() => {});
  }, []);

  const toPayload = (formData) => ({
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

  // ── add ────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      await admissionAPI.create(toPayload(formData));
      refresh();
    } catch (err) {
      toast.error("Failed to submit application: " + err.message);
    }
  };

  // ── edit ───────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    try {
      await admissionAPI.update(editTarget.id, toPayload(formData));
      refresh();
    } catch (err) {
      toast.error("Failed to update application: " + err.message);
    }
  };

  // ── approve / reject ───────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await admissionAPI.approve(id);
      refresh();
    } catch (err) {
      toast.error("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await admissionAPI.reject(id);
      refresh();
    } catch (err) {
      toast.error("Failed to reject: " + err.message);
    }
  };

  // ── delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await admissionAPI.delete(id);
      refresh();
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const filtered = admissions; // rows are already filtered by the backend

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
          <button
            onClick={() => setEditTarget(row)}
            style={{ background: theme.blue + "15", color: theme.blue, border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
          >Edit</button>
          {row.status !== "Approved" && (
            <button
              onClick={() => handleApprove(row.id)}
              style={{ background: theme.green + "18", color: theme.green, border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
            >Approve</button>
          )}
          {row.status !== "Rejected" && (
            <button
              onClick={() => handleReject(row.id)}
              style={{ background: theme.red + "18", color: theme.red, border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
            >Reject</button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            style={{ background: theme.muted + "18", color: theme.muted, border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
          >Delete</button>
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
                ({counts[f] ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by applicant name…"
      />

      <CardWrapper>
        {loading && <LoadingSpinner message="Loading admissions…" />}
        {error && <ErrorMessage message={error} onRetry={fetchList} />}
        {!loading && !error && (
          filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: theme.muted }}>
              {debouncedSearch ? `No applicants match “${debouncedSearch}”.` : "No admissions found."}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} />
          )
        )}
      </CardWrapper>

      {addOpen && (
        <AddAdmissionForm onClose={() => setAddOpen(false)} onAdd={handleAdd} classOptions={classOptions} />
      )}
      {editTarget && (
        <AddAdmissionForm onClose={() => setEditTarget(null)} onEdit={handleEdit} initial={editTarget} classOptions={classOptions} />
      )}
    </div>
  );
}
