import { useState, useEffect } from "react";
import { attendanceAPI, studentAPI, configAPI } from "../api/apiService";
import { theme } from "../theme";

const STATUS_OPTIONS = [
  { key: "PRESENT", label: "P",    color: "#10B981", bg: "#ecfdf5" },
  { key: "ABSENT",  label: "A",    color: "#EF4444", bg: "#fef2f2" },
  { key: "LATE",    label: "L",    color: "#F59E0B", bg: "#fffbeb" },
  { key: "EXCUSED", label: "E",    color: "#6C63FF", bg: "#f5f3ff" },
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
    setLoading(true);
    Promise.all([
      studentAPI.getByClass(selClass).catch(() => []),
      attendanceAPI.getByClassDate(selClass, date).catch(() => []),
    ]).then(([sts, records]) => {
      setStudents(sts);
      const map = {};
      // Default everyone to PRESENT
      sts.forEach(s => { map[s.id] = "PRESENT"; });
      // Override with existing records
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
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadReport = async () => {
    if (!selClass) return;
    try {
      const records = await attendanceAPI.getClassSummary(selClass, reportFrom, reportTo);
      setReportRecords(records);
    } catch (err) {
      alert("Failed to load report: " + err.message);
    }
  };

  // Compute summary counts for mark tab
  const counts = Object.values(attendance).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
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
        <div>
          <label style={labelSt}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            max={todayStr()} style={selectSt} />
        </div>
        {tab === "report" && (
          <>
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
            <button onClick={handleLoadReport} style={{
              padding: "9px 20px", borderRadius: 8, border: "none",
              background: theme.accent, color: "#fff", fontWeight: 600,
              fontSize: 13, cursor: "pointer",
            }}>
              Load Report
            </button>
          </>
        )}
      </div>

      {tab === "mark" && (
        <MarkTab
          loading={loading} students={students} attendance={attendance}
          setStatus={setStatus} counts={counts} saved={saved}
          saving={saving} onSave={handleSave} selClass={selClass} date={date}
        />
      )}

      {tab === "report" && (
        <ReportTab records={reportRecords} students={students} />
      )}
    </div>
  );
}

function MarkTab({ loading, students, attendance, setStatus, counts, saved, saving, onSave, selClass, date }) {
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
      {/* Summary badges */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {STATUS_OPTIONS.map(opt => (
          <div key={opt.key} style={{
            padding: "6px 16px", borderRadius: 8,
            background: opt.bg, color: opt.color,
            fontWeight: 600, fontSize: 13, border: `1px solid ${opt.color}22`,
          }}>
            {opt.label === "P" ? "Present" : opt.label === "A" ? "Absent" : opt.label === "L" ? "Late" : "Excused"}
            : {counts[opt.key] || 0}
          </div>
        ))}
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
                        onClick={() => setStatus(s.id, opt.key)}
                        style={statusStyle(opt.key, attendance[s.id] === opt.key)}
                      >
                        {opt.key === "PRESENT" ? "Present"
                          : opt.key === "ABSENT" ? "Absent"
                          : opt.key === "LATE"   ? "Late"
                          : "Excused"}
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
          disabled={saving || !students.length}
          style={{
            padding: "10px 28px", borderRadius: 10, border: "none",
            background: saving ? theme.muted : theme.accent,
            color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: saving || !students.length ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save Attendance"}
        </button>
      </div>
    </>
  );
}

function ReportTab({ records, students }) {
  if (!records.length) return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 48, textAlign: "center",
      color: theme.muted, border: `1px solid ${theme.border}`,
    }}>
      Select a date range and click "Load Report"
    </div>
  );

  // Group by student
  const byStudent = {};
  records.forEach(r => {
    const sid = r.student.id;
    if (!byStudent[sid]) byStudent[sid] = { student: r.student, records: [] };
    byStudent[sid].records.push(r);
  });

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            <th style={thSt}>Student</th>
            <th style={{ ...thSt, textAlign: "center" }}>Present</th>
            <th style={{ ...thSt, textAlign: "center" }}>Absent</th>
            <th style={{ ...thSt, textAlign: "center" }}>Late</th>
            <th style={{ ...thSt, textAlign: "center" }}>Excused</th>
            <th style={{ ...thSt, textAlign: "center" }}>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(byStudent).map(({ student, records: recs }) => {
            const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
            recs.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
            const total = recs.length;
            const pct = total ? Math.round(((c.PRESENT + c.LATE) / total) * 100) : 0;
            return (
              <tr key={student.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ ...tdSt, fontWeight: 600 }}>{student.name}</td>
                <td style={{ ...tdSt, textAlign: "center", color: "#10B981", fontWeight: 600 }}>{c.PRESENT}</td>
                <td style={{ ...tdSt, textAlign: "center", color: "#EF4444", fontWeight: 600 }}>{c.ABSENT}</td>
                <td style={{ ...tdSt, textAlign: "center", color: "#F59E0B", fontWeight: 600 }}>{c.LATE}</td>
                <td style={{ ...tdSt, textAlign: "center", color: "#6C63FF", fontWeight: 600 }}>{c.EXCUSED}</td>
                <td style={{ ...tdSt, textAlign: "center" }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: pct >= 75 ? "#ecfdf5" : pct >= 50 ? "#fffbeb" : "#fef2f2",
                    color:      pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444",
                  }}>
                    {pct}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const labelSt  = { display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 };
const selectSt = { padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", background: "#f9fafb" };
const thSt     = { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdSt     = { padding: "12px 16px", fontSize: 14, color: "#374151" };
