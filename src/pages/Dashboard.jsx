// pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { theme } from "../theme";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  studentAPI,
  teacherAPI,
  classAPI,
  admissionAPI,
  examAPI,
  attendanceAPI,
} from "../api/apiService";

function SectionCard({ title, accent, children, fullWidth }) {
  return (
    <div style={{
      background: theme.card, borderRadius: 14,
      border: `1px solid ${theme.border}`, padding: 24,
      boxShadow: "0 2px 12px #6C63FF0A",
      ...(fullWidth ? { gridColumn: "1 / -1" } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent || theme.accent }} />
        <h3 style={{
          margin: 0, fontSize: 12, fontWeight: 700, color: theme.muted,
          fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase",
        }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

const admissionStatusLabel = s =>
  s === "PENDING" ? "Pending" : s === "UNDER_REVIEW" ? "Under Review"
  : s === "APPROVED" ? "Approved" : s === "REJECTED" ? "Rejected" : s;

const examStatusLabel = s =>
  s === "SCHEDULED" ? "Scheduled" : s === "UPCOMING" ? "Upcoming"
  : s === "COMPLETED" ? "Completed" : s === "CANCELLED" ? "Cancelled" : s;

// Returns "MM-DD" for a dob value that may be a string "YYYY-MM-DD" or a
// Jackson-serialized LocalDate array [year, month, day]
const monthDay = dob => {
  if (!dob) return "";
  if (Array.isArray(dob)) {
    // Jackson default: [2005, 7, 4]
    return `${String(dob[1]).padStart(2, "0")}-${String(dob[2]).padStart(2, "0")}`;
  }
  return String(dob).slice(5, 10); // "YYYY-MM-DD" → "MM-DD"
};

export default function Dashboard() {
  const [stats,       setStats]       = useState({ students: 0, teachers: 0, classes: 0, pendingAdmissions: 0 });
  const [admissions,  setAdmissions]  = useState([]);
  const [exams,       setExams]       = useState([]);
  const [birthdays,   setBirthdays]   = useState([]);
  const [attendance,  setAttendance]  = useState(null); // { total, present, absent, percentage, hasData }
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const _now = new Date();
      const todayMMDD = `${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;


      const [studentData, teacherData, classData, admissionData, examData, attendanceData] =
        await Promise.allSettled([
          studentAPI.getAll(),
          teacherAPI.getAll(),
          classAPI.getAll(),
          admissionAPI.getAll(),
          examAPI.getAll(),
          attendanceAPI.getSummaryToday(),
        ]);

      // Stats
      setStats({
        students:          studentData.status  === "fulfilled" ? studentData.value.length  : 0,
        teachers:          teacherData.status  === "fulfilled" ? teacherData.value.length  : 0,
        classes:           classData.status    === "fulfilled" ? classData.value.length    : 0,
        pendingAdmissions: admissionData.status === "fulfilled"
          ? admissionData.value.filter(a => a.status === "PENDING" || a.status === "UNDER_REVIEW").length
          : 0,
      });

      // Today's birthdays
      if (studentData.status === "fulfilled") {
        setBirthdays(
          studentData.value
            .filter(s => monthDay(s.dob) === todayMMDD)
            .map(s => ({
              id:          s.id,
              name:        s.name,
              className:   s.className,
              photoBase64: s.photoBase64,
              dob:         s.dob,
            }))
        );
      }

      // Attendance summary
      if (attendanceData.status === "fulfilled") {
        setAttendance(attendanceData.value);
      }

      // Recent admissions (latest 5)
      if (admissionData.status === "fulfilled") {
        setAdmissions(
          [...admissionData.value]
            .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
            .slice(0, 5)
            .map(a => ({ id: a.id, name: a.applicantName, applyClass: a.applyClass, date: a.appliedDate, status: admissionStatusLabel(a.status) }))
        );
      }

      // Upcoming exams (next 5)
      if (examData.status === "fulfilled") {
        setExams(
          examData.value
            .filter(e => e.status !== "COMPLETED" && e.status !== "CANCELLED")
            .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
            .slice(0, 5)
            .map(e => ({ id: e.id, name: e.name, subject: e.subject, date: e.examDate, status: examStatusLabel(e.status) }))
        );
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Attendance ring colour
  const pct   = attendance?.percentage ?? 0;
  const attColor = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";
  const circumference = 2 * Math.PI * 38; // r=38
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div>
      {/* Welcome row */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: theme.text, marginBottom: 4 }}>Welcome back 👋</h2>
          <p style={{ color: theme.muted, fontSize: 14 }}>{today}</p>
        </div>
        <div style={{
          background: "linear-gradient(135deg,#6C63FF15,#A855F715)",
          border: "1px solid #6C63FF22", borderRadius: 12,
          padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🏫</span>
          <div>
            <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, letterSpacing: 0.5 }}>SYSTEM STATUS</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>● Online</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Students"     value={stats.students.toLocaleString()}         icon="🎓" color="#6C63FF" />
        <StatCard label="Teachers"           value={stats.teachers.toLocaleString()}          icon="👩‍🏫" color="#3B82F6" />
        <StatCard label="Classes"            value={stats.classes.toLocaleString()}           icon="🏫" color="#10B981" />
        <StatCard label="Pending Admissions" value={stats.pendingAdmissions.toLocaleString()} icon="📋" color="#A855F7" />
      </div>

      {/* Attendance + Birthdays row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Attendance percentage */}
        <SectionCard title="Today's Attendance" accent="#10B981">
          {!attendance?.hasData ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13, color: theme.muted, fontWeight: 600 }}>No attendance marked today</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>Mark attendance in the Attendance module</div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {/* Donut ring */}
              <div style={{ flexShrink: 0, position: "relative", width: 96, height: 96 }}>
                <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={48} cy={48} r={38} fill="none" stroke="#E5E7EB" strokeWidth={10} />
                  <circle
                    cx={48} cy={48} r={38} fill="none"
                    stroke={attColor} strokeWidth={10}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: attColor }}>{pct}%</div>
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Present",  value: attendance.present, color: "#10B981", bg: "#D1FAE5" },
                  { label: "Absent",   value: attendance.absent,  color: "#EF4444", bg: "#FEE2E2" },
                  { label: "Total",    value: attendance.total,   color: "#6C63FF", bg: "#EDE9FE" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                      <span style={{ fontSize: 13, color: theme.muted, fontWeight: 500 }}>{r.label}</span>
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 800, color: r.color,
                      background: r.bg, padding: "2px 10px", borderRadius: 20,
                    }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Birthdays today */}
        <SectionCard title={`🎂 Birthdays Today${birthdays.length ? ` (${birthdays.length})` : ""}`} accent="#EC4899">
          {birthdays.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎂</div>
              <div style={{ fontSize: 13, color: theme.muted, fontWeight: 600 }}>No birthdays today</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 220, overflowY: "auto" }}>
              {birthdays.map(b => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0", borderBottom: `1px solid ${theme.border}`,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: b.photoBase64 ? "transparent" : "linear-gradient(135deg,#EC4899,#A855F7)",
                    border: b.photoBase64 ? "2px solid #fbcfe8" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800, color: "#fff",
                    overflow: "hidden",
                  }}>
                    {b.photoBase64
                      ? <img src={b.photoBase64} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : b.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.name}
                    </div>
                    <div style={{ fontSize: 11, color: theme.muted }}>{b.className}</div>
                  </div>
                  <div style={{
                    fontSize: 18, flexShrink: 0,
                    background: "#FDF2F8", borderRadius: "50%",
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>🎉</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

      </div>

      {/* Admissions + Exams row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        <SectionCard title="Recent Admissions" accent="#6C63FF">
          {admissions.length === 0
            ? <p style={{ color: theme.muted, fontSize: 13 }}>No recent admissions.</p>
            : admissions.map(a => (
                <div key={a.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: `1px solid ${theme.border}`,
                }}>
                  <div>
                    <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                    <div style={{ color: theme.muted, fontSize: 12 }}>Class {a.applyClass} · {a.date}</div>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))
          }
        </SectionCard>

        <SectionCard title="Upcoming Exams" accent="#A855F7">
          {exams.length === 0
            ? <p style={{ color: theme.muted, fontSize: 13 }}>No upcoming exams.</p>
            : exams.map(e => (
                <div key={e.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: `1px solid ${theme.border}`,
                }}>
                  <div>
                    <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                    <div style={{ color: theme.muted, fontSize: 12 }}>{e.subject} · {e.date}</div>
                  </div>
                  <Badge status={e.status} />
                </div>
              ))
          }
        </SectionCard>

      </div>
    </div>
  );
}
