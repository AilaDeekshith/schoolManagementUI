// components/TopBar.jsx
import { useState, useEffect, useRef } from "react";
import { theme } from "../theme";

const ROLE_META = {
  SUPER_ADMIN: { label: "Super Admin",  color: "#6C63FF", bg: "#ede9fe" },
  ADMIN:       { label: "Admin",        color: "#3B82F6", bg: "#eff6ff" },
  TEACHER:     { label: "Teacher",      color: "#10B981", bg: "#ecfdf5" },
  STAFF:       { label: "Staff",        color: "#F59E0B", bg: "#fffbeb" },
};

// Pick a gradient per first letter
const avatarGradient = (name = "") => {
  const gradients = [
    "linear-gradient(135deg, #6C63FF, #A855F7)",
    "linear-gradient(135deg, #3B82F6, #06B6D4)",
    "linear-gradient(135deg, #10B981, #3B82F6)",
    "linear-gradient(135deg, #F59E0B, #EF4444)",
    "linear-gradient(135deg, #EC4899, #A855F7)",
    "linear-gradient(135deg, #8B5CF6, #6C63FF)",
  ];
  return gradients[name.charCodeAt(0) % gradients.length] || gradients[0];
};

export default function TopBar({ active, user, onLogout, schoolProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initial  = (user?.name || "U").charAt(0).toUpperCase();
  const roleMeta = ROLE_META[user?.role] || { label: user?.role || "User", color: theme.muted, bg: "#f3f4f6" };
  const gradient = avatarGradient(user?.name || "");

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{
      height: 60,
      borderBottom: `1px solid ${theme.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      background: "#ffffff",
      flexShrink: 0,
      boxShadow: "0 1px 0 #E8EDFF, 0 2px 16px rgba(108,99,255,0.05)",
    }}>
      {/* Left — school branding */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: schoolProfile?.logoBase64 ? "transparent" : "linear-gradient(135deg, #6C63FF, #A855F7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, overflow: "hidden",
          boxShadow: "0 2px 10px rgba(108,99,255,0.3)",
        }}>
          {schoolProfile?.logoBase64
            ? <img src={schoolProfile.logoBase64} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
            : "🏫"}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1E1B4B", lineHeight: 1.1 }}>
            {schoolProfile?.schoolName || "My School"}
          </div>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: "monospace", letterSpacing: 1.2, marginTop: 1 }}>
            {(schoolProfile?.affiliationBoard || "SCHOOL").toUpperCase()}
          </div>
        </div>
      </div>

      {/* Right — avatar trigger */}
      <div ref={ref} style={{ position: "relative" }}>

        {/* Avatar button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: open ? "#f0f0ff" : "transparent",
            border: `1.5px solid ${open ? "#6C63FF44" : "transparent"}`,
            borderRadius: 40,
            padding: "4px 12px 4px 4px",
            cursor: "pointer",
            transition: "background 0.18s, border-color 0.18s",
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = "#f5f3ff"; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
        >
          {/* Avatar circle */}
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: gradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#fff",
            boxShadow: "0 2px 8px rgba(108,99,255,0.35)",
            flexShrink: 0,
          }}>{initial}</div>

          {/* Name + role — visible on wider screens */}
          <div style={{ textAlign: "left", lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E1B4B", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: 10, color: roleMeta.color, fontWeight: 600 }}>
              {roleMeta.label}
            </div>
          </div>

          {/* Chevron */}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ marginLeft: 2, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}
          >
            <path d="M2 4l4 4 4-4" stroke={theme.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* ── Dropdown card ── */}
        {open && (
          <div style={{
            position: "absolute", top: 52, right: 0, width: 260,
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E8EDFF",
            boxShadow: "0 16px 48px rgba(30,27,75,0.14), 0 4px 16px rgba(108,99,255,0.08)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "dropIn 0.18s cubic-bezier(.4,0,.2,1)",
          }}>

            {/* ── User hero ── */}
            <div style={{
              background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
              padding: "20px 20px 16px",
              borderBottom: "1px solid #EDE9FE",
            }}>
              {/* Big avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  boxShadow: "0 4px 16px rgba(108,99,255,0.35)",
                  flexShrink: 0,
                  border: "2px solid rgba(255,255,255,0.7)",
                }}>
                  {initial}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{
                    fontWeight: 800, fontSize: 15, color: "#1E1B4B",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {user?.name}
                  </div>
                  {/* Role badge */}
                  <span style={{
                    display: "inline-block", marginTop: 4,
                    background: roleMeta.bg, color: roleMeta.color,
                    border: `1px solid ${roleMeta.color}33`,
                    borderRadius: 20, padding: "2px 10px",
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                  }}>
                    {roleMeta.label.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Details below avatar */}
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 5 }}>
                {user?.username && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13, color: "#A5B4FC" }}>@</span>
                    <span style={{ fontSize: 12, color: "#6C63FF", fontFamily: "monospace", fontWeight: 600 }}>
                      {user.username}
                    </span>
                  </div>
                )}
                {user?.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>✉</span>
                    <span style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Actions ── */}
            <div style={{ padding: "8px 0" }}>
              <DropdownItem
                icon="🔑"
                label="Change Password"
                onClick={() => {
                  setOpen(false);
                  // Placeholder — hook in if needed
                }}
              />
              <div style={{ margin: "6px 14px", height: 1, background: "#F0F0FF" }} />
              <DropdownItem
                icon="🚪"
                label="Sign Out"
                danger
                onClick={() => { setOpen(false); onLogout?.(); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DropdownItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 18px", border: "none", cursor: "pointer", textAlign: "left",
        background: hov ? (danger ? "#fff0f0" : "#f5f3ff") : "transparent",
        color: danger ? "#EF4444" : "#374151",
        fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.15s",
      }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{icon}</span>
      {label}
    </button>
  );
}
