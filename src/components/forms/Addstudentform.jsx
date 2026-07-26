// components/forms/AddStudentForm.jsx
import { useState, useEffect, useRef } from "react";
import { toast } from "../../toast";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";
import { configAPI } from "../../api/apiService";

const BLANK = {
  name: "", dob: "", gender: "", class: "", roll: "", admissionDate: "",
  bloodGroup: "", nationality: "", religion: "", aadharNumber: "", category: "",
  fatherName: "", motherName: "", fatherOccupation: "", motherOccupation: "",
  guardian: "", contact: "", emergencyContact: "", email: "",
  address: "", status: "ACTIVE", photoBase64: "",
};

const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Other"];

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
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
      <div
        onClick={() => ref.current?.click()}
        style={{
          width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
          border: `2px dashed ${value ? theme.accent : theme.border}`,
          background: value ? "transparent" : "#f8fafc",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", cursor: "pointer",
        }}
      >
        {value
          ? <img src={value} alt="student" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>🎓</div>
              <div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>Photo</div>
            </div>
        }
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 4 }}>Student Photo</div>
        <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8 }}>JPG / PNG · max 2 MB</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          <button type="button" onClick={() => ref.current?.click()}
            style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${theme.blue}33`, background: theme.blue + "15", color: theme.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {value ? "Change" : "Upload"}
          </button>
          {value && (
            <button type="button" onClick={() => { onChange(""); if (ref.current) ref.current.value = ""; }}
              style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${theme.red}33`, background: theme.red + "12", color: theme.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Class select — grouped by grade, with sections ────────────
function ClassSelect({ value, onChange, grades, loadingGrades }) {
  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1px solid ${theme.border}`, background: "#F9FAFB",
    color: value ? theme.text : "#9CA3AF", fontSize: 14,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    transition: "border-color 0.15s",
  };

  if (loadingGrades) {
    return <div style={{ ...inputStyle, pointerEvents: "none" }}>Loading classes…</div>;
  }

  // If no grades configured at all, fall back to text input
  if (!grades.length) {
    return (
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Grade 10-A"
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = theme.accent)}
        onBlur={e => (e.target.style.borderColor = theme.border)}
      />
    );
  }

  // Build flat option list: for grades with sections, show "GradeName-Section";
  // for grades without sections, show just the grade name so they're still selectable.
  const hasAnySections = grades.some(g => g.sections?.length > 0);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = theme.accent)}
      onBlur={e => (e.target.style.borderColor = theme.border)}
    >
      <option value="">— Select class —</option>

      {hasAnySections
        // Grouped by grade with section options
        ? grades.map(g => {
            if (!g.sections?.length) return null;
            return (
              <optgroup key={g.id} label={g.name}>
                {g.sections.map(s => {
                  const cls = `${g.name}-${s.letter}`;
                  return <option key={s.id} value={cls}>{cls}</option>;
                })}
              </optgroup>
            );
          })
        // No sections anywhere — just show grade names
        : grades.map(g => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))
      }
    </select>
  );
}

export default function AddStudentForm({ onClose, onAdd, onEdit, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(isEdit ? {
    name:             initial.name             ?? "",
    dob:              initial.dob              ?? "",
    gender:           initial.gender           ?? "",
    class:            initial.class            ?? "",
    roll:             initial.roll             ?? "",
    admissionDate:    initial.admissionDate    ?? "",
    bloodGroup:       initial.bloodGroup       ?? "",
    nationality:      initial.nationality      ?? "",
    religion:         initial.religion         ?? "",
    aadharNumber:     initial.aadharNumber     ?? "",
    category:         initial.category         ?? "",
    fatherName:       initial.fatherName       ?? "",
    motherName:       initial.motherName       ?? "",
    fatherOccupation: initial.fatherOccupation ?? "",
    motherOccupation: initial.motherOccupation ?? "",
    guardian:         initial.guardian         ?? "",
    contact:          initial.contact          ?? "",
    emergencyContact: initial.emergencyContact ?? "",
    email:            initial.email            ?? "",
    address:          initial.address          ?? "",
    status:           initial.status === "Active" ? "ACTIVE" : initial.status === "Inactive" ? "INACTIVE" : (initial.status ?? "ACTIVE"),
    photoBase64:      initial.photoBase64       ?? "",
  } : BLANK);

  const [errors,       setErrors]       = useState({});
  const [grades,       setGrades]       = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(true);

  // Fetch grades directly inside the form so it's always fresh
  useEffect(() => {
    configAPI.getGrades()
      .then(data => setGrades(data ?? []))
      .catch(() => setGrades([]))
      .finally(() => setLoadingGrades(false));
  }, []);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = "Name is required";
    if (!form.dob)               e.dob        = "Date of birth is required";
    if (!form.gender)            e.gender     = "Select gender";
    if (!form.class)             e.class      = "Select class";
    if (!form.fatherName.trim()) e.fatherName = "Father's name is required";
    if (!form.motherName.trim()) e.motherName = "Mother's name is required";
    if (!form.guardian.trim())   e.guardian   = "Guardian name is required";
    if (!form.contact.trim())    e.contact    = "Contact is required";
    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber.trim()))
      e.aadharNumber = "Aadhaar must be 12 digits";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email";
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    if (isEdit) onEdit(form);
    else        onAdd(form);
    onClose();
  };

  const field = (key, label, required, children) => (
    <FormField label={label} required={required}>
      {children}
      {errors[key] && <span style={{ color: theme.red, fontSize: 11 }}>{errors[key]}</span>}
    </FormField>
  );

  const section = (title) => (
    <div style={{ fontSize: 12, fontWeight: 800, color: theme.accent, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4, paddingBottom: 4, borderBottom: `1px solid ${theme.border}` }}>
      {title}
    </div>
  );

  return (
    <Modal title={isEdit ? "Edit Student" : "Add New Student"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Photo upload */}
        <PhotoUpload value={form.photoBase64} onChange={set("photoBase64")} />

        {/* ── Personal details ── */}
        {section("Personal Details")}
        <FormRow>
          {field("name", "Full Name", true,
            <TextInput value={form.name} onChange={set("name")} placeholder="deekshith" />)}
          {field("dob", "Date of Birth", true,
            <TextInput type="date" value={form.dob} onChange={set("dob")} />)}
        </FormRow>

        <FormRow>
          {field("gender", "Gender", true,
            <SelectInput value={form.gender} onChange={set("gender")} placeholder="Select gender"
              options={["Male", "Female", "Other"]} />)}
          {field("bloodGroup", "Blood Group", false,
            <SelectInput value={form.bloodGroup} onChange={set("bloodGroup")} placeholder="Select"
              options={["A+","A-","B+","B-","AB+","AB-","O+","O-"]} />)}
        </FormRow>

        <FormRow>
          {field("nationality", "Nationality", false,
            <TextInput value={form.nationality} onChange={set("nationality")} placeholder="e.g. Indian" />)}
          {field("religion", "Religion", false,
            <TextInput value={form.religion} onChange={set("religion")} placeholder="Optional" />)}
        </FormRow>

        <FormRow>
          {field("aadharNumber", "Aadhaar Number", false,
            <TextInput value={form.aadharNumber} onChange={set("aadharNumber")} placeholder="12-digit UID" type="tel" />)}
          {field("category", "Category", false,
            <SelectInput value={form.category} onChange={set("category")} placeholder="Select" options={CATEGORIES} />)}
        </FormRow>

        {/* ── Academic ── */}
        {section("Academic")}
        <FormRow>
          {field("class", "Class / Section", true,
            <ClassSelect value={form.class} onChange={set("class")} grades={grades} loadingGrades={loadingGrades} />)}
          {field("roll", "Roll Number", false,
            <TextInput value={form.roll} onChange={set("roll")} placeholder="e.g. 12" type="number" />)}
        </FormRow>

        <FormRow>
          {field("admissionDate", "Admission Date", false,
            <TextInput type="date" value={form.admissionDate} onChange={set("admissionDate")} />)}
          {field("status", "Status", false,
            <SelectInput value={form.status} onChange={set("status")} options={["ACTIVE", "INACTIVE"]} />)}
        </FormRow>

        {/* ── Parents & Guardian ── */}
        {section("Parents & Guardian")}
        <FormRow>
          {field("fatherName", "Father's Name", true,
            <TextInput value={form.fatherName} onChange={set("fatherName")} placeholder="deekshith" />)}
          {field("fatherOccupation", "Father's Occupation", false,
            <TextInput value={form.fatherOccupation} onChange={set("fatherOccupation")} placeholder="Optional" />)}
        </FormRow>

        <FormRow>
          {field("motherName", "Mother's Name", true,
            <TextInput value={form.motherName} onChange={set("motherName")} placeholder="deekshith" />)}
          {field("motherOccupation", "Mother's Occupation", false,
            <TextInput value={form.motherOccupation} onChange={set("motherOccupation")} placeholder="Optional" />)}
        </FormRow>

        <FormRow>
          {field("guardian", "Guardian Name", true,
            <TextInput value={form.guardian} onChange={set("guardian")} placeholder="deekshith" />)}
          {field("contact", "Contact Number", true,
            <TextInput value={form.contact} onChange={set("contact")} placeholder="10-digit mobile" type="tel" />)}
        </FormRow>

        <FormRow>
          {field("emergencyContact", "Emergency Contact", false,
            <TextInput value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="Alternate number" type="tel" />)}
          {field("email", "Email", false,
            <TextInput value={form.email} onChange={set("email")} placeholder="parent@example.com" type="email" />)}
        </FormRow>

        {/* ── Address ── */}
        {section("Address")}
        {field("address", "Residential Address", false,
          <TextInput value={form.address} onChange={set("address")} placeholder="Full residential address" />)}

        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update Student" : "Add Student"} />
      </form>
    </Modal>
  );
}
