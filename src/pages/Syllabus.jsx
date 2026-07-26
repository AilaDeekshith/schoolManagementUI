// pages/Syllabus.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "../toast";
import { theme } from "../theme";
import { syllabusAPI, configAPI } from "../api/apiService";

// ── Colour tokens ─────────────────────────────────────────────────────
const TEAL   = "#0D9488";
const TEAL_L = "#CCFBF1";
const TEAL_B = "#99F6E4";

// ── YouTube helpers ───────────────────────────────────────────────────
const getYtId = url => {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return m ? m[1] : null;
};
const isYt      = url => !!getYtId(url);
const ytThumb   = url => `https://img.youtube.com/vi/${getYtId(url)}/mqdefault.jpg`;

// ── Auto-detect reference type from URL ──────────────────────────────
const detectType = url => {
  if (!url) return "WEBSITE";
  if (isYt(url)) return "YOUTUBE";
  if (/\.pdf(\?|$)/i.test(url)) return "PDF";
  if (/drive\.google\.com|docs\.google\.com/i.test(url)) return "DOCUMENT";
  return "WEBSITE";
};

// ── Reference type display config ─────────────────────────────────────
const REF_CFG = {
  YOUTUBE:  { icon: "▶", label: "YouTube",  bg: "#FEE2E2", color: "#DC2626" },
  WEBSITE:  { icon: "🔗", label: "Website",  bg: "#EFF6FF", color: "#2563EB" },
  PDF:      { icon: "📄", label: "PDF",      bg: "#FEF3C7", color: "#D97706" },
  DOCUMENT: { icon: "📑", label: "Document", bg: "#F3E8FF", color: "#7C3AED" },
  OTHER:    { icon: "🔖", label: "Other",    bg: "#F3F4F6", color: "#6B7280" },
};

// ── Topic status config ───────────────────────────────────────────────
const STATUS_CFG = {
  NOT_STARTED: { label: "Not Started", dot: "#9CA3AF", bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB", next: "IN_PROGRESS"  },
  IN_PROGRESS: { label: "In Progress", dot: "#F59E0B", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", next: "COMPLETED"   },
  COMPLETED:   { label: "Completed",   dot: "#10B981", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", next: "NOT_STARTED" },
};

// ── Blank forms ───────────────────────────────────────────────────────
const blankTopic = { title: "", description: "", estimatedHours: "", isKeyTopic: false, status: "NOT_STARTED" };
const blankRef   = { title: "", url: "", type: "WEBSITE", description: "" };
const blankSyl   = { gradeName: "", subjectName: "", academicYear: "", description: "", totalHours: "" };

// ── Shared primitives ─────────────────────────────────────────────────
const inp = (extra = {}) => ({
  padding: "8px 11px", borderRadius: 8, border: `1.5px solid ${theme.border}`,
  background: "#fff", color: theme.text, fontSize: 13, outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif", ...extra,
});

const Btn = ({ children, onClick, type = "button", variant = "primary", small, disabled, style: s }) => {
  const base = {
    padding: small ? "5px 11px" : "8px 16px", borderRadius: 8, border: "none",
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, opacity: disabled ? 0.55 : 1,
    fontSize: small ? 11 : 13, fontFamily: "'DM Sans',sans-serif", transition: "opacity .15s", ...s,
  };
  const variants = {
    primary: { background: TEAL,                color: "#fff" },
    ghost:   { background: theme.bg,            color: theme.muted, border: `1px solid ${theme.border}` },
    danger:  { background: "#FEE2E2",           color: "#DC2626", border: "1px solid #FECACA" },
    teal:    { background: TEAL_L,              color: TEAL,     border: `1px solid ${TEAL_B}` },
    icon:    { background: "transparent",       color: theme.muted, padding: "4px 8px" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
};

// ── Progress bar ──────────────────────────────────────────────────────
function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const color = pct === 100 ? "#10B981" : pct >= 50 ? TEAL : "#F59E0B";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>
          {done} / {total} topics completed
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</div>
      </div>
      <div style={{ height: 8, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          borderRadius: 99, transition: "width .6s cubic-bezier(.4,0,.2,1)",
          boxShadow: pct > 0 ? `0 0 6px ${color}88` : "none",
        }} />
      </div>
    </div>
  );
}

// ── Reference card ────────────────────────────────────────────────────
function RefCard({ ref: r, onEdit, onDelete }) {
  const cfg = REF_CFG[r.type] || REF_CFG.OTHER;
  const ytId = r.type === "YOUTUBE" ? getYtId(r.url) : null;
  let domain = "";
  try { domain = new URL(r.url).hostname.replace("www.", ""); } catch {}

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px", borderRadius: 10,
      background: cfg.bg, border: `1px solid ${cfg.color}22`,
    }}>
      {/* Thumbnail / icon */}
      {ytId ? (
        <a href={r.url} target="_blank" rel="noreferrer" style={{ position: "relative", flexShrink: 0, display: "block" }}>
          <img
            src={ytThumb(r.url)}
            alt={r.title}
            style={{ width: 80, height: 50, borderRadius: 7, objectFit: "cover", display: "block" }}
            onError={e => { e.target.style.display = "none"; }}
          />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.32)", borderRadius: 7,
          }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>▶</div>
          </div>
        </a>
      ) : (
        <div style={{
          width: 38, height: 38, borderRadius: 9, background: cfg.color + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, flexShrink: 0,
        }}>{cfg.icon}</div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={r.url} target="_blank" rel="noreferrer"
          style={{ fontWeight: 700, fontSize: 13, color: theme.text, textDecoration: "none", display: "block",
                   whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {r.title}
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg,
                         border: `1px solid ${cfg.color}33`, borderRadius: 5, padding: "1px 6px" }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 11, color: theme.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
            {domain}
          </span>
        </div>
        {r.description && <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{r.description}</div>}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <Btn variant="icon" small onClick={onEdit}>✎</Btn>
        <Btn variant="icon" small onClick={onDelete} style={{ color: "#EF4444" }}>🗑</Btn>
      </div>
    </div>
  );
}

// ── Inline reference form ─────────────────────────────────────────────
function RefForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...blankRef, ...(initial || {}) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUrlBlur = () => {
    if (!form.url) return;
    const detected = detectType(form.url);
    if (detected !== form.type) set("type", detected);
    // Auto-fill title from domain if empty
    if (!form.title) {
      try {
        const domain = new URL(form.url).hostname.replace("www.", "");
        set("title", domain);
      } catch {}
    }
  };

  return (
    <div style={{ padding: "14px 16px", background: "#F0FDFA", borderRadius: 10, border: `1.5px solid ${TEAL_B}`, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: TEAL, letterSpacing: .5, textTransform: "uppercase" }}>
        {initial ? "Edit Reference" : "Add Reference"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, marginBottom: 4 }}>URL *</div>
          <input value={form.url} onChange={e => set("url", e.target.value)} onBlur={handleUrlBlur}
            placeholder="https://… or youtube.com/…" style={inp()} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, marginBottom: 4 }}>Title *</div>
          <input value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="Descriptive title" style={inp()} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, marginBottom: 4 }}>Type</div>
          <select value={form.type} onChange={e => set("type", e.target.value)} style={inp()}>
            {Object.keys(REF_CFG).map(t => <option key={t} value={t}>{REF_CFG[t].icon} {REF_CFG[t].label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, marginBottom: 4 }}>Note (optional)</div>
          <input value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Short note about this resource" style={inp()} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="primary" small onClick={() => form.title && form.url && onSave(form)}>Save</Btn>
        <Btn variant="ghost"   small onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

// ── Topic card ─────────────────────────────────────────────────────────
function TopicCard({ topic, index, isFirst, isLast, onStatusCycle, onKeyToggle, onMoveUp, onMoveDown, onDelete, onSaveEdit, onAddRef, onSaveRef, onDeleteRef }) {
  const [expanded, setExpanded]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [addingRef, setAddingRef] = useState(false);
  const [editingRef, setEditingRef] = useState(null); // ref id
  const [editForm, setEditForm]   = useState({ title: topic.title, description: topic.description || "", estimatedHours: topic.estimatedHours || "", isKeyTopic: !!topic.isKeyTopic });

  const sc = STATUS_CFG[topic.status] || STATUS_CFG.NOT_STARTED;

  const handleSaveEdit = async () => {
    await onSaveEdit(topic.id, { ...editForm, estimatedHours: editForm.estimatedHours ? Number(editForm.estimatedHours) : null });
    setEditing(false);
  };

  return (
    <div style={{
      border: `1.5px solid ${topic.isKeyTopic ? "#FDE68A" : theme.border}`,
      borderLeft: `4px solid ${sc.dot}`,
      borderRadius: 12, overflow: "hidden",
      background: "#fff",
      boxShadow: topic.isKeyTopic ? "0 2px 12px rgba(245,158,11,0.12)" : "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      {/* ── Topic header row ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
        {/* Order number */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: sc.bg, border: `1.5px solid ${sc.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 900, color: sc.text,
        }}>{index}</div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                style={inp({ fontWeight: 700, fontSize: 14 })} placeholder="Topic title" autoFocus />
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={2} style={{ ...inp(), resize: "vertical" }} placeholder="Description (optional)" />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" value={editForm.estimatedHours} onChange={e => setEditForm(f => ({ ...f, estimatedHours: e.target.value }))}
                  style={inp({ width: 100 })} placeholder="Hours" min={0} />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#D97706", fontWeight: 600, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!editForm.isKeyTopic} onChange={e => setEditForm(f => ({ ...f, isKeyTopic: e.target.checked }))} />
                  ⭐ Key Topic
                </label>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="primary" small onClick={handleSaveEdit}>Save</Btn>
                <Btn variant="ghost"   small onClick={() => setEditing(false)}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{topic.title}</span>
                {topic.isKeyTopic && <span style={{ fontSize: 11, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", borderRadius: 20, padding: "1px 8px", fontWeight: 700 }}>⭐ Key Topic</span>}
                {topic.estimatedHours && <span style={{ fontSize: 11, color: theme.muted }}>· {topic.estimatedHours}h</span>}
              </div>
              {topic.description && (
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 1.5 }}>{topic.description}</div>
              )}
              {topic.references?.length > 0 && !expanded && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {topic.references.slice(0, 3).map(r => {
                    const cfg = REF_CFG[r.type] || REF_CFG.OTHER;
                    return (
                      <span key={r.id} style={{ fontSize: 10, background: cfg.bg, color: cfg.color, borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>
                        {cfg.icon} {r.title}
                      </span>
                    );
                  })}
                  {topic.references.length > 3 && <span style={{ fontSize: 10, color: theme.muted }}>+{topic.references.length - 3} more</span>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right controls */}
        {!editing && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* Status chip — click to cycle */}
            <button onClick={() => onStatusCycle(topic.id, sc.next)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
              background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
              borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }} title="Click to change status">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
              {sc.label}
            </button>

            {/* Move up/down */}
            <Btn variant="ghost" small onClick={onMoveUp}  disabled={isFirst} style={{ padding: "4px 8px", fontSize: 13 }}>↑</Btn>
            <Btn variant="ghost" small onClick={onMoveDown} disabled={isLast}  style={{ padding: "4px 8px", fontSize: 13 }}>↓</Btn>

            {/* Star toggle */}
            <Btn variant="ghost" small onClick={() => onKeyToggle(topic.id, !topic.isKeyTopic)}
              style={{ padding: "4px 8px", fontSize: 13, color: topic.isKeyTopic ? "#D97706" : theme.muted }}>⭐</Btn>

            {/* Edit */}
            <Btn variant="ghost" small onClick={() => setEditing(true)} style={{ padding: "4px 8px" }}>✎</Btn>

            {/* Expand refs */}
            <Btn variant="ghost" small onClick={() => setExpanded(e => !e)}
              style={{ padding: "4px 8px", color: TEAL }}>
              {expanded ? "▲" : `📎 ${topic.references?.length || 0}`}
            </Btn>

            {/* Delete */}
            <Btn variant="icon" small onClick={() => window.confirm("Delete this topic?") && onDelete(topic.id)}
              style={{ color: "#EF4444", padding: "4px 8px" }}>🗑</Btn>
          </div>
        )}
      </div>

      {/* ── References section ── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${theme.border}`, padding: "14px 16px", background: "#FAFAFA", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: .8, textTransform: "uppercase", marginBottom: 4 }}>
            References ({topic.references?.length || 0})
          </div>

          {topic.references?.map(r =>
            editingRef === r.id ? (
              <RefForm key={r.id} initial={r} onCancel={() => setEditingRef(null)}
                onSave={async data => { await onSaveRef(r.id, data); setEditingRef(null); }} />
            ) : (
              <RefCard key={r.id} ref={r}
                onEdit={() => setEditingRef(r.id)}
                onDelete={() => window.confirm("Delete this reference?") && onDeleteRef(r.id)} />
            )
          )}

          {addingRef ? (
            <RefForm onCancel={() => setAddingRef(false)}
              onSave={async data => { await onAddRef(topic.id, data); setAddingRef(false); }} />
          ) : (
            <button onClick={() => setAddingRef(true)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 12px", border: `1.5px dashed ${TEAL_B}`,
              borderRadius: 9, background: "#F0FDFA", color: TEAL,
              fontWeight: 600, fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}>
              + Add Reference (link, YouTube, PDF…)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── New / Edit Syllabus modal ─────────────────────────────────────────
function SyllabusModal({ grades, configSubjects, existingSubjectNames, initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...blankSyl, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.gradeName || !form.subjectName || !form.academicYear) return;
    setSaving(true);
    try { await onSave({ ...form, totalHours: form.totalHours ? Number(form.totalHours) : null }); onClose(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const YEARS = ["2023-24", "2024-25", "2025-26", "2026-27"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>
            {initial ? "Edit Syllabus" : "New Syllabus"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.muted, fontSize: 24, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Grade */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 5 }}>Grade *</div>
              <select value={form.gradeName} onChange={e => set("gradeName", e.target.value)} required style={inp()}>
                <option value="">— Select Grade —</option>
                {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            {/* Subject */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 5 }}>Subject *</div>
              <select value={form.subjectName} onChange={e => set("subjectName", e.target.value)} required style={inp()}>
                <option value="">— Select Subject —</option>
                {configSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            {/* Year */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 5 }}>Academic Year *</div>
              <select value={form.academicYear} onChange={e => set("academicYear", e.target.value)} required style={inp()}>
                <option value="">— Select Year —</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {/* Hours */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 5 }}>Total Hours</div>
              <input type="number" min={0} value={form.totalHours} onChange={e => set("totalHours", e.target.value)}
                placeholder="e.g. 120" style={inp()} />
            </div>
          </div>
          {/* Description */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 5 }}>Description</div>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} style={{ ...inp(), resize: "vertical" }} placeholder="Brief overview of the syllabus…" />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: "10px 0", background: TEAL, color: "#fff", border: "none",
              borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif",
            }}>
              {saving ? "Saving…" : initial ? "Update" : "Create Syllabus"}
            </button>
            <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Inline add topic form ─────────────────────────────────────────────
function AddTopicForm({ onSave, onCancel }) {
  const [form, setForm] = useState(blankTopic);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null });
  };

  return (
    <div style={{ border: `1.5px dashed ${TEAL_B}`, borderRadius: 12, padding: "16px 18px", background: "#F0FDFA", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: .5, textTransform: "uppercase" }}>New Topic</div>
      <input ref={titleRef} value={form.title} onChange={e => set("title", e.target.value)}
        placeholder="Topic title (e.g. Wave Motion)" style={inp({ fontWeight: 600 })}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }} />
      <textarea value={form.description} onChange={e => set("description", e.target.value)}
        rows={2} style={{ ...inp(), resize: "vertical" }} placeholder="Description (optional)" />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted }}>Est. Hours</div>
          <input type="number" value={form.estimatedHours} onChange={e => set("estimatedHours", e.target.value)}
            style={inp({ width: 90 })} placeholder="hrs" min={0} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted }}>Status</div>
          <select value={form.status} onChange={e => set("status", e.target.value)} style={inp({ width: 140 })}>
            {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#D97706", fontWeight: 600, cursor: "pointer", marginTop: 18 }}>
          <input type="checkbox" checked={form.isKeyTopic} onChange={e => set("isKeyTopic", e.target.checked)} />
          ⭐ Key Topic
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="primary" onClick={handleSave} disabled={!form.title.trim()}>+ Add Topic</Btn>
        <Btn variant="ghost"   onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════
export default function Syllabus() {
  // Config data
  const [grades, setGrades]             = useState([]);
  const [configSubjects, setConfigSubjects] = useState([]);

  // Syllabus data
  const [syllabi, setSyllabi]           = useState([]);   // for selected grade
  const [selected, setSelected]         = useState(null); // full syllabus object
  const [selectedGrade, setSelectedGrade] = useState(null);

  // UI
  const [loading, setLoading]           = useState(true);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [modal, setModal]               = useState(null); // null | { mode:"add"|"edit", data:{} }
  const [search, setSearch]             = useState("");

  // ── Load config (grades + subjects) ────────────────────────────────
  useEffect(() => {
    Promise.allSettled([configAPI.getGrades(), configAPI.getSubjects()])
      .then(([g, s]) => {
        if (g.status === "fulfilled") setGrades(g.value);
        if (s.status === "fulfilled") setConfigSubjects(s.value);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Load syllabi for selected grade ────────────────────────────────
  const loadSyllabi = useCallback(async (grade) => {
    setSyllabusLoading(true);
    const data = await syllabusAPI.getByGrade(grade).catch(() => []);
    setSyllabi(data);
    setSyllabusLoading(false);
  }, []);

  const selectGrade = grade => {
    setSelectedGrade(grade);
    setSelected(null);
    setSearch("");
    setShowAddTopic(false);
    loadSyllabi(grade);
  };

  const selectSyllabus = syl => {
    setSelected(syl);
    setSearch("");
    setShowAddTopic(false);
  };

  // ── Refresh the currently open syllabus ────────────────────────────
  const refreshSelected = async () => {
    if (!selected) return;
    const fresh = await syllabusAPI.getById(selected.id).catch(() => null);
    if (fresh) setSelected(fresh);
    // also refresh the sidebar list
    loadSyllabi(selectedGrade);
  };

  // ── Syllabus CRUD handlers ─────────────────────────────────────────
  const handleCreateSyllabus = async data => {
    await syllabusAPI.create(data);
    await loadSyllabi(data.gradeName);
    // auto-select the new one
    const all = await syllabusAPI.getByGrade(data.gradeName).catch(() => []);
    setSyllabi(all);
    const newSyl = all.find(s => s.subjectName === data.subjectName && s.academicYear === data.academicYear);
    if (newSyl) setSelected(newSyl);
  };

  const handleEditSyllabus = async data => {
    await syllabusAPI.update(selected.id, data);
    await refreshSelected();
  };

  const handleDeleteSyllabus = async () => {
    if (!window.confirm(`Delete the ${selected.subjectName} syllabus for ${selected.gradeName}? All topics and references will be lost.`)) return;
    await syllabusAPI.delete(selected.id);
    setSelected(null);
    loadSyllabi(selectedGrade);
  };

  // ── Topic handlers ─────────────────────────────────────────────────
  const handleAddTopic = async data => {
    await syllabusAPI.addTopic(selected.id, data);
    await refreshSelected();
    setShowAddTopic(false);
  };

  const handleEditTopic = async (topicId, data) => {
    await syllabusAPI.updateTopic(topicId, data);
    await refreshSelected();
  };

  const handleDeleteTopic = async topicId => {
    await syllabusAPI.deleteTopic(topicId);
    await refreshSelected();
  };

  const handleStatusCycle = async (topicId, nextStatus) => {
    await syllabusAPI.patchStatus(topicId, nextStatus);
    await refreshSelected();
  };

  const handleKeyToggle = async (topicId, flag) => {
    await syllabusAPI.patchKey(topicId, flag);
    await refreshSelected();
  };

  const handleMove = async (topicId, dir) => {
    const updated = await syllabusAPI.moveTopic(topicId, dir);
    setSelected(updated);
  };

  // ── Reference handlers ─────────────────────────────────────────────
  const handleAddRef = async (topicId, data) => {
    await syllabusAPI.addReference(topicId, data);
    await refreshSelected();
  };

  const handleSaveRef = async (refId, data) => {
    await syllabusAPI.updateReference(refId, data);
    await refreshSelected();
  };

  const handleDeleteRef = async refId => {
    await syllabusAPI.deleteReference(refId);
    await refreshSelected();
  };

  // ── Computed ──────────────────────────────────────────────────────
  const filteredTopics = (selected?.topics || []).filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = (selected?.topics || []).filter(t => t.status === "COMPLETED").length;
  const totalCount     = (selected?.topics || []).length;
  const keyTopicCount  = (selected?.topics || []).filter(t => t.isKeyTopic).length;

  // ── Existing subject names for the selected grade (to show what's done) ──
  const existingSubjectNames = syllabi.map(s => s.subjectName);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center", color: theme.muted }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
        <div style={{ fontWeight: 600 }}>Loading syllabus…</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>Syllabus</div>
              <div style={{ fontSize: 12, color: theme.muted }}>Grade & subject-wise curriculum with references</div>
            </div>
          </div>
        </div>
        <Btn variant="primary" onClick={() => setModal({ mode: "add", data: {} })} disabled={grades.length === 0}>
          + New Syllabus
        </Btn>
      </div>

      {/* ── Two-panel body ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>

        {/* ── LEFT PANEL: Grade + Subject navigator ─────────────── */}
        <div style={{
          width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4,
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: theme.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Grades</div>

          {grades.length === 0 ? (
            <div style={{ fontSize: 12, color: theme.muted, padding: "8px 0" }}>
              No grades configured — go to <strong>Configuration → Grades</strong>
            </div>
          ) : (
            grades.map(g => {
              const isGrade = selectedGrade === g.name;
              const gradeCount = isGrade ? syllabi.length : null;
              return (
                <div key={g.id}>
                  {/* Grade button */}
                  <button onClick={() => selectGrade(g.name)} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", borderRadius: 9, border: `1px solid ${isGrade ? TEAL_B : theme.border}`,
                    background: isGrade ? TEAL_L : "#fff", color: isGrade ? TEAL : theme.text,
                    fontWeight: isGrade ? 800 : 500, fontSize: 13, cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif", transition: "all .15s", marginBottom: 3,
                  }}>
                    <span>{g.name}</span>
                    {isGrade && gradeCount !== null && (
                      <span style={{ background: TEAL, color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                        {gradeCount}
                      </span>
                    )}
                  </button>

                  {/* Subjects for selected grade */}
                  {isGrade && (
                    <div style={{ paddingLeft: 10, marginBottom: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                      {syllabusLoading ? (
                        <div style={{ fontSize: 11, color: theme.muted, padding: "4px 8px" }}>Loading…</div>
                      ) : syllabi.length === 0 ? (
                        <div style={{ fontSize: 11, color: theme.muted, padding: "4px 8px" }}>No syllabi yet</div>
                      ) : (
                        syllabi.map(syl => {
                          const isSel = selected?.id === syl.id;
                          const done  = (syl.topics || []).filter(t => t.status === "COMPLETED").length;
                          const total = (syl.topics || []).length;
                          return (
                            <button key={syl.id} onClick={() => selectSyllabus(syl)} style={{
                              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "8px 10px", borderRadius: 8,
                              border: `1px solid ${isSel ? TEAL_B : theme.border}`,
                              background: isSel ? "#E6FFFA" : "#FAFAFA",
                              color: isSel ? TEAL : theme.text,
                              fontWeight: isSel ? 700 : 500, fontSize: 12, cursor: "pointer",
                              fontFamily: "'DM Sans',sans-serif", textAlign: "left",
                            }}>
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {syl.subjectName}
                              </span>
                              {total > 0 && (
                                <span style={{ fontSize: 10, color: done === total ? "#10B981" : theme.muted, fontWeight: 600, flexShrink: 0 }}>
                                  {done}/{total}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                      <button onClick={() => setModal({ mode: "add", data: { gradeName: selectedGrade } })} style={{
                        width: "100%", padding: "6px 10px", border: `1px dashed ${TEAL_B}`,
                        borderRadius: 8, background: "#F0FDFA", color: TEAL,
                        fontWeight: 600, fontSize: 11, cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif",
                      }}>
                        + Add Subject Syllabus
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>

          {!selectedGrade ? (
            /* No grade selected */
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", textAlign: "center",
              color: theme.muted, padding: 40,
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
                Select a Grade to get started
              </div>
              <div style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.6 }}>
                Choose a grade from the left panel to view or manage its subject syllabi, topics, and online references.
              </div>
              {grades.length === 0 && (
                <div style={{ marginTop: 16, padding: "10px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: 12, color: "#92400E" }}>
                  ⚠️ No grades found — first add grades in <strong>Configuration → Grades</strong>
                </div>
              )}
            </div>
          ) : !selected ? (
            /* Grade selected but no syllabus chosen */
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", textAlign: "center",
              color: theme.muted, padding: 40,
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📖</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 6 }}>
                {syllabi.length === 0 ? `No syllabi for ${selectedGrade} yet` : `Select a subject for ${selectedGrade}`}
              </div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>
                {syllabi.length === 0
                  ? "Create the first syllabus for this grade."
                  : "Pick a subject from the left panel to see its topics."}
              </div>
              <button onClick={() => setModal({ mode: "add", data: { gradeName: selectedGrade } })} style={{
                padding: "10px 22px", background: TEAL, color: "#fff", border: "none",
                borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}>
                + Add Subject Syllabus for {selectedGrade}
              </button>
            </div>
          ) : (
            /* Syllabus view */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* ── Syllabus header card ── */}
              <div style={{
                background: `linear-gradient(135deg, ${TEAL_L} 0%, #E0FDF4 100%)`,
                border: `1px solid ${TEAL_B}`, borderRadius: 16, padding: "20px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: TEAL, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase", marginBottom: 6 }}>
                      {selected.gradeName}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: theme.text, marginBottom: 4 }}>
                      {selected.subjectName}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: theme.muted }}>{selected.academicYear}</span>
                      {selected.totalHours && <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>· {selected.totalHours} total hours</span>}
                      {keyTopicCount > 0 && <span style={{ fontSize: 11, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", borderRadius: 20, padding: "1px 8px", fontWeight: 700 }}>⭐ {keyTopicCount} key topics</span>}
                    </div>
                    {selected.description && (
                      <div style={{ fontSize: 13, color: theme.muted, marginTop: 6, maxWidth: 500 }}>{selected.description}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="teal" small onClick={() => setModal({ mode: "edit", data: selected })}>✎ Edit</Btn>
                    <Btn variant="danger" small onClick={handleDeleteSyllabus}>🗑 Delete</Btn>
                  </div>
                </div>
                {/* Progress */}
                {totalCount > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <ProgressBar done={completedCount} total={totalCount} />
                  </div>
                )}
              </div>

              {/* ── Search bar ── */}
              {totalCount > 0 && (
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", color: theme.muted }}>🔍</span>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search topics…"
                    style={{ ...inp(), paddingLeft: 36, background: "#fff" }}
                  />
                </div>
              )}

              {/* ── Topics list ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredTopics.length === 0 && search ? (
                  <div style={{ textAlign: "center", padding: "28px 0", color: theme.muted }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontWeight: 600 }}>No topics match "{search}"</div>
                  </div>
                ) : filteredTopics.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "36px 20px",
                    border: `2px dashed ${TEAL_B}`, borderRadius: 14,
                    background: "#F0FDFA", color: theme.muted,
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 6 }}>No topics yet</div>
                    <div style={{ fontSize: 13 }}>Add the first topic for this syllabus below</div>
                  </div>
                ) : (
                  filteredTopics.map((topic, idx) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      index={idx + 1}
                      isFirst={idx === 0}
                      isLast={idx === filteredTopics.length - 1}
                      onStatusCycle={handleStatusCycle}
                      onKeyToggle={handleKeyToggle}
                      onMoveUp={() => handleMove(topic.id, "UP")}
                      onMoveDown={() => handleMove(topic.id, "DOWN")}
                      onDelete={handleDeleteTopic}
                      onSaveEdit={handleEditTopic}
                      onAddRef={handleAddRef}
                      onSaveRef={handleSaveRef}
                      onDeleteRef={handleDeleteRef}
                    />
                  ))
                )}
              </div>

              {/* ── Add topic ── */}
              {showAddTopic ? (
                <AddTopicForm onSave={handleAddTopic} onCancel={() => setShowAddTopic(false)} />
              ) : (
                <button onClick={() => setShowAddTopic(true)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px 0", border: `2px dashed ${TEAL_B}`, borderRadius: 12,
                  background: "#F0FDFA", color: TEAL, fontWeight: 700, fontSize: 13,
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  transition: "background .15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = TEAL_L}
                  onMouseLeave={e => e.currentTarget.style.background = "#F0FDFA"}
                >
                  + Add Topic
                </button>
              )}

              {/* ── Stats strip ── */}
              {totalCount > 0 && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "14px 20px", background: "#F8FAFC", borderRadius: 12, border: `1px solid ${theme.border}` }}>
                  {[
                    { label: "Total Topics",   value: totalCount,                                                          color: theme.text  },
                    { label: "Not Started",    value: filteredTopics.filter(t => t.status === "NOT_STARTED").length,       color: "#6B7280"   },
                    { label: "In Progress",    value: filteredTopics.filter(t => t.status === "IN_PROGRESS").length,       color: "#F59E0B"   },
                    { label: "Completed",      value: filteredTopics.filter(t => t.status === "COMPLETED").length,         color: "#10B981"   },
                    { label: "Key Topics",     value: filteredTopics.filter(t => t.isKeyTopic).length,                     color: "#D97706"   },
                    { label: "References",     value: filteredTopics.reduce((s, t) => s + (t.references?.length || 0), 0), color: "#2563EB"   },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: "center", minWidth: 70 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                      <div style={{ fontSize: 10, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Syllabus Modal ─────────────────────────── */}
      {modal && (
        <SyllabusModal
          grades={grades}
          configSubjects={configSubjects}
          existingSubjectNames={existingSubjectNames}
          initial={modal.mode === "edit" ? modal.data : (modal.data?.gradeName ? { gradeName: modal.data.gradeName, academicYear: "" } : null)}
          onSave={modal.mode === "edit" ? handleEditSyllabus : handleCreateSyllabus}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
