// components/StickyHeader.jsx
import { theme } from "../theme";

// Wraps a page's heading row so it stays pinned to the top while only the data
// below scrolls. The negative horizontal margins bleed over the 28px side
// padding of the scrollable content container in App.jsx so the opaque
// background spans full width. The container has no top padding, so the header's
// own top padding sets the gap and its background reaches y=0 — keeping it
// pinned with data scrolling cleanly beneath (never above) it.
export default function StickyHeader({ children, style }) {
  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      background: theme.bg,
      margin: "0 -28px 20px -28px",
      padding: "22px 28px 16px 28px",
      borderBottom: `1px solid ${theme.border}`,
      ...style,
    }}>
      {children}
    </div>
  );
}
