// pages/Timetable.jsx
import { useState, useEffect } from "react";
import { theme, subjectColors } from "../theme";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { timetableAPI, classAPI, teacherAPI } from "../api/apiService";

// ── Constants ─────────────────────────────────────────────────
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_LABELS = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday"
};
const TOTAL_PERIODS = 8;
const BREAK_PERIOD  = 5;
const PERIOD_TIMES  = [
  "8:00–8:45", "8:45–9:30", "9:30–10:15", "10:15–11:00",
  "11:00–11:30", "11:30–12:15", "12:15–1:00", "1:00–1:45",
];
const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "History", "Geography", "Computer", "P.E.", "Art", "Music",
];

// ── Helpers ───────────────────────────────────────────────────
const makeEmptyGrid = () => {
  const g = {};
  DAYS.forEach(d => {
    g[d] = {};
    for (let p = 1; p <= TOTAL_PERIODS; p++) g[d][p] = null;
  });
  return g;
};

const buildGrid = (rows, teachers) => {
  const g = makeEmptyGrid();
  rows.forEach(row => {
    const d = row.dayOfWeek;
    const p = row.periodNumber;
    if (g[d] && p >= 1 && p <= TOTAL_PERIODS) {
      const teacher = teachers.find(t => t.id === row.teacherId);
      g[d][p] = {
        subject:     row.subject,
        teacherId:   row.teacherId   || null,
        teacherName: row.teacherName || teacher?.name || "",
        entryId:     row.id,
      };
    }
  });
  return g;
};

// ── Cell Editor Modal ─────────────────────────────────────────
function CellEditor({ cell, teachers, onSave, onClear, onClose }) {
  const [subject,   setSubject]   = useState(cell.subject   || "");
  const [teacherId, setTeacherId] = useState(cell.teacherId ? String(cell.teacherId) : "");

  const sel = {
    width: "100%", background: theme.bg,
    border: `1px solid ${theme.border}`, borderRadius: 8,
    padding: "10px 12px", color: theme.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", cursor: "pointer",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "#1E1B4B66", backdropFilter: "blur(4px)",
        zIndex: 1000, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.card, borderRadius: 18,
          border: `1px solid ${theme.border}`,
          padding: 28, width: 380,
          boxShadow: "0 24px 64px #00000030",
        }}
      >
        {/* Title */}
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: theme.text }}>
          {DAY_LABELS[cell.day]} · Period {cell.period}
        </h3>
        <p style={{ margin: "0 0 22px", fontSize: 12, color: theme.muted, fontFamily: "monospace" }}>
          {PERIOD_TIMES[cell.period - 1]}
        </p>

        {/* Subject */}
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          Subject <span style={{ color: theme.accent }}>*</span>
        </label>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ ...sel, marginBottom: 16 }}
          onFocus={e => (e.target.style.borderColor = theme.accent)}
          onBlur={e  => (e.target.style.borderColor = theme.border)}
        >
          <option value="">— Select Subject —</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Teacher */}
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          Teacher
        </label>
        <select
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
          style={{ ...sel, marginBottom: 24 }}
          onFocus={e => (e.target.style.borderColor = theme.accent)}
          onBlur={e  => (e.target.style.borderColor = theme.border)}
        >
          <option value="">— Select Teacher —</option>
          {teachers.map(t => (
            <option key={t.id} value={String(t.id)}>
              {t.name} ({t.subject})
            </option>
          ))}
        </select>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: `1px solid ${theme.border}`, color: theme.muted, borderRadius: 8, padding: "9px 0", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          {cell.subject && (
            <button
              onClick={() => { onClear(cell.day, cell.period); onClose(); }}
              style={{ flex: 1, background: theme.red + "18", border: `1px solid ${theme.red}33`, color: theme.red, borderRadius: 8, padding: "9px 0", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
            >
              Clear
            </button>
          )}
          <button
            onClick={() => {
              if (!subject) { alert("Please select a subject"); return; }
              onSave(cell.day, cell.period, subject, teacherId || null);
              onClose();
            }}
            style={{ flex: 2, background: theme.accent, border: "none", color: "#fff", borderRadius: 8, padding: "9px 0", cursor: "pointer", fontSize: 13, fontWeight: 800 }}
          >
            Save Period
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28,
      background: type === "error" ? theme.red : theme.green,
      color: "#fff", borderRadius: 12, padding: "13px 22px",
      fontWeight: 700, fontSize: 14, zIndex: 2000,
      boxShadow: "0 8px 32px #00000033",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      {type === "error" ? "❌" : "✅"} {message}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Timetable() {
  const [classes,       setClasses]       = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [grid,          setGrid]          = useState(makeEmptyGrid());
  const [editingCell,   setEditingCell]   = useState(null);
  const [classLoading,  setClassLoading]  = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState(null);
  const [toast,         setToast]         = useState(null);
  const [dirty,         setDirty]         = useState(false);

  // ── Load classes + teachers on mount ───────────────────────
  useEffect(() => {
    const init = async () => {
      setClassLoading(true);
      try {
        const [classData, teacherData] = await Promise.all([
          classAPI.getAll(),
          teacherAPI.getAll(),
        ]);
        const names = classData.map(c => c.className).sort();
        setClasses(names);
        setTeachers(teacherData.map(t => ({ id: t.id, name: t.name, subject: t.subject })));
        if (names.length > 0) setSelectedClass(names[0]);
      } catch (err) {
        setError("Failed to load data: " + err.message);
      } finally {
        setClassLoading(false);
      }
    };
    init();
  }, []);

  // ── Load timetable when selected class changes ──────────────
  useEffect(() => {
    if (!selectedClass) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      setDirty(false);
      try {
        const rows = await timetableAPI.getByClass(selectedClass);
        setGrid(buildGrid(rows, teachers));
      } catch (err) {
        setError("Failed to load timetable: " + err.message);
        setGrid(makeEmptyGrid());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedClass]);

  // ── Open cell editor ───────────────────────────────────────
  const handleCellClick = (day, period) => {
    if (period === BREAK_PERIOD) return;
    const existing = grid[day][period];
    setEditingCell({
      day, period,
      subject:   existing?.subject   || "",
      teacherId: existing?.teacherId || "",
    });
  };

  // ── Save cell to local grid (unsaved) ──────────────────────
  const handleSaveCell = (day, period, subject, teacherId) => {
    const teacher = teachers.find(t => String(t.id) === String(teacherId));
    setGrid(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [period]: {
          ...prev[day][period],       // preserve entryId if exists
          subject,
          teacherId:   teacherId || null,
          teacherName: teacher?.name || "",
        },
      },
    }));
    setDirty(true);
  };

  // ── Clear one cell ─────────────────────────────────────────
  const handleClearCell = (day, period) => {
    setGrid(prev => ({
      ...prev,
      [day]: { ...prev[day], [period]: null },
    }));
    setDirty(true);
  };

  // ── Clear entire grid ──────────────────────────────────────
  const handleClearAll = () => {
    if (!window.confirm(`Clear entire timetable for Class ${selectedClass}?`)) return;
    setGrid(makeEmptyGrid());
    setDirty(true);
  };

  // ── Submit to backend ──────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const entries = [];
      DAYS.forEach(day => {
        for (let period = 1; period <= TOTAL_PERIODS; period++) {
          if (period === BREAK_PERIOD) continue;
          const cell = grid[day][period];
          if (cell?.subject) entries.push({ day, period, cell });
        }
      });

      if (entries.length === 0) {
        setToast({ message: "Please fill at least one period before saving.", type: "error" });
        setSubmitting(false);
        return;
      }

      // Create or update each filled cell
      await Promise.all(
        entries.map(({ day, period, cell }) => {
          const payload = {
            className:    selectedClass,
            dayOfWeek:    day,
            periodNumber: period,
            subject:      cell.subject,
            teacherId:    cell.teacherId || null,
          };
          return cell.entryId
            ? timetableAPI.update(cell.entryId, payload)
            : timetableAPI.create(payload);
        })
      );

      // Reload so entryIds are populated for future edits
      const rows = await timetableAPI.getByClass(selectedClass);
      setGrid(buildGrid(rows, teachers));
      setDirty(false);
      setToast({ message: `Timetable for Class ${selectedClass} saved!`, type: "success" });
    } catch (err) {
      setToast({ message: "Save failed: " + err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Counts ─────────────────────────────────────────────────
  const filled = DAYS.reduce((acc, d) => {
    for (let p = 1; p <= TOTAL_PERIODS; p++) {
      if (p !== BREAK_PERIOD && grid[d][p]?.subject) acc++;
    }
    return acc;
  }, 0);
  const total = DAYS.length * (TOTAL_PERIODS - 1);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div>

      {/* ── Header bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text }}>
            Class Timetable
          </h2>
          {!loading && selectedClass && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>
              Click any cell to assign a subject &amp; teacher
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

          {/* Class selector */}
          {classLoading
            ? <span style={{ color: theme.muted, fontSize: 13 }}>Loading classes…</span>
            : (
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                style={{
                  background: theme.card, border: `1px solid ${theme.border}`,
                  color: theme.text, borderRadius: 8,
                  padding: "8px 14px", fontSize: 14,
                  cursor: "pointer", outline: "none",
                }}
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )
          }

          {/* Filled counter */}
          {!loading && (
            <div style={{
              background: theme.accent + "18",
              border: `1px solid ${theme.accent}33`,
              borderRadius: 20, padding: "5px 14px",
              fontSize: 12, color: theme.accent, fontWeight: 700,
            }}>
              {filled} / {total} filled
            </div>
          )}

          {/* Clear all */}
          {!loading && dirty && (
            <button onClick={handleClearAll} style={{ background: theme.red + "18", color: theme.red, border: `1px solid ${theme.red}33`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              Clear All
            </button>
          )}

          {/* Save button */}
          {!loading && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !dirty}
              style={{
                background: dirty ? "linear-gradient(135deg, #6C63FF, #A855F7)" : theme.border,
                color:      dirty ? "#fff" : theme.muted,
                border: "none", borderRadius: 8,
                padding: "9px 24px",
                cursor: dirty ? "pointer" : "not-allowed",
                fontSize: 13, fontWeight: 800,
                opacity: submitting ? 0.7 : 1,
                boxShadow: dirty ? "0 4px 14px #6C63FF33" : "none",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Saving…" : "💾  Save Timetable"}
            </button>
          )}
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && <LoadingSpinner message={`Loading timetable for ${selectedClass}…`} />}
      {error   && <ErrorMessage  message={error} onRetry={() => setSelectedClass(s => s)} />}

      {/* ── Grid ── */}
      {!loading && !error && (
        <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}`, overflow: "auto", boxShadow: "0 2px 12px #6C63FF0A" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "14px 18px", color: theme.accent, textAlign: "left", fontFamily: "monospace", fontSize: 11, letterSpacing: 1.5, borderBottom: `1px solid ${theme.border}`, background: theme.surface, minWidth: 110 }}>
                  PERIOD
                </th>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: "14px 18px", color: theme.muted, textAlign: "left", fontFamily: "monospace", fontSize: 11, letterSpacing: 1.5, borderBottom: `1px solid ${theme.border}`, background: theme.surface, minWidth: 155 }}>
                    {DAY_LABELS[d].toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: TOTAL_PERIODS }, (_, i) => i + 1).map(period => {
                const isBreak = period === BREAK_PERIOD;
                return (
                  <tr key={period} style={{ borderBottom: `1px solid ${theme.border}22` }}>

                    {/* Period label */}
                    <td style={{ padding: "10px 18px", background: theme.surface, whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 700, color: theme.text, fontSize: 13 }}>P{period}</div>
                      <div style={{ color: theme.muted, fontSize: 10, marginTop: 2 }}>{PERIOD_TIMES[period - 1]}</div>
                    </td>

                    {DAYS.map(day => {
                      if (isBreak) {
                        return (
                          <td key={day} style={{ padding: "8px 12px" }}>
                            <div style={{ background: theme.border + "44", color: theme.muted, borderRadius: 8, padding: "12px 10px", fontSize: 11, fontWeight: 600, textAlign: "center", fontFamily: "monospace", letterSpacing: 1 }}>
                              — BREAK —
                            </div>
                          </td>
                        );
                      }

                      const cell  = grid[day][period];
                      const color = cell?.subject ? (subjectColors[cell.subject] || theme.blue) : null;

                      return (
                        <td key={day} style={{ padding: "7px 10px" }}>
                          <div
                            onClick={() => handleCellClick(day, period)}
                            title={cell?.subject ? `Click to edit: ${cell.subject}` : "Click to add subject & teacher"}
                            style={{
                              borderRadius: 10,
                              padding: "10px 12px",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              minHeight: 58,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              border: cell?.subject
                                ? `1px solid ${color}44`
                                : `1.5px dashed ${theme.border}`,
                              background: cell?.subject
                                ? color + "15"
                                : "transparent",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor  = theme.accent;
                              e.currentTarget.style.background   = theme.accent + "0D";
                              e.currentTarget.style.transform    = "scale(1.02)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = cell?.subject ? color + "44" : theme.border;
                              e.currentTarget.style.background  = cell?.subject ? color + "15" : "transparent";
                              e.currentTarget.style.transform   = "scale(1)";
                            }}
                          >
                            {cell?.subject ? (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 800, color, lineHeight: 1.3 }}>
                                  {cell.subject}
                                </div>
                                {cell.teacherName && (
                                  <div style={{ fontSize: 10, color: color + "CC", marginTop: 3, fontWeight: 500 }}>
                                    {cell.teacherName}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: 11, color: theme.border, textAlign: "center", fontWeight: 600, letterSpacing: 0.5 }}>
                                + Add
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ── */}
      {!loading && !error && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: theme.muted, fontSize: 12 }}>
            Showing timetable for Class {selectedClass}
          </span>
          {dirty && (
            <span style={{ color: theme.accent, fontSize: 12, fontWeight: 700 }}>
              ● Unsaved changes — click Save Timetable
            </span>
          )}
        </div>
      )}

      {/* ── Cell editor modal ── */}
      {editingCell && (
        <CellEditor
          cell={editingCell}
          teachers={teachers}
          onSave={handleSaveCell}
          onClear={handleClearCell}
          onClose={() => setEditingCell(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}