// pages/Teachers.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddTeacherForm from "../components/forms/AddTeacherForm";
import { teacherAPI, timetableAPI } from "../api/apiService";

// ── helpers ───────────────────────────────────────────────────
const mapStatus = (s) =>
  s === "ACTIVE" ? "Active" : s === "ON_LEAVE" ? "On Leave" : "Inactive";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];
const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri" };

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
  photoBase64: t.photoBase64 ?? "",
});

// ── Teacher Detail Modal ──────────────────────────────────────
function TeacherDetail({ teacher, onClose }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableAPI.getByTeacher(teacher.id)
      .then(slots => setSchedule(slots || []))
      .catch(() => setSchedule([]))
      .finally(() => setLoading(false));
  }, [teacher.id]);

  // Group schedule by day
  const byDay = DAYS.reduce((acc, d) => { acc[d] = []; return acc; }, {});
  schedule.forEach(s => { if (byDay[s.dayOfWeek]) byDay[s.dayOfWeek].push(s); });
  DAYS.forEach(d => byDay[d].sort((a, b) => a.periodNumber - b.periodNumber));

  const initial = (teacher?.name || "").split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#1E1B4B99",
        backdropFilter: "blur(4px)", zIndex: 2000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "32px 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 18, width: "100%", maxWidth: 760,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1E1B4B, #312E81)",
          padding: "24px 28px", display: "flex", alignItems: "center", gap: 18,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: teacher.photoBase64 ? "transparent" : theme.accent + "33",
            border: "2px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900, color: "#fff",
            overflow: "hidden",
          }}>
            {teacher.photoBase64
              ? <img src={teacher.photoBase64} alt={teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initial}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>{teacher.name}</h2>
            <div style={{ color: "#A5B4FC", fontSize: 14, marginTop: 2 }}>{teacher.subject}</div>
          </div>
          <Badge status={teacher.status} />
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "#fff", borderRadius: 8, width: 32, height: 32,
              cursor: "pointer", fontSize: 18, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        <div style={{ padding: 28 }}>
          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {[
              { icon: "🆔", label: "Teacher ID", val: teacher.id },
              { icon: "📧", label: "Email", val: teacher.email || "—" },
              { icon: "📞", label: "Contact", val: teacher.contact || "—" },
              { icon: "🎓", label: "Qualification", val: teacher.qualification || "—" },
              { icon: "⏳", label: "Experience", val: teacher.exp || "—" },
              { icon: "🏫", label: "Assigned Classes", val: teacher.classes || "—" },
            ].map(({ icon, label, val }) => (
              <div key={label} style={{
                background: theme.bg, borderRadius: 10, padding: "10px 14px",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 10, color: theme.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginTop: 2 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Timetable schedule */}
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
            Weekly Schedule
          </div>
          {loading ? (
            <div style={{ color: theme.muted, fontSize: 13 }}>Loading schedule…</div>
          ) : schedule.length === 0 ? (
            <div style={{ color: theme.muted, fontSize: 13, padding: "16px 0" }}>No schedule assigned yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {DAYS.map(day => (
                <div key={day}>
                  <div style={{
                    textAlign: "center", fontSize: 11, fontWeight: 700,
                    color: theme.accent, marginBottom: 6,
                    padding: "4px 0", background: theme.accent + "12",
                    borderRadius: 6,
                  }}>{DAY_SHORT[day]}</div>
                  {byDay[day].length === 0 ? (
                    <div style={{ textAlign: "center", fontSize: 11, color: "#d1d5db", padding: "8px 0" }}>—</div>
                  ) : (
                    byDay[day].map(slot => (
                      <div key={slot.id} style={{
                        background: "#f0f4ff", borderRadius: 8, padding: "6px 8px",
                        marginBottom: 4, fontSize: 11,
                      }}>
                        <div style={{ fontWeight: 700, color: theme.text }}>{slot.subject}</div>
                        <div style={{ color: theme.muted }}>{slot.className} · P{slot.periodNumber}</div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Teacher Card ──────────────────────────────────────────────
function TeacherCard({ teacher, onDelete, onEdit, onView }) {
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
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hovered ? "0 4px 20px #6C63FF1A" : "none",
        cursor: "pointer",
      }}
      onClick={() => onView(teacher)}
    >
      {/* Avatar + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: teacher.photoBase64 ? "transparent" : theme.accent + "22",
          border: teacher.photoBase64 ? "2px solid #E5E7EB" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: theme.accent,
          overflow: "hidden", flexShrink: 0,
        }}>
          {teacher?.photoBase64
            ? <img src={teacher.photoBase64} alt={teacher?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : teacher?.name?.[0]}
        </div>
        <Badge status={teacher.status} />
      </div>

      {/* Name & subject */}
      <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>{teacher.name}</div>
      <div style={{ color: theme.accent, fontWeight: 600, fontSize: 13, margin: "4px 0 10px" }}>
        {teacher.subject}
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          ["📚", "Classes: " + teacher.classes],
          teacher.exp && ["⏳", "Exp: " + teacher.exp],
          teacher.qualification && ["🎓", teacher.qualification],
          ["📞", teacher.contact],
          ["✉️", teacher.email],
        ]
          .filter(Boolean)
          .map(([icon, val]) => (
            <div key={val} style={{ display: "flex", gap: 8, color: theme.muted, fontSize: 12 }}>
              <span>{icon}</span><span>{val}</span>
            </div>
          ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={e => { e.stopPropagation(); onEdit(teacher); }}
          style={{ flex: 1, background: theme.blue + "15", color: theme.blue, border: `1px solid ${theme.blue}33`, borderRadius: 8, padding: "6px 0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >Edit</button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(teacher.id); }}
          style={{ flex: 1, background: theme.red + "12", color: theme.red, border: `1px solid ${theme.red}22`, borderRadius: 8, padding: "6px 0", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >Remove</button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Teachers() {
  const [teachers, setTeachers]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [addOpen, setAddOpen]         = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [viewTarget, setViewTarget]   = useState(null);

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
    fetchTeachers();
  }, []);

  const toPayload = (formData) => ({
    name: formData.name,
    subject: formData.subject,
    email: formData.email,
    contactNumber: formData.contact,
    qualification: formData.qualification || null,
    experience: formData.exp || null,
    assignedClasses: Array.isArray(formData.classes)
      ? formData.classes.join(", ")
      : (formData.classes || null),
    status: formData.status || 'ACTIVE',
    photoBase64: formData.photoBase64 || null,
  });

  const handleAdd = async (formData) => {
    try {
      await teacherAPI.create(toPayload(formData));
      fetchTeachers();
    } catch (err) {
      toast.error("Failed to add teacher: " + err.message);
    }
  };

  const handleEdit = async (formData) => {
    try {
      await teacherAPI.update(editTarget.id, toPayload(formData));
      fetchTeachers();
    } catch (err) {
      toast.error("Failed to update teacher: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this teacher?")) return;
    try {
      await teacherAPI.delete(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
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
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} — click any card to view details
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {teachers.length === 0 ? (
              <p style={{ color: theme.muted }}>No teachers found.</p>
            ) : (
              teachers.map((t) => (
                <TeacherCard
                  key={t.id}
                  teacher={t}
                  onDelete={handleDelete}
                  onEdit={setEditTarget}
                  onView={setViewTarget}
                />
              ))
            )}
          </div>
        </>
      )}

      {addOpen && (
        <AddTeacherForm onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      )}
      {editTarget && (
        <AddTeacherForm onClose={() => setEditTarget(null)} onEdit={handleEdit} initial={editTarget} />
      )}
      {viewTarget && (
        <TeacherDetail teacher={viewTarget} onClose={() => setViewTarget(null)} />
      )}
    </div>
  );
}
