// pages/ExamSeating.jsx
import { useState, useEffect, useCallback } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import { examAPI, configAPI, studentAPI, examSeatingAPI } from "../api/apiService";

// ── helpers ───────────────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

const GRADIENTS = [
  "linear-gradient(135deg,#6C63FF,#3B82F6)",
  "linear-gradient(135deg,#10B981,#06B6D4)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#A855F7,#EC4899)",
  "linear-gradient(135deg,#3B82F6,#06B6D4)",
  "linear-gradient(135deg,#10B981,#A855F7)",
];
const gradOf = (id = 0) => GRADIENTS[id % GRADIENTS.length];

const inp = (extra = {}) => ({
  padding: "10px 13px", borderRadius: 9, border: `1.5px solid ${theme.border}`,
  background: theme.bg, color: theme.text, fontSize: 14, outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", ...extra,
});

const btn = (variant = "primary", small = false) => {
  const base = {
    padding: small ? "7px 14px" : "10px 20px", borderRadius: 9, border: "none",
    cursor: "pointer", fontWeight: 700, fontSize: small ? 12.5 : 13.5,
    fontFamily: "'DM Sans', sans-serif",
  };
  const v = {
    primary: { background: theme.accent, color: "#fff" },
    success: { background: theme.green, color: "#fff" },
    danger:  { background: theme.red + "14", color: theme.red, border: `1px solid ${theme.red}22` },
    ghost:   { background: theme.bg, color: theme.muted, border: `1px solid ${theme.border}` },
    blue:    { background: theme.blue + "15", color: theme.blue, border: `1px solid ${theme.blue}33` },
  };
  return { ...base, ...v[variant] };
};

const fmtDate = (d) => {
  if (!d) return "";
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

// ══════════════════════════════════════════════════════════════
// Room (plan) create / edit form
// ══════════════════════════════════════════════════════════════
function RoomForm({ initial, classes, onSave, onCancel }) {
  const [form, setForm] = useState({
    roomName: initial?.roomName || "",
    rows: initial?.rows || "",
    columns: initial?.columns || "",
    seatsPerBench: initial?.seatsPerBench || 1,
    classNames: initial?.classNames || [],
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const totalSeats = (Number(form.rows) || 0) * (Number(form.columns) || 0) * (Number(form.seatsPerBench) || 0);

  const toggleClass = (cn) =>
    setForm((f) => ({
      ...f,
      classNames: f.classNames.includes(cn)
        ? f.classNames.filter((x) => x !== cn)
        : [...f.classNames, cn],
    }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.roomName.trim()) { toast.error("Room name is required"); return; }
    const rows = Number(form.rows), columns = Number(form.columns), seatsPerBench = Number(form.seatsPerBench);
    if (!rows || !columns || !seatsPerBench) { toast.error("Enter rows, columns and seats per bench"); return; }
    onSave({ roomName: form.roomName.trim(), rows, columns, seatsPerBench, classNames: form.classNames });
  };

  const numField = (label, key, ph) => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>{label}</div>
      <input type="number" min={1} max={30} value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} style={inp()} />
    </div>
  );

  return (
    <div style={{ background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 26, maxWidth: 620 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: theme.text, marginBottom: 4 }}>
        {initial?.id ? "Edit Room" : "New Exam Room"}
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, marginBottom: 20 }}>
        Name the room, design its layout and choose which classes sit here.
      </div>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Room / Hall Name</div>
          <input type="text" value={form.roomName} onChange={(e) => set("roomName", e.target.value)} placeholder="e.g. Hall A / Room 101" style={inp()} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
          {numField("Rows", "rows", "e.g. 5")}
          {numField("Columns", "columns", "e.g. 6")}
          {numField("Seats / Bench", "seatsPerBench", "e.g. 1")}
        </div>

        {/* Class + section picker */}
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: .4 }}>
          Grades &amp; Sections in this room
        </div>
        {classes.length === 0 ? (
          <div style={{ fontSize: 13, color: theme.muted, padding: "6px 0 14px" }}>No classes found. Create classes first.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {classes.map((c) => {
              const on = form.classNames.includes(c.className);
              return (
                <button type="button" key={c.id} onClick={() => toggleClass(c.className)}
                  style={{
                    padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    border: `1.5px solid ${on ? theme.accent : theme.border}`,
                    background: on ? theme.accent + "18" : theme.bg,
                    color: on ? theme.accent : theme.muted,
                  }}>
                  {on ? "✓ " : ""}{c.className}
                </button>
              );
            })}
          </div>
        )}

        {/* Live total */}
        <div style={{
          padding: "12px 16px", background: theme.accent + "0E", border: `1px solid ${theme.accent}22`,
          borderRadius: 10, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: theme.muted, fontWeight: 600 }}>Total capacity</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: theme.accent }}>{totalSeats} seats</span>
        </div>
        {initial?.id && (
          <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, marginBottom: 16 }}>
            ⚠ Changing rows / columns / seats-per-bench will clear existing seat assignments.
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" style={btn("primary")}>Save Room</button>
          <button type="button" onClick={onCancel} style={btn("ghost")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Assign-student modal
// ══════════════════════════════════════════════════════════════
function AssignModal({ pool, assignedIds, currentId, seatLabel, onAssign, onClose }) {
  const [selected, setSelected] = useState(currentId ? String(currentId) : "");
  const [q, setQ] = useState("");
  const available = pool
    .filter((s) => !assignedIds.has(s.id) || s.id === currentId)
    .filter((s) => !q || (s?.name || "").toLowerCase().includes(q.toLowerCase()) || String(s?.rollNumber ?? "").includes(q));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: 28, width: 420, maxHeight: "82vh", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: 1, marginBottom: 5 }}>ASSIGN STUDENT</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: theme.text, marginBottom: 16 }}>{seatLabel}</div>

        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or roll…" style={{ ...inp(), marginBottom: 12 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", paddingRight: 4 }}>
          {available.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: theme.muted, fontSize: 13 }}>
              No available students from the selected classes.
            </div>
          ) : available.map((s) => (
            <div key={s.id} onClick={() => setSelected(String(s.id))} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${selected === String(s.id) ? theme.accent : theme.border}`,
              background: selected === String(s.id) ? theme.accent + "12" : theme.bg,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: gradOf(s.id), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {initials(s.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: theme.muted }}>{s.className}{s.rollNumber ? ` · Roll ${s.rollNumber}` : ""}</div>
              </div>
              {selected === String(s.id) && <div style={{ color: theme.accent, fontSize: 16 }}>✓</div>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={() => selected && onAssign(Number(selected))} disabled={!selected}
            style={{ ...btn(selected ? "success" : "ghost"), flex: 1, cursor: selected ? "pointer" : "not-allowed" }}>
            Assign
          </button>
          <button onClick={onClose} style={{ ...btn("ghost"), flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── one seat ──────────────────────────────────────────────────
function Seat({ seat, onAssign, onUnassign }) {
  const a = seat.assignment;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative" }}>
      <div
        onClick={() => (a ? null : onAssign())}
        title={a ? `${a.studentName} (${a.studentClass})` : "Click to assign"}
        style={{
          width: 48, height: 48, borderRadius: 12,
          background: a ? gradOf(a.studentId ?? 0) : "#EEF2FF",
          border: a ? "2px solid transparent" : "2px dashed #C7D2FE",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: a ? "default" : "pointer",
          boxShadow: a ? "0 4px 12px rgba(0,0,0,0.14)" : "none",
        }}>
        {a ? <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{initials(a.studentName)}</span>
           : <span style={{ fontSize: 20, color: "#A5B4FC", lineHeight: 1 }}>+</span>}
      </div>
      {a && (
        <button onClick={onUnassign} title="Remove" style={{
          position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%",
          background: theme.red, color: "#fff", border: "2px solid #fff", cursor: "pointer",
          fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontWeight: 800, lineHeight: 1,
        }}>×</button>
      )}
      <div style={{ fontSize: 10, fontWeight: 700, color: a ? theme.text : theme.muted, maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
        {a ? (a.studentName || "").split(" ")[0] : "Empty"}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Seating arranger — the grid for a single room/plan
// ══════════════════════════════════════════════════════════════
function SeatingArranger({ plan, onBack, onChanged }) {
  const [seats, setSeats] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const seatData = await examSeatingAPI.getSeats(plan.id);
      setSeats(seatData);
      // Build student pool from the plan's classes.
      const lists = await Promise.all(
        (plan.classNames || []).map((cn) => studentAPI.getByClass(cn).catch(() => []))
      );
      const merged = [];
      const seen = new Set();
      lists.flat().forEach((s) => { if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); } });
      merged.sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999));
      setPool(merged);
    } finally {
      setLoading(false);
    }
  }, [plan.id, plan.classNames]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const seatAt = (r, c, si) => seats.find((s) => s.rowNum === r && s.colNum === c && s.seatIndex === si);
  const assignedIds = new Set(seats.map((s) => s.studentId).filter(Boolean));
  const total = plan.rows * plan.columns * plan.seatsPerBench;
  const seated = assignedIds.size;

  const handleAssign = async (studentId) => {
    if (!assignModal) return;
    const { r, c, si } = assignModal;
    try {
      const saved = await examSeatingAPI.assignSeat(plan.id, r, c, si, studentId);
      setSeats((prev) => {
        // Remove any prior seat for this student (a move) and the target seat, then add saved.
        const cleaned = prev.filter(
          (s) => s.studentId !== studentId && !(s.rowNum === saved.rowNum && s.colNum === saved.colNum && s.seatIndex === saved.seatIndex)
        );
        return [...cleaned, saved];
      });
      setAssignModal(null);
      onChanged?.();
    } catch (err) { toast.error("Failed to assign: " + err.message); }
  };

  const handleUnassign = async (r, c, si) => {
    try {
      await examSeatingAPI.unassignSeat(plan.id, r, c, si);
      setSeats((prev) => prev.filter((s) => !(s.rowNum === r && s.colNum === c && s.seatIndex === si)));
      onChanged?.();
    } catch (err) { toast.error("Failed to remove: " + err.message); }
  };

  const handleAuto = async () => {
    try {
      const updated = await examSeatingAPI.autoAssign(plan.id);
      setSeats(updated);
      onChanged?.();
    } catch (err) { toast.error("Auto-assign failed: " + err.message); }
  };

  const handleClear = async () => {
    if (!confirm("Clear all seat assignments in this room?")) return;
    try {
      await examSeatingAPI.clearSeats(plan.id);
      setSeats([]);
      onChanged?.();
    } catch (err) { toast.error("Failed to clear: " + err.message); }
  };

  const modalSeat = assignModal ? seatAt(assignModal.r, assignModal.c, assignModal.si) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <button onClick={onBack} style={btn("ghost", true)}>← Back to rooms</button>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{plan.roomName}</div>
          <div style={{ fontSize: 12.5, color: theme.muted }}>
            {plan.examName} · {plan.rows}×{plan.columns} · {plan.seatsPerBench}/bench · {(plan.classNames || []).join(", ") || "no classes"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: seated === total ? theme.green : theme.accent, background: (seated === total ? theme.green : theme.accent) + "14", padding: "6px 12px", borderRadius: 20 }}>
            {seated}/{total} seated
          </span>
          <button onClick={handleAuto} style={btn("primary", true)}>⚡ Auto-assign</button>
          <button onClick={handleClear} style={btn("danger", true)}>Clear all</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: theme.muted }}>Loading seats…</div>
      ) : (
        <div style={{
          background: "#EEF2FF",
          backgroundImage: "radial-gradient(circle at 1px 1px, #C7D2FE 1px, transparent 0)",
          backgroundSize: "26px 26px",
          borderRadius: 16, border: `1px solid ${theme.border}`, padding: "24px 20px", overflowX: "auto",
        }}>
          {/* Board */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <div style={{
              background: "linear-gradient(180deg,#0F2A1A,#1A3A2A)", color: "#C8E6C9",
              padding: "10px 40px", borderRadius: 8, fontSize: 12, fontWeight: 800,
              letterSpacing: 3, textTransform: "uppercase", borderBottom: "5px solid #5C3310",
            }}>
              📋 Front — Invigilator
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            {Array.from({ length: plan.rows }, (_, r) => (
              <div key={r} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 26, alignSelf: "center", fontSize: 10, fontWeight: 800, color: theme.muted }}>R{r + 1}</div>
                {Array.from({ length: plan.columns }, (_, c) => (
                  <div key={c} style={{
                    background: "#fff", border: `1.5px solid ${theme.border}`, borderRadius: 12,
                    padding: "12px 14px", display: "flex", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}>
                    {Array.from({ length: plan.seatsPerBench }, (_, si) => (
                      <Seat
                        key={si}
                        seat={{ assignment: seatAt(r, c, si) }}
                        onAssign={() => setAssignModal({ r, c, si })}
                        onUnassign={() => handleUnassign(r, c, si)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: theme.muted }}>
            Click an empty seat to assign a student · Click × to remove · Pool: {pool.length} students
          </div>
        </div>
      )}

      {assignModal && (
        <AssignModal
          pool={pool}
          assignedIds={assignedIds}
          currentId={modalSeat?.studentId ?? null}
          seatLabel={`Row ${assignModal.r + 1}, Bench ${assignModal.c + 1}, Seat ${assignModal.si + 1}`}
          onAssign={handleAssign}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Root page
// ══════════════════════════════════════════════════════════════
export default function ExamSeating() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [examId, setExamId] = useState("");
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [editing, setEditing] = useState(null); // null | {} (new) | plan (edit)
  const [arranging, setArranging] = useState(null); // plan being arranged

  useEffect(() => {
    examAPI.getAll().then(setExams).catch(() => {});
    // Class options come from the configured grades & sections.
    configAPI.getGrades()
      .then(grades => setClasses((grades || []).flatMap(g =>
        (g.sections ?? []).map(s => {
          const cn = `${g.name}-${s.letter}`;
          return { id: cn, className: cn };
        }))))
      .catch(() => {});
  }, []);

  const loadPlans = useCallback((id) => {
    if (!id) { setPlans([]); return; }
    setLoadingPlans(true);
    examSeatingAPI.getPlans(id)
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans(examId);
  }, [examId, loadPlans]);

  const selectedExam = exams.find((e) => String(e.id) === String(examId));

  const handleSave = async (data) => {
    try {
      if (editing?.id) {
        await examSeatingAPI.updatePlan(editing.id, { ...data, examId: Number(examId) });
      } else {
        await examSeatingAPI.createPlan({ ...data, examId: Number(examId) });
      }
      setEditing(null);
      loadPlans(examId);
    } catch (err) { toast.error("Failed to save room: " + err.message); }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Delete room "${plan.roomName}" and its seating?`)) return;
    try { await examSeatingAPI.deletePlan(plan.id); loadPlans(examId); }
    catch (err) { toast.error("Failed to delete: " + err.message); }
  };

  // ── Arranging a specific room ──────────────────────────────
  if (arranging) {
    return (
      <div>
        <PageTitle />
        <SeatingArranger
          plan={arranging}
          onBack={() => { setArranging(null); loadPlans(examId); }}
          onChanged={() => loadPlans(examId)}
        />
      </div>
    );
  }

  return (
    <div>
      <PageTitle />

      {/* Exam selector */}
      <div style={{ background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: .4 }}>Select Exam</div>
        <select value={examId} onChange={(e) => { setExamId(e.target.value); setEditing(null); }} style={{ ...inp({ maxWidth: 360 }) }}>
          <option value="">— Choose an exam —</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name} · {e.subject} · {fmtDate(e.examDate)}</option>
          ))}
        </select>
        {selectedExam && (
          <span style={{ fontSize: 12.5, color: theme.muted }}>
            {plans.length} room{plans.length !== 1 ? "s" : ""} configured
          </span>
        )}
      </div>

      {!examId ? (
        <EmptyBox emoji="🪑" title="Select an exam to begin" sub="Choose an exam above, then add rooms and assign students to seats." />
      ) : editing ? (
        <RoomForm
          initial={editing}
          classes={classes}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>Rooms for {selectedExam?.name}</div>
            <button onClick={() => setEditing({})} style={btn("primary", true)}>+ New Room</button>
          </div>

          {loadingPlans ? (
            <div style={{ padding: 30, textAlign: "center", color: theme.muted }}>Loading rooms…</div>
          ) : plans.length === 0 ? (
            <EmptyBox emoji="🏫" title="No rooms yet" sub="Add a room, design its layout and pick the classes that will sit there." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {plans.map((p) => {
                const full = p.seatedCount >= p.totalSeats && p.totalSeats > 0;
                return (
                  <div key={p.id} style={{ background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>{p.roomName}</div>
                        <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{p.rows}×{p.columns} · {p.seatsPerBench}/bench</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: full ? theme.green : theme.accent, background: (full ? theme.green : theme.accent) + "14", padding: "4px 10px", borderRadius: 20 }}>
                        {p.seatedCount}/{p.totalSeats}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(p.classNames || []).length === 0
                        ? <span style={{ fontSize: 11.5, color: theme.muted }}>No classes selected</span>
                        : p.classNames.map((cn) => (
                            <span key={cn} style={{ fontSize: 11, fontWeight: 700, color: theme.blue, background: theme.blue + "15", borderRadius: 6, padding: "2px 8px" }}>{cn}</span>
                          ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      <button onClick={() => setArranging(p)} style={{ ...btn("primary", true), flex: 1 }}>🪑 Arrange Seats</button>
                      <button onClick={() => setEditing(p)} style={btn("blue", true)}>Edit</button>
                      <button onClick={() => handleDelete(p)} style={btn("danger", true)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PageTitle() {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>Exam Seating Arrangement</div>
      <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>
        Select an exam, design each room, choose the classes and assign every student a seat.
      </div>
    </div>
  );
}

function EmptyBox({ emoji, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 0", color: theme.muted, background: "#fff", border: `1px dashed ${theme.border}`, borderRadius: 16 }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
