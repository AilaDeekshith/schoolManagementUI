// pages/Classes.jsx
import { useState, useEffect } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddClassForm from "../components/forms/AddClassForm";
import { classAPI, teacherAPI } from "../api/apiService";

// ── Class Card ────────────────────────────────────────────────
function ClassCard({ cls, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card,
        border: `1px solid ${hovered ? theme.blue : theme.border}`,
        borderRadius: 14,
        padding: 22,
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Decorative bg text */}
      <div
        style={{
          position: "absolute",
          top: -10,
          right: -10,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: theme.blue + "11",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 900,
          color: theme.blue + "44",
          pointerEvents: "none",
        }}
      >
        {cls.name}
      </div>

      <div style={{ fontSize: 26, fontWeight: 900, color: theme.blue }}>
        Class {cls.name}
      </div>
      <div style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>
        Room #{cls.room}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {[
          ["👩‍🏫", "Class Teacher", cls.classTeacher],
          ["👥", "Strength", `${cls.strength} students`],
          ["📦", "Capacity", `${cls.capacity} seats`],
          ["⭐", "Monitor", cls.monitor],
        ].map(([icon, label, val]) => (
          <div key={label} style={{ display: "flex", gap: 8, fontSize: 13 }}>
            <span>{icon}</span>
            <span style={{ color: theme.muted }}>{label}:</span>
            <span style={{ color: theme.text, fontWeight: 600 }}>
              {val || "—"}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onDelete(cls.id)}
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
        Delete Class
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [classData, teacherData] = await Promise.all([
        classAPI.getAll(),
        teacherAPI.getAll(),
      ]);

      setClasses(
        classData.map((c) => ({
          id: c.id,
          name: c.className,
          room: c.roomNumber,
          classTeacher: c.classTeacher.name || "—",
          strength: c.currentStrength || 0,
          capacity: c.maxCapacity || 40,
          monitor: c.classMonitor || "—",
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

  // ── add ────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      const created = await classAPI.create({
        className: `${formData.name}`,
        roomNumber: formData.room,
        maxCapacity: formData.capacity ? Number(formData.capacity) : 40,
        classMonitor: formData.monitor || null,
      });

      // If a teacher was selected, assign them right away
      if (formData.classTeacher) {
        const teacher = teachers.find((t) => t.name === formData.classTeacher);
        if (teacher) {
          await classAPI.assignTeacher(created.id, teacher.id);
        }
      }

      fetchData();
    } catch (err) {
      alert("Failed to create class: " + err.message);
    }
  };

  // ── delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      await classAPI.delete(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Classes"
        actionLabel="+ New Class"
        onAction={() => setAddOpen(true)}
      />

      {loading && <LoadingSpinner message="Loading classes…" />}
      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <>
          <div style={{ color: theme.muted, fontSize: 12, marginBottom: 16 }}>
            {classes.length} class{classes.length !== 1 ? "es" : ""}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {classes.length === 0 ? (
              <p style={{ color: theme.muted }}>No classes found.</p>
            ) : (
              classes.map((c) => (
                <ClassCard key={c.id} cls={c} onDelete={handleDelete} />
              ))
            )}
          </div>
        </>
      )}

      {addOpen && (
        <AddClassForm
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
          teachers={teachers}
        />
      )}
    </div>
  );
}
