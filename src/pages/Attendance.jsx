import { useState, useEffect } from "react";
import { toast } from "../toast";
import { attendanceAPI, studentAPI, configAPI } from "../api/apiService";
import { theme } from "../theme";
import StickyHeader from "../components/StickyHeader";

const STATUS_OPTIONS = [
  { key: "PRESENT", label: "P",    color: "#10B981", bg: "#ecfdf5" },
  { key: "ABSENT",  label: "A",    color: "#EF4444", bg: "#fef2f2" },
  { key: "LATE",    label: "L",    color: "#F59E0B", bg: "#fffbeb" },
];

const statusStyle = (s, active) => {
  const opt = STATUS_OPTIONS.find(o => o.key === s) || STATUS_OPTIONS[0];
  return {
    padding: "4px 12px", borderRadius: 6, border: "1.5px solid",
    borderColor: active ? opt.color : "#d1d5db",
    background: active ? opt.bg : "#f9fafb",
    color: active ? opt.color : "#9ca3af",
    fontWeight: active ? 700 : 400,
    fontSize: 13, cursor: "pointer", transition: "all 0.15s",
  };
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const [classes, setClasses]     = useState([]);
  const [selClass, setSelClass]   = useState("");
  const [date, setDate]           = useState(todayStr());
  const [students, setStudents]   = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: "PRESENT"|... }
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState("mark"); // "mark" | "report"
  const [reportRecords, setReportRecords] = useState([]);
  const [reportStudent, setReportStudent] = useState(""); // selected student id for report ("" = whole class)
  const [reportMode, setReportMode]       = useState("class"); // "student" | "class"
  const [reportLoaded, setReportLoaded]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFrom, setReportFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [reportTo, setReportTo]   = useState(todayStr());

  // Load class list from grades config
  useEffect(() => {
    configAPI.getGrades().then(grades => {
      const opts = grades.flatMap(g =>
        (g.sections ?? []).map(s => `${g.name}-${s.letter}`)
      );
      setClasses(opts);
      if (opts.length) setSelClass(opts[0]);
    }).catch(() => {});
  }, []);

  // When class or date changes, load students and existing attendance
  useEffect(() => {
    if (!selClass) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      studentAPI.getByClass(selClass).catch(() => []),
      attendanceAPI.getByClassDate(selClass, date).catch(() => []),
    ]).then(([sts, records]) => {
      setStudents(sts);
      // Start blank — only students with saved records show a status, so it's
      // clear which have been marked and which haven't.
      const map = {};
      records.forEach(r => { map[r.student.id] = r.status; });
      setAttendance(map);
      setSaved(false);
    }).finally(() => setLoading(false));
  }, [selClass, date]);

  const setStatus = (studentId, status) => {
    setAttendance(a => ({ ...a, [studentId]: status }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceAPI.save({
        className: selClass,
        date,
        records: students.map(s => ({
          studentId: s.id,
          status:    attendance[s.id] || "PRESENT",
          remarks:   null,
        })),
      });
      setSaved(true);
    } catch (err) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset a loaded report when the student or range changes so stale data
  // isn't shown before the next Load.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setReportLoaded(false);
    setReportRecords([]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reportStudent, reportFrom, reportTo, selClass]);

  const handleLoadReport = async () => {
    if (!selClass) { toast.warning("Please select a class first"); return; }
    if (reportFrom > reportTo) { toast.warning("“From” date must be on or before “To” date"); return; }
    setReportLoading(true);
    try {
      let records;
      const mode = reportStudent ? "student" : "class";
      if (mode === "student") {
        records = await attendanceAPI.getByStudent(reportStudent, reportFrom, reportTo);
      } else {
        records = await attendanceAPI.getClassSummary(selClass, reportFrom, reportTo);
      }
      const sorted = [...(records || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      setReportRecords(sorted);
      setReportMode(mode);
      setReportLoaded(true);
    } catch (err) {
      toast.error("Failed to load report: " + err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const reportStudentObj = students.find(s => String(s.id) === String(reportStudent));

  // Compute summary counts for mark tab
  const counts = Object.values(attendance).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <StickyHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: theme.text }}>
            Student Attendance
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["mark", "report"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: tab === t ? theme.accent : "#e5e7eb",
                color: tab === t ? "#fff" : "#374151",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                {t === "mark" ? "Mark Attendance" : "Reports"}
              </button>
            ))}
          </div>
        </div>
      </StickyHeader>

      {/* Filters row */}
      <div style={{
        background: "#fff", borderRadius: 12, padding: "16px 20px",
        display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20,
        border: `1px solid ${theme.border}`,
      }}>
        <div>
          <label style={labelSt}>Class</label>
          <select value={selClass} onChange={e => setSelClass(e.target.value)} style={selectSt}>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {tab === "mark" && (
          <div>
            <label style={labelSt}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              max={todayStr()} style={selectSt} />
          </div>
        )}
        {tab === "report" && (
          <>
            <div>
              <label style={labelSt}>Student (optional)</label>
              <select value={reportStudent} onChange={e => setReportStudent(e.target.value)} style={{ ...selectSt, minWidth: 200 }}>
                <option value="">— Whole class (summary) —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.rollNumber ? ` (Roll ${s.rollNumber})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelSt}>From</label>
              <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                style={selectSt} />
            </div>
            <div>
              <label style={labelSt}>To</label>
              <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                style={selectSt} />
            </div>
            <button onClick={handleLoadReport} disabled={reportLoading} style={{
              padding: "9px 20px", borderRadius: 8, border: "none",
              background: reportLoading ? theme.muted : theme.accent, color: "#fff", fontWeight: 600,
              fontSize: 13, cursor: reportLoading ? "not-allowed" : "pointer",
            }}>
              {reportLoading ? "Loading…" : "Load Report"}
            </button>
          </>
        )}
      </div>

      {tab === "mark" && (
        <MarkTab
          loading={loading} students={students} attendance={attendance}
          setStatus={setStatus} counts={counts} saved={saved}
          saving={saving} onSave={handleSave} selClass={selClass}
          isToday={date === todayStr()}
        />
      )}

      {tab === "report" && (
        <ReportTab
          records={reportRecords}
          mode={reportMode}
          student={reportStudentObj}
          className={selClass}
          from={reportFrom}
          to={reportTo}
          loaded={reportLoaded}
          loading={reportLoading}
        />
      )}
    </div>
  );
}

function MarkTab({ loading, students, attendance, setStatus, counts, saved, saving, onSave, selClass, isToday }) {
  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: theme.muted }}>Loading students…</div>
  );

  if (!students.length) return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 48, textAlign: "center",
      color: theme.muted, border: `1px solid ${theme.border}`,
    }}>
      No students found for {selClass}
    </div>
  );

  return (
    <>
      {/* Read-only notice for non-today dates */}
      {!isToday && (
        <div style={{
          background: "#fffbeb", border: "1px solid #FDE68A", color: "#92400E",
          borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          👁️ Viewing a past date — attendance is read-only. Only the current day's attendance can be updated.
        </div>
      )}

      {/* Summary badges */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_OPTIONS.map(opt => (
          <div key={opt.key} style={{
            padding: "6px 16px", borderRadius: 8,
            background: opt.bg, color: opt.color,
            fontWeight: 600, fontSize: 13, border: `1px solid ${opt.color}22`,
          }}>
            {opt.label === "P" ? "Present" : opt.label === "A" ? "Absent" : "Late"}
            : {counts[opt.key] || 0}
          </div>
        ))}
        {(() => {
          const marked = STATUS_OPTIONS.reduce((a, o) => a + (counts[o.key] || 0), 0);
          const unmarked = students.length - marked;
          return (
            <div style={{
              padding: "6px 16px", borderRadius: 8,
              background: "#f3f4f6", color: theme.muted,
              fontWeight: 600, fontSize: 13, border: `1px solid ${theme.border}`,
            }}>
              Unmarked: {unmarked}
            </div>
          );
        })()}
        <div style={{ marginLeft: "auto", color: theme.muted, fontSize: 13, alignSelf: "center" }}>
          Total: {students.length}
        </div>
      </div>

      {/* Student list */}
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={thSt}>#</th>
              <th style={thSt}>Student Name</th>
              <th style={thSt}>Roll No</th>
              <th style={{ ...thSt, textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={tdSt}>{idx + 1}</td>
                <td style={{ ...tdSt, fontWeight: 600 }}>{s.name}</td>
                <td style={{ ...tdSt, color: theme.muted }}>{s.rollNumber || "—"}</td>
                <td style={{ ...tdSt, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => isToday && setStatus(s.id, opt.key)}
                        disabled={!isToday}
                        style={{
                          ...statusStyle(opt.key, attendance[s.id] === opt.key),
                          cursor: isToday ? "pointer" : "default",
                          opacity: isToday || attendance[s.id] === opt.key ? 1 : 0.55,
                        }}
                      >
                        {opt.key === "PRESENT" ? "Present"
                          : opt.key === "ABSENT" ? "Absent"
                          : "Late"}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 12 }}>
        {saved && (
          <span style={{ color: theme.green, fontWeight: 600, alignSelf: "center", fontSize: 14 }}>
            Attendance saved!
          </span>
        )}
        <button
          onClick={onSave}
          disabled={saving || !students.length || !isToday}
          title={!isToday ? "You can only update the current day's attendance" : undefined}
          style={{
            padding: "10px 28px", borderRadius: 10, border: "none",
            background: (saving || !isToday) ? theme.muted : theme.accent,
            color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: (saving || !students.length || !isToday) ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save Attendance"}
        </button>
      </div>
    </>
  );
}

const STATUS_META = {
  PRESENT: { label: "Present", color: "#10B981", bg: "#ecfdf5" },
  ABSENT:  { label: "Absent",  color: "#EF4444", bg: "#fef2f2" },
  LATE:    { label: "Late",    color: "#F59E0B", bg: "#fffbeb" },
  EXCUSED: { label: "Excused", color: "#6C63FF", bg: "#f5f3ff" },
};

const weekday = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }); }
  catch { return ""; }
};
const prettyDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

function emptyBox(children) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 48, textAlign: "center",
      color: theme.muted, border: `1px solid ${theme.border}`,
    }}>
      {children}
    </div>
  );
}

const LETTER = { PRESENT: "P", ABSENT: "A", LATE: "L", EXCUSED: "E" };
const dcol = (d) => {
  try { const dt = new Date(d + "T00:00:00"); return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`; }
  catch { return d; }
};

// Whole-class day-wise matrix: roll, name, a status cell per date, then totals.
function ClassReport({ records, className, from, to }) {
  const dates = [...new Set(records.map(r => r.date))].sort();

  const byStudent = {};
  records.forEach(r => {
    const sid = r.student?.id;
    if (sid == null) return;
    if (!byStudent[sid]) byStudent[sid] = { student: r.student, byDate: {}, c: { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 }, total: 0 };
    byStudent[sid].byDate[r.date] = r.status;
    byStudent[sid].c[r.status] = (byStudent[sid].c[r.status] || 0) + 1;
    byStudent[sid].total += 1;
  });
  const rows = Object.values(byStudent)
    .map(x => ({ ...x, pct: x.total ? Math.round(((x.c.PRESENT + x.c.LATE) / x.total) * 100) : 0 }))
    .sort((a, b) => (a.student.rollNumber ?? 9999) - (b.student.rollNumber ?? 9999) || String(a.student.name).localeCompare(String(b.student.name)));

  const handleExport = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Roll", "Student", ...dates, "Total Present", "Total Absent", "Total Late", "Total", "Attendance %"];
    const csvRows = rows.map(x => [
      x.student.rollNumber ?? "", x.student.name,
      ...dates.map(d => x.byDate[d] || ""),
      x.c.PRESENT, x.c.ABSENT, x.c.LATE, x.total, `${x.pct}%`,
    ]);
    const csv = [
      [`Class`, className].map(esc).join(","),
      [`Range`, `${from} to ${to}`].map(esc).join(","),
      "",
      header.map(esc).join(","),
      ...csvRows.map(r => r.map(esc).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${String(className).replace(/\s+/g, "_")}_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const thCenter = { ...thSt, textAlign: "center", whiteSpace: "nowrap" };
  const tdCenter = { ...tdSt, textAlign: "center", whiteSpace: "nowrap" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>Class {className} — Day-wise Attendance</div>
          <div style={{ fontSize: 12.5, color: theme.muted }}>
            {rows.length} student{rows.length !== 1 ? "s" : ""} · {dates.length} day{dates.length !== 1 ? "s" : ""} · {prettyDate(from)} → {prettyDate(to)}
          </div>
        </div>
        <button onClick={handleExport} style={{
          padding: "9px 18px", borderRadius: 8, border: `1px solid ${theme.accent}`,
          background: theme.accent + "12", color: theme.accent, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>⬇ Export CSV</button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${theme.border}`, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={thSt}>Roll</th>
              <th style={{ ...thSt, whiteSpace: "nowrap" }}>Student</th>
              {dates.map(d => (
                <th key={d} style={{ ...thCenter, minWidth: 46 }} title={prettyDate(d)}>{dcol(d)}</th>
              ))}
              <th style={{ ...thCenter, background: "#ecfdf5" }}>T. Present</th>
              <th style={{ ...thCenter, background: "#fef2f2" }}>T. Absent</th>
              <th style={{ ...thCenter, background: "#fffbeb" }}>T. Late</th>
              <th style={thCenter}>Total</th>
              <th style={thCenter}>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, byDate, c, total, pct }) => (
              <tr key={student.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ ...tdSt, color: theme.muted }}>{student.rollNumber || "—"}</td>
                <td style={{ ...tdSt, fontWeight: 600, whiteSpace: "nowrap" }}>{student.name}</td>
                {dates.map(d => {
                  const st = byDate[d];
                  const m = st ? (STATUS_META[st] || { color: theme.muted, bg: "#f3f4f6" }) : null;
                  return (
                    <td key={d} style={{ ...tdCenter, padding: "8px 6px" }}>
                      {st ? (
                        <span title={STATUS_META[st]?.label || st} style={{
                          display: "inline-block", width: 22, height: 22, lineHeight: "22px", borderRadius: 6,
                          fontSize: 12, fontWeight: 800, background: m.bg, color: m.color,
                        }}>{LETTER[st] || "?"}</span>
                      ) : <span style={{ color: "#d1d5db" }}>·</span>}
                    </td>
                  );
                })}
                <td style={{ ...tdCenter, color: "#10B981", fontWeight: 700 }}>{c.PRESENT}</td>
                <td style={{ ...tdCenter, color: "#EF4444", fontWeight: 700 }}>{c.ABSENT}</td>
                <td style={{ ...tdCenter, color: "#F59E0B", fontWeight: 700 }}>{c.LATE}</td>
                <td style={{ ...tdCenter, color: theme.muted }}>{total}</td>
                <td style={tdCenter}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: pct >= 75 ? "#ecfdf5" : pct >= 50 ? "#fffbeb" : "#fef2f2",
                    color:      pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444",
                  }}>{pct}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {["PRESENT", "ABSENT", "LATE"].map(k => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 20, height: 20, lineHeight: "20px", textAlign: "center", borderRadius: 5, fontSize: 11, fontWeight: 800, background: STATUS_META[k].bg, color: STATUS_META[k].color }}>{LETTER[k]}</span>
            <span style={{ fontSize: 12, color: theme.muted }}>{STATUS_META[k].label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#d1d5db", fontWeight: 800 }}>·</span>
          <span style={{ fontSize: 12, color: theme.muted }}>No record</span>
        </div>
      </div>
    </div>
  );
}

function ReportTab({ records, mode, student, className, from, to, loaded, loading }) {
  if (loading) return emptyBox("Loading report…");
  if (!loaded) return emptyBox('Select a class (and optionally a student), set a date range, then click "Load Report".');

  if (!records.length) return emptyBox(
    <>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🗓️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>No attendance data</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>
        No records found for {mode === "student" ? (student?.name || "this student") : `class ${className}`} between {prettyDate(from)} and {prettyDate(to)}.
      </div>
    </>
  );

  if (mode === "class") return <ClassReport records={records} className={className} from={from} to={to} />;

  // ── Single-student day-wise report ────────────────────────
  // Totals
  const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
  records.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
  const total = records.length;
  const pct = total ? Math.round(((c.PRESENT + c.LATE) / total) * 100) : 0;

  const handleExport = () => {
    const header = ["Date", "Day", "Status", "Remarks"];
    const rows = records.map(r => [
      r.date, weekday(r.date), STATUS_META[r.status]?.label || r.status, (r.remarks || "").replace(/\n/g, " "),
    ]);
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const summary = [
      [`Student`, student?.name || ""],
      [`Class`, student?.className || ""],
      [`Range`, `${from} to ${to}`],
      [`Present`, c.PRESENT], [`Absent`, c.ABSENT], [`Late`, c.LATE], [`Excused`, c.EXCUSED],
      [`Total days`, total], [`Attendance %`, `${pct}%`],
    ];
    const csv = [
      ...summary.map(row => row.map(esc).join(",")),
      "",
      header.map(esc).join(","),
      ...rows.map(row => row.map(esc).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${(student?.name || "student").replace(/\s+/g, "_")}_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { label: "Present", value: c.PRESENT, ...STATUS_META.PRESENT },
    { label: "Absent",  value: c.ABSENT,  ...STATUS_META.ABSENT },
    { label: "Late",    value: c.LATE,    ...STATUS_META.LATE },
    { label: "Total Days", value: total, color: theme.text, bg: "#f3f4f6" },
  ];

  return (
    <div>
      {/* Header: student + attendance% + export */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>{student?.name}</div>
          <div style={{ fontSize: 12.5, color: theme.muted }}>
            {student?.className ? `${student.className} · ` : ""}{prettyDate(from)} → {prettyDate(to)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800,
            background: pct >= 75 ? "#ecfdf5" : pct >= 50 ? "#fffbeb" : "#fef2f2",
            color:      pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444",
          }}>{pct}% attendance</span>
          <button onClick={handleExport} style={{
            padding: "9px 18px", borderRadius: 8, border: `1px solid ${theme.accent}`,
            background: theme.accent + "12", color: theme.accent, fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 18 }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${card.color}22` }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: card.color, textTransform: "uppercase", letterSpacing: .4, marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Day-wise table */}
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={thSt}>#</th>
              <th style={thSt}>Date</th>
              <th style={thSt}>Day</th>
              <th style={{ ...thSt, textAlign: "center" }}>Status</th>
              <th style={thSt}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => {
              const m = STATUS_META[r.status] || { label: r.status, color: theme.muted, bg: "#f3f4f6" };
              return (
                <tr key={r.id ?? `${r.date}-${idx}`} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ ...tdSt, color: theme.muted }}>{idx + 1}</td>
                  <td style={{ ...tdSt, fontWeight: 600 }}>{prettyDate(r.date)}</td>
                  <td style={{ ...tdSt, color: theme.muted }}>{weekday(r.date)}</td>
                  <td style={{ ...tdSt, textAlign: "center" }}>
                    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: m.bg, color: m.color }}>
                      {m.label}
                    </span>
                  </td>
                  <td style={{ ...tdSt, color: theme.muted }}>{r.remarks || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelSt  = { display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 };
const selectSt = { padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", background: "#f9fafb" };
const thSt     = { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdSt     = { padding: "12px 16px", fontSize: 14, color: "#374151" };
