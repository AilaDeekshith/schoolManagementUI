// pages/StudentProfile.jsx
import { useState, useEffect, useCallback } from "react";
import { theme } from "../theme";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { feesAPI, attendanceAPI, examResultsAPI } from "../api/apiService";

// ── helpers ──────────────────────────────────────────────────
const mapFeeStatus = (s) =>
  s === "PAID" ? "Paid" : s === "OVERDUE" ? "Overdue" : "Pending";

const toFeeRow = (f) => ({
  id: f.id,
  year: f.academicYear || "—",
  total: Number(f.totalAmount || 0),
  paid: Number(f.paidAmount || 0),
  due: Number(f.dueAmount || 0),
  status: mapFeeStatus(f.feeStatus),
});

function getAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function SectionTitle({ children, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color || theme.accent }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {children}
      </span>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: `1px solid ${theme.border}` }}>
      <span style={{ fontSize: 16, flexShrink: 0, width: 22 }}>{icon}</span>
      <span style={{ color: theme.muted, fontSize: 13, minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{value || "—"}</span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────
const ATTENDANCE_COLORS = {
  PRESENT: { color: "#10B981", bg: "#ecfdf5" },
  ABSENT:  { color: "#EF4444", bg: "#fef2f2" },
  LATE:    { color: "#F59E0B", bg: "#fffbeb" },
  EXCUSED: { color: "#6C63FF", bg: "#f5f3ff" },
};

export default function StudentProfile({ student, onBack, backLabel }) {
  const [feeHistory, setFeeHistory]         = useState([]);
  const [attendanceRecs, setAttendanceRecs] = useState([]);
  const [examResults, setExamResults]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [attLoading, setAttLoading]         = useState(true);
  const [error, setError]                   = useState(null);

  const fetchFeeHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await feesAPI.getByStudent(student.id);
      setFeeHistory((data || []).map(toFeeRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  const fetchAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      // Fetch last 30 days
      const to   = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const data = await attendanceAPI.getByStudent(student.id, from, to);
      setAttendanceRecs((data || []).sort((a, b) => b.date.localeCompare(a.date)));
    } catch {
      setAttendanceRecs([]);
    } finally {
      setAttLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    fetchFeeHistory();
    fetchAttendance();
    examResultsAPI.getByStudent(student.id)
      .then(data => setExamResults(data || []))
      .catch(() => setExamResults([]));
  }, [fetchFeeHistory, fetchAttendance, student.id]);

  const age = getAge(student.dob);
  const totalDue = feeHistory.reduce((sum, f) => sum + f.due, 0);

  const attCounts = attendanceRecs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const attTotal = attendanceRecs.length;
  const attPct   = attTotal ? Math.round(((attCounts.PRESENT || 0) + (attCounts.LATE || 0)) / attTotal * 100) : null;

  // avatar: photo or first alphabet
  const firstAlpha = (student.name?.[0] ?? "?").toUpperCase();
  const avatarGradients = [
    "linear-gradient(135deg, #6C63FF, #A855F7)",
    "linear-gradient(135deg, #3B82F6, #06B6D4)",
    "linear-gradient(135deg, #10B981, #3B82F6)",
    "linear-gradient(135deg, #F59E0B, #EF4444)",
    "linear-gradient(135deg, #EC4899, #A855F7)",
  ];
  const idNum = parseInt(String(student.id).replace(/\D/g, ""), 10) || 0;
  const gradient = avatarGradients[idNum % avatarGradients.length];
  const rawPhoto = student.photo || student.photoBase64 || null;
  const photoSrc = rawPhoto
    ? (rawPhoto.startsWith("data:") ? rawPhoto : `data:image/jpeg;base64,${rawPhoto}`)
    : null;

  return (
    <div>
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
        {backLabel || "Back to Students"}
      </button>

      {/* ── Hero card ── */}
      <div style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 16, padding: 28, marginBottom: 20,
        display: "flex", gap: 24, alignItems: "flex-start",
        boxShadow: "0 2px 16px #6C63FF0D",
      }}>
        {/* Avatar */}
        <div style={{
          width: 90, height: 90, borderRadius: 20, background: photoSrc ? "transparent" : gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, fontWeight: 900, color: "#fff", flexShrink: 0,
          boxShadow: "0 4px 16px #6C63FF33", overflow: "hidden",
        }}>
          {photoSrc
            ? <img src={photoSrc} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : firstAlpha
          }
        </div>

        {/* Name block */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: theme.text }}>{student.name}</h2>
            <Badge status={student.status} />
            <Badge status={student.fees} />
          </div>
          <div style={{ color: theme.muted, fontSize: 14, marginTop: 4 }}>
            {student.id} &nbsp;·&nbsp; Class {student.class} &nbsp;·&nbsp; Roll #{student.roll}
            {age != null && <> &nbsp;·&nbsp; Age {age} yrs</>}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Blood Group", value: student.bloodGroup || "—", color: theme.red },
              { label: "Gender", value: student.gender || "—", color: theme.blue },
              { label: "Contact", value: student.contact || "—", color: theme.green },
              { label: "Total Due", value: `₹${totalDue.toLocaleString()}`, color: totalDue > 0 ? theme.orange : theme.green },
              attPct != null ? { label: "Attendance (30d)", value: `${attPct}%`, color: attPct >= 75 ? theme.green : attPct >= 50 ? theme.orange : theme.red } : null,
            ].filter(Boolean).map((chip) => (
              <div key={chip.label} style={{
                background: chip.color + "15", border: `1px solid ${chip.color}33`,
                borderRadius: 8, padding: "6px 14px",
              }}>
                <div style={{ fontSize: 10, color: chip.color, fontFamily: "monospace", letterSpacing: 1, fontWeight: 700 }}>{chip.label.toUpperCase()}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: chip.color }}>{chip.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2-column grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* Personal Details */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#6C63FF">Personal Details</SectionTitle>
          <InfoRow icon="🎂" label="Date of Birth" value={student.dob ? `${student.dob}${age != null ? ` (Age ${age})` : ""}` : null} />
          <InfoRow icon="⚧" label="Gender" value={student.gender} />
          <InfoRow icon="🩸" label="Blood Group" value={student.bloodGroup} />
          <InfoRow icon="📧" label="Email" value={student.email} />
          <InfoRow icon="🏠" label="Address" value={student.address} />
        </div>

        {/* Academic Details */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#3B82F6">Academic Details</SectionTitle>
          <InfoRow icon="🏫" label="Class" value={student.class} />
          <InfoRow icon="🔢" label="Roll Number" value={String(student.roll)} />
          <InfoRow icon="✅" label="Enrollment Status" value={<Badge status={student.status} />} />
          <InfoRow icon="💳" label="Fee Status" value={<Badge status={student.fees} />} />
        </div>

        {/* Guardian Details */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#10B981">Guardian Details</SectionTitle>
          <InfoRow icon="👤" label="Guardian Name" value={student.guardian} />
          <InfoRow icon="📞" label="Contact" value={student.contact} />
        </div>

        {/* Fee History */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#F59E0B">Fee History</SectionTitle>
          {loading && <LoadingSpinner message="Loading fee history…" />}
          {error && <ErrorMessage message={error} onRetry={fetchFeeHistory} />}
          {!loading && !error && (
            feeHistory.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Year", "Total", "Paid", "Due", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: theme.muted, fontFamily: "monospace", fontSize: 10, letterSpacing: 1, borderBottom: `1px solid ${theme.border}` }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeHistory.map((f) => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${theme.border}55` }}>
                      <td style={{ padding: "8px 8px", color: theme.muted }}>{f.year}</td>
                      <td style={{ padding: "8px 8px", color: theme.text }}>₹{f.total.toLocaleString()}</td>
                      <td style={{ padding: "8px 8px", color: theme.green, fontWeight: 700 }}>₹{f.paid.toLocaleString()}</td>
                      <td style={{ padding: "8px 8px", color: f.due > 0 ? theme.red : theme.muted, fontWeight: f.due > 0 ? 700 : 400 }}>₹{f.due.toLocaleString()}</td>
                      <td style={{ padding: "8px 8px" }}><Badge status={f.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: theme.muted, fontSize: 13, padding: "12px 0" }}>No fee records found.</div>
            )
          )}
        </div>

        {/* Exam Results — spans both columns */}
        <div style={{ gridColumn: "1 / -1", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#A855F7">Exam Results</SectionTitle>
          {examResults.length === 0 ? (
            <div style={{ color: theme.muted, fontSize: 13 }}>No exam results recorded.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Exam","Date","Subject","Marks","Max","Grade","Remarks"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: theme.muted, fontSize: 10, letterSpacing: 1, fontWeight: 700, borderBottom: `1px solid ${theme.border}`, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {examResults.map(r => {
                  const gcfg = { "A+": "#059669", "A": "#10B981", "B": "#3B82F6", "C": "#F59E0B", "D": "#F97316", "F": "#EF4444" };
                  const gc = gcfg[r.grade] || theme.muted;
                  return (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}55` }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: theme.text }}>{r.exam?.name || "—"}</td>
                      <td style={{ padding: "8px 10px", color: theme.muted }}>{r.exam?.examDate || "—"}</td>
                      <td style={{ padding: "8px 10px", color: theme.accent, fontWeight: 600 }}>{r.subject}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 700, color: theme.text }}>{r.marksObtained ?? "—"}</td>
                      <td style={{ padding: "8px 10px", color: theme.muted }}>{r.maxMarks}</td>
                      <td style={{ padding: "8px 10px" }}>
                        {r.grade ? (
                          <span style={{ background: gc + "18", color: gc, border: `1px solid ${gc}44`, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 800 }}>{r.grade}</span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", color: theme.muted, fontSize: 12 }}>{r.remarks || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Attendance — spans both columns */}
        <div style={{ gridColumn: "1 / -1", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#6C63FF">Attendance — Last 30 Days</SectionTitle>

          {/* Summary pills */}
          {!attLoading && (
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { key: "PRESENT", label: "Present" },
                { key: "ABSENT",  label: "Absent" },
                { key: "LATE",    label: "Late" },
                { key: "EXCUSED", label: "Excused" },
              ].map(({ key, label }) => {
                const { color, bg } = ATTENDANCE_COLORS[key];
                return (
                  <div key={key} style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 8, padding: "6px 14px" }}>
                    <div style={{ fontSize: 10, color, fontFamily: "monospace", letterSpacing: 1, fontWeight: 700 }}>{label.toUpperCase()}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color }}>{attCounts[key] || 0}</div>
                  </div>
                );
              })}
              {attPct != null && (
                <div style={{ background: "#f0f4ff", border: "1px solid #6C63FF33", borderRadius: 8, padding: "6px 14px" }}>
                  <div style={{ fontSize: 10, color: "#6C63FF", fontFamily: "monospace", letterSpacing: 1, fontWeight: 700 }}>ATTENDANCE %</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: attPct >= 75 ? theme.green : attPct >= 50 ? theme.orange : theme.red }}>{attPct}%</div>
                </div>
              )}
              {attTotal === 0 && !attLoading && (
                <div style={{ color: theme.muted, fontSize: 13 }}>No attendance records in the last 30 days.</div>
              )}
            </div>
          )}

          {attLoading && <div style={{ color: theme.muted, fontSize: 13 }}>Loading attendance…</div>}

          {/* Recent records */}
          {!attLoading && attendanceRecs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {attendanceRecs.slice(0, 30).map(r => {
                const { color, bg } = ATTENDANCE_COLORS[r.status] || ATTENDANCE_COLORS.PRESENT;
                return (
                  <div key={r.id} title={`${r.date} — ${r.status}${r.remarks ? " · " + r.remarks : ""}`}
                    style={{
                      background: bg, border: `1px solid ${color}44`,
                      borderRadius: 6, padding: "3px 8px", fontSize: 11,
                      color, fontWeight: 700, cursor: "default",
                    }}>
                    {r.date.slice(5)} {r.status[0]}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
