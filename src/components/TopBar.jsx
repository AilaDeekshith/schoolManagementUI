// components/TopBar.jsx
import { useState, useEffect, useRef } from "react";
import { theme } from "../theme";

export default function TopBar({ active, user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (user?.name || "A").charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const roleLabel = (user?.role || "").replace(/_/g, " ").toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{
      height: 58,
      borderBottom: `1px solid ${theme.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      background: theme.surface,
      flexShrink: 0,
      boxShadow: "0 1px 12px #6C63FF11",
    }}>
      <div />

      {/* Right side — avatar only; dropdown on click */}
      <div ref={ref} style={{ position: "relative" }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #6C63FF, #A855F7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#FFFFFF", cursor: "pointer",
            boxShadow: "0 2px 8px #6C63FF44",
            userSelect: "none",
          }}
          title={user?.name}
        >
          {initial}
        </div>

        {open && (
          <div style={{
            position: "absolute", top: 44, right: 0, width: 210,
            background: "#fff", borderRadius: 12,
            border: `1px solid ${theme.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            zIndex: 1000, overflow: "hidden",
          }}>
            {/* User info section */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{roleLabel}</div>
              {user?.username && (
                <div style={{ fontSize: 11, color: theme.muted, fontFamily: "monospace" }}>@{user.username}</div>
              )}
            </div>
            {/* Sign out */}
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              style={{
                width: "100%", padding: "11px 16px", textAlign: "left",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: "#EF4444", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
