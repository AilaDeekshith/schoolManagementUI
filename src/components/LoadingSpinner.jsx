// components/LoadingSpinner.jsx
import { theme } from "../theme";

export default function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 16 }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: `3px solid ${theme.border}`,
        borderTop: `3px solid ${theme.accent}`,
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ color: theme.muted, fontSize: 14 }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}