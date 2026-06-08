// pages/Timetable.jsx
import { useState } from "react";
import { theme, subjectColors } from "../theme";
import { timetableData, timePeriods } from "../data/mockData";

const CLASS_OPTIONS = ["10-A", "10-B", "9-B", "8-A", "7-C"];

export default function Timetable() {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const days = Object.keys(timetableData);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Class Timetable
        </h2>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {CLASS_OPTIONS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{
                padding: "14px 18px", color: theme.accent, textAlign: "left",
                fontFamily: "monospace", fontSize: 12, letterSpacing: 1,
                borderBottom: `1px solid ${theme.border}`, background: theme.surface, minWidth: 90,
              }}>
                PERIOD
              </th>
              {days.map(d => (
                <th key={d} style={{
                  padding: "14px 18px", color: theme.muted, textAlign: "left",
                  fontFamily: "monospace", fontSize: 12, letterSpacing: 1,
                  borderBottom: `1px solid ${theme.border}`, background: theme.surface, minWidth: 120,
                }}>
                  {d.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timePeriods.map((period, i) => (
              <tr key={period} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                <td style={{ padding: "12px 18px", color: theme.muted, fontFamily: "monospace", fontSize: 12, background: theme.surface, whiteSpace: "nowrap" }}>
                  {period}
                </td>
                {days.map(day => {
                  const subj = timetableData[day][i];
                  const color = subjectColors[subj] || theme.muted;
                  const isBreak = subj === "—BREAK—";
                  return (
                    <td key={day} style={{ padding: "10px 14px" }}>
                      <div style={{
                        background: isBreak ? theme.border + "44" : color + "22",
                        color: isBreak ? theme.muted : color,
                        borderRadius: 7,
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: isBreak ? 400 : 700,
                        textAlign: "center",
                        fontFamily: isBreak ? "monospace" : "'DM Sans', sans-serif",
                        letterSpacing: isBreak ? 1 : 0,
                      }}>
                        {subj}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}