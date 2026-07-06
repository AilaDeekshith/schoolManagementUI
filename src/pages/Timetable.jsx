// pages/Timetable.jsx
import { useState, useEffect } from "react";
import { theme, subjectColors } from "../theme";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { timetableAPI, classAPI, teacherAPI, periodAPI, configAPI } from "../api/apiService";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_LABELS = { MONDAY:"Monday", TUESDAY:"Tuesday", WEDNESDAY:"Wednesday", THURSDAY:"Thursday", FRIDAY:"Friday", SATURDAY: "Saturday" };
const FALLBACK_SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","History","Geography","Computer","P.E.","Art","Music"];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmt = (t) => {
  // "08:00:00" → "8:00 AM"
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2,"0")} ${ampm}`;
};

const diffMins = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
};

const makeEmptyGrid = (periods) => {
  const g = {};
  DAYS.forEach(d => {
    g[d] = {};
    periods.forEach(p => { g[d][p.periodNumber] = null; });
  });
  return g;
};

const buildGrid = (slots, periods, teachers) => {
  const g = makeEmptyGrid(periods);
  slots.forEach(slot => {
    const d = slot.dayOfWeek;
    const p = slot.periodNumber;
    if (g[d] && g[d][p] !== undefined) {
      const teacher = teachers.find(t => t.id === slot.teacherId);
      g[d][p] = {
        subject:      slot.subject,
        teacherId:    slot.teacherId   || null,
        teacherName:  slot.teacherName || teacher?.name  || "",
        teacherPhoto: teacher?.photo   || null,
        entryId:      slot.id,
      };
    }
  });
  return g;
};

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position:"fixed", bottom:28, right:28,
      background: type === "error" ? theme.red : theme.green,
      color:"#fff", borderRadius:12, padding:"13px 22px",
      fontWeight:700, fontSize:14, zIndex:2000,
      boxShadow:"0 8px 32px #00000033",
      display:"flex", alignItems:"center", gap:10,
    }}>
      {type === "error" ? "❌" : "✅"} {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 1 — PERIOD SETUP
// ─────────────────────────────────────────────────────────────
function PeriodSetup({ className, existingPeriods, onSaved }) {
  const defaultRow = () => ({ label:"", startTime:"", endTime:"", isBreak:false, notes:"" });
  const [rows, setRows] = useState(
    existingPeriods.length > 0
      ? existingPeriods.map(p => ({
          id:        p.id,
          label:     p.periodLabel,
          startTime: p.startTime ? p.startTime.slice(0,5) : "",
          endTime:   p.endTime   ? p.endTime.slice(0,5)   : "",
          isBreak:   p.isBreak   || false,
          notes:     p.notes     || "",
        }))
      : [defaultRow()]
  );
  const [saving, setSaving] = useState(false);

  const update = (i, field, val) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const addRow = () => setRows(prev => [...prev, defaultRow()]);

  const removeRow = (i) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, idx) => idx !== i));
  };

  const addBreak = () => setRows(prev => [...prev, { label:"Break", startTime:"", endTime:"", isBreak:true, notes:"" }]);

  const moveUp   = (i) => { if (i === 0) return; const r=[...rows]; [r[i-1],r[i]]=[r[i],r[i-1]]; setRows(r); };
  const moveDown = (i) => { if (i===rows.length-1) return; const r=[...rows]; [r[i],r[i+1]]=[r[i+1],r[i]]; setRows(r); };

  const handleSave = async () => {
    for (let i=0; i<rows.length; i++) {
      const r = rows[i];
      if (!r.label.trim())     { alert(`Row ${i+1}: Label is required`);      return; }
      if (!r.startTime)        { alert(`Row ${i+1}: Start time is required`); return; }
      if (!r.endTime)          { alert(`Row ${i+1}: End time is required`);   return; }
      if (r.startTime >= r.endTime) { alert(`Row ${i+1}: End time must be after start time`); return; }
      // Duplicate start-time check
      const dupStart = rows.findIndex((o, j) => j !== i && o.startTime === r.startTime);
      if (dupStart !== -1) { alert(`Rows ${i+1} and ${dupStart+1} have the same start time. Each period must have a unique start time.`); return; }
      // Overlap check — ensure this period doesn't overlap any other
      const start = r.startTime, end = r.endTime;
      const overlap = rows.findIndex((o, j) => j !== i && o.startTime && o.endTime && start < o.endTime && end > o.startTime);
      if (overlap !== -1) { alert(`Period ${i+1} overlaps with period ${overlap+1}. Fix the times before saving.`); return; }
    }
    setSaving(true);
    try {
      const payload = rows.map(r => ({
        periodLabel: r.label,
        startTime:   r.startTime + ":00",
        endTime:     r.endTime   + ":00",
        isBreak:     r.isBreak,
        notes:       r.notes || null,
      }));
      const saved = await periodAPI.saveForClass(className, payload);
      onSaved(saved);
    } catch (err) {
      alert("Failed to save periods: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = (extra={}) => ({
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 7, padding: "7px 10px",
    color: theme.text, fontSize: 13,
    outline: "none", ...extra,
  });

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:theme.text }}>
            Step 1 — Configure Periods
          </h3>
          <p style={{ margin:"4px 0 0", fontSize:12, color:theme.muted }}>
            Define the period structure for Class {className}. You can add breaks and reorder rows.
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={addBreak} style={{ background:theme.orange+"18", color:theme.orange, border:`1px solid ${theme.orange}33`, borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:700 }}>
            + Break / Lunch
          </button>
          <button onClick={addRow} style={{ background:theme.blue+"18", color:theme.blue, border:`1px solid ${theme.blue}33`, borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:700 }}>
            + Period
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:theme.card, border:`1px solid ${theme.border}`, borderRadius:14, overflow:"hidden", marginBottom:20 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:theme.surface }}>
              {["#","Label","Start Time","End Time","Duration","Break?","Notes",""].map(h => (
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontFamily:"monospace", letterSpacing:1, color:theme.muted, borderBottom:`1px solid ${theme.border}`, whiteSpace:"nowrap" }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const mins = diffMins(row.startTime, row.endTime);
              return (
                <tr key={i} style={{ borderBottom:`1px solid ${theme.border}22`, background: row.isBreak ? theme.orange+"08" : "transparent" }}>
                  {/* # */}
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                      <button onClick={() => moveUp(i)}   style={{ background:"none", border:"none", cursor:"pointer", color:theme.muted, fontSize:12, padding:"1px 4px" }}>▲</button>
                      <span   style={{ textAlign:"center", color:theme.muted, fontSize:13, fontWeight:700 }}>{i+1}</span>
                      <button onClick={() => moveDown(i)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.muted, fontSize:12, padding:"1px 4px" }}>▼</button>
                    </div>
                  </td>
                  {/* Label */}
                  <td style={{ padding:"10px 14px" }}>
                    <input
                      value={row.label}
                      onChange={e => update(i,"label",e.target.value)}
                      placeholder={row.isBreak ? "Break" : "P1, P2…"}
                      style={{ ...inp(), width:90 }}
                    />
                  </td>
                  {/* Start */}
                  <td style={{ padding:"10px 14px" }}>
                    <input type="time" value={row.startTime} onChange={e => update(i,"startTime",e.target.value)}
                      style={{ ...inp(), width:120 }} />
                  </td>
                  {/* End */}
                  <td style={{ padding:"10px 14px" }}>
                    <input type="time" value={row.endTime} onChange={e => update(i,"endTime",e.target.value)}
                      style={{ ...inp(), width:120 }} />
                  </td>
                  {/* Duration */}
                  <td style={{ padding:"10px 14px", color:mins>0?theme.green:theme.muted, fontWeight:600, fontSize:13, whiteSpace:"nowrap" }}>
                    {mins > 0 ? `${mins} min` : "—"}
                  </td>
                  {/* isBreak */}
                  <td style={{ padding:"10px 14px" }}>
                    <input type="checkbox" checked={row.isBreak} onChange={e => update(i,"isBreak",e.target.checked)}
                      style={{ width:16, height:16, cursor:"pointer", accentColor:theme.orange }} />
                  </td>
                  {/* Notes */}
                  <td style={{ padding:"10px 14px" }}>
                    <input value={row.notes} onChange={e => update(i,"notes",e.target.value)}
                      placeholder="Optional note"
                      style={{ ...inp(), width:150 }} />
                  </td>
                  {/* Remove */}
                  <td style={{ padding:"10px 14px" }}>
                    <button onClick={() => removeRow(i)} style={{ background:theme.red+"18", color:theme.red, border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ display:"flex", gap:16, marginBottom:20 }}>
        {[
          { label:"Total Rows",    val: rows.length,                                color:theme.blue   },
          { label:"Teaching Periods", val: rows.filter(r => !r.isBreak).length,    color:theme.accent },
          { label:"Breaks",        val: rows.filter(r => r.isBreak).length,         color:theme.orange },
          { label:"Total Time",    val: rows.reduce((a,r) => a + diffMins(r.startTime,r.endTime), 0) + " min", color:theme.green },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:s.color+"12", border:`1px solid ${s.color}22`, borderRadius:10, padding:"12px 16px" }}>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11, color:s.color+"BB", fontWeight:600, fontFamily:"monospace", letterSpacing:0.5 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ background:"linear-gradient(135deg,#6C63FF,#A855F7)", color:"#fff", border:"none", borderRadius:10, padding:"11px 32px", cursor:"pointer", fontSize:14, fontWeight:800, boxShadow:"0 4px 14px #6C63FF33", opacity:saving?0.7:1 }}
      >
        {saving ? "Saving…" : "Save Period Structure →"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — ASSIGN SUBJECTS & TEACHERS
// ─────────────────────────────────────────────────────────────
function CellEditor({ cell, period, teachers, subjects, className, classes, onSave, onClear, onClose }) {
  const [subject,     setSubject]     = useState(cell?.subject   || "");
  const [teacherId,   setTeacherId]   = useState(cell?.teacherId ? String(cell.teacherId) : "");
  const [classFilter, setClassFilter] = useState(className || "");

  // Filter teachers by selected subject and class
  const filteredTeachers = teachers.filter(t => {
    const tSubjects = (t.subject || "").split(",").map(s => s.trim());
    const subjectMatch = !subject || tSubjects.includes(subject);
    const tClasses = (t.assignedClasses || "").split(",").map(c => c.trim()).filter(Boolean);
    const classMatch = !classFilter || tClasses.includes(classFilter);
    return subjectMatch && classMatch;
  });

  // Clear teacher selection if it's no longer in the filtered list
  const prevFiltered = filteredTeachers.some(t => String(t.id) === teacherId);
  if (teacherId && !prevFiltered) {
    // Use effect-like logic via derived state reset
  }

  const handleSubjectChange = val => { setSubject(val); setTeacherId(""); };
  const handleClassChange   = val => { setClassFilter(val); setTeacherId(""); };

  const sel = {
    width:"100%", background:theme.bg, border:`1px solid ${theme.border}`,
    borderRadius:8, padding:"10px 12px", color:theme.text, fontSize:13,
    outline:"none", boxSizing:"border-box", cursor:"pointer",
  };

  const labelStyle = {
    display:"block", fontSize:11, fontWeight:700, color:theme.muted,
    fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase", marginBottom:6,
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#1E1B4B66", backdropFilter:"blur(4px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:theme.card, borderRadius:18, border:`1px solid ${theme.border}`, padding:28, width:420, boxShadow:"0 24px 64px #00000030", maxHeight:"90vh", overflowY:"auto" }}>
        <h3 style={{ margin:"0 0 4px", fontSize:17, fontWeight:800, color:theme.text }}>
          {DAY_LABELS[cell.day]} · {period.periodLabel}
        </h3>
        <p style={{ margin:"0 0 20px", fontSize:12, color:theme.muted, fontFamily:"monospace" }}>
          {fmt(period.startTime)} – {fmt(period.endTime)} &nbsp;·&nbsp; {diffMins(period.startTime?.slice(0,5), period.endTime?.slice(0,5))} min
        </p>

        {/* 1. Subject */}
        <label style={labelStyle}>Subject <span style={{ color:theme.accent }}>*</span></label>
        <select value={subject} onChange={e => handleSubjectChange(e.target.value)} style={{ ...sel, marginBottom:16 }}
          onFocus={e => (e.target.style.borderColor=theme.accent)} onBlur={e => (e.target.style.borderColor=theme.border)}>
          <option value="">— Select Subject —</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* 2. Class filter */}
        <label style={labelStyle}>Filter by Class</label>
        <select value={classFilter} onChange={e => handleClassChange(e.target.value)} style={{ ...sel, marginBottom:16 }}
          onFocus={e => (e.target.style.borderColor=theme.accent)} onBlur={e => (e.target.style.borderColor=theme.border)}>
          <option value="">— All Classes —</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* 3. Teacher list (filtered) */}
        <label style={labelStyle}>
          Teacher
          {subject && (
            <span style={{ fontWeight:500, color:theme.muted, marginLeft:6, fontSize:10, textTransform:"none", letterSpacing:0 }}>
              ({filteredTeachers.length} available)
            </span>
          )}
        </label>

        {!subject ? (
          <div style={{ padding:"12px 14px", background:theme.bg, borderRadius:8, color:theme.muted, fontSize:13, border:`1.5px dashed ${theme.border}`, marginBottom:20, textAlign:"center" }}>
            Select a subject first
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{ padding:"12px 14px", background:theme.orange+"10", borderRadius:8, color:theme.orange, fontSize:13, border:`1px solid ${theme.orange}33`, marginBottom:20, textAlign:"center" }}>
            No teachers found for this subject{classFilter ? ` in class ${classFilter}` : ""}
          </div>
        ) : (
          <div style={{ border:`1px solid ${theme.border}`, borderRadius:10, overflow:"hidden", marginBottom:20, maxHeight:200, overflowY:"auto" }}>
            {/* None option */}
            <div
              onClick={() => setTeacherId("")}
              style={{
                display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer",
                background: !teacherId ? theme.accent+"12" : "transparent",
                borderBottom:`1px solid ${theme.border}22`,
              }}
            >
              <div style={{ width:32, height:32, borderRadius:"50%", background:theme.border+"66", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:theme.muted, flexShrink:0 }}>—</div>
              <span style={{ fontSize:13, color:theme.muted }}>— No teacher —</span>
              {!teacherId && <span style={{ marginLeft:"auto", color:theme.accent }}>✓</span>}
            </div>
            {filteredTeachers.map(t => {
              const active = teacherId === String(t.id);
              const rawPhoto = t.photo || null;
              const photoSrc = rawPhoto ? (rawPhoto.startsWith("data:") ? rawPhoto : `data:image/jpeg;base64,${rawPhoto}`) : null;
              return (
                <div
                  key={t.id}
                  onClick={() => setTeacherId(String(t.id))}
                  style={{
                    display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                    cursor:"pointer", transition:"background 0.1s",
                    background: active ? theme.accent+"12" : "transparent",
                    borderBottom:`1px solid ${theme.border}11`,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.bg; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width:32, height:32, borderRadius:"50%",
                    background: photoSrc ? "transparent" : theme.accent+"22",
                    border:`1.5px solid ${active ? theme.accent : theme.border}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:700, color:theme.accent,
                    overflow:"hidden", flexShrink:0,
                  }}>
                    {photoSrc
                      ? <img src={photoSrc} alt={t.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : t.name[0].toUpperCase()
                    }
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight: active ? 700 : 500, color: active ? theme.accent : theme.text }}>{t.name}</div>
                    <div style={{ fontSize:10, color:theme.muted }}>{t.subject}</div>
                  </div>
                  {active && <span style={{ color:theme.accent, fontSize:14, flexShrink:0 }}>✓</span>}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:"transparent", border:`1px solid ${theme.border}`, color:theme.muted, borderRadius:8, padding:"9px 0", cursor:"pointer", fontSize:13, fontWeight:600 }}>Cancel</button>
          {cell.subject && (
            <button onClick={() => { onClear(cell.day, period.periodNumber); onClose(); }}
              style={{ flex:1, background:theme.red+"18", border:`1px solid ${theme.red}33`, color:theme.red, borderRadius:8, padding:"9px 0", cursor:"pointer", fontSize:13, fontWeight:700 }}>
              Clear
            </button>
          )}
          <button
            onClick={() => {
              if (!subject) { alert("Please select a subject"); return; }
              onSave(cell.day, period.periodNumber, subject, teacherId || null);
              onClose();
            }}
            style={{ flex:2, background:theme.accent, border:"none", color:"#fff", borderRadius:8, padding:"9px 0", cursor:"pointer", fontSize:13, fontWeight:800 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignStep({ className, periods, teachers, subjects, classes, onBack }) {
  const teachingPeriods = periods.filter(p => !p.isBreak);
  const [grid,        setGrid]        = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [toast,       setToast]       = useState(null);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const slots = await timetableAPI.getByClass(className);
        setGrid(buildGrid(slots, periods, teachers));
      } catch (err) {
        setError("Failed to load assignments: " + err.message);
        setGrid(makeEmptyGrid(periods));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [className, periods, teachers]);

  const handleCellClick = (day, periodNum) => {
    const cell = grid[day][periodNum];
    setEditingCell({
      day, periodNumber: periodNum,
      subject:   cell?.subject   || "",
      teacherId: cell?.teacherId || "",
    });
  };

  const handleSaveCell = (day, periodNum, subject, teacherId) => {
    const teacher = teachers.find(t => String(t.id) === String(teacherId));
    setGrid(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [periodNum]: {
          ...prev[day][periodNum],
          subject,
          teacherId:    teacherId || null,
          teacherName:  teacher?.name  || "",
          teacherPhoto: teacher?.photo || null,
        },
      },
    }));
    setDirty(true);
  };

  const handleClearCell = (day, periodNum) => {
    setGrid(prev => ({ ...prev, [day]: { ...prev[day], [periodNum]: null } }));
    setDirty(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const entries = [];
      DAYS.forEach(day => {
        teachingPeriods.forEach(p => {
          const cell = grid[day][p.periodNumber];
          if (cell?.subject) entries.push({ day, period: p.periodNumber, cell });
        });
      });

      if (entries.length === 0) {
        setToast({ message:"Please assign at least one period.", type:"error" });
        setSubmitting(false);
        return;
      }

      await Promise.all(
        entries.map(({ day, period, cell }) => {
          console.log("cell", cell)
          const payload = { className, dayOfWeek:day, periodNumber:period, subject:cell.subject, teacherId:parseInt(cell.teacherId) || null };
          return cell.entryId ? timetableAPI.update(cell.entryId, payload) : timetableAPI.create(payload);
        })
      );

      const slots = await timetableAPI.getByClass(className);
      setGrid(buildGrid(slots, periods, teachers));
      setDirty(false);
      setToast({ message:`Timetable for Class ${className} saved successfully!`, type:"success" });
    } catch (err) {
      setToast({ message:"Save failed: " + err.message, type:"error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filled = grid ? DAYS.reduce((acc, d) => {
    teachingPeriods.forEach(p => { if (grid[d][p.periodNumber]?.subject) acc++; });
    return acc;
  }, 0) : 0;
  const total = DAYS.length * teachingPeriods.length;

  if (loading) return <LoadingSpinner message="Loading assignments…" />;
  if (error)   return <ErrorMessage  message={error} />;

  const editPeriod = editingCell ? periods.find(p => p.periodNumber === editingCell.periodNumber) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <div>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:theme.text }}>Step 2 — Assign Subjects &amp; Teachers</h3>
          <p style={{ margin:"4px 0 0", fontSize:12, color:theme.muted }}>Click any cell to assign a subject and teacher for that period.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onBack} style={{ background:theme.surface, border:`1px solid ${theme.border}`, color:theme.muted, borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            ← Edit Periods
          </button>
          <div style={{ background:theme.accent+"18", border:`1px solid ${theme.accent}33`, borderRadius:20, padding:"5px 14px", fontSize:12, color:theme.accent, fontWeight:700 }}>
            {filled} / {total} filled
          </div>
          {dirty && (
            <button onClick={() => { setGrid(makeEmptyGrid(periods)); setDirty(true); }}
              style={{ background:theme.red+"18", color:theme.red, border:`1px solid ${theme.red}33`, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>
              Clear All
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || !dirty}
            style={{ background:dirty?"linear-gradient(135deg,#6C63FF,#A855F7)":theme.border, color:dirty?"#fff":theme.muted, border:"none", borderRadius:8, padding:"9px 24px", cursor:dirty?"pointer":"not-allowed", fontSize:13, fontWeight:800, boxShadow:dirty?"0 4px 14px #6C63FF33":"none", opacity:submitting?0.7:1, transition:"all 0.2s" }}>
            {submitting ? "Saving…" : "💾  Save Timetable"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ background:theme.card, borderRadius:14, border:`1px solid ${theme.border}`, overflow:"auto", boxShadow:"0 2px 12px #6C63FF0A" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th style={{ padding:"13px 16px", color:theme.accent, textAlign:"left", fontFamily:"monospace", fontSize:11, letterSpacing:1.5, borderBottom:`1px solid ${theme.border}`, background:theme.surface, minWidth:130 }}>PERIOD</th>
              {DAYS.map(d => (
                <th key={d} style={{ padding:"13px 16px", color:theme.muted, textAlign:"left", fontFamily:"monospace", fontSize:11, letterSpacing:1.5, borderBottom:`1px solid ${theme.border}`, background:theme.surface, minWidth:145 }}>
                  {DAY_LABELS[d].toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period.periodNumber} style={{ borderBottom:`1px solid ${theme.border}22` }}>
                {/* Period label cell */}
                <td style={{ padding:"10px 16px", background:theme.surface, whiteSpace:"nowrap" }}>
                  <div style={{ fontWeight:800, color:period.isBreak?theme.orange:theme.text, fontSize:13 }}>
                    {period.periodLabel}
                  </div>
                  <div style={{ color:theme.muted, fontSize:10, marginTop:2 }}>
                    {fmt(period.startTime)} – {fmt(period.endTime)}
                  </div>
                  <div style={{ color:theme.muted, fontSize:10 }}>
                    {diffMins(period.startTime?.slice(0,5), period.endTime?.slice(0,5))} min
                  </div>
                </td>
                {DAYS.map(day => {
                  if (period.isBreak) {
                    return (
                      <td key={day} style={{ padding:"8px 10px" }}>
                        <div style={{ background:theme.orange+"15", color:theme.orange, borderRadius:8, padding:"10px 12px", fontSize:11, fontWeight:700, textAlign:"center", fontFamily:"monospace", letterSpacing:1, border:`1px solid ${theme.orange}22` }}>
                          — {period.periodLabel.toUpperCase()} —
                        </div>
                      </td>
                    );
                  }
                  const cell  = grid[day][period.periodNumber];
                  const color = cell?.subject ? (subjectColors[cell.subject] || theme.blue) : null;
                  return (
                    <td key={day} style={{ padding:"7px 9px" }}>
                      <div
                        onClick={() => handleCellClick(day, period.periodNumber)}
                        title={cell?.subject ? `Click to edit: ${cell.subject}` : "Click to assign"}
                        style={{ borderRadius:10, padding:"10px 12px", cursor:"pointer", transition:"all 0.15s", minHeight:58, display:"flex", flexDirection:"column", justifyContent:"center", border:cell?.subject?`1px solid ${color}44`:`1.5px dashed ${theme.border}`, background:cell?.subject?color+"15":"transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=theme.accent; e.currentTarget.style.background=theme.accent+"0D"; e.currentTarget.style.transform="scale(1.02)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor=cell?.subject?color+"44":theme.border; e.currentTarget.style.background=cell?.subject?color+"15":"transparent"; e.currentTarget.style.transform="scale(1)"; }}
                      >
                        {cell?.subject ? (
                          <>
                            <div style={{ fontSize:12, fontWeight:800, color, lineHeight:1.3 }}>{cell.subject}</div>
                            {cell.teacherName && (
                              <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                                {cell.teacherPhoto && (() => {
                                  const src = cell.teacherPhoto.startsWith("data:") ? cell.teacherPhoto : `data:image/jpeg;base64,${cell.teacherPhoto}`;
                                  return <img src={src} alt={cell.teacherName} style={{ width:16, height:16, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />;
                                })()}
                                <div style={{ fontSize:10, color:color+"CC", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cell.teacherName}</div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize:11, color:theme.border, textAlign:"center", fontWeight:600 }}>+ Add</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dirty && (
        <div style={{ marginTop:10, textAlign:"right", color:theme.accent, fontSize:12, fontWeight:700 }}>
          ● Unsaved changes — click Save Timetable
        </div>
      )}

      {editingCell && editPeriod && (
        <CellEditor
          cell={editingCell}
          period={editPeriod}
          teachers={teachers}
          subjects={subjects}
          className={className}
          classes={classes}
          onSave={handleSaveCell}
          onClear={handleClearCell}
          onClose={() => setEditingCell(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function Timetable() {
  const [classes,       setClasses]       = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [periods,       setPeriods]       = useState([]);
  const [step,          setStep]          = useState("setup"); // "setup" | "assign"
  const [initLoading,   setInitLoading]   = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [error,         setError]         = useState(null);

  // Load classes + teachers on mount
  useEffect(() => {
    const init = async () => {
      setInitLoading(true);
      try {
        const [classData, teacherData, subjectData] = await Promise.all([
          classAPI.getAll(),
          teacherAPI.getAll(),
          configAPI.getSubjects().catch(() => []),
        ]);
        const names = classData.map(c => c.className).sort();
        setClasses(names);
        setTeachers(teacherData.map(t => ({ id:t.id, name:t.name, subject:t.subject || "", photo:t.photoBase64 ?? null, assignedClasses:t.assignedClasses || "" })));
        const subjectNames = subjectData.length
          ? subjectData.map(s => s.name)
          : FALLBACK_SUBJECTS;
        setSubjects(subjectNames);
        if (names.length > 0) setSelectedClass(names[0]);
      } catch (err) {
        setError("Failed to load: " + err.message);
      } finally {
        setInitLoading(false);
      }
    };
    init();
  }, []);

  // Load periods when class changes
  useEffect(() => {
    if (!selectedClass) return;
    const load = async () => {
      setPeriodLoading(true);
      setStep("setup");
      try {
        const data = await periodAPI.getByClass(selectedClass);
        setPeriods(data);
        // If periods already configured, jump straight to assign step
        if (data.length > 0) setStep("assign");
      } catch (err) {
        setPeriods([]);
        setStep("setup");
        console.log(err)
      } finally {
        setPeriodLoading(false);
      }
    };
    load();
  }, [selectedClass]);

  const handlePeriodsSaved = (saved) => {
    setPeriods(saved);
    setStep("assign");
  };

  if (initLoading) return <LoadingSpinner message="Initialising timetable…" />;
  if (error)       return <ErrorMessage  message={error} />;

  return (
    <div>
      {/* ── Top bar ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:theme.text }}>Class Timetable</h2>
          <p style={{ margin:"4px 0 0", fontSize:12, color:theme.muted }}>
            {step === "setup" ? "Configure the period structure first, then assign subjects." : `Managing timetable for Class ${selectedClass}`}
          </p>
        </div>

        {/* Class selector */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {/* Step indicator */}
          <div style={{ display:"flex", gap:0, borderRadius:8, overflow:"hidden", border:`1px solid ${theme.border}` }}>
            {[["setup","1 · Period Setup"],["assign","2 · Assign Subjects"]].map(([s, label]) => (
              <button
                key={s}
                onClick={() => { if (s === "assign" && periods.length === 0) { alert("Please save period structure first."); return; } setStep(s); }}
                style={{
                  padding:"7px 16px", fontSize:12, fontWeight:700, border:"none", cursor:"pointer",
                  background: step === s ? theme.accent : theme.surface,
                  color:      step === s ? "#fff"        : theme.muted,
                  transition:"all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            style={{ background:theme.card, border:`1px solid ${theme.border}`, color:theme.text, borderRadius:8, padding:"8px 14px", fontSize:14, cursor:"pointer", outline:"none" }}
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      {periodLoading
        ? <LoadingSpinner message={`Loading period structure for ${selectedClass}…`} />
        : step === "setup"
          ? <PeriodSetup
              className={selectedClass}
              existingPeriods={periods}
              onSaved={handlePeriodsSaved}
            />
          : <AssignStep
              className={selectedClass}
              periods={periods}
              teachers={teachers}
              subjects={subjects}
              classes={classes}
              onBack={() => setStep("setup")}
            />
      }
    </div>
  );
}