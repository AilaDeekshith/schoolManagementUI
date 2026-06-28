// components/DataTable.jsx
import { theme } from "../theme";

export default function DataTable({ columns, data, onRowClick }) {

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                textAlign: "left",
                padding: "12px 16px",
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: 1.5,
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
              style={{ borderBottom: `1px solid ${theme.border}22`, cursor: onRowClick ? "pointer" : "default", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = theme.surface)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td key={col.key} style={{
                  padding: "13px 16px",
                  color: col.key === "name" ? theme.text : theme.muted,
                  fontWeight: col.key === "name" ? 600 : 400,
                  fontSize: 14,
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
  );
}