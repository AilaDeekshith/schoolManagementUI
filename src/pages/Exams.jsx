// pages/Exams.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddExamForm from "../components/forms/AddExamForm";
import { examAPI, teacherAPI, configAPI } from "../api/apiService";
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

function ExamCard({ exam, onStatusChange, onEdit, onDelete, onMarks }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card,
        border: `1px solid ${hovered ? theme.accent : theme.border}`,
        borderRadius: 14,
        padding: 22,
        transition: "border-color 0.2s",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{ fontFamily: "monospace", fontSize: 11, color: theme.muted }}
        >
          #{exam.id}
        </span>
        <Badge status={exam.status} />
      </div>

      {/* Name & subject */}
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: theme.text,
          marginBottom: 3,
        }}
      >
        {exam.name}
      </div>
      <div
        style={{
          color: theme.accent,
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 14,
        }}
      >
        {exam.subject}
      </div>

      {/* Details */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: 13,
        }}
      >
        {[
          ["📅", "Date", exam.date],
          ["🏫", "Class", exam.class],
          ["📊", "Max Marks", exam.maxMarks],
          ["⏱", "Duration", exam.duration],
          ["👩‍🏫", "Examiner", exam.examiner],
        ]
          .filter(([, , v]) => v)
          .map(([icon, label, val]) => (
            <div key={label} style={{ display: "flex", gap: 8 }}>
              <span>{icon}</span>
              <span style={{ color: theme.muted }}>{label}:</span>
              <span style={{ color: theme.text, fontWeight: 600 }}>
                {String(val)}
              </span>
            </div>
          ))}
      </div>

      {/* Status control */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>Status</span>
        <select
          value={exam.status}
          onChange={(e) => {
            const enumVal = CARD_STATUS_OPTIONS.find(([label]) => label === e.target.value)?.[1];
            if (enumVal) onStatusChange(exam.id, enumVal);
          }}
          title="Change exam status"
          style={{ flex: 1, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 8px", cursor: "pointer", fontSize: 12.5, fontWeight: 700, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
        >
          {CARD_STATUS_OPTIONS.map(([label]) => <option key={label} value={label}>{label}</option>)}
        </select>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => onMarks(exam)}
          style={{ flex: 2, background: "#f0f4ff", color: theme.accent, border: `1px solid ${theme.accent}44`, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >✏️ Enter Marks</button>
        <button
          onClick={() => onEdit(exam)}
          style={{ flex: 1, background: theme.blue + "15", color: theme.blue, border: `1px solid ${theme.blue}33`, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >Edit</button>
        <button
          onClick={() => onDelete(exam.id)}
          style={{ flex: 1, background: theme.red + "12", color: theme.red, border: `1px solid ${theme.red}22`, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >Delete</button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Exams() {
  const [exams, setExams] = useState([]);
  const [teachers, setTeachers] = useState([]);
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
    duration: e.duration, examiner: e.examinerName,
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
    const [teacherData, gradeData] = await Promise.all([
      teacherAPI.getAll().catch(() => []),
      configAPI.getGrades().catch(() => []),
    ]);
    setClassOptions(gradeData.flatMap(g => (g.sections ?? []).map(s => `${g.name}-${s.letter}`)));
    setTeachers(teacherData.map((t) => ({ id: t.id, name: t.name })));
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
    examinerId: formData.examiner ? teachers.find((t) => t.name === formData.examiner)?.id : null,
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
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
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
        <AddExamForm onClose={() => setAddOpen(false)} onAdd={handleAdd} teachers={teachers} classOptions={classOptions} />
      )}
      {editTarget && (
        <AddExamForm onClose={() => setEditTarget(null)} onEdit={handleEdit} initial={editTarget} teachers={teachers} classOptions={classOptions} />
      )}
      {marksExam && (
        <ExamMarks exam={marksExam} onClose={() => setMarksExam(null)} />
      )}
    </div>
  );
}
