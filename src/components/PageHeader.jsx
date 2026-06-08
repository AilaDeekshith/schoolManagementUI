// components/PageHeader.jsx
import { theme } from "../theme";

export default function PageHeader({ title, actionLabel, onAction }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    }}>
      <h2 style={{
        fontSize: 22,
        fontWeight: 800,
        color: theme.text,
        fontFamily: "'DM Sans', sans-serif",
        margin: 0,
      }}>
        {title}
      </h2>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            background: theme.accent,
            color: "#0D1117",
            border: "none",
            borderRadius: 8,
            padding: "9px 20px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}