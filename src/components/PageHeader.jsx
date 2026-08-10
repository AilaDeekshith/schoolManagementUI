// components/PageHeader.jsx
import { theme } from "../theme";

// Sticky page heading. The negative horizontal margins bleed over the 28px side
// padding of the scrollable content container (see App.jsx) so the opaque
// background spans the full width. The container has no top padding, so the
// header's own top padding sets the gap and its background reaches y=0 — keeping
// it pinned with data scrolling cleanly beneath (never above) it.
export default function PageHeader({ title, actionLabel, onAction }) {
  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      background: theme.bg,
      margin: "0 -28px 24px -28px",
      padding: "24px 28px 16px 28px",
      borderBottom: `1px solid ${theme.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
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
