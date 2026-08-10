// pages/Exams.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddExamForm from "../components/forms/AddExamForm";
import { examAPI, configAPI } from "../api/apiService";
import ExamMarks from "./ExamMarks";

// ── helpers ───────────────────────────────────────────────────
const statusLabel = (s) =>
  s === "SCHEDULED"
    ? "Scheduled"
    : s === "UPCOMING"
      ? "Upcoming"
      : s === "COMPLETED"
        ? "Completed"
        : s === "CANCELLED"
          ? "Cancelled"
          : s;

// ── Exam Card ─────────────────────────────────────────────────
const CARD_STATUS_OPTIONS = [
  ["Scheduled", "SCHEDULED"],
  ["Upcoming",  "UPCOMING"],
  ["Completed", "COMPLETED"],
  ["Cancelled", "CANCELLED"],
];

// Accent colour per status — drives the top stripe and hover glow.
const STATUS_COLOR = {
  SCHEDULED: theme.blue,
  UPCOMING:  theme.orange,
  COMPLETED: theme.green,
  CANCELLED: theme.red,
};

function ExamCard({ exam, onStatusChange, onEdit, onDelete, onMarks }) {
  const [hovered, setHovered] = useState(false);
  const accent = STATUS_COLOR[exam.status] || theme.accent;

  const details = [
    ["📅", "Date", exam.date],
    ["🏫", "Class", exam.class],
    ["📊", "Max Marks", exam.maxMarks],
    ["⏱", "Duration", exam.duration],
  ].filter(([, , v]) => v);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card,
        border: `1px solid ${hovered ? accent + "88" : theme.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: hovered
          ? `0 12px 28px ${accent}26`
          : "0 2px 10px rgba(16,24,64,0.05)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      {/* Status stripe */}
      <div style={{ height: 4, background: accent }} />

      <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: theme.muted, background: theme.bg, borderRadius: 6, padding: "2px 8px" }}>
            #{exam.id}
          </span>
          <Badge status={exam.status} />
        </div>

        {/* Name & subject */}
        <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, lineHeight: 1.25 }}>
          {exam.name}
        </div>
        <div style={{ color: theme.accent, fontWeight: 700, fontSize: 12.5, marginTop: 3, marginBottom: 16 }}>
          {exam.subject}
        </div>

        {/* Details grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          background: theme.bg,
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 16,
        }}>
          {details.map(([icon, label, val]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10.5, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
                {icon} {label}
              </span>
              <span style={{ fontSize: 13.5, color: theme.text, fontWeight: 700 }}>
                {String(val)}
              </span>
            </div>
          ))}
        </div>

        {/* Pushes the controls to the bottom so cards align */}
        <div style={{ flex: 1 }} />

        {/* Status control */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 10.5, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 }}>
            Status
          </label>
          <select
            value={exam.status}
            onChange={(e) => {
              const enumVal = CARD_STATUS_OPTIONS.find(([label]) => label === e.target.value)?.[1];
              if (enumVal) onStatusChange(exam.id, enumVal);
            }}
            title="Change exam status"
            style={{ width: "100%", background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "9px 10px", cursor: "pointer", fontSize: 12.5, fontWeight: 700, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
          >
            {CARD_STATUS_OPTIONS.map(([label]) => <option key={label} value={label}>{label}</option>)}
          </select>
        </div>

        {/* Actions */}
        <button
          onClick={() => onMarks(exam)}
          style={{ width: "100%", background: theme.accent, color: "#fff", border: "none", borderRadius: 9, padding: "10px 0", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 12px ${theme.accent}33`, marginBottom: 8 }}
        >
          ✏️ Enter Marks
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onEdit(exam)}
            style={{ flex: 1, background: theme.blue + "12", color: theme.blue, border: `1px solid ${theme.blue}33`, borderRadius: 9, padding: "9px 0", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(exam.id)}
            style={{ flex: 1, background: theme.red + "10", color: theme.red, border: `1px solid ${theme.red}2A`, borderRadius: 9, padding: "9px 0", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Exams() {
  const [exams, setExams] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [marksExam, setMarksExam]   = useState(null);
  const [filter, setFilter]         = useState("All");
  const [counts, setCounts]         = useState({});

  const STATUS_ENUM = { Scheduled: "SCHEDULED", Upcoming: "UPCOMING", Completed: "COMPLETED", Cancelled: "CANCELLED" };

  const toExamRow = (e) => ({
    id: e.id, name: e.name, subject: e.subject,
    class: e.className || "All", date: e.examDate, maxMarks: e.maxMarks,
    duration: e.duration,
    rawStatus: e.status, status: statusLabel(e.status),
  });

  // ── Fetch (status filter runs on the backend) ──────────────
  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = filter === "All"
        ? await examAPI.getAll()
        : await examAPI.getByStatus(STATUS_ENUM[filter]);
      setExams(data.map(toExamRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshCounts = async () => {
    const all = (await examAPI.getAll().catch(() => [])).map(toExamRow);
    const c = {};
    all.forEach((e) => { c[e.status] = (c[e.status] || 0) + 1; });
    setCounts(c);
  };

  const loadMeta = async () => {
    const gradeData = await configAPI.getGrades().catch(() => []);
    setClassOptions(gradeData.flatMap(g => (g.sections ?? []).map(s => `${g.name}-${s.letter}`)));
  };

  const refresh = () => { fetchExams(); refreshCounts(); };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    loadMeta();
    refreshCounts();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch from the backend whenever the status filter changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toPayload = (formData, status = 'SCHEDULED') => ({
    name: formData.name,
    subject: formData.subject,
    className: formData.class,
    examDate: formData.date,
    maxMarks: Number(formData.maxMarks),
    duration: formData.duration,
    instructions: formData.instructions,
    status,
  });

  // ── Add exam ────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      await examAPI.create(toPayload(formData));
      refresh();
    } catch (err) {
      toast.error("Failed to schedule exam: " + err.message);
    }
  };

  // ── Edit exam ───────────────────────────────────────────────
  const handleEdit = async (formData) => {
    try {
      await examAPI.update(editTarget.id, toPayload(formData, editTarget.rawStatus ?? 'SCHEDULED'));
      refresh();
    } catch (err) {
      toast.error("Failed to update exam: " + err.message);
    }
  };

  // ── Delete exam ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam?")) return;
    try {
      await examAPI.delete(id);
      refresh();
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  // ── Status change ───────────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    try {
      await examAPI.updateStatus(id, status);
      refresh();
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  // ── Filter tabs ─────────────────────────────────────────────
  const FILTERS = ["All", "Scheduled", "Upcoming", "Completed", "Cancelled"];
  const filtered = exams; // rows are already filtered by the backend

  return (
    <div>
      <PageHeader
        title="Examinations"
        actionLabel="+ Schedule Exam"
        onAction={() => setAddOpen(true)}
      />

      {/* Filter tabs */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? theme.accent : theme.card,
              color: filter === f ? "#fff" : theme.muted,
              border: `1px solid ${filter === f ? theme.accent : theme.border}`,
              borderRadius: 999,
              padding: "7px 16px",
              fontSize: 12.5,
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: filter === f ? `0 4px 12px ${theme.accent}33` : "none",
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

      {loading && <LoadingSpinner message="Loading exams…" />}
      {error && <ErrorMessage message={error} onRetry={fetchExams} />}

      {!loading &&
        !error &&
        (filtered.length === 0 ? (
          <p style={{ color: theme.muted, fontSize: 14 }}>No exams found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 18,
            }}
          >
            {filtered.map((e) => (
              <ExamCard
                key={e.id}
                exam={e}
                onStatusChange={handleStatusChange}
                onEdit={setEditTarget}
                onDelete={handleDelete}
                onMarks={setMarksExam}
              />
            ))}
          </div>
        ))}

      {addOpen && (
        <AddExamForm onClose={() => setAddOpen(false)} onAdd={handleAdd} classOptions={classOptions} />
      )}
      {editTarget && (
        <AddExamForm onClose={() => setEditTarget(null)} onEdit={handleEdit} initial={editTarget} classOptions={classOptions} />
      )}
      {marksExam && (
        <ExamMarks exam={marksExam} onClose={() => setMarksExam(null)} />
      )}
    </div>
  );
}
