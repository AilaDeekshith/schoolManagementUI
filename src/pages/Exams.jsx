// pages/Exams.jsx
import { useState, useEffect } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddExamForm from "../components/forms/AddExamForm";
import { examAPI, teacherAPI, configAPI } from "../api/apiService";

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
function ExamCard({ exam, onStatusChange, onEdit, onDelete }) {
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

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        <button
          onClick={() => onEdit(exam)}
          style={{ flex: 1, background: theme.blue + "15", color: theme.blue, border: `1px solid ${theme.blue}33`, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >Edit</button>
        {exam.status !== "Completed" && exam.status !== "Cancelled" && (
          <button
            onClick={() => onStatusChange(exam.id, "COMPLETED")}
            style={{ flex: 1, background: theme.green + "18", color: theme.green, border: `1px solid ${theme.green}33`, borderRadius: 8, padding: "7px 0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
          >✓ Done</button>
        )}
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
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [filter, setFilter] = useState("All");

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = async () => {
    
    setLoading(true);
    setError(null);

    try {
      const [examData, teacherData, gradeData] = await Promise.all([
        examAPI.getAll(),
        teacherAPI.getAll(),
        configAPI.getGrades().catch(() => []),
      ]);
      setClassOptions(gradeData.flatMap(g =>
        (g.sections ?? []).map(s => `${g.name}-${s.letter}`)
      ));

      setExams(
        examData.map((e) => ({
          id: e.id,
          name: e.name,
          subject: e.subject,
          class: e.className || "All",
          date: e.examDate,
          maxMarks: e.maxMarks,
          duration: e.duration,
          examiner: e.examinerName,
          rawStatus: e.status,
          status: statusLabel(e.status),
        })),
      );

      setTeachers(teacherData.map((t) => ({ id: t.id, name: t.name })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

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
      fetchData();
    } catch (err) {
      alert("Failed to schedule exam: " + err.message);
    }
  };

  // ── Edit exam ───────────────────────────────────────────────
  const handleEdit = async (formData) => {
    try {
      await examAPI.update(editTarget.id, toPayload(formData, editTarget.rawStatus ?? 'SCHEDULED'));
      fetchData();
    } catch (err) {
      alert("Failed to update exam: " + err.message);
    }
  };

  // ── Delete exam ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam?")) return;
    try {
      await examAPI.delete(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  // ── Status change ───────────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    try {
      await examAPI.updateStatus(id, status);
      setExams((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: statusLabel(status) } : e,
        ),
      );
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  // ── Filter tabs ─────────────────────────────────────────────
  const FILTERS = ["All", "Scheduled", "Upcoming", "Completed", "Cancelled"];
  const filtered =
    filter === "All" ? exams : exams.filter((e) => e.status === filter);

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
                ({exams.filter((e) => e.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner message="Loading exams…" />}
      {error && <ErrorMessage message={error} onRetry={fetchData} />}

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
    </div>
  );
}
