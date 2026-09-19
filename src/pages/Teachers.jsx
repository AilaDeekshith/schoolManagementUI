// pages/Teachers.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddTeacherForm from "../components/forms/AddTeacherForm";
import { teacherAPI, timetableAPI } from "../api/apiService";

// ── helpers ───────────────────────────────────────────────────
const mapStatus = (s) =>
  s === "ACTIVE" ? "Active" : s === "ON_LEAVE" ? "On Leave" : "Inactive";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };

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

// ── Teacher Profile (full page — mirrors StudentProfile.jsx) ──
function TeacherProfile({ teacher, onBack }) {
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
    <div style={{ paddingTop: 24 }}>
      {/* ── Back button ── */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 20, justifyContent: "center",
          background: "transparent", border: `1px solid ${theme.border}`,
          borderRadius: 8, padding: "8px 16px", cursor: "pointer",
          color: theme.muted, fontSize: 13, fontWeight: 600,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted; }}
      >
        ← Back to Teachers
      </button>

      {/* ── Hero card ── */}
      <div style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 16, padding: 28, marginBottom: 20,
        display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap",
        boxShadow: "0 2px 16px #6C63FF0D",
      }}>
        {/* Avatar */}
        <div style={{
          width: 90, height: 90, borderRadius: 20,
          background: teacher.photoBase64 ? "transparent" : "linear-gradient(135deg, #1E1B4B, #312E81)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 34, fontWeight: 900, color: "#fff", flexShrink: 0,
          boxShadow: "0 4px 16px #6C63FF33", overflow: "hidden",
        }}>
          {teacher.photoBase64
            ? <img src={teacher.photoBase64} alt={teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initial}
        </div>

        {/* Name block */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: theme.text }}>{teacher.name}</h2>
            <Badge status={teacher.status} />
          </div>
          <div style={{ color: theme.muted, fontSize: 14, marginTop: 4 }}>
            Teacher #{teacher.id} &nbsp;·&nbsp; {teacher.subject}
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
            {[
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
        </div>
      </div>

      {/* ── Weekly Schedule ── */}
      <div style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 16, padding: 24,
        boxShadow: "0 2px 16px #6C63FF0D",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: theme.accent }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Weekly Schedule
          </span>
        </div>
        {loading ? (
          <div style={{ color: theme.muted, fontSize: 13 }}>Loading schedule…</div>
        ) : schedule.length === 0 ? (
          <div style={{ color: theme.muted, fontSize: 13, padding: "16px 0" }}>No schedule assigned yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
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
  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── fetch (search runs on the backend) ─────────────────────
  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const name = debouncedSearch.trim();
      const data = name ? await teacherAPI.search(name) : await teacherAPI.getAll();
      setTeachers(data.map(toRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounce typing so we hit the backend once the user pauses.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Any change to the search triggers a backend call (also runs on mount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

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

  if (viewTarget) {
    return <TeacherProfile teacher={viewTarget} onBack={() => setViewTarget(null)} />;
  }

  return (
    <div>
      <PageHeader
        title="Teacher Directory"
        actionLabel="+ Add Teacher"
        onAction={() => setAddOpen(true)}
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by teacher name…"
      />

      {loading && <LoadingSpinner message="Loading teachers…" />}
      {error && <ErrorMessage message={error} onRetry={fetchTeachers} />}

      {!loading && !error && (
        <>
          <div style={{ color: theme.muted, fontSize: 12, marginBottom: 16 }}>
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} — click any card to view details
          </div>
          {teachers.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: theme.muted }}>
              {debouncedSearch ? `No teachers match “${debouncedSearch}”.` : "No teachers found."}
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {teachers.map((t) => (
                <TeacherCard
                  key={t.id}
                  teacher={t}
                  onDelete={handleDelete}
                  onEdit={setEditTarget}
                  onView={setViewTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      {addOpen && (
        <AddTeacherForm onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      )}
      {editTarget && (
        <AddTeacherForm onClose={() => setEditTarget(null)} onEdit={handleEdit} initial={editTarget} />
      )}
    </div>
  );
}
