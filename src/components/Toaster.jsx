// components/Toaster.jsx — renders the global toast stack (bottom-right).
import { useEffect, useState, useCallback } from "react";
import { subscribe } from "../toast";

const STYLES = {
  success: { accent: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: "✅", title: "Success" },
  error:   { accent: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "⛔", title: "Error" },
  warning: { accent: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "⚠️", title: "Heads up" },
  info:    { accent: "#6C63FF", bg: "#EEF2FF", border: "#C7D2FE", icon: "ℹ️", title: "Info" },
};

export default function Toaster() {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return subscribe((t) => {
      setItems((prev) => [...prev, t]);
      if (t.duration > 0) setTimeout(() => remove(t.id), t.duration);
    });
  }, [remove]);

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 4000,
      display: "flex", flexDirection: "column", gap: 12, maxWidth: 380, pointerEvents: "none",
    }}>
      {items.map((t) => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <div key={t.id} style={{
            pointerEvents: "auto",
            display: "flex", alignItems: "flex-start", gap: 12,
            background: "#fff", borderRadius: 14,
            border: `1px solid ${s.border}`,
            borderLeft: `5px solid ${s.accent}`,
            boxShadow: "0 12px 34px rgba(15,23,42,0.18)",
            padding: "13px 14px 13px 16px", minWidth: 280,
            fontFamily: "'DM Sans', sans-serif",
            animation: "toastIn .28s cubic-bezier(.2,.8,.2,1)",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: s.accent, marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.45, wordBreak: "break-word" }}>{t.message}</div>
            </div>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" style={{
              background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
              fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0,
            }}>×</button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(.98); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
