// components/Sidebar.jsx
import { useState } from "react";
import { MODULES } from "../data/mockData";

// Icon background colour per module (subtle pill on active)
const MODULE_ACCENT = {
  dashboard:     "#6C63FF",
  students:      "#3B82F6",
  teachers:      "#10B981",
  admissions:    "#F59E0B",
  attendance:    "#06B6D4",
  timetable:     "#8B5CF6",
  classes:       "#EC4899",
  fees:          "#EF4444",
  exams:         "#F97316",
  examSeating:   "#D946EF",
  syllabus:      "#0D9488",
  configuration: "#64748B",
};

export default function Sidebar({ active, setActive, open, setOpen }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      width: open ? 236 : 68,
      minWidth: open ? 236 : 68,
      background: "linear-gradient(175deg, #1E1B4B 0%, #312E81 45%, #4C1D95 100%)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.26s cubic-bezier(.4,0,.2,1), min-width 0.26s cubic-bezier(.4,0,.2,1)",
      flexShrink: 0,
      boxShadow: "6px 0 32px rgba(108,99,255,0.18)",
      position: "relative",
      zIndex: 10,
    }}>

      {/* ── Section label ── */}
      {open && (
        <div style={{
          padding: "20px 20px 6px",
          fontSize: 9, fontWeight: 800,
          color: "rgba(165,180,252,0.55)",
          letterSpacing: 2,
          textTransform: "uppercase",
          fontFamily: "monospace",
        }}>
          Navigation
        </div>
      )}

      {/* ── Nav Links ── */}
      <nav
        className="sidebar-scroll"
        style={{ flex: 1, padding: open ? "4px 10px 10px" : "8px 10px 10px", overflowY: "auto" }}
      >
        {MODULES.map(m => {
          const isActive  = active === m.id;
          const isHovered = hovered === m.id;
          const accent    = MODULE_ACCENT[m.id] || "#6C63FF";

          return (
            <div key={m.id} style={{ position: "relative", marginBottom: 3 }}>

              {/* Active left bar */}
              {isActive && (
                <div style={{
                  position: "absolute", left: 0, top: "50%",
                  transform: "translateY(-50%)",
                  width: 3, height: 22, borderRadius: 99,
                  background: "#fff",
                  boxShadow: "0 0 8px #fff",
                }} />
              )}

              <button
                className="nav-item"
                onClick={() => setActive(m.id)}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
                title={!open ? m.label : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: open ? "9px 12px 9px 16px" : "10px 0",
                  justifyContent: open ? "flex-start" : "center",
                  borderRadius: 10,
                  background: isActive
                    ? "rgba(255,255,255,0.13)"
                    : isHovered
                      ? "rgba(255,255,255,0.07)"
                      : "transparent",
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid transparent",
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.62)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: isActive ? 700 : 450,
                  fontSize: 13.5,
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: isActive
                    ? `0 2px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.1)`
                    : "none",
                  backdropFilter: isActive ? "blur(4px)" : "none",
                }}
              >
                {/* Icon bubble */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: isActive ? accent : "rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15,
                  transition: "background 0.18s",
                  boxShadow: isActive ? `0 2px 8px ${accent}55` : "none",
                }}>
                  {m.icon}
                </div>

                {open && (
                  <span style={{
                    whiteSpace: "nowrap", overflow: "hidden",
                    animation: "fadeSlideIn 0.18s ease",
                  }}>
                    {m.label}
                  </span>
                )}

                {/* Active dot when collapsed */}
                {!open && isActive && (
                  <div style={{
                    position: "absolute", bottom: 6, left: "50%",
                    transform: "translateX(-50%)",
                    width: 4, height: 4, borderRadius: 99, background: "#fff",
                  }} />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div style={{ margin: "0 14px", height: 1, background: "rgba(255,255,255,0.08)" }} />

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          margin: "10px 10px 14px",
          padding: "9px 0",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          cursor: "pointer",
          color: "rgba(255,255,255,0.7)",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "flex-start" : "center",
          gap: 10,
          paddingLeft: open ? 14 : 0,
          transition: "background 0.15s, padding 0.25s",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      >
        <span style={{ fontSize: 12, transition: "transform 0.25s", display: "inline-block", transform: open ? "rotate(0deg)" : "rotate(180deg)" }}>
          ◀
        </span>
        {open && <span style={{ fontSize: 12 }}>Collapse</span>}
      </button>
    </div>
  );
}
