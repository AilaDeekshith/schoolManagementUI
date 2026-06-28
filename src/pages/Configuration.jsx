// pages/Configuration.jsx
import { useState, useEffect, useCallback } from "react";
import { theme } from "../theme";
import { configAPI, userMgmtAPI } from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

// ── shared primitives ─────────────────────────────────────────
const inp = (extra = {}) => ({
  padding: "9px 12px", borderRadius: 8,
  border: `1.5px solid ${theme.border}`,
  background: theme.bg, color: theme.text,
  fontSize: 14, outline: "none", width: "100%",
  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", ...extra,
});

const Btn = ({ children, onClick, type = "button", variant = "primary", small, style: s }) => {
  const base = {
    padding: small ? "6px 12px" : "9px 18px",
    borderRadius: 8, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: small ? 12 : 13,
    fontFamily: "'DM Sans', sans-serif", transition: "opacity .15s", ...s,
  };
  const variants = {
    primary:  { background: theme.accent,            color: "#fff" },
    success:  { background: theme.green,             color: "#fff" },
    danger:   { background: theme.red + "14",        color: theme.red,  border: `1px solid ${theme.red}22` },
    ghost:    { background: theme.bg,                color: theme.muted, border: `1px solid ${theme.border}` },
    blue:     { background: theme.blue + "15",       color: theme.blue, border: `1px solid ${theme.blue}33` },
  };
  return <button type={type} onClick={onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

const Tag = ({ label, color = theme.blue }) => (
  <span style={{ background: color + "18", color, border: `1px solid ${color}33`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{label}</span>
);

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 28, width, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.muted, fontSize: 24, lineHeight: 1, padding: 0 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── field helper ──────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: .4 }}>{label}</div>
      {children}
    </div>
  );
}

// ── empty state ───────────────────────────────────────────────
function Empty({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: theme.muted }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{message}</div>
    </div>
  );
}

// ── list header ───────────────────────────────────────────────
function ListHeader({ title, count, onAdd, addLabel = "+ Add" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>{title}</div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{count} record{count !== 1 ? "s" : ""}</div>
      </div>
      <Btn onClick={onAdd}>{addLabel}</Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 1 — School Profile
// ══════════════════════════════════════════════════════════════
function ProfileTab() {
  const blank = { schoolName: "", address: "", phone: "", email: "", principalName: "", academicYear: "", establishedYear: "", website: "", affiliationBoard: "", schoolType: "" };
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    configAPI.getProfile()
      .then(p => { if (p?.id) setForm({ ...blank, ...p, establishedYear: p.establishedYear ?? "" }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [blank]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await configAPI.saveProfile({ ...form, establishedYear: form.establishedYear ? Number(form.establishedYear) : null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: theme.muted, padding: 20 }}>Loading…</div>;

  const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Matriculation"];
  const TYPES  = ["Government", "Government Aided", "Private Unaided", "Central Government"];

  const rows = [
    ["School Name", "schoolName", "text", null],
    ["Principal Name", "principalName", "text", null],
    ["Phone", "phone", "tel", null],
    ["Email", "email", "email", null],
    ["Established Year", "establishedYear", "number", null],
    ["Affiliation Board", "affiliationBoard", "select", BOARDS],
    ["School Type", "schoolType", "select", TYPES],
  ];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>School Profile</div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Basic information about your school</div>
      </div>
      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {rows.map(([label, key, type, opts]) => (
            <div key={key}>
              <Field label={label}>
                {opts ? (
                  <select value={form[key]} onChange={e => set(key, e.target.value)} style={inp()}>
                    <option value="">— Select —</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} style={inp()} />
                )}
              </Field>
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Address">
              <textarea value={form.address} onChange={e => set("address", e.target.value)} rows={3} style={{ ...inp(), resize: "vertical" }} />
            </Field>
          </div>
        </div>
        <Btn type="submit" variant="primary" style={{ padding: "11px 32px", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Profile"}
        </Btn>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2 — Grades & Sections
// ══════════════════════════════════════════════════════════════
function GradesTab() {
  const [grades, setGrades]         = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [newGrade, setNewGrade]     = useState("");
  const [newSection, setNewSection] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await configAPI.getGrades().catch(() => []);
    setGrades(data);
    setSelected(prev => data.find(g => g.id === prev?.id) ?? data[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect 
    load(); 
  }, [load]);

  const addGrade = async () => {
    if (!newGrade.trim()) return;
    const g = await configAPI.createGrade({ name: newGrade.trim() }).catch(e => { alert(e.message); return null; });
    if (g) { setNewGrade(""); setSelected(g); load(); }
  };

  const delGrade = async id => {
    if (!window.confirm("Delete this grade and all its sections?")) return;
    await configAPI.deleteGrade(id).catch(e => alert(e.message));
    if (selected?.id === id) setSelected(null);
    load();
  };

  const addSection = async () => {
    if (!newSection.trim() || !selected) return;
    await configAPI.addSection(selected.id, newSection.trim()).catch(e => { alert(e.message); return; });
    setNewSection(""); load();
  };

  const delSection = async sid => { await configAPI.deleteSection(sid).catch(e => alert(e.message)); load(); };

  if (loading) return <div style={{ color: theme.muted }}>Loading…</div>;

  const selectedGrade = grades.find(g => g.id === selected?.id) ?? null;

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Left — grade list */}
      <div style={{ width: 230, flexShrink: 0 }}>
        <ListHeader title="Grades" count={grades.length} onAdd={() => {}} addLabel="" />
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input value={newGrade} onChange={e => setNewGrade(e.target.value)} placeholder="e.g. Grade 10" style={inp({ flex: 1 })} onKeyDown={e => e.key === "Enter" && addGrade()} />
          <Btn onClick={addGrade} small>+</Btn>
        </div>
        {grades.length === 0 && <Empty message="No grades yet" />}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {grades.map(g => (
            <div key={g.id} onClick={() => setSelected(g)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, cursor: "pointer", background: selected?.id === g.id ? theme.accent + "15" : theme.bg, border: `1px solid ${selected?.id === g.id ? theme.accent + "55" : theme.border}`, transition: "all .15s" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: selected?.id === g.id ? theme.accent : theme.text }}>{g.name}</div>
                <div style={{ fontSize: 11, color: theme.muted }}>{g.sections?.length ?? 0} section{g.sections?.length !== 1 ? "s" : ""}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); delGrade(g.id); }} style={{ background: "none", border: "none", color: theme.red, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 1, background: theme.border, flexShrink: 0 }} />

      {/* Right — sections */}
      <div style={{ flex: 1 }}>
        {!selectedGrade ? (
          <Empty message="Select a grade to manage its sections" />
        ) : (
          <>
            <ListHeader title={`Sections — ${selectedGrade.name}`} count={selectedGrade.sections?.length ?? 0} onAdd={() => {}} addLabel="" />
            <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center" }}>
              <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="Letter (A / B / C)" maxLength={3} style={inp({ width: 140 })} onKeyDown={e => e.key === "Enter" && addSection()} />
              <Btn onClick={addSection} variant="success">+ Add Section</Btn>
            </div>
            {(!selectedGrade.sections || selectedGrade.sections.length === 0) ? (
              <Empty message="No sections yet — add one above" />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {selectedGrade.sections.map(s => (
                  <div key={s.id} style={{ background: theme.green + "12", border: `2px solid ${theme.green}44`, borderRadius: 14, padding: "16px 22px", textAlign: "center", minWidth: 100, position: "relative" }}>
                    <div style={{ fontSize: 30, fontWeight: 900, color: theme.green }}>{s.letter}</div>
                    <div style={{ fontSize: 11, color: theme.muted, marginTop: 3 }}>{selectedGrade.name} — {s.letter}</div>
                    <button onClick={() => delSection(s.id)} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: theme.red, cursor: "pointer", fontSize: 15 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 20, padding: "10px 14px", background: theme.blue + "0D", borderRadius: 8, fontSize: 12, color: theme.blue }}>
              These sections create class names like <strong>{selectedGrade.name}-A</strong>, <strong>{selectedGrade.name}-B</strong>, etc.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3 — Subjects
// ══════════════════════════════════════════════════════════════
const SUBJECT_TYPES  = ["CORE", "ELECTIVE", "CO_CURRICULAR"];
const SUBJECT_LABEL  = { CORE: "Core", ELECTIVE: "Elective", CO_CURRICULAR: "Co-curricular" };
const SUBJECT_COLOR  = { CORE: theme.blue, ELECTIVE: theme.green, CO_CURRICULAR: theme.purple };

function SubjectModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ name: "", code: "", type: "CORE", description: "", ...(initial ?? {}) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };
  return (
    <Modal title={initial ? "Edit Subject" : "Add Subject"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Subject Name *"><input required value={form.name} onChange={e => set("name", e.target.value)} style={inp()} /></Field>
        <Field label="Code (e.g. MATH)"><input value={form.code} onChange={e => set("code", e.target.value)} style={inp()} /></Field>
        <Field label="Description"><input value={form.description} onChange={e => set("description", e.target.value)} style={inp()} /></Field>
        <Field label="Type">
          <div style={{ display: "flex", gap: 8 }}>
            {SUBJECT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => set("type", t)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${form.type === t ? SUBJECT_COLOR[t] : theme.border}`, background: form.type === t ? SUBJECT_COLOR[t] + "18" : theme.bg, color: form.type === t ? SUBJECT_COLOR[t] : theme.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {SUBJECT_LABEL[t]}
              </button>
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn type="submit" variant="primary" style={{ flex: 1 }}>{initial ? "Update" : "Add Subject"}</Btn>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        </div>
      </form>
    </Modal>
  );
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | { mode: 'add'|'edit', data: {} }

  const load = async () => { setLoading(true); setSubjects(await configAPI.getSubjects().catch(() => [])); setLoading(false); };
  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(); }, []);

  const handleSave = async form => {
    if (modal.mode === "edit") await configAPI.updateSubject(modal.data.id, form).catch(e => alert(e.message));
    else                       await configAPI.createSubject(form).catch(e => alert(e.message));
    load();
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this subject?")) return;
    await configAPI.deleteSubject(id).catch(e => alert(e.message));
    load();
  };

  if (loading) return <div style={{ color: theme.muted }}>Loading…</div>;

  return (
    <>
      <ListHeader title="Subjects" count={subjects.length} onAdd={() => setModal({ mode: "add", data: {} })} addLabel="+ Add Subject" />
      {subjects.length === 0 ? <Empty message="No subjects yet — click Add Subject to get started" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {subjects.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: SUBJECT_COLOR[s.type] + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{s.name}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                  {s.code && <span style={{ fontSize: 11, color: theme.muted, fontFamily: "monospace", background: theme.bg, padding: "1px 6px", borderRadius: 4 }}>{s.code}</span>}
                  <Tag label={SUBJECT_LABEL[s.type]} color={SUBJECT_COLOR[s.type]} />
                </div>
                {s.description && <div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>{s.description}</div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small variant="blue" onClick={() => setModal({ mode: "edit", data: s })}>Edit</Btn>
                <Btn small variant="danger" onClick={() => handleDelete(s.id)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <SubjectModal initial={modal.mode === "edit" ? modal.data : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 4 — Fee Structure
// ══════════════════════════════════════════════════════════════
const FEE_CATS   = ["TUITION", "TRANSPORT", "LABORATORY", "LIBRARY", "SPORTS", "EXAM", "OTHER"];
const FEE_ICON   = { TUITION: "📚", TRANSPORT: "🚌", LABORATORY: "🔬", LIBRARY: "📖", SPORTS: "⚽", EXAM: "📝", OTHER: "💰" };
const FEE_COLOR  = { TUITION: theme.blue, TRANSPORT: theme.orange, LABORATORY: theme.purple, LIBRARY: theme.green, SPORTS: "#10B981", EXAM: theme.red, OTHER: theme.muted };
const FEE_FREQS  = ["ANNUAL", "TERM", "MONTHLY"];

function FeeModal({ initial, onSave, onClose }) {
  const blank = { gradeName: "", feeCategory: "TUITION", amount: "", academicYear: "", frequency: "ANNUAL", description: "" };
  const [form, setForm] = useState({ ...blank, ...(initial ?? {}) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => { e.preventDefault(); await onSave({ ...form, amount: Number(form.amount) }); onClose(); };
  return (
    <Modal title={initial ? "Edit Fee Entry" : "Add Fee Entry"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Grade / Class *"><input required value={form.gradeName} onChange={e => set("gradeName", e.target.value)} placeholder="e.g. Grade 10 or All" style={inp()} /></Field>
          <Field label="Academic Year *"><input required value={form.academicYear} onChange={e => set("academicYear", e.target.value)} placeholder="2024-25" style={inp()} /></Field>
          <Field label="Amount (₹) *"><input required type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="e.g. 45000" style={inp()} /></Field>
          <Field label="Category">
            <select value={form.feeCategory} onChange={e => set("feeCategory", e.target.value)} style={inp()}>
              {FEE_CATS.map(c => <option key={c} value={c}>{FEE_ICON[c]} {c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Frequency">
          <div style={{ display: "flex", gap: 8 }}>
            {FEE_FREQS.map(f => (
              <button key={f} type="button" onClick={() => set("frequency", f)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${form.frequency === f ? theme.accent : theme.border}`, background: form.frequency === f ? theme.accent + "18" : theme.bg, color: form.frequency === f ? theme.accent : theme.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Description"><input value={form.description} onChange={e => set("description", e.target.value)} style={inp()} /></Field>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn type="submit" variant="primary" style={{ flex: 1 }}>{initial ? "Update" : "Add Entry"}</Btn>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        </div>
      </form>
    </Modal>
  );
}

function FeeStructureTab() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);

  const load = async () => { setLoading(true); setItems(await configAPI.getFeeStructures().catch(() => [])); setLoading(false); };
  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(); }, []);

  const handleSave = async form => {
    if (modal.mode === "edit") await configAPI.updateFeeStructure(modal.data.id, form).catch(e => alert(e.message));
    else                       await configAPI.createFeeStructure(form).catch(e => alert(e.message));
    load();
  };

  const handleDelete = async id => { if (!window.confirm("Delete?")) return; await configAPI.deleteFeeStructure(id); load(); };

  if (loading) return <div style={{ color: theme.muted }}>Loading…</div>;

  const grouped = items.reduce((acc, i) => { (acc[i.gradeName] = acc[i.gradeName] || []).push(i); return acc; }, {});

  return (
    <>
      <ListHeader title="Fee Structure" count={items.length} onAdd={() => setModal({ mode: "add", data: {} })} addLabel="+ Add Fee Entry" />
      {items.length === 0 ? <Empty message="No fee structure defined — click Add Fee Entry to get started" /> : (
        Object.entries(grouped).map(([grade, entries]) => (
          <div key={grade} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              🎒 {grade}
              <span style={{ fontSize: 12, color: theme.green, fontWeight: 700, background: theme.green + "12", padding: "2px 10px", borderRadius: 20 }}>
                Total ₹{entries.reduce((s, i) => s + Number(i.amount), 0).toLocaleString()}
              </span>
            </div>
            {entries.map(i => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{FEE_ICON[i.feeCategory]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{i.feeCategory.charAt(0) + i.feeCategory.slice(1).toLowerCase()}</span>
                    <Tag label={i.frequency.charAt(0) + i.frequency.slice(1).toLowerCase()} color={FEE_COLOR[i.feeCategory]} />
                    <span style={{ fontSize: 11, color: theme.muted }}>{i.academicYear}</span>
                  </div>
                  {i.description && <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{i.description}</div>}
                </div>
                <div style={{ fontWeight: 900, fontSize: 17, color: theme.green, marginRight: 8 }}>₹{Number(i.amount).toLocaleString()}</div>
                <Btn small variant="blue" onClick={() => setModal({ mode: "edit", data: i })}>Edit</Btn>
                <Btn small variant="danger" onClick={() => handleDelete(i.id)}>Delete</Btn>
              </div>
            ))}
          </div>
        ))
      )}
      {modal && <FeeModal initial={modal.mode === "edit" ? modal.data : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 5 — Academic Calendar
// ══════════════════════════════════════════════════════════════
const HOLIDAY_TYPES  = ["PUBLIC", "SCHOOL", "VACATION", "EXAM_BREAK", "FESTIVAL"];
const HOLIDAY_LABEL  = { PUBLIC: "Public Holiday", SCHOOL: "School Event", VACATION: "Vacation", EXAM_BREAK: "Exam Break", FESTIVAL: "Festival" };
const HOLIDAY_COLOR  = { PUBLIC: theme.red, SCHOOL: theme.blue, VACATION: theme.green, EXAM_BREAK: theme.orange, FESTIVAL: "#A855F7" };
const HOLIDAY_ICON   = { PUBLIC: "🇮🇳", SCHOOL: "🏫", VACATION: "🌴", EXAM_BREAK: "📝", FESTIVAL: "🎉" };

function HolidayModal({ initial, onSave, onClose }) {
  const blank = { name: "", date: "", endDate: "", type: "PUBLIC", description: "", academicYear: "" };
  const [form, setForm] = useState({ ...blank, ...(initial ?? {}) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => { e.preventDefault(); await onSave({ ...form, endDate: form.endDate || null }); onClose(); };
  return (
    <Modal title={initial ? "Edit Event" : "Add Holiday / Event"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Name *"><input required value={form.name} onChange={e => set("name", e.target.value)} style={inp()} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Date *"><input required type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inp()} /></Field>
          <Field label="End Date (optional)"><input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} style={inp()} /></Field>
          <Field label="Academic Year"><input value={form.academicYear} onChange={e => set("academicYear", e.target.value)} placeholder="2024-25" style={inp()} /></Field>
        </div>
        <Field label="Description"><input value={form.description} onChange={e => set("description", e.target.value)} style={inp()} /></Field>
        <Field label="Type">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {HOLIDAY_TYPES.map(t => (
              <button key={t} type="button" onClick={() => set("type", t)}
                style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${form.type === t ? HOLIDAY_COLOR[t] : theme.border}`, background: form.type === t ? HOLIDAY_COLOR[t] + "18" : theme.bg, color: form.type === t ? HOLIDAY_COLOR[t] : theme.muted, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                {HOLIDAY_ICON[t]} {HOLIDAY_LABEL[t]}
              </button>
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn type="submit" variant="primary" style={{ flex: 1 }}>{initial ? "Update" : "Add Event"}</Btn>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        </div>
      </form>
    </Modal>
  );
}

function CalendarTab() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);

  const load = async () => { setLoading(true); setItems(await configAPI.getHolidays().catch(() => [])); setLoading(false); };
  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(); }, []);

  const handleSave = async form => {
    if (modal.mode === "edit") await configAPI.updateHoliday(modal.data.id, form).catch(e => alert(e.message));
    else                       await configAPI.createHoliday(form).catch(e => alert(e.message));
    load();
  };

  const handleDelete = async id => { if (!window.confirm("Delete?")) return; await configAPI.deleteHoliday(id); load(); };

  if (loading) return <div style={{ color: theme.muted }}>Loading…</div>;

  const byMonth = items.reduce((acc, h) => {
    const m = new Date(h.date + "T00:00:00").toLocaleString("default", { month: "long", year: "numeric" });
    (acc[m] = acc[m] || []).push(h);
    return acc;
  }, {});

  return (
    <>
      <ListHeader title="Academic Calendar" count={items.length} onAdd={() => setModal({ mode: "add", data: {} })} addLabel="+ Add Event" />
      {items.length === 0 ? <Empty message="No events yet — click Add Event to get started" /> : (
        Object.entries(byMonth).map(([month, entries]) => (
          <div key={month} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: theme.muted, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>{month}</div>
            {entries.map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 6 }}>
                <div style={{ textAlign: "center", flexShrink: 0, width: 42 }}>
                  <div style={{ fontSize: 22 }}>{HOLIDAY_ICON[h.type]}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: HOLIDAY_COLOR[h.type] }}>
                    {new Date(h.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{h.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                    <Tag label={HOLIDAY_LABEL[h.type]} color={HOLIDAY_COLOR[h.type]} />
                    {h.endDate && <span style={{ fontSize: 11, color: theme.muted }}>→ {new Date(h.endDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
                    {h.academicYear && <span style={{ fontSize: 11, color: theme.muted }}>{h.academicYear}</span>}
                  </div>
                  {h.description && <div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>{h.description}</div>}
                </div>
                <Btn small variant="blue" onClick={() => setModal({ mode: "edit", data: { ...h, date: h.date, endDate: h.endDate ?? "" } })}>Edit</Btn>
                <Btn small variant="danger" onClick={() => handleDelete(h.id)}>Delete</Btn>
              </div>
            ))}
          </div>
        ))
      )}
      {modal && <HolidayModal initial={modal.mode === "edit" ? modal.data : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 6 — Users
// ══════════════════════════════════════════════════════════════
const ROLES    = ["SUPER_ADMIN", "ADMIN", "TEACHER", "STAFF"];
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const ROLE_LABEL  = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", TEACHER: "Teacher", STAFF: "Staff" };
const ROLE_COLOR  = { SUPER_ADMIN: "#6C63FF", ADMIN: theme.blue, TEACHER: theme.green, STAFF: theme.orange };
const ROLE_ICON   = { SUPER_ADMIN: "👑", ADMIN: "🛡️", TEACHER: "👩‍🏫", STAFF: "🧑‍💼" };
const STATUS_COLOR = { ACTIVE: theme.green, INACTIVE: theme.muted, SUSPENDED: theme.red };
const STATUS_LABEL = { ACTIVE: "Active", INACTIVE: "Inactive", SUSPENDED: "Suspended" };
const USER_GRADIENTS = [
  "linear-gradient(135deg,#6C63FF,#3B82F6)",
  "linear-gradient(135deg,#10B981,#06B6D4)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#A855F7,#EC4899)",
  "linear-gradient(135deg,#3B82F6,#06B6D4)",
];
const userInitials = name => (name || "").split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");

function UserModal({ initial, onSave, onClose }) {
  const blank = { name: "", email: "", username: "", phone: "", department: "", role: "STAFF", status: "ACTIVE", passwordChanged: false, };
  const [form, setForm] = useState({ ...blank, ...(initial ?? {}) });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? "Edit User" : "Add New User"} onClose={onClose} width={520}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Full Name *"><input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Rahul Sharma" style={inp()} /></Field>
          <Field label="Email *"><input required type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="rahul@school.in" style={inp()} /></Field>
          <Field label="Username"><input value={form.username} onChange={e => set("username", e.target.value)} placeholder="rahul.sharma" style={inp()} /></Field>
          <Field label="Phone"><input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="9876543210" style={inp()} /></Field>
          <Field label="Department" ><input value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Science, Admin" style={inp()} /></Field>
        </div>
        <Field label="Role">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ROLES.map(r => (
              <button key={r} type="button" onClick={() => set("role", r)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${form.role === r ? ROLE_COLOR[r] : theme.border}`, background: form.role === r ? ROLE_COLOR[r] + "12" : theme.bg, cursor: "pointer", fontWeight: form.role === r ? 700 : 500, fontSize: 13, color: form.role === r ? ROLE_COLOR[r] : theme.text }}>
                <span>{ROLE_ICON[r]}</span>{ROLE_LABEL[r]}
                {form.role === r && <span style={{ marginLeft: "auto" }}>✓</span>}
              </button>
            ))}
          </div>
        </Field>
        {!initial && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
            Default password will be <strong>username@123</strong> (or email-prefix@123 if no username given). The user must change it on first login.
          </div>
        )}
        {initial && (
          <Field label="Status">
            <div style={{ display: "flex", gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${form.status === s ? STATUS_COLOR[s] : theme.border}`, background: form.status === s ? STATUS_COLOR[s] + "12" : theme.bg, color: form.status === s ? STATUS_COLOR[s] : theme.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </Field>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn type="submit" variant="primary" style={{ flex: 1, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : initial ? "Update User" : "Create User"}</Btn>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        </div>
      </form>
    </Modal>
  );
}

function UsersTab() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [modal, setModal]           = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setUsers(await userMgmtAPI.getAll()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect 
    load(); }, []);

  const handleSave = async form => {
    if (modal.mode === "edit") await userMgmtAPI.update(modal.data.id, form);
    else                       await userMgmtAPI.create(form);
    load();
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this user?")) return;
    await userMgmtAPI.delete(id).catch(e => alert(e.message));
    load();
  };

  const counts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {});

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return <LoadingSpinner message="Loading users…" />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total",    value: users.length,                                        color: theme.accent },
          { label: "Active",   value: counts.ACTIVE ?? 0,                                  color: theme.green  },
          { label: "Admins",   value: (counts.SUPER_ADMIN ?? 0) + (counts.ADMIN ?? 0),    color: theme.blue   },
          { label: "Teachers", value: counts.TEACHER ?? 0,                                 color: "#10B981"    },
          { label: "Staff",    value: counts.STAFF ?? 0,                                   color: theme.orange },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "8px 16px", minWidth: 80 }}>
            <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color, marginTop: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <ListHeader title="Users" count={filtered.length} onAdd={() => setModal({ mode: "add", data: {} })} addLabel="+ Add User" />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by name or email…" style={inp({ width: 240 })} />
        <div style={{ display: "flex", gap: 5 }}>
          {["ALL", ...ROLES].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${roleFilter === r ? (ROLE_COLOR[r] ?? theme.accent) : theme.border}`, background: roleFilter === r ? (ROLE_COLOR[r] ?? theme.accent) + "14" : theme.bg, color: roleFilter === r ? (ROLE_COLOR[r] ?? theme.accent) : theme.muted, fontWeight: roleFilter === r ? 700 : 500, fontSize: 12, cursor: "pointer" }}>
              {r === "ALL" ? "All" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty message={users.length === 0 ? "No users yet — click Add User to get started" : "No users match your filters"} />
      ) : (
        filtered.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: USER_GRADIENTS[u.id % USER_GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {userInitials(u.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: theme.text, fontSize: 13 }}>{u.name}</div>
              <div style={{ fontSize: 11, color: theme.muted }}>{u.email}{u.username ? ` · @${u.username}` : ""}{u.department ? ` · ${u.department}` : ""}</div>
            </div>
            {u.phone && <div style={{ fontSize: 12, color: theme.muted, flexShrink: 0 }}>📞 {u.phone}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: ROLE_COLOR[u.role] + "12", color: ROLE_COLOR[u.role], border: `1px solid ${ROLE_COLOR[u.role]}33`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {ROLE_ICON[u.role]} {ROLE_LABEL[u.role]}
            </div>
            <Tag label={STATUS_LABEL[u.status]} color={STATUS_COLOR[u.status]} />
            <Btn small variant="blue" onClick={() => setModal({ mode: "edit", data: u })}>Edit</Btn>
            <Btn small variant="danger" onClick={() => handleDelete(u.id)}>Delete</Btn>
          </div>
        ))
      )}

      {modal && <UserModal initial={modal.mode === "edit" ? modal.data : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// Root
// ══════════════════════════════════════════════════════════════
const TABS = [
  { id: "profile",      label: "School Profile",    icon: "🏫" },
  { id: "grades",       label: "Grades & Sections", icon: "📚" },
  { id: "subjects",     label: "Subjects",          icon: "📖" },
  { id: "feeStructure", label: "Fee Structure",     icon: "💰" },
  { id: "calendar",     label: "Academic Calendar", icon: "📅" },
  { id: "users",        label: "Users",             icon: "👤" },
];

export default function Configuration() {
  const [tab, setTab] = useState("profile");

  const content = {
    profile:      <ProfileTab />,
    grades:       <GradesTab />,
    subjects:     <SubjectsTab />,
    feeStructure: <FeeStructureTab />,
    calendar:     <CalendarTab />,
    users:        <UsersTab />,
  };

  return (
    <div style={{ display: "flex", gap: 0, height: "100%", minHeight: 0 }}>
      {/* Left nav */}
      <div style={{ width: 210, flexShrink: 0, paddingRight: 24, borderRight: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: theme.text, marginBottom: 2 }}>Configuration</div>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 20 }}>School-wide settings</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: tab === t.id ? theme.accent + "15" : "transparent", border: `1px solid ${tab === t.id ? theme.accent + "44" : "transparent"}`, color: tab === t.id ? theme.accent : theme.muted, fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingLeft: 28, overflowY: "auto" }}>
        {content[tab]}
      </div>
    </div>
  );
}
