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
  feesAPI,
} from "../api/apiService";

// ── Section card wrapper ──────────────────────────────────────
function SectionCard({ title, accent, children }) {
  return (
    <div style={{
      background: theme.card, borderRadius: 14,
      border: `1px solid ${theme.border}`, padding: 24,
      boxShadow: "0 2px 12px #6C63FF0A",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent || theme.accent }} />
        <h3 style={{
          margin: 0, fontSize: 12, fontWeight: 700, color: theme.muted,
          fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ── Status label helpers ──────────────────────────────────────
const admissionStatusLabel = s =>
  s === "PENDING"      ? "Pending"
  : s === "UNDER_REVIEW" ? "Under Review"
  : s === "APPROVED"     ? "Approved"
  : s === "REJECTED"     ? "Rejected"
  : s;

const examStatusLabel = s =>
  s === "SCHEDULED" ? "Scheduled"
  : s === "UPCOMING"  ? "Upcoming"
  : s === "COMPLETED" ? "Completed"
  : s === "CANCELLED" ? "Cancelled"
  : s;

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,       setStats]       = useState({ students: 0, teachers: 0, classes: 0, pendingAdmissions: 0 });
  const [admissions,  setAdmissions]  = useState([]);
  const [exams,       setExams]       = useState([]);
  const [feeSummary,  setFeeSummary]  = useState({ totalCollected: 0, totalOutstanding: 0 });
  const [loading,     setLoading]     = useState(true);


  const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch all dashboard data in parallel
        const [
          studentData,
          teacherData,
          classData,
          admissionData,
          examData,
          feeData,
        ] = await Promise.allSettled([
          studentAPI.getAll(),
          teacherAPI.getAll(),
          classAPI.getAll(),
          admissionAPI.getAll(),
          examAPI.getAll(),
          feesAPI.getSummary(),
        ]);

        // Stats
        setStats({
          students:         studentData.status  === "fulfilled" ? studentData.value.length  : 0,
          teachers:         teacherData.status  === "fulfilled" ? teacherData.value.length  : 0,
          classes:          classData.status    === "fulfilled" ? classData.value.length    : 0,
          pendingAdmissions: admissionData.status === "fulfilled"
            ? admissionData.value.filter(a => a.status === "PENDING" || a.status === "UNDER_REVIEW").length
            : 0,
        });

        // Recent admissions (latest 4)
        if (admissionData.status === "fulfilled") {
          setAdmissions(
            [...admissionData.value]
              .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
              .slice(0, 4)
              .map(a => ({
                id:         a.id,
                name:       a.applicantName,
                applyClass: a.applyClass,
                date:       a.appliedDate,
                status:     admissionStatusLabel(a.status),
              }))
          );
        }

        // Upcoming exams (not completed, latest 4)
        if (examData.status === "fulfilled") {
          setExams(
            examData.value
              .filter(e => e.status !== "COMPLETED" && e.status !== "CANCELLED")
              .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
              .slice(0, 4)
              .map(e => ({
                id:      e.id,
                name:    e.name,
                subject: e.subject,
                date:    e.examDate,
                status:  examStatusLabel(e.status),
              }))
          );
        }

        // Fee summary
        if (feeData.status === "fulfilled") {
          setFeeSummary({
            totalCollected:   Number(feeData.value.totalCollected   || 0),
            totalOutstanding: Number(feeData.value.totalOutstanding || 0),
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: theme.text, marginBottom: 4 }}>
          Welcome back,{" "}
          <span style={{
            background: "linear-gradient(90deg, #6C63FF, #A855F7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Admin
          </span>{" "}
          👋
        </h2>
        <p style={{ color: theme.muted, fontSize: 14 }}>
          Here's what's happening at Sunrise Public School today.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Students"     value={stats.students.toLocaleString()}         icon="🎓" color="#6C63FF" />
        <StatCard label="Teachers"           value={stats.teachers.toLocaleString()}          icon="👩‍🏫" color="#3B82F6" />
        <StatCard label="Classes"            value={stats.classes.toLocaleString()}           icon="🏫" color="#10B981" />
        <StatCard label="Pending Admissions" value={stats.pendingAdmissions.toLocaleString()} icon="📋" color="#A855F7" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Recent Admissions */}
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

        {/* Upcoming Exams */}
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

        {/* Fee Overview — full width */}
        <div style={{
          background: theme.card, borderRadius: 14,
          border: `1px solid ${theme.border}`, padding: 24,
          gridColumn: "1 / -1", boxShadow: "0 2px 12px #6C63FF0A",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: "#10B981" }} />
            <h3 style={{
              margin: 0, fontSize: 12, fontWeight: 700, color: theme.muted,
              fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              Fee Collection Overview
            </h3>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              {
                label: "Total Collected",
                value: `₹${feeSummary.totalCollected.toLocaleString()}`,
                color: "#10B981", bg: "#D1FAE5",
              },
              {
                label: "Outstanding",
                value: `₹${feeSummary.totalOutstanding.toLocaleString()}`,
                color: "#EF4444", bg: "#FEE2E2",
              },
              {
                label: "Total Students",
                value: stats.students,
                color: "#6C63FF", bg: "#EDE9FE",
              },
            ].map(item => (
              <div key={item.label} style={{
                flex: 1, minWidth: 150,
                background: item.bg, borderRadius: 12, padding: "16px 20px",
              }}>
                <div style={{ color: item.color, fontSize: 22, fontWeight: 800 }}>{item.value}</div>
                <div style={{ color: item.color + "BB", fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}