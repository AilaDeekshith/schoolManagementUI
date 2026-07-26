// pages/ExamMarks.jsx – Enter & view marks for one exam
import { useState, useEffect, useCallback } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import { studentAPI, configAPI, examResultsAPI } from "../api/apiService";

// ── Grade helpers ──────────────────────────────────────────────
const gradeColor = {
  "A+": { color: "#059669", bg: "#ecfdf5" },
  "A":  { color: "#10B981", bg: "#d1fae5" },
  "B":  { color: "#3B82F6", bg: "#eff6ff" },
  "C":  { color: "#F59E0B", bg: "#fffbeb" },
  "D":  { color: "#F97316", bg: "#fff7ed" },
  "F":  { color: "#EF4444", bg: "#fef2f2" },
};

function calcGrade(marks, max) {
  if (marks === "" || marks == null || isNaN(Number(marks)) || !max) return null;
  const pct = (Number(marks) / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function GradeBadge({ grade }) {
  if (!grade) return <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>;
  const { color, bg } = gradeColor[grade] || { color: theme.muted, bg: "#f3f4f6" };
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 800,
    }}>{grade}</span>
  );
}

// ── Stats bar ─────────────────────────────────────────────────
function StatsBar({ entries, maxMarks }) {
  const withMarks = entries.filter(e => e.marks !== "" && e.marks != null && !isNaN(Number(e.marks)));
  if (!withMarks.length) return null;
  const nums    = withMarks.map(e => Number(e.marks));
  const avg     = nums.reduce((a, b) => a + b, 0) / nums.length;
  const highest = Math.max(...nums);
  const lowest  = Math.min(...nums);
  const pass    = withMarks.filter(e => Number(e.marks) / maxMarks >= 0.5).length;
  const passPct = Math.round((pass / withMarks.length) * 100);

  const chips = [
    { label: "Entered", value: withMarks.length, color: theme.accent },
    { label: "Average",  value: avg.toFixed(1),  color: theme.blue },
    { label: "Highest",  value: highest,          color: "#10B981" },
    { label: "Lowest",   value: lowest,           color: "#F59E0B" },
    { label: "Pass %",   value: `${passPct}%`,   color: passPct >= 60 ? "#10B981" : "#EF4444" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
      {chips.map(c => (
        <div key={c.label} style={{
          background: c.color + "12", border: `1px solid ${c.color}33`,
          borderRadius: 10, padding: "6px 14px", minWidth: 80,
        }}>
          <div style={{ fontSize: 10, color: c.color, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{c.label}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Results report table ───────────────────────────────────────
function ResultsReport({ examId, exam }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examResultsAPI.getByExam(examId)
      .then(data => setResults(data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <div style={{ color: theme.muted, padding: 24 }}>Loading results…</div>;
  if (!results.length) return <div style={{ color: theme.muted, padding: 24 }}>No marks entered yet.</div>;

  // Group by student
  const byStudent = {};
  results.forEach(r => {
    const sid = r.student.id;
    if (!byStudent[sid]) byStudent[sid] = { student: r.student, bySubject: {} };
    byStudent[sid].bySubject[r.subject] = r;
  });

  const allSubjects = [...new Set(results.map(r => r.subject))].sort();

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8faff" }}>
            <th style={thSt}>Student</th>
            <th style={thSt}>Roll</th>
            {allSubjects.map(s => (
              <th key={s} style={{ ...thSt, textAlign: "center" }}>{s}</th>
            ))}
            {allSubjects.length > 1 && (
              <>
                <th style={{ ...thSt, textAlign: "center" }}>Total</th>
                <th style={{ ...thSt, textAlign: "center" }}>%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {Object.values(byStudent)
            .sort((a, b) => (a.student.rollNumber || 0) - (b.student.rollNumber || 0))
            .map(({ student, bySubject }) => {
              const marks     = allSubjects.map(s => bySubject[s]?.marksObtained ?? null);
              const total     = marks.filter(m => m != null).reduce((a, b) => a + b, 0);
              const maxTotal  = allSubjects.filter(s => bySubject[s]).length * exam.maxMarks;
              const pct       = maxTotal > 0 ? Math.round(total / maxTotal * 100) : null;
              const overallGrade = pct != null ? calcGrade(pct, 100) : null;

              return (
                <tr key={student.id} style={{ borderBottom: "1px solid #f0f4ff" }}>
                  <td style={{ ...tdSt, fontWeight: 600 }}>{student.name}</td>
                  <td style={{ ...tdSt, color: theme.muted }}>{student.rollNumber || "—"}</td>
                  {allSubjects.map(s => {
                    const r = bySubject[s];
                    const g = r ? calcGrade(r.marksObtained, r.maxMarks) : null;
                    return (
                      <td key={s} style={{ ...tdSt, textAlign: "center" }}>
                        {r ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontWeight: 700 }}>{r.marksObtained}</span>
                            <GradeBadge grade={g} />
                          </div>
                        ) : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                    );
                  })}
                  {allSubjects.length > 1 && (
                    <>
                      <td style={{ ...tdSt, textAlign: "center", fontWeight: 700 }}>{total}</td>
                      <td style={{ ...tdSt, textAlign: "center" }}>
                        {pct != null ? <GradeBadge grade={overallGrade} /> : "—"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main ExamMarks page ───────────────────────────────────────
export default function ExamMarks({ exam, onClose, embedded = false }) {
  const [tab, setTab]             = useState("enter"); // "enter" | "report"
  const [subjects, setSubjects]   = useState([]);
  const [selSubject, setSelSubject] = useState("");
  const [classes, setClasses]     = useState([]);
  const [selClass, setSelClass]   = useState(exam.class !== "All" ? exam.class : "");
  const [students, setStudents]   = useState([]);
  const [entries, setEntries]     = useState({}); // { studentId: { marks, remarks } }
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  // Load subjects (from configAPI or use exam subject)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (exam.subject && exam.subject !== "All Subjects") {
      setSubjects([exam.subject]);
      setSelSubject(exam.subject);
    } else {
      configAPI.getSubjects()
        .then(data => {
          const names = (data || []).map(s => s.name);
          setSubjects(names);
          if (names.length) setSelSubject(names[0]);
        })
        .catch(() => {
          setSubjects(["General"]);
          setSelSubject("General");
        });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [exam.subject]);

  // Load class list if exam is "All"
  useEffect(() => {
    if (exam.class === "All") {
      configAPI.getGrades()
        .then(grades => {
          const opts = grades.flatMap(g =>
            (g.sections ?? []).map(s => `${g.name}-${s.letter}`)
          );
          setClasses(opts);
          if (opts.length && !selClass) setSelClass(opts[0]);
        })
        .catch(() => {});
    }
  }, [exam.class]);

  // Load students when class is selected
  useEffect(() => {
    if (!selClass) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    studentAPI.getByClass(selClass)
      .then(data => setStudents(data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [selClass]);

  // Load existing marks when exam + subject + class changes
  const loadExistingMarks = useCallback(async () => {
    if (!selSubject || !selClass) return;
    try {
      const results = await examResultsAPI.getByExamSubject(exam.id, selSubject);
      const map = {};
      results.forEach(r => {
        map[r.student.id] = { marks: r.marksObtained ?? "", remarks: r.remarks || "" };
      });
      setEntries(map);
    } catch {
      setEntries({});
    }
  }, [exam.id, selSubject, selClass]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    loadExistingMarks();
    setSaved(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadExistingMarks]);

  const setField = (studentId, field, val) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { marks: "", remarks: "" }), [field]: val },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selSubject) { toast.error("Please select a subject"); return; }
    setSaving(true);
    try {
      const payload = {
        examId:  exam.id,
        subject: selSubject,
        entries: students
          .filter(s => entries[s.id]?.marks !== "" && entries[s.id]?.marks != null)
          .map(s => ({
            studentId:     s.id,
            marksObtained: Number(entries[s.id].marks),
            remarks:       entries[s.id]?.remarks || null,
          })),
      };
      await examResultsAPI.saveBulk(payload);
      setSaved(true);
    } catch (err) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const entryList = students.map(s => ({
    ...s,
    marks:   entries[s.id]?.marks   ?? "",
    remarks: entries[s.id]?.remarks ?? "",
    grade:   calcGrade(entries[s.id]?.marks, exam.maxMarks),
  }));

  const inner = (
      <div style={{ maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header card ── */}
        <div style={{
          background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1e3a5f 100%)",
          borderRadius: "16px 16px 0 0",
          padding: "20px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#A5B4FC", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              Exam Marks Entry
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>{exam.name}</h2>
            <div style={{ color: "#C7D2FE", fontSize: 13, marginTop: 4, display: "flex", gap: 16 }}>
              <span>📅 {exam.date}</span>
              <span>🏫 {exam.class}</span>
              <span>📊 Max: {exam.maxMarks} marks</span>
              {exam.subject !== "All Subjects" && <span>📖 {exam.subject}</span>}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 10, width: 36, height: 36, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >×</button>
          )}
        </div>

        {/* ── Tab bar + class selector ── */}
        <div style={{
          background: "#fff", borderBottom: `1px solid ${theme.border}`,
          padding: "0 28px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ display: "flex", borderBottom: "2px solid transparent" }}>
            {[["enter","✏️  Enter Marks"], ["report","📊  Results Report"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "14px 20px", border: "none", background: "none",
                fontSize: 13, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? theme.accent : theme.muted,
                borderBottom: `2px solid ${tab === t ? theme.accent : "transparent"}`,
                cursor: "pointer", marginBottom: -1,
              }}>{label}</button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, padding: "8px 0" }}>
            {exam.class === "All" && (
              <select value={selClass} onChange={e => setSelClass(e.target.value)} style={selSt}>
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ background: "#fff", borderRadius: "0 0 16px 16px", padding: 28 }}>

          {/* Subject tabs */}
          {subjects.length > 1 && tab === "enter" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {subjects.map(s => (
                <button key={s} onClick={() => setSelSubject(s)} style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${selSubject === s ? theme.accent : theme.border}`,
                  background: selSubject === s ? theme.accent : "#f9fafb",
                  color: selSubject === s ? "#fff" : theme.muted,
                  cursor: "pointer", transition: "all 0.15s",
                }}>{s}</button>
              ))}
            </div>
          )}

          {tab === "enter" && (
            <>
              <StatsBar entries={entryList} maxMarks={exam.maxMarks} />

              {!selClass ? (
                <div style={{ textAlign: "center", color: theme.muted, padding: 48 }}>
                  Select a class above to start entering marks.
                </div>
              ) : loading ? (
                <div style={{ textAlign: "center", color: theme.muted, padding: 48 }}>Loading students…</div>
              ) : students.length === 0 ? (
                <div style={{ textAlign: "center", color: theme.muted, padding: 48 }}>
                  No students found for class {selClass}.
                </div>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8faff" }}>
                          <th style={thSt}>#</th>
                          <th style={thSt}>Student Name</th>
                          <th style={thSt}>Roll No</th>
                          <th style={{ ...thSt, textAlign: "center", width: 160 }}>
                            Marks <span style={{ color: theme.muted, fontWeight: 400 }}>/ {exam.maxMarks}</span>
                          </th>
                          <th style={{ ...thSt, textAlign: "center", width: 90 }}>Grade</th>
                          <th style={thSt}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entryList.map((s, idx) => (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f0f4ff" }}>
                            <td style={{ ...tdSt, color: theme.muted, width: 36 }}>{idx + 1}</td>
                            <td style={{ ...tdSt, fontWeight: 600 }}>{s.name}</td>
                            <td style={{ ...tdSt, color: theme.muted }}>{s.rollNumber || "—"}</td>
                            <td style={{ ...tdSt, textAlign: "center" }}>
                              <input
                                type="number"
                                min={0}
                                max={exam.maxMarks}
                                step={0.5}
                                value={s.marks}
                                onChange={e => setField(s.id, "marks", e.target.value)}
                                placeholder="—"
                                style={{
                                  width: 80, padding: "6px 10px", borderRadius: 8,
                                  border: `1.5px solid ${s.marks !== "" && (Number(s.marks) > exam.maxMarks || Number(s.marks) < 0) ? "#EF4444" : "#d1d5db"}`,
                                  fontSize: 14, fontWeight: 700, textAlign: "center",
                                  outline: "none", background: "#f9fafb",
                                }}
                                onBlur={e => {
                                  const v = Number(e.target.value);
                                  if (v > exam.maxMarks) setField(s.id, "marks", exam.maxMarks);
                                  if (v < 0) setField(s.id, "marks", 0);
                                }}
                              />
                            </td>
                            <td style={{ ...tdSt, textAlign: "center" }}>
                              <GradeBadge grade={s.grade} />
                            </td>
                            <td style={tdSt}>
                              <input
                                type="text"
                                value={s.remarks}
                                onChange={e => setField(s.id, "remarks", e.target.value)}
                                placeholder="Optional"
                                style={{
                                  width: "100%", padding: "6px 10px", borderRadius: 8,
                                  border: "1.5px solid #e5e7eb", fontSize: 13,
                                  outline: "none", background: "#f9fafb", boxSizing: "border-box",
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Save bar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
                    {saved && (
                      <span style={{ color: "#10B981", fontWeight: 600, fontSize: 13 }}>
                        ✅ Marks saved for {selSubject}
                      </span>
                    )}
                    <div style={{ color: theme.muted, fontSize: 12 }}>
                      {entryList.filter(e => e.marks !== "").length} / {students.length} filled
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: "10px 28px", borderRadius: 10, border: "none",
                        background: saving ? theme.muted : theme.accent,
                        color: "#fff", fontWeight: 700, fontSize: 14,
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {saving ? "Saving…" : `Save ${selSubject} Marks`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "report" && (
            <ResultsReport examId={exam.id} exam={exam} />
          )}
        </div>
      </div>
  );

  if (embedded) return inner;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#0f0e1acc",
      backdropFilter: "blur(6px)",
      zIndex: 3000,
      overflowY: "auto",
      padding: "20px 16px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {inner}
    </div>
  );
}

const thSt = { padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };
const tdSt = { padding: "10px 14px", fontSize: 14, color: "#374151", verticalAlign: "middle" };
const selSt = { padding: "7px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", background: "#f9fafb" };
