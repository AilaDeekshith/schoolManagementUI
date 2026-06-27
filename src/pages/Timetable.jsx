// pages/Timetable.jsx
import { useState, useEffect } from "react";
import { theme, subjectColors } from "../theme";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { timetableAPI, classAPI } from "../api/apiService";

const DAYS    = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS = { MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday" };
const PERIODS = 8;

// ── Build a 2D grid from flat timetable rows ──────────────────
// Returns: { MONDAY: { 1: "Mathematics", 2: "Physics", … }, … }
function buildGrid(rows) {
  const grid = {};
  DAYS.forEach(d => {
    grid[d] = {};
    for (let p = 1; p <= PERIODS; p++) grid[d][p] = null;
  });

  rows.forEach(row => {
    const day    = row.dayOfWeek;
    const period = row.periodNumber;
    if (grid[day] && period >= 1 && period <= PERIODS) {
      grid[day][period] = {
        subject: row.subject,
        teacher: row.teacherName || "",
        startTime: row.startTime,
        endTime:   row.endTime,
      };
    }
  });

  return grid;
}

// Default period time labels (shown when no startTime in DB)
const PERIOD_TIMES = [
  "8:00–8:45",
  "8:45–9:30",
  "9:30–10:15",
  "10:15–11:00",
  "11:00–11:30",  // break
  "11:30–12:15",
  "12:15–1:00",
  "1:00–1:45",
];
const BREAK_PERIOD = 5;

// ── Page ──────────────────────────────────────────────────────
export default function Timetable() {
  const [classes,       setClasses]       = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [grid,          setGrid]          = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [classLoading,  setClassLoading]  = useState(true);
  const [error,         setError]         = useState(null);

  // Load class list on mount
  useEffect(() => {
    const loadClasses = async () => {
      setClassLoading(true);
      try {
        const data = await classAPI.getAll();
        const names = data.map(c => c.className).sort();
        setClasses(names);
        if (names.length > 0) setSelectedClass(names[0]);
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setClassLoading(false);
      }
    };
    loadClasses();
  }, []);

  // Load timetable when selected class changes
  useEffect(() => {
    if (!selectedClass) return;
    const loadTimetable = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await timetableAPI.getByClass(selectedClass);
        setGrid(buildGrid(rows));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTimetable();
  }, [selectedClass]);

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 24,
      }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text }}>
          Class Timetable
        </h2>

        {classLoading
          ? <span style={{ color: theme.muted, fontSize: 13 }}>Loading classes…</span>
          : (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{
                background: theme.card, border: `1px solid ${theme.border}`,
                color: theme.text, borderRadius: 8,
                padding: "8px 16px", fontSize: 14,
                cursor: "pointer", outline: "none",
              }}
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )
        }
      </div>

      {loading && <LoadingSpinner message={`Loading timetable for ${selectedClass}…`} />}
      {error   && <ErrorMessage  message={error} onRetry={() => setSelectedClass(s => s)} />}

      {!loading && !error && grid && (
        <div style={{
          background: theme.card, borderRadius: 14,
          border: `1px solid ${theme.border}`, overflow: "auto",
          boxShadow: "0 2px 12px #6C63FF0A",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {/* Period column */}
                <th style={{
                  padding: "14px 18px", color: theme.accent, textAlign: "left",
                  fontFamily: "monospace", fontSize: 11, letterSpacing: 1.5,
                  borderBottom: `1px solid ${theme.border}`,
                  background: theme.surface, minWidth: 100,
                }}>
                  PERIOD
                </th>
                {DAYS.map(d => (
                  <th key={d} style={{
                    padding: "14px 18px", color: theme.muted, textAlign: "left",
                    fontFamily: "monospace", fontSize: 11, letterSpacing: 1.5,
                    borderBottom: `1px solid ${theme.border}`,
                    background: theme.surface, minWidth: 130,
                  }}>
                    {DAY_LABELS[d].toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: PERIODS }, (_, i) => i + 1).map(period => {
                const isBreak = period === BREAK_PERIOD;
                return (
                  <tr
                    key={period}
                    style={{ borderBottom: `1px solid ${theme.border}22` }}
                  >
                    {/* Period label */}
                    <td style={{
                      padding: "10px 18px", color: theme.muted,
                      fontFamily: "monospace", fontSize: 11,
                      background: theme.surface, whiteSpace: "nowrap",
                    }}>
                      <div style={{ fontWeight: 700 }}>P{period}</div>
                      <div style={{ opacity: 0.7, fontSize: 10 }}>{PERIOD_TIMES[period - 1]}</div>
                    </td>

                    {/* Each day cell */}
                    {DAYS.map(day => {
                      const cell = grid[day][period];

                      if (isBreak) {
                        return (
                          <td key={day} style={{ padding: "8px 12px" }}>
                            <div style={{
                              background: theme.border + "44", color: theme.muted,
                              borderRadius: 7, padding: "8px 10px",
                              fontSize: 11, fontWeight: 600,
                              textAlign: "center", fontFamily: "monospace",
                              letterSpacing: 1,
                            }}>
                              — BREAK —
                            </div>
                          </td>
                        );
                      }

                      const subject = cell?.subject || null;
                      const color   = subject ? (subjectColors[subject] || theme.blue) : null;

                      return (
                        <td key={day} style={{ padding: "8px 12px" }}>
                          {subject ? (
                            <div style={{
                              background: color + "18",
                              border: `1px solid ${color}33`,
                              color, borderRadius: 8,
                              padding: "8px 12px", fontSize: 12,
                              fontWeight: 700, textAlign: "center",
                            }}>
                              <div>{subject}</div>
                              {cell.teacher && (
                                <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>
                                  {cell.teacher}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{
                              color: theme.border, borderRadius: 8,
                              padding: "8px 12px", fontSize: 11,
                              textAlign: "center", fontFamily: "monospace",
                            }}>
                              —
                            </div>
                          )}
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

      {/* Empty state */}
      {!loading && !error && grid && selectedClass && (
        <div style={{ marginTop: 12, color: theme.muted, fontSize: 12, textAlign: "right" }}>
          Showing timetable for Class {selectedClass}
        </div>
      )}
    </div>
  );
}