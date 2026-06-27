// pages/Teachers.jsx
import { useState, useEffect } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddTeacherForm from "../components/forms/AddTeacherForm";
import { teacherAPI } from "../api/apiService";

// ── helpers ───────────────────────────────────────────────────
const mapStatus = (s) =>
  s === "ACTIVE" ? "Active" : s === "ON_LEAVE" ? "On Leave" : "Inactive";

const toRow = (t) => ({
  id: t.id,
  name: t.name,
  subject: t.subject,
  email: t.email,
  contact: t.contactNumber,
  classes: t.assignedClasses || "—",
  exp: t.experience || "",
  qualification: t.qualification || "",
  status: mapStatus(t.status),
});

// ── Teacher Card ──────────────────────────────────────────────
function TeacherCard({ teacher, onDelete }) {
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
        position: "relative",
      }}
    >
      {/* Avatar + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: theme.accent + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
            color: theme.accent,
          }}
        >
          {teacher.name[0]}
        </div>
        <Badge status={teacher.status} />
      </div>

      {/* Name & subject */}
      <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>
        {teacher.name}
      </div>
      <div
        style={{
          color: theme.accent,
          fontWeight: 600,
          fontSize: 13,
          margin: "4px 0 10px",
        }}
      >
        {teacher.subject}
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          ["🆔", String(teacher.id)],
          ["📚", "Classes: " + teacher.classes],
          teacher.exp && ["⏳", "Exp: " + teacher.exp],
          teacher.qualification && ["🎓", teacher.qualification],
          ["📞", teacher.contact],
          ["✉️", teacher.email],
        ]
          .filter(Boolean)
          .map(([icon, val]) => (
            <div
              key={val}
              style={{
                display: "flex",
                gap: 8,
                color: theme.muted,
                fontSize: 12,
              }}
            >
              <span>{icon}</span>
              <span>{val}</span>
            </div>
          ))}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(teacher.id)}
        style={{
          marginTop: 14,
          width: "100%",
          background: theme.red + "12",
          color: theme.red,
          border: `1px solid ${theme.red}22`,
          borderRadius: 8,
          padding: "6px 0",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Remove Teacher
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherAPI.getAll();
      setTeachers(data.map(toRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeachers();
  }, []);

  const handleAdd = async (formData) => {
    try {
      await teacherAPI.create({
        name: formData.name,
        subject: formData.subject,
        email: formData.email,
        contactNumber: formData.contact,
        qualification: formData.qualification || null,
        experience: formData.exp || null,
        assignedClasses: formData.classes || null,
        status: formData.status || 'ACTIVE'
      });
      fetchTeachers();
    } catch (err) {
      alert("Failed to add teacher: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this teacher?")) return;
    try {
      await teacherAPI.delete(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Teacher Directory"
        actionLabel="+ Add Teacher"
        onAction={() => setAddOpen(true)}
      />

      {loading && <LoadingSpinner message="Loading teachers…" />}
      {error && <ErrorMessage message={error} onRetry={fetchTeachers} />}

      {!loading && !error && (
        <>
          <div style={{ color: theme.muted, fontSize: 12, marginBottom: 16 }}>
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {teachers.length === 0 ? (
              <p style={{ color: theme.muted }}>No teachers found.</p>
            ) : (
              teachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} onDelete={handleDelete} />
              ))
            )}
          </div>
        </>
      )}

      {addOpen && (
        <AddTeacherForm onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
