// components/Modal.jsx
import { useEffect } from "react";
import { theme } from "../theme";

export default function Modal({ title, onClose, children, width = 600 }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "#1E1B4B55",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          border: `1px solid ${theme.border}`,
          borderRadius: 18,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px #6C63FF22",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px",
          borderBottom: `1px solid ${theme.border}`,
          position: "sticky", top: 0, background: "#FFFFFF", zIndex: 1,
          borderRadius: "18px 18px 0 0",
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: theme.text }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            background: "#F3F4F6",
            border: `1px solid ${theme.border}`,
            color: theme.muted, borderRadius: 8, width: 32, height: 32,
            cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}