// components/ErrorMessage.jsx
import { theme } from "../theme";

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 24px", gap: 14,
    }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <p style={{ color: theme.red, fontWeight: 600, fontSize: 15, margin: 0 }}>
        {message || "Failed to load data"}
      </p>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: theme.accent, color: "#fff", border: "none",
          borderRadius: 8, padding: "8px 20px", cursor: "pointer",
          fontWeight: 700, fontSize: 13,
        }}>
          Retry
        </button>
      )}
    </div>
  );
}