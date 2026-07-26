// components/forms/AddTeacherForm.jsx
import { useState, useEffect, useRef } from "react";
import { toast } from "../../toast";
import Modal from "../Modal";
import { FormField, TextInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";
import { configAPI } from "../../api/apiService";

const BLANK = {
  name: "", subject: [], email: "", contact: "",
  classes: [], exp: "", qualification: "", status: "ACTIVE", photoBase64: "",
};

// ── Photo uploader ────────────────────────────────────────────
function PhotoUpload({ value, onChange }) {
  const ref = useRef(null);

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: theme.bg, borderRadius: 10, border: `1px solid ${theme.border}` }}>
      <div
        onClick={() => ref.current?.click()}
        style={{
          width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
          border: `2px dashed ${value ? theme.accent : theme.border}`,
          background: value ? "transparent" : "#f0f4ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", cursor: "pointer",
        }}
      >
        {value
          ? <img src={value} alt="teacher" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26 }}>👩‍🏫</div>
              <div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>Photo</div>
            </div>
        }
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 3 }}>Teacher Photo</div>
        <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8 }}>JPG / PNG · max 2 MB</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          <button type="button" onClick={() => ref.current?.click()}
            style={{ padding: "5px 14px", borderRadius: 7, border: `1px solid ${theme.blue}33`, background: theme.blue + "15", color: theme.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {value ? "Change" : "Upload Photo"}
          </button>
          {value && (
            <button type="button" onClick={() => { onChange(""); if (ref.current) ref.current.value = ""; }}
              style={{ padding: "5px 14px", borderRadius: 7, border: `1px solid ${theme.red}33`, background: theme.red + "12", color: theme.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subject multi-select picker ───────────────────────────────
function SubjectPicker({ value, onChange, subjects, loading }) {
  // value is an array of selected subject names
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = name => {
    if (value.includes(name)) onChange(value.filter(v => v !== name));
    else onChange([...value, name]);
  };

  const base = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1.5px solid ${theme.border}`, background: theme.bg,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  };

  if (loading) {
    return <div style={{ ...base, color: theme.muted }}>Loading subjects…</div>;
  }

  if (!subjects.length) {
    return (
      <input
        type="text"
        placeholder="Type subjects, comma-separated"
        value={value.join(", ")}
        onChange={e => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        style={base}
      />
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...base, display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 4, textAlign: "left",
        }}
      >
        {value.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
            {value.map(v => (
              <span key={v} style={{
                background: theme.accent + "18", color: theme.accent,
                borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700,
              }}>
                {v}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: theme.muted }}>Select subjects (multi)</span>
        )}
        <span style={{ color: theme.muted, fontSize: 12, flexShrink: 0, marginLeft: 6 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "#fff", borderRadius: 10, border: `1.5px solid ${theme.border}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto",
        }}>
          {subjects.map(s => {
            const selected = value.includes(s.name);
            return (
              <div
                key={s.id}
                onClick={() => toggle(s.name)}
                style={{
                  padding: "9px 14px", cursor: "pointer", fontSize: 13,
                  background: selected ? theme.accent + "12" : "transparent",
                  color: selected ? theme.accent : theme.text,
                  fontWeight: selected ? 700 : 400,
                  display: "flex", alignItems: "center", gap: 10,
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = theme.bg; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                  background: s.type === "CORE" ? "#EFF6FF" : s.type === "ELECTIVE" ? "#ECFDF5" : "#F5F3FF",
                  color: s.type === "CORE" ? "#3B82F6" : s.type === "ELECTIVE" ? "#10B981" : "#8B5CF6",
                }}>{s.type}</span>
                {s.name}
                {s.code && <span style={{ fontSize: 10, color: theme.muted, fontFamily: "monospace" }}>{s.code}</span>}
                {selected && <span style={{ marginLeft: "auto", color: theme.accent, fontSize: 14 }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Class multi-select (grade + section grid) ─────────────────
function ClassMultiSelect({ selected, onChange, grades, loading }) {
  const toggle = cls => {
    if (selected.includes(cls)) onChange(selected.filter(c => c !== cls));
    else                         onChange([...selected, cls]);
  };

  if (loading) return <div style={{ fontSize: 12, color: theme.muted, padding: "8px 0" }}>Loading classes…</div>;

  if (!grades.length) {
    return (
      <input
        type="text"
        placeholder="e.g. 10-A, 9-B"
        value={selected.join(", ")}
        onChange={e => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 8,
          border: `1.5px solid ${theme.border}`, background: theme.bg,
          fontSize: 14, outline: "none", boxSizing: "border-box",
          fontFamily: "'DM Sans', sans-serif", color: theme.text,
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto", padding: "2px 0" }}>
      {grades.map(g => (
        <div key={g.id}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" }}>
            {g.name}
          </div>
          {(!g.sections || g.sections.length === 0) ? (
            <div style={{ fontSize: 12, color: theme.muted, paddingLeft: 4 }}>No sections configured</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {g.sections.map(s => {
                const cls = `${g.name}-${s.letter}`;
                const active = selected.includes(cls);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(cls)}
                    style={{
                      padding: "5px 14px", borderRadius: 8,
                      border: `1.5px solid ${active ? theme.accent : theme.border}`,
                      background: active ? theme.accent : theme.bg,
                      color: active ? "#fff" : theme.text,
                      fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {g.name}-{s.letter}
                    {active && <span style={{ marginLeft: 4 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {selected.length > 0 && (
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
          Selected: <strong style={{ color: theme.accent }}>{selected.join(", ")}</strong>
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────
export default function AddTeacherForm({ onClose, onAdd, onEdit, initial }) {
  const isEdit = !!initial;

  const parseClasses = raw => {
    if (!raw || raw === "—") return [];
    if (Array.isArray(raw)) return raw;
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  };

  const parseSubjects = raw => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  };

  const [form, setForm] = useState(isEdit ? {
    name:          initial.name          ?? "",
    subject:       parseSubjects(initial.subject),
    email:         initial.email         ?? "",
    contact:       initial.contact       ?? "",
    classes:       parseClasses(initial.classes),
    exp:           initial.exp           ?? "",
    qualification: initial.qualification ?? "",
    status:        initial.status === "Active"   ? "ACTIVE"
                 : initial.status === "On Leave" ? "ON_LEAVE"
                 : initial.status === "Inactive" ? "INACTIVE"
                 : (initial.status ?? "ACTIVE"),
    photoBase64:   initial.photoBase64   ?? "",
  } : BLANK);

  const [errors,     setErrors]     = useState({});
  const [subjects,   setSubjects]   = useState([]);
  const [grades,     setGrades]     = useState([]);
  const [loadingCfg, setLoadingCfg] = useState(true);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    Promise.allSettled([configAPI.getSubjects(), configAPI.getGrades()])
      .then(([subRes, gradeRes]) => {
        if (subRes.status   === "fulfilled") setSubjects(subRes.value   || []);
        if (gradeRes.status === "fulfilled") setGrades(gradeRes.value   || []);
      })
      .finally(() => setLoadingCfg(false));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name    = "Name is required";
    if (!form.subject.length)    e.subject = "At least one subject is required";
    if (!form.email.trim())      e.email   = "Email is required";
    if (!form.contact.trim())    e.contact = "Contact is required";
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    const payload = {
      ...form,
      subject: form.subject.join(", "),
      classes: form.classes.join(", "),
    };
    if (isEdit) onEdit(payload);
    else        onAdd(payload);
    onClose();
  };

  const field = (key, label, required, children) => (
    <FormField label={label} required={required}>
      {children}
      {errors[key] && <span style={{ color: theme.red, fontSize: 11 }}>{errors[key]}</span>}
    </FormField>
  );

  return (
    <Modal title={isEdit ? "Edit Teacher" : "Add New Teacher"} onClose={onClose} width={560}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Photo */}
        <PhotoUpload value={form.photoBase64} onChange={set("photoBase64")} />

        <FormRow>
          {field("name", "Full Name", true,
            <TextInput value={form.name} onChange={set("name")} placeholder="deekshith" />)}
          {field("email", "Email", true,
            <TextInput type="email" value={form.email} onChange={set("email")} placeholder="teacher@school.in" />)}
        </FormRow>

        {/* Subject multi-select */}
        {field("subject", "Subjects", true,
          <SubjectPicker value={form.subject} onChange={set("subject")} subjects={subjects} loading={loadingCfg} />)}

        <FormRow>
          {field("contact", "Contact Number", true,
            <TextInput value={form.contact} onChange={set("contact")} placeholder="10-digit mobile" type="tel" />)}
          {field("qualification", "Qualification", false,
            <TextInput value={form.qualification} onChange={set("qualification")} placeholder="e.g. M.Sc, B.Ed" />)}
        </FormRow>

        {field("exp", "Experience", false,
          <TextInput value={form.exp} onChange={set("exp")} placeholder="e.g. 5 yrs" />)}

        {/* Classes multi-select */}
        <FormField label="Assigned Classes" required={false}>
          <ClassMultiSelect
            selected={form.classes}
            onChange={set("classes")}
            grades={grades}
            loading={loadingCfg}
          />
        </FormField>

        {/* Status */}
        <FormField label="Status" required={false}>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { val: "ACTIVE",   label: "Active",   color: "#10B981" },
              { val: "ON_LEAVE", label: "On Leave", color: "#F59E0B" },
              { val: "INACTIVE", label: "Inactive", color: "#9CA3AF" },
            ].map(opt => (
              <button key={opt.val} type="button" onClick={() => set("status")(opt.val)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${form.status === opt.val ? opt.color : theme.border}`,
                  background: form.status === opt.val ? opt.color + "15" : theme.bg,
                  color: form.status === opt.val ? opt.color : theme.muted,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </FormField>

        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update Teacher" : "Add Teacher"} />
      </form>
    </Modal>
  );
}
