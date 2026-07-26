// pages/ClassroomLayout.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import { classAPI, classLayoutAPI, studentAPI } from "../api/apiService";

// ── helpers ───────────────────────────────────────────────────
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Avatar gradient pool (cycles by seat index)
const GRADIENTS = [
  "linear-gradient(135deg,#6C63FF,#3B82F6)",
  "linear-gradient(135deg,#10B981,#06B6D4)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#A855F7,#EC4899)",
  "linear-gradient(135deg,#3B82F6,#06B6D4)",
  "linear-gradient(135deg,#10B981,#A855F7)",
];

// ── Layout Config Form ────────────────────────────────────────
function LayoutForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    rows: initial?.rows || "",
    columns: initial?.columns || "",
    studentsPerBench: initial?.studentsPerBench || 2,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const totalBenches = (Number(form.rows) || 0) * (Number(form.columns) || 0);
  const totalSeats   = totalBenches * (Number(form.studentsPerBench) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const rows = Number(form.rows);
    const columns = Number(form.columns);
    const studentsPerBench = Number(form.studentsPerBench);
    if (!rows || !columns || !studentsPerBench) return;
    onSave({ rows, columns, studentsPerBench });
  };

  const inp = {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #C7D2FE",
    background: "#F8FAFF",
    color: "#1E1B4B",
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontWeight: 600,
  };

  const fields = [
    { label: "Rows", key: "rows", icon: "↕", placeholder: "e.g. 5" },
    { label: "Columns", key: "columns", icon: "↔", placeholder: "e.g. 6" },
    { label: "Seats per Bench", key: "studentsPerBench", icon: "👤", placeholder: "e.g. 2" },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 36,
        width: 440,
        boxShadow: "0 24px 64px rgba(99,102,241,0.12)",
        border: "1px solid #E0E7FF",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🏫</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1E1B4B" }}>
          Configure Classroom
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
          Define the physical layout of your classroom
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {fields.map(({ label, key, icon, placeholder }) => (
            <div key={key}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6C63FF",
                  marginBottom: 6,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {icon} {label}
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                required
                style={inp}
              />
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div
          style={{
            marginTop: 22,
            padding: "14px 18px",
            background: "linear-gradient(135deg,#EEF2FF,#F0FDF4)",
            borderRadius: 12,
            border: "1px solid #C7D2FE",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {[
              { label: "Benches", value: totalBenches },
              { label: "Total Seats", value: totalSeats },
              { label: "Per Bench", value: Number(form.studentsPerBench) || 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#6C63FF" }}>{value}</div>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
          {initial?.rows && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#D97706",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              ⚠ Saving will clear all current seat assignments
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            type="submit"
            style={{
              flex: 1,
              background: "linear-gradient(135deg,#6C63FF,#3B82F6)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "13px 0",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 4px 16px rgba(108,99,255,0.35)",
            }}
          >
            Save Layout
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                background: "#F8FAFF",
                color: "#6B7280",
                border: "1.5px solid #E0E7FF",
                borderRadius: 10,
                padding: "13px 0",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────
function AssignModal({ students, assignedStudentIds, currentStudentId, benchLabel, onAssign, onClose }) {
  const [selected, setSelected] = useState(currentStudentId ? String(currentStudentId) : "");
  const available = students.filter((s) => !assignedStudentIds.has(s.id) || s.id === currentStudentId);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          width: 400,
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6C63FF", letterSpacing: 1, marginBottom: 6 }}>
          ASSIGN STUDENT
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1E1B4B", marginBottom: 20 }}>
          {benchLabel}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 280,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {available.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>
              All students in this class are already seated.
            </div>
          ) : (
            available.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelected(String(s.id))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `2px solid ${selected === String(s.id) ? "#6C63FF" : "#E0E7FF"}`,
                  background: selected === String(s.id) ? "#EEF2FF" : "#F8FAFF",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: GRADIENTS[s.id % GRADIENTS.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {initials(s.name)}
                </div>
                <div style={{ fontWeight: 600, color: "#1E1B4B", fontSize: 14 }}>{s.name}</div>
                {selected === String(s.id) && (
                  <div style={{ marginLeft: "auto", color: "#6C63FF", fontSize: 16 }}>✓</div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => selected && onAssign(Number(selected))}
            disabled={!selected}
            style={{
              flex: 1,
              background: selected
                ? "linear-gradient(135deg,#10B981,#06B6D4)"
                : "#E2E8F0",
              color: selected ? "#fff" : "#94A3B8",
              border: "none",
              borderRadius: 10,
              padding: "12px 0",
              cursor: selected ? "pointer" : "not-allowed",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: selected ? "0 4px 14px rgba(16,185,129,0.3)" : "none",
            }}
          >
            Assign Student
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "#F8FAFF",
              color: "#6B7280",
              border: "1.5px solid #E0E7FF",
              borderRadius: 10,
              padding: "12px 0",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bench ─────────────────────────────────────────────────────
function Bench({ row, col, studentsPerBench, seats, onAssign, onUnassign, onStudentClick }) {
  const [hovered, setHovered] = useState(false);

  const benchSeats = Array.from({ length: studentsPerBench }, (_, si) => ({
    si,
    assignment: seats.find(
      (s) => s.rowNum === row && s.colNum === col && s.seatIndex === si
    ),
  }));

  const occupiedCount = benchSeats.filter((b) => b.assignment).length;
  const isFull  = occupiedCount === studentsPerBench;
  const isEmpty = occupiedCount === 0;

  const borderColor = isFull ? "#6EE7B7" : isEmpty ? "#C7D2FE" : "#FCD34D";
  const bgColor     = isFull ? "#ECFDF5" : isEmpty ? "#F8FAFF" : "#FFFBEB";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bgColor,
        border: `2px solid ${hovered ? "#6C63FF" : borderColor}`,
        borderRadius: 14,
        padding: "14px 16px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        minWidth: studentsPerBench > 2 ? 60 * studentsPerBench + 24 : 148,
        boxShadow: hovered
          ? "0 8px 24px rgba(108,99,255,0.15)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      {/* Bench label */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: "#94A3B8",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        {row + 1}-{col + 1}
      </div>

      {/* Desk surface line */}
      <div
        style={{
          width: "calc(100% + 32px)",
          height: 3,
          background: hovered
            ? "linear-gradient(90deg,#6C63FF44,#3B82F644)"
            : "linear-gradient(90deg,#E0E7FF,#C7D2FE,#E0E7FF)",
          borderRadius: 2,
          margin: "-6px -16px 2px",
        }}
      />

      {/* Seats row */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {benchSeats.map(({ si, assignment }) => {
          const gradient = assignment
            ? GRADIENTS[(assignment.studentId ?? si) % GRADIENTS.length]
            : null;

          return (
            <div
              key={si}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
            >
              {/* Avatar */}
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => assignment ? onStudentClick?.(assignment.studentId) : onAssign(row, col, si)}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: gradient ?? "#E2E8F0",
                    border: assignment
                      ? "2px solid transparent"
                      : "2px dashed #CBD5E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: assignment ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                  }}
                  title={assignment ? assignment.studentName : "Click to assign"}
                >
                  {assignment ? (
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
                      {initials(assignment.studentName)}
                    </span>
                  ) : (
                    <span style={{ fontSize: 20, color: "#94A3B8", lineHeight: 1 }}>+</span>
                  )}
                </div>

                {/* Remove button */}
                {assignment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnassign(row, col, si);
                    }}
                    title="Remove"
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#EF4444",
                      color: "#fff",
                      border: "2px solid #fff",
                      cursor: "pointer",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      fontWeight: 800,
                      lineHeight: 1,
                      boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: assignment ? "#1E1B4B" : "#94A3B8",
                  maxWidth: 52,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
                title={assignment?.studentName}
              >
                {assignment ? (assignment.studentName || "").split(" ")[0] : "Empty"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Chip ─────────────────────────────────────────────────
function StatChip({ label, value, accent }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 20,
        padding: "5px 14px",
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: accent ?? "#fff",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
const mapStatus = (s) => s === "ACTIVE" ? "Active" : "Inactive";
const mapFeeStatus = (s) => s === "PAID" ? "Paid" : s === "OVERDUE" ? "Overdue" : "Pending";
const toProfileRow = (s) => ({
  id: s.id, name: s.name, class: s.className, roll: s.rollNumber,
  gender: s.gender, dob: s.dob, guardian: s.guardianName,
  contact: s.contactNumber, email: s.email, address: s.address,
  bloodGroup: s.bloodGroup, status: mapStatus(s.status), fees: mapFeeStatus(s.feeStatus),
  photo: s.photoBase64 || null,
});

export default function ClassroomLayout({ classId, className, onBack, onStudentClick }) {
  const [classData, setClassData]         = useState(null);
  const [seats, setSeats]                 = useState([]);
  const [students, setStudents]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editingLayout, setEditingLayout] = useState(false);
  const [assignModal, setAssignModal]     = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cls, seatData, studentData] = await Promise.all([
        classAPI.getById(classId),
        classLayoutAPI.getSeats(classId),
        studentAPI.getByClass(className),
      ]);
      setClassData(cls);
      setSeats(seatData);
      setStudents(studentData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [classId]);

  const hasLayout = !!(classData?.rows && classData?.columns);
  const totalSeats   = hasLayout ? classData.rows * classData.columns * classData.studentsPerBench : 0;
  const occupiedSeats = seats.length;

  const handleLayoutSave = async ({ rows, columns, studentsPerBench }) => {
    try {
      const updated = await classLayoutAPI.updateLayout(classId, { rows, columns, studentsPerBench });
      setClassData(updated);
      setSeats([]);
      setEditingLayout(false);
    } catch (err) {
      toast.error("Failed to save layout: " + err.message);
    }
  };

  const handleAssign = async (studentId) => {
    if (!assignModal) return;
    const { row, col, seatIndex } = assignModal;
    try {
      const newSeat = await classLayoutAPI.assignSeat(classId, row, col, seatIndex, studentId);
      setSeats((prev) => [
        ...prev.filter(
          (s) => !(s.rowNum === newSeat.rowNum && s.colNum === newSeat.colNum && s.seatIndex === newSeat.seatIndex)
        ),
        newSeat,
      ]);
      setAssignModal(null);
    } catch (err) {
      toast.error("Failed to assign: " + err.message);
    }
  };

  const handleUnassign = async (row, col, seatIndex) => {
    try {
      await classLayoutAPI.unassignSeat(classId, row, col, seatIndex);
      setSeats((prev) =>
        prev.filter((s) => !(s.rowNum === row && s.colNum === col && s.seatIndex === seatIndex))
      );
    } catch (err) {
      toast.error("Failed to remove: " + err.message);
    }
  };

  const assignedStudentIds = new Set(seats.map((s) => s.studentId).filter(Boolean));

  const modalSeat = assignModal
    ? seats.find(
        (s) =>
          s.rowNum === assignModal.row &&
          s.colNum === assignModal.col &&
          s.seatIndex === assignModal.seatIndex
      )
    : null;

  const benchLabel = assignModal
    ? `Bench ${assignModal.row + 1}-${assignModal.col + 1}, Seat ${assignModal.seatIndex + 1}`
    : "";

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ══ HEADER ══════════════════════════════════════════ */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 60%, #1E3A5F 100%)",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
          borderBottom: "1px solid rgba(99,102,241,0.4)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 9,
            padding: "8px 16px",
            cursor: "pointer",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          ← Back
        </button>

        {/* Title */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
            Class {className}
          </div>
          <div style={{ fontSize: 11, color: "#A5B4FC", fontWeight: 600, marginTop: 1 }}>
            Seating Layout
          </div>
        </div>

        {/* Stats */}
        {hasLayout && !loading && (
          <div style={{ display: "flex", gap: 8, marginLeft: 12, flexWrap: "wrap" }}>
            <StatChip label="Rows" value={classData.rows} />
            <StatChip label="Cols" value={classData.columns} />
            <StatChip label="Per Bench" value={classData.studentsPerBench} />
            <StatChip label="Total Seats" value={totalSeats} />
            <StatChip
              label="Seated"
              value={`${occupiedSeats}/${totalSeats}`}
              accent={occupiedSeats === totalSeats ? "#6EE7B7" : "#FCD34D"}
            />
          </div>
        )}

        {/* Edit button */}
        {hasLayout && !editingLayout && !loading && (
          <button
            onClick={() => setEditingLayout(true)}
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 9,
              padding: "8px 18px",
              cursor: "pointer",
              color: "#A5B4FC",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            ⚙ Edit Layout
          </button>
        )}
      </div>

      {/* ══ BODY ════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#EEF2FF",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #C7D2FE 1px, transparent 0)",
          backgroundSize: "28px 28px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#6C63FF",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "3px solid #C7D2FE",
                borderTop: "3px solid #6C63FF",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Loading classroom…
          </div>
        ) : !hasLayout || editingLayout ? (
          /* ── SETUP SCREEN ──────────────────────────────── */
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <LayoutForm
              initial={classData}
              onSave={handleLayoutSave}
              onCancel={hasLayout ? () => setEditingLayout(false) : null}
            />
          </div>
        ) : (
          /* ── CLASSROOM VIEW ────────────────────────────── */
          <>
            {/* Blackboard */}
            <div
              style={{
                background: "linear-gradient(180deg, #0F2A1A 0%, #1A3A2A 60%, #0A2015 100%)",
                padding: "18px 40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                borderBottom: "6px solid #5C3310",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
                flexShrink: 0,
                position: "relative",
              }}
            >
              {/* Chalk shine effect */}
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: "10%",
                  right: "10%",
                  height: 2,
                  background:
                    "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)",
                  borderRadius: 2,
                }}
              />
              <span style={{ fontSize: 22 }}>📋</span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#C8E6C9",
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  opacity: 0.9,
                }}
              >
                Blackboard — Front of Class
              </span>
              <span style={{ fontSize: 22 }}>📋</span>
            </div>

            {/* Teacher's desk */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "14px 40px 6px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg,#78350F,#92400E)",
                  borderRadius: 10,
                  padding: "8px 36px",
                  color: "#FEF3C7",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  boxShadow: "0 4px 14px rgba(120,53,15,0.35)",
                }}
              >
                👩‍🏫  Teacher's Desk
              </div>
            </div>

            {/* Bench grid */}
            <div
              style={{
                flex: 1,
                padding: "20px 40px 40px",
                overflowX: "auto",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {Array.from({ length: classData.rows }, (_, r) => (
                  <div
                    key={r}
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                      marginBottom: r < classData.rows - 1 ? 20 : 0,
                    }}
                  >
                    {/* Row label */}
                    <div
                      style={{
                        width: 32,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingTop: 18,
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#94A3B8",
                        letterSpacing: 0.5,
                      }}
                    >
                      R{r + 1}
                    </div>

                    {/* Benches in this row */}
                    {Array.from({ length: classData.columns }, (_, c) => (
                      <Bench
                        key={c}
                        row={r}
                        col={c}
                        studentsPerBench={classData.studentsPerBench}
                        seats={seats}
                        onAssign={(row, col, si) =>
                          setAssignModal({ row, col, seatIndex: si })
                        }
                        onUnassign={handleUnassign}
                        onStudentClick={async (sid) => {
                          try {
                            const full = await studentAPI.getById(sid);
                            onStudentClick?.(toProfileRow(full));
                          } catch {
                            const s = students.find(st => st.id === sid);
                            if (s) onStudentClick?.(toProfileRow(s));
                          }
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: 20,
                padding: "12px 40px",
                background: "rgba(255,255,255,0.6)",
                borderTop: "1px solid #E0E7FF",
                flexShrink: 0,
                flexWrap: "wrap",
              }}
            >
              {[
                { color: "#6EE7B7", border: "#6EE7B7", label: "Fully occupied" },
                { color: "#FCD34D", border: "#FCD34D", label: "Partially occupied" },
                { color: "#C7D2FE", border: "#C7D2FE", label: "Empty bench" },
              ].map(({ color, border, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: color + "33",
                      border: `2px solid ${border}`,
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
                    {label}
                  </span>
                </div>
              ))}
              <div style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
                Click an empty seat to assign · Click × to remove
              </div>
            </div>
          </>
        )}
      </div>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ══ ASSIGN MODAL ════════════════════════════════════ */}
      {assignModal && (
        <AssignModal
          students={students}
          assignedStudentIds={assignedStudentIds}
          currentStudentId={modalSeat?.studentId ?? null}
          benchLabel={benchLabel}
          onAssign={handleAssign}
          onClose={() => setAssignModal(null)}
        />
      )}

    </div>
  );
}
