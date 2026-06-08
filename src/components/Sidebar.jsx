// components/Sidebar.jsx
import { MODULES } from "../data/mockData";

export default function Sidebar({ active, setActive, open, setOpen }) {
  return (
    <div style={{
      width: open ? 230 : 64,
      background: "linear-gradient(180deg, #6C63FF 0%, #8B5CF6 50%, #A855F7 100%)",
      borderRight: "none",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s",
      flexShrink: 0,
      boxShadow: "4px 0 24px #6C63FF33",
    }}>
      {/* Logo */}
      <div style={{
        padding: "22px 18px",
        borderBottom: "1px solid #FFFFFF22",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
          boxShadow: "0 2px 8px #00000022",
        }}>🏫</div>
        {open && (
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#FFFFFF", lineHeight: 1 }}>Sunrise</div>
            <div style={{ fontSize: 11, color: "#FFFFFFBB", fontFamily: "monospace", letterSpacing: 1 }}>PUBLIC SCHOOL</div>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
        {MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 9,
              marginBottom: 2,
              background: active === m.id ? "#FFFFFF22" : "transparent",
              border: `1px solid ${active === m.id ? "#FFFFFF44" : "transparent"}`,
              color: active === m.id ? "#FFFFFF" : "#FFFFFFAA",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
              fontWeight: active === m.id ? 700 : 400,
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
            {open && <span>{m.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          margin: "0 10px 14px",
          padding: "10px",
          background: "#FFFFFF22",
          border: "1px solid #FFFFFF33",
          borderRadius: 9,
          cursor: "pointer",
          color: "#FFFFFF",
          fontSize: 16,
          transition: "all 0.15s",
        }}
      >
        {open ? "◀" : "▶"}
      </button>
    </div>
  );
}