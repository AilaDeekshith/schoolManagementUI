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
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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