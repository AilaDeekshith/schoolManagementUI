// pages/ExamTimetable.jsx
import { useState, useEffect, useCallback } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import Modal from "../components/Modal";
import StickyHeader from "../components/StickyHeader";
import { examAPI, configAPI, examScheduleAPI, loadAcademicYears } from "../api/apiService";

const inp = (extra = {}) => ({
  padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${theme.border}`,
  background: theme.bg, color: theme.text, fontSize: 13.5, outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", ...extra,
});

const btn = (variant = "primary", small = false) => {
  const base = { padding: small ? "7px 14px" : "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: small ? 12.5 : 13.5, fontFamily: "'DM Sans', sans-serif" };
  const v = {
    primary: { background: theme.accent, color: "#fff" },
    ghost:   { background: theme.bg, color: theme.muted, border: `1px solid ${theme.border}` },
    blue:    { background: theme.blue + "15", color: theme.blue, border: `1px solid ${theme.blue}33` },
    danger:  { background: theme.red + "14", color: theme.red, border: `1px solid ${theme.red}22` },
  };
  return { ...base, ...v[variant] };
};

const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
};
const dateParts = (d) => {
  try {
    const dt = new Date(d + "T00:00:00");
    return {
      weekday: dt.toLocaleDateString("en-IN", { weekday: "short" }),
      day: String(dt.getDate()).padStart(2, "0"),
      month: dt.toLocaleDateString("en-IN", { month: "short" }),
    };
  } catch { return { weekday: "", day: "", month: "" }; }
};
const timeRange = (s, e) => {
  if (!s && !e) return "";
  return `${s ? fmtTime(s) : "—"}${e ? ` – ${fmtTime(e)}` : ""}`;
};
const BLANK = { subject: "", examDate: "", startTime: "", endTime: "", className: "", notes: "" };

// ── Add / edit a paper ────────────────────────────────────────
function PaperForm({ initial, subjects, classes, onSave, onCancel }) {
  const [form, setForm] = useState({ ...BLANK, ...(initial || {}) });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.subject.trim()) { toast.warning("Select a subject"); return; }
    if (!form.examDate) { toast.warning("Pick a date"); return; }
    if (form.startTime && form.endTime && form.startTime >= form.endTime) { toast.warning("End time must be after start time"); return; }
    onSave({
      subject: form.subject.trim(),
      examDate: form.examDate,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      className: form.className || null,
      notes: form.notes || null,
    });
  };

  const lbl = { fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 };

  return (
    <Modal title={initial?.id ? "Edit Paper" : "Add Paper"} onClose={onCancel}>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Subject *</div>
          <input list="et-subjects" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Mathematics" style={inp()} />
          <datalist id="et-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div><div style={lbl}>Date *</div><input type="date" value={form.examDate} onChange={(e) => set("examDate", e.target.value)} style={inp()} /></div>
          <div>
            <div style={lbl}>Class</div>
            <select value={form.className} onChange={(e) => set("className", e.target.value)} style={inp()}>
              <option value="">— Any / All —</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><div style={lbl}>Start Time</div><input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} style={inp()} /></div>
          <div><div style={lbl}>End Time</div><input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} style={inp()} /></div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={lbl}>Notes</div>
          <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" style={inp()} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" style={btn("primary")}>{initial?.id ? "Update Paper" : "Add Paper"}</button>
          <button type="button" onClick={onCancel} style={btn("ghost")}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function ExamTimetable() {
  const [exams, setExams]       = useState([]);
  const [examId, setExamId]     = useState("");
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses]   = useState([]);
  const [years, setYears]       = useState([]);
  const [yearFilter, setYearFilter]   = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [editing, setEditing]   = useState(null); // null | {} (new) | entry

  useEffect(() => {
    configAPI.getSubjects().then((d) => setSubjects((d || []).map((s) => s.name))).catch(() => {});
    loadAcademicYears().then(({ years, current }) => { setYears(years); if (current) setYearFilter(current); }).catch(() => {});
    configAPI.getGrades()
      .then((grades) => setClasses((grades || []).flatMap((g) => (g.sections ?? []).map((s) => `${g.name}-${s.letter}`))))
      .catch(() => {});
  }, []);

  // Exams are fetched from the backend, already filtered by the selected year/class.
  useEffect(() => {
    examAPI.getAll({
      academicYear: yearFilter === "All" ? undefined : yearFilter,
      className: classFilter === "All" ? undefined : classFilter,
    }).then((d) => setExams(d || [])).catch(() => setExams([]));
  }, [yearFilter, classFilter]);

  const loadEntries = useCallback((id) => {
    if (!id) { setEntries([]); return; }
    setLoading(true);
    examScheduleAPI.getByExam(id)
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries(examId);
  }, [examId, loadEntries]);

  const selectedExam = exams.find((e) => String(e.id) === String(examId));
  // Constrain the paper form to the exam's own subjects/classes (fall back to all configured).
  const examSubjects = selectedExam?.subjects?.length ? selectedExam.subjects : subjects;
  const examClasses  = selectedExam?.classes?.length ? selectedExam.classes : classes;

  const handleSave = async (data) => {
    try {
      if (editing?.id) await examScheduleAPI.update(editing.id, data);
      else await examScheduleAPI.create(examId, data);
      setEditing(null);
      loadEntries(examId);
    } catch (err) { toast.error("Failed to save paper: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this paper from the timetable?")) return;
    try { await examScheduleAPI.delete(id); loadEntries(examId); }
    catch (err) { toast.error("Failed to delete: " + err.message); }
  };

  // group entries by class (papers stay in date/time order from the backend)
  const groups = [];
  const idx = {};
  entries.forEach((e) => {
    const key = e.className || "All Classes";
    if (idx[key] == null) { idx[key] = groups.length; groups.push({ className: key, items: [] }); }
    groups[idx[key]].items.push(e);
  });
  groups.sort((a, b) => String(a.className).localeCompare(String(b.className)));

  return (
    <div>
      <StickyHeader>
        <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>Exam Timetable</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>
          Schedule each subject paper (date, time, room) for an exam.
        </div>
      </StickyHeader>

      {/* Filters + exam selector */}
      <div style={{ background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Academic Year</span>
          <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setExamId(""); setEditing(null); }} style={inp({ width: "auto", fontWeight: 700 })}>
            <option value="All">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Class</span>
          <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setExamId(""); setEditing(null); }} style={inp({ width: "auto", fontWeight: 700 })}>
            <option value="All">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Select Exam</span>
          <select value={examId} onChange={(e) => { setExamId(e.target.value); setEditing(null); }} style={inp({ maxWidth: 360 })}>
            <option value="">— Choose an exam —</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}{e.academicYear ? ` · ${e.academicYear}` : ""}{e.classes?.length ? ` · ${e.classes.length} class${e.classes.length === 1 ? "" : "es"}` : ""}</option>)}
          </select>
        </div>
        {selectedExam && (
          <span style={{ fontSize: 12.5, color: theme.muted }}>{entries.length} paper{entries.length !== 1 ? "s" : ""} scheduled</span>
        )}
      </div>

      {!examId ? (
        <EmptyBox emoji="🗓️" title="Select an exam to begin" sub="Choose an exam above, then add its subject papers with dates and times." />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>Timetable for {selectedExam?.name}</div>
            <button onClick={() => setEditing({})} style={btn("primary", true)}>+ Add Paper</button>
          </div>

          {editing && (
            <PaperForm
              initial={editing}
              subjects={examSubjects}
              classes={examClasses}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          )}

          {loading ? (
            <div style={{ padding: 30, textAlign: "center", color: theme.muted }}>Loading timetable…</div>
          ) : entries.length === 0 ? (
            <EmptyBox emoji="📝" title="No papers scheduled" sub="Add a paper to build this exam's timetable." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {groups.map((g) => (
                <div key={g.className} style={{ background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                  {/* Class header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", borderBottom: `1px solid ${theme.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: `0 4px 12px ${theme.accent}55` }}>🏫</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: theme.text }}>{g.className}</div>
                        <div style={{ fontSize: 11.5, color: theme.muted }}>{g.items.length} paper{g.items.length !== 1 ? "s" : ""} scheduled</div>
                      </div>
                    </div>
                  </div>

                  {/* Papers */}
                  <div>
                    {g.items.map((e, i) => {
                      const d = dateParts(e.examDate);
                      const tr = timeRange(e.startTime, e.endTime);
                      return (
                        <div
                          key={e.id}
                          className="et-paper-row"
                          style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderTop: i > 0 ? `1px solid ${theme.border}` : "none", transition: "background .15s" }}
                        >
                          {/* Date block */}
                          <div style={{ minWidth: 58, textAlign: "center", flexShrink: 0 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: theme.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{d.weekday}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: theme.text, lineHeight: 1.05 }}>{d.day}</div>
                            <div style={{ fontSize: 10.5, color: theme.muted, textTransform: "uppercase" }}>{d.month}</div>
                          </div>
                          <div style={{ width: 1, alignSelf: "stretch", background: theme.border }} />

                          {/* Subject + time */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: theme.text }}>{e.subject}</div>
                            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 3, display: "flex", gap: 14, flexWrap: "wrap" }}>
                              {tr && <span>🕐 {tr}</span>}
                              {e.notes && <span>📝 {e.notes}</span>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => setEditing(e)} style={btn("blue", true)}>Edit</button>
                            <button onClick={() => handleDelete(e.id)} style={btn("danger", true)}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <style>{`.et-paper-row:hover { background: #F8FAFF; }`}</style>
            </div>
          )}

          {selectedExam && (
            <div style={{ marginTop: 18, fontSize: 12, color: theme.muted }}>
              Exam: <b>{selectedExam.name}</b>{selectedExam.classes?.length ? ` · Classes: ${selectedExam.classes.join(", ")}` : ""}{selectedExam.subjects?.length ? ` · Subjects: ${selectedExam.subjects.join(", ")}` : ""}
            </div>
          )}
        </>
      )}
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
