// pages/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import StickyHeader from "../components/StickyHeader";
import {
  studentAPI, teacherAPI, classAPI, admissionAPI,
  examAPI, attendanceAPI, noticesAPI,
} from "../api/apiService";

// ── Helpers ─────────────────────────────────────────────────────
const monthDay = dob => {
  if (!dob) return "";
  if (Array.isArray(dob))
    return `${String(dob[1]).padStart(2, "0")}-${String(dob[2]).padStart(2, "0")}`;
  return String(dob).slice(5, 10);
};

const admissionStatusLabel = s =>
  s === "PENDING" ? "Pending" : s === "UNDER_REVIEW" ? "Under Review"
  : s === "APPROVED" ? "Approved" : s === "REJECTED" ? "Rejected" : s;

const examStatusLabel = s =>
  s === "SCHEDULED" ? "Scheduled" : s === "UPCOMING" ? "Upcoming"
  : s === "COMPLETED" ? "Completed" : s === "CANCELLED" ? "Cancelled" : s;

// Deterministic avatar gradient from a name string
const AVATAR_GRADS = [
  "linear-gradient(135deg,#6C63FF,#A855F7)",
  "linear-gradient(135deg,#3B82F6,#06B6D4)",
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#EC4899,#A855F7)",
];
const avatarGrad = name => AVATAR_GRADS[(name?.charCodeAt(0) ?? 0) % AVATAR_GRADS.length];

// Admission status → visual tokens
const ADM_STATUS = {
  Pending:        { dot: "#F59E0B", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", bar: "#F59E0B" },
  "Under Review": { dot: "#3B82F6", bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE", bar: "#3B82F6" },
  Approved:       { dot: "#10B981", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", bar: "#10B981" },
  Rejected:       { dot: "#EF4444", bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", bar: "#EF4444" },
};

// Exam status → pill tokens
const EXAM_STATUS = {
  Scheduled: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  Upcoming:  { bg: "#EDE9FE", text: "#5B21B6", dot: "#A855F7" },
  Completed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  Cancelled: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

// Days-away label for an ISO date string
const daysAway = dateStr => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr + "T00:00:00") - new Date()) / 86_400_000);
  if (diff < 0)  return null;
  if (diff === 0) return { label: "Today",    color: "#EF4444" };
  if (diff === 1) return { label: "Tomorrow", color: "#F59E0B" };
  if (diff <= 7)  return { label: `${diff}d`,  color: "#6C63FF" };
  return            { label: `${diff}d`,  color: theme.muted };
};

// ── Shared card shell ────────────────────────────────────────────
// A single, uniform brand-violet header is used across every panel.
function PanelCard({ icon, title, subtitle, corner, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20,
      border: `1px solid ${theme.border}`, overflow: "hidden",
      boxShadow: "0 4px 24px rgba(108,99,255,0.08)",
      display: "flex", flexDirection: "column",
    }}>
      {/* uniform header strip */}
      <div style={{
        background: theme.accent + "0D", borderBottom: `1px solid ${theme.border}`,
        padding: "18px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: theme.accent, boxShadow: `0 4px 12px ${theme.accent}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>{icon}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: theme.muted, marginTop: 1 }}>{subtitle}</div>}
          </div>
        </div>
        {corner}
      </div>
      {/* body */}
      <div style={{ padding: "20px 22px", flex: 1 }}>{children}</div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyState({ emoji, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 0" }}>
      <div style={{ fontSize: 42, marginBottom: 10, lineHeight: 1 }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CARD 1 — Today's Attendance
// ══════════════════════════════════════════════════════════════════
function AttendanceCard({ attendance }) {
  const pct    = attendance?.percentage ?? 0;
  const health = pct >= 80 ? { label: "Excellent", color: "#10B981", bg: "#D1FAE5" }
               : pct >= 60 ? { label: "Good",      color: "#F59E0B", bg: "#FEF3C7" }
               :             { label: "Low",        color: "#EF4444", bg: "#FEE2E2" };

  // Donut dimensions
  const R  = 48;
  const SZ = 112;
  const CX = SZ / 2;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - pct / 100);

  return (
    <PanelCard
      icon="📊"
      title="Today's Attendance"
      subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
      corner={
        attendance?.hasData ? (
          <span style={{ background: health.bg, color: health.color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {health.label}
          </span>
        ) : null
      }
    >
      {!attendance?.hasData ? (
        <EmptyState emoji="📋" title="No attendance yet" sub="Mark attendance in the Attendance module" />
      ) : (
        <>
          {/* Donut + stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
            {/* Donut ring */}
            <div style={{ flexShrink: 0, position: "relative", width: SZ, height: SZ }}>
              <svg width={SZ} height={SZ} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={CX} cy={CX} r={R} fill="none" stroke="#E5E7EB" strokeWidth={11} />
                <circle
                  cx={CX} cy={CX} r={R} fill="none"
                  stroke={health.color} strokeWidth={11}
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 6px ${health.color}88)` }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: health.color, lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 10, color: theme.muted, fontWeight: 600, marginTop: 2 }}>present</div>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Present", value: attendance.present, color: "#10B981", bg: "#D1FAE5", pct: Math.round((attendance.present / attendance.total) * 100) },
                { label: "Absent",  value: attendance.absent,  color: "#EF4444", bg: "#FEE2E2", pct: Math.round((attendance.absent  / attendance.total) * 100) },
                { label: "Total",   value: attendance.total,   color: "#6C63FF", bg: "#EDE9FE", pct: 100 },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, boxShadow: `0 0 4px ${r.color}88` }} />
                      <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: r.color, background: r.bg, padding: "2px 9px", borderRadius: 20 }}>
                      {r.value}
                    </span>
                  </div>
                  {/* Progress bar */}
                  {r.label !== "Total" && (
                    <div style={{ height: 5, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${r.pct}%`, background: r.color,
                        borderRadius: 99, transition: "width 1s cubic-bezier(.4,0,.2,1)",
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer summary */}
          <div style={{
            marginTop: 4, padding: "10px 14px",
            background: health.bg, borderRadius: 10,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>
              {pct >= 80 ? "✅" : pct >= 60 ? "⚠️" : "🔴"}
            </span>
            <span style={{ fontSize: 12, color: health.color, fontWeight: 600 }}>
              {attendance.present} of {attendance.total} students present today
            </span>
          </div>
        </>
      )}
    </PanelCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// CARD 2 — Birthdays Today
// ══════════════════════════════════════════════════════════════════
function BirthdayCard({ birthdays }) {
  return (
    <PanelCard
      icon="🎂"
      title="Birthdays Today"
      subtitle={birthdays.length ? `${birthdays.length} student${birthdays.length > 1 ? "s" : ""} celebrating` : "No celebrations today"}
      corner={
        birthdays.length > 0 ? (
          <span style={{ background: theme.accent, color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            🎉 {birthdays.length}
          </span>
        ) : null
      }
    >
      {birthdays.length === 0 ? (
        <EmptyState emoji="🎂" title="No birthdays today" sub="Come back tomorrow — someone might be celebrating!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 250, overflowY: "auto", paddingRight: 4 }}>
          {birthdays.map((b, i) => (
            <div key={b.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 12,
              background: i === 0
                ? "linear-gradient(135deg,#FDF2F8,#FDE8F4)"
                : "#FAFAFA",
              border: `1px solid ${i === 0 ? "#F9A8D4" : "#F3F4F6"}`,
              transition: "background 0.15s",
            }}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: b.photoBase64 ? "transparent" : avatarGrad(b.name),
                  border: "2.5px solid #F9A8D4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, fontWeight: 800, color: "#fff", overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(236,72,153,0.25)",
                }}>
                  {b?.photoBase64
                    ? <img src={b.photoBase64} alt={b?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : b?.name?.charAt(0)?.toUpperCase()}
                </div>
                {/* Star badge on first */}
                {i === 0 && (
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#F59E0B", border: "1.5px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9,
                  }}>⭐</div>
                )}
              </div>

              {/* Name + class */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {b.name}
                </div>
                <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{b.className}</div>
              </div>

              {/* Celebration icon */}
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#FDF2F8,#FCE7F3)",
                border: "1.5px solid #F9A8D4",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17,
              }}>🎉</div>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// CARD 3 — Recent Admissions
// ══════════════════════════════════════════════════════════════════
function AdmissionsCard({ admissions }) {
  const fmtDate = d => {
    if (!d) return "";
    try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }
    catch { return d; }
  };

  return (
    <PanelCard
      icon="📋"
      title="Recent Admissions"
      subtitle="Latest 5 applications"
      corner={
        admissions.length > 0 ? (
          <span style={{ background: theme.accent + "18", color: theme.accent, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {admissions.length} entries
          </span>
        ) : null
      }
    >
      {admissions.length === 0 ? (
        <EmptyState emoji="📭" title="No admissions yet" sub="New applications will appear here" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {admissions.map(a => {
            const st = ADM_STATUS[a.status] || { dot: theme.muted, bg: "#F9FAFB", text: theme.muted, border: theme.border, bar: theme.muted };
            return (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12,
                background: "#FAFAFA", border: `1px solid #F3F4F6`,
                borderLeft: `3.5px solid ${st.bar}`,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8F7FF"}
                onMouseLeave={e => e.currentTarget.style.background = "#FAFAFA"}
              >
                {/* Initials avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: avatarGrad(a.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, color: "#fff",
                  boxShadow: "0 2px 8px rgba(108,99,255,0.2)",
                }}>
                  {a.name?.charAt(0).toUpperCase()}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: "#6C63FF", fontWeight: 600, background: "#EDE9FE", borderRadius: 6, padding: "1px 7px" }}>
                      Class {a.applyClass}
                    </span>
                    <span style={{ fontSize: 11, color: theme.muted }}>· {fmtDate(a.date)}</span>
                  </div>
                </div>

                {/* Status pill */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                  background: st.bg, color: st.text, border: `1px solid ${st.border}`,
                  borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                  {a.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// CARD 4 — Upcoming Exams
// ══════════════════════════════════════════════════════════════════
function ExamsCard({ exams }) {
  return (
    <PanelCard
      icon="📝"
      title="Upcoming Exams"
      subtitle="Next 5 scheduled"
      corner={
        exams.length > 0 ? (
          <span style={{ background: theme.accent + "18", color: theme.accent, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {exams.length} exams
          </span>
        ) : null
      }
    >
      {exams.length === 0 ? (
        <EmptyState emoji="📅" title="No upcoming exams" sub="Scheduled exams will appear here" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {exams.map(e => {
            const st     = EXAM_STATUS[e.status] || { bg: "#F3F4F6", text: theme.muted, dot: theme.muted };
            const away   = daysAway(e.date);
            let day = "", mon = "";
            try {
              const d = new Date(e.date + "T00:00:00");
              day = d.getDate();
              mon = d.toLocaleString("default", { month: "short" }).toUpperCase();
            } catch (error) {
              console.error("Error parsing exam date:", error);
            }

            return (
              <div key={e.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12,
                background: "#FAFAFA", border: "1px solid #F3F4F6",
                transition: "background 0.15s",
              }}
                onMouseEnter={ev => ev.currentTarget.style.background = "#F5F3FF"}
                onMouseLeave={ev => ev.currentTarget.style.background = "#FAFAFA"}
              >
                {/* Calendar chip */}
                <div style={{
                  width: 48, height: 54, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)",
                  border: "1.5px solid #C4B5FD",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(168,85,247,0.15)",
                }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#7C3AED", letterSpacing: 1 }}>{mon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#5B21B6", lineHeight: 1.1 }}>{day}</div>
                </div>

                {/* Exam info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    {e.subject && (
                      <span style={{ fontSize: 11, color: "#A855F7", fontWeight: 600, background: "#F5F3FF", borderRadius: 6, padding: "1px 7px", border: "1px solid #E9D5FF" }}>
                        {e.subject}
                      </span>
                    )}
                    {away && (
                      <span style={{ fontSize: 11, color: away.color, fontWeight: 700 }}>{away.label}</span>
                    )}
                  </div>
                </div>

                {/* Status pill */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                  background: st.bg, color: st.text,
                  borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                  {e.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// NOTICE BOARD
// ══════════════════════════════════════════════════════════════════
const noticeDate = (d) => {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
};

const noticeTime = (d) => {
  if (!d) return "";
  try { return new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); }
  catch { return ""; }
};

// Friendly label for a date group header (Today / Yesterday / date).
const dayLabel = (d) => {
  if (!d) return "Undated";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const that  = new Date(d); that.setHours(0, 0, 0, 0);
  const diff  = Math.round((today - that) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return noticeDate(d);
};

// Group notices (already newest-first) into per-day buckets, keeping order.
const groupNoticesByDay = (notices) => {
  const groups = [];
  const idx = {};
  notices.forEach((n) => {
    const d = n.createdAt ? new Date(n.createdAt) : null;
    const key = d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : "undated";
    if (idx[key] == null) { idx[key] = groups.length; groups.push({ key, date: d, items: [] }); }
    groups[idx[key]].items.push(n);
  });
  return groups;
};

function NoticeModal({ initial, onSave, onClose }) {
  const [title, setTitle]     = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [image, setImage]     = useState(initial?.imageBase64 || "");
  const [saving, setSaving]   = useState(false);
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && !image) { toast.error("Add a title, information or image"); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), content: content.trim(), imageBase64: image });
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    padding: "10px 13px", borderRadius: 9, border: `1.5px solid ${theme.border}`,
    background: theme.bg, color: theme.text, fontSize: 14, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: 26, width: 460, maxWidth: "95vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: theme.text, marginBottom: 18 }}>
          {initial?.id ? "Edit Notice" : "New Notice"}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Day on 15th Aug" style={inp} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>Information</div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Notice details…" style={{ ...inp, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: .4 }}>Image (optional)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: 130, height: 82, borderRadius: 10, flexShrink: 0, cursor: "pointer", overflow: "hidden",
              border: `2px dashed ${image ? theme.accent : theme.border}`,
              background: image ? "transparent" : "#f8fafc",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {image
                ? <img src={image} alt="notice" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center" }}><div style={{ fontSize: 22 }}>🖼️</div><div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>Upload</div></div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
              <button onClick={() => fileRef.current?.click()} style={{ background: theme.blue + "15", color: theme.blue, border: `1px solid ${theme.blue}33`, borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {image ? "Change Image" : "Upload Image"}
              </button>
              {image && (
                <button onClick={() => { setImage(""); if (fileRef.current) fileRef.current.value = ""; }} style={{ background: theme.red + "14", color: theme.red, border: `1px solid ${theme.red}22`, borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Remove
                </button>
              )}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 8 }}>PNG, JPG · max 5 MB</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} style={{ flex: 1, background: theme.accent, color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save Notice"}
          </button>
          <button onClick={onClose} style={{ flex: 1, background: theme.bg, color: theme.muted, border: `1px solid ${theme.border}`, borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | notice (edit)

  const load = () => {
    noticesAPI.getAll()
      .then((d) => setNotices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editing?.id) await noticesAPI.update(editing.id, data);
    else await noticesAPI.create(data);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this notice?")) return;
    try { await noticesAPI.delete(id); setNotices((p) => p.filter((n) => n.id !== id)); }
    catch (err) { toast.error("Failed to delete: " + err.message); }
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 20, border: `1px solid ${theme.border}`,
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: 20, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: theme.accent + "0D", borderBottom: `1px solid ${theme.border}`,
        padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: theme.accent, boxShadow: `0 4px 12px ${theme.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📌</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>Notice Board</div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 1 }}>
              {notices.length ? `${notices.length} active notice${notices.length > 1 ? "s" : ""}` : "No notices yet"}
            </div>
          </div>
        </div>
        <button onClick={() => setEditing({})} style={{
          background: theme.accent, color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px",
          fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
        }}>+ Add Notice</button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 22px" }}>
        {loading ? (
          <div style={{ color: theme.muted, fontSize: 13, padding: 12 }}>Loading notices…</div>
        ) : notices.length === 0 ? (
          <EmptyState emoji="📭" title="No notices posted" sub="Click “Add Notice” to post an announcement with an optional image." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {groupNoticesByDay(notices).map((g) => (
              <div key={g.key}>
                {/* Date separator */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, background: theme.accent + "15", border: `1px solid ${theme.accent}33`, padding: "3px 12px", borderRadius: 20 }}>
                    {dayLabel(g.date)}
                  </span>
                  <span style={{ fontSize: 11, color: theme.muted }}>{g.items.length} notice{g.items.length > 1 ? "s" : ""}</span>
                  <div style={{ flex: 1, height: 1, background: theme.border }} />
                </div>

                {/* Single row — horizontal scroll */}
                <div className="notice-row" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
                  {g.items.map((n) => (
                    <div key={n.id} style={{ width: 240, flexShrink: 0, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", background: "#fff" }}>
                      {n.imageBase64 && (
                        <img src={n.imageBase64} alt={n.title || "notice"} style={{ width: "100%", height: 130, objectFit: "cover" }} />
                      )}
                      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>{n.title || "Notice"}</div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            <button onClick={() => setEditing(n)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: theme.muted, padding: 2 }}>✏️</button>
                            <button onClick={() => handleDelete(n.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: theme.red, padding: 2, fontWeight: 800, lineHeight: 1 }}>×</button>
                          </div>
                        </div>
                        {n.content && <div style={{ fontSize: 12.5, color: "#4B5563", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.content}</div>}
                        <div style={{ marginTop: "auto", fontSize: 11, color: theme.muted, paddingTop: 6 }}>🕑 {noticeTime(n.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <style>{`
              .notice-row::-webkit-scrollbar { height: 8px; }
              .notice-row::-webkit-scrollbar-track { background: #F3F4F6; border-radius: 99px; }
              .notice-row::-webkit-scrollbar-thumb { background: #C7CBF0; border-radius: 99px; }
              .notice-row::-webkit-scrollbar-thumb:hover { background: #6C63FF; }
            `}</style>
          </div>
        )}
      </div>

      {editing && (
        <NoticeModal initial={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
export default function Dashboard({ onNavigate }) {
  const [stats,      setStats]      = useState({ students: 0, teachers: 0, classes: 0, pendingAdmissions: 0 });
  const [admissions, setAdmissions] = useState([]);
  const [exams,      setExams]      = useState([]);
  const [birthdays,  setBirthdays]  = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const _now = new Date();
      const todayMMDD = `${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

      const [studentData, teacherData, classData, admissionData, examData, attendanceData] =
        await Promise.allSettled([
          studentAPI.getAll(), teacherAPI.getAll(), classAPI.getAll(),
          admissionAPI.getAll(), examAPI.getAll(),
          attendanceAPI.getSummaryToday(),
        ]);

      setStats({
        students:          studentData.status   === "fulfilled" ? studentData.value.length   : 0,
        teachers:          teacherData.status   === "fulfilled" ? teacherData.value.length   : 0,
        classes:           classData.status     === "fulfilled" ? classData.value.length     : 0,
        pendingAdmissions: admissionData.status === "fulfilled"
          ? admissionData.value.filter(a => a.status === "PENDING" || a.status === "UNDER_REVIEW").length : 0,
      });

      if (studentData.status === "fulfilled") {
        setBirthdays(studentData.value
          .filter(s => monthDay(s.dob) === todayMMDD)
          .map(s => ({ id: s.id, name: s.name, className: s.className, photoBase64: s.photoBase64 })));
      }

      if (attendanceData.status === "fulfilled") setAttendance(attendanceData.value);

      if (admissionData.status === "fulfilled") {
        setAdmissions([...admissionData.value]
          .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
          .slice(0, 5)
          .map(a => ({
            id: a.id, name: a.applicantName, applyClass: a.applyClass,
            date: a.appliedDate, status: admissionStatusLabel(a.status),
          })));
      }

      if (examData.status === "fulfilled") {
        setExams(examData.value
          .filter(e => e.status !== "COMPLETED" && e.status !== "CANCELLED")
          .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
          .slice(0, 5)
          .map(e => ({
            id: e.id, name: e.name, subject: e.subject,
            date: e.examDate, status: examStatusLabel(e.status),
          })));
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  const today      = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Logged-in user + time-based greeting
  const authUser  = (() => { try { return JSON.parse(localStorage.getItem("authUser")) || {}; } catch { return {}; } })();
  const firstName = (authUser.name || authUser.username || "").trim().split(" ")[0];
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetIcon = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌆";

  return (
    <div>

      {/* ── Greeting bar (user wishes) — stays pinned while data scrolls ── */}
      <StickyHeader style={{ borderBottom: "none", padding: "20px 28px 14px 28px" }}>
      <div style={{
        borderRadius: 16, overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 45%, #6D28D9 100%)",
        boxShadow: "0 8px 24px rgba(76,29,149,0.28)",
        padding: "16px 26px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
      }}>
        {/* decorative texture + glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }} />
        <div style={{
          position: "absolute", top: -70, right: -50, width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.40), transparent 70%)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Time-based greeting for the logged-in user */}
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 900, color: "#fff",
            letterSpacing: -0.5, lineHeight: 1.1, textShadow: "0 2px 14px rgba(0,0,0,0.35)",
          }}>
            {greeting}{firstName ? `, ${firstName}` : ""} {greetIcon}
          </h1>
          {/* Live date chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 99, padding: "4px 12px", backdropFilter: "blur(6px)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600, letterSpacing: 0.5 }}>{today}</span>
          </div>
        </div>

        {/* System status */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 12, padding: "8px 16px", backdropFilter: "blur(8px)", flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>🏫</span>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600, letterSpacing: 0.5 }}>SYSTEM STATUS</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399" }}>● Online</div>
          </div>
        </div>
      </div>
      </StickyHeader>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Students"     value={stats.students.toLocaleString()}         icon="🎓" color={theme.accent} onClick={() => onNavigate?.("students")} />
        <StatCard label="Teachers"           value={stats.teachers.toLocaleString()}          icon="👩‍🏫" color={theme.accent} onClick={() => onNavigate?.("teachers")} />
        <StatCard label="Classes"            value={stats.classes.toLocaleString()}           icon="🏫" color={theme.accent} onClick={() => onNavigate?.("classes")} />
        <StatCard label="Pending Admissions" value={stats.pendingAdmissions.toLocaleString()} icon="📋" color={theme.accent} onClick={() => onNavigate?.("admissions")} />
      </div>

      {/* ── Notice Board ────────────────────────────────────────── */}
      <NoticeBoard />

      {/* ── Row 1: Attendance + Birthdays ─────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <AttendanceCard attendance={attendance} />
        <BirthdayCard   birthdays={birthdays} />
      </div>

      {/* ── Row 2: Admissions + Exams ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <AdmissionsCard admissions={admissions} />
        <ExamsCard      exams={exams} />
      </div>

    </div>
  );
}
