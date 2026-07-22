// components/StatCard.jsx
import { theme } from "../theme";

export default function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      cursor: onClick ? "pointer" : "default",
      boxShadow: `0 2px 12px ${color}18`,
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${color}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.boxShadow = `0 2px 12px ${color}18`; }}
    >
      <div style={{
        width: 50,
        height: 50,
        borderRadius: 14,
        background: color + "18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 11,
          color: theme.muted,
          marginTop: 4,
          fontFamily: "monospace",
          letterSpacing: 1,
          textTransform: "uppercase",
          fontWeight: 600,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}