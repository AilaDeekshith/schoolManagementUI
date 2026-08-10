// components/DataTable.jsx
import { theme } from "../theme";

export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(16,24,64,0.05)",
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{
                  textAlign: "left",
                  padding: "14px 18px",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: theme.muted,
                  borderBottom: `1px solid ${theme.border}`,
                  background: theme.surface,
                  whiteSpace: "nowrap",
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i === data.length - 1 ? "none" : `1px solid ${theme.border}66`,
                  background: i % 2 === 1 ? theme.bg + "55" : "transparent",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = theme.accent + "0F")}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? theme.bg + "55" : "transparent")}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} style={{
                    padding: "13px 18px",
                    color: col.key === "name" ? theme.text : theme.muted,
                    fontWeight: col.key === "name" ? 700 : 500,
                    fontSize: 13.5,
                    whiteSpace: "nowrap",
                  }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
