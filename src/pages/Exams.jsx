// pages/Exams.jsx
import { useState, useEffect } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddExamForm from "../components/forms/AddExamForm";
import { examAPI, teacherAPI } from "../api/apiService";

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
function ExamCard({ exam, onStatusChange }) {
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

      {/* Mark complete button */}
      {exam.status !== "Completed" && exam.status !== "Cancelled" && (
        <button
          onClick={() => onStatusChange(exam.id, "COMPLETED")}
          style={{
            marginTop: 14,
            width: "100%",
            background: theme.green + "18",
            color: theme.green,
            border: `1px solid ${theme.green}33`,
            borderRadius: 8,
            padding: "7px 0",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ✓ Mark as Completed
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Exams() {
  const [exams, setExams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState("All");

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = async () => {
    
    setLoading(true);
    setError(null);

    try {
      const [examData, teacherData] = await Promise.all([
        examAPI.getAll(),
        teacherAPI.getAll(),
      ]);

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

  // ── Add exam ────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      const examinerId = formData.examiner
        ? teachers.find((t) => t.name === formData.examiner)?.id
        : null;

      await examAPI.create({
        name: formData.name,
        subject: formData.subject,
        className: formData.class,
        examDate: formData.date,
        maxMarks: Number(formData.maxMarks),
        duration: formData.duration,
        instructions: formData.instructions,
        status: 'SCHEDULED',
        examinerId,
      });
      fetchData();
    } catch (err) {
      alert("Failed to schedule exam: " + err.message);
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
              />
            ))}
          </div>
        ))}

      {addOpen && (
        <AddExamForm
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
          teachers={teachers}
        />
      )}
    </div>
  );
}
