// components/TopBar.jsx
import { theme } from "../theme";
import { MODULES } from "../data/mockData";

export default function TopBar({ active }) {
  const current = MODULES.find(m => m.id === active);
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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{current?.icon}</span>
        <span style={{ fontSize: 13, color: theme.muted, fontFamily: "monospace", letterSpacing: 1, fontWeight: 600 }}>
          {current?.label.toUpperCase()}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          background: theme.accent + "11",
          border: `1px solid ${theme.accent}33`,
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 12,
          color: theme.muted,
        }}>
          Academic Year: <span style={{ color: theme.accent, fontWeight: 700 }}>2024–25</span>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "linear-gradient(135deg, #6C63FF, #A855F7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 14, color: "#FFFFFF", cursor: "pointer",
          boxShadow: "0 2px 8px #6C63FF44",
        }}>A</div>
      </div>
    </div>
  );
}