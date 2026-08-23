// components/forms/AddExamForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, TextareaInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const FALLBACK_SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Computer", "P.E."];
const FALLBACK_CLASSES  = ["6-A", "6-B", "7-A", "7-B", "7-C", "8-A", "8-B", "9-A", "9-B", "10-A", "10-B"];

export default function AddExamForm({ onClose, onAdd, onEdit, initial, classOptions = [], subjectOptions = [], yearOptions = [] }) {
  const isEdit = !!initial;
  const classOpts   = classOptions.length ? classOptions : FALLBACK_CLASSES;
  const subjectOpts = subjectOptions.length ? subjectOptions : FALLBACK_SUBJECTS;
  // Keep a pre-existing year even if it is no longer configured, so edits don't lose it.
  const yearOpts = initial?.academicYear && !yearOptions.includes(initial.academicYear)
    ? [initial.academicYear, ...yearOptions]
    : yearOptions;

  const [name, setName]                 = useState(initial?.name ?? "");
  const [academicYear, setAcademicYear] = useState(initial?.academicYear ?? "");
  const [selectedClasses, setSelectedClasses] = useState(initial?.classes ?? []);
  const [selectedSubjects, setSelectedSubjects] = useState(initial?.subjects ?? []);
  const [date, setDate]                 = useState(initial?.date ?? "");
  const [maxMarks, setMaxMarks]         = useState(initial?.maxMarks ? String(initial.maxMarks) : "100");
  const [duration, setDuration]         = useState(initial?.duration ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [errors, setErrors]             = useState({});

  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const handleSubmit = e => {
    e.preventDefault();
    const err = {};
    if (!name.trim()) err.name = "Exam name is required";
    if (!academicYear) err.academicYear = "Select an academic year";
    if (selectedClasses.length === 0) err.classes = "Select at least one class";
    if (selectedSubjects.length === 0) err.subjects = "Select at least one subject";
    if (Object.keys(err).length) { setErrors(err); return; }

    const payload = {
      name: name.trim(),
      academicYear,
      subjects: selectedSubjects,
      classes: selectedClasses,
      date: date || null,
      maxMarks: maxMarks ? Number(maxMarks) : null,
      duration,
      instructions,
    };
    (isEdit ? onEdit : onAdd)(payload);
    onClose();
  };

  const fieldErr = key => errors[key]
    ? <span style={{ color: theme.red, fontSize: 11 }}>{errors[key]}</span> : null;

  const chip = on => ({
    padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    border: `1.5px solid ${on ? theme.accent : theme.border}`,
    background: on ? theme.accent : theme.card,
    color: on ? "#fff" : theme.muted,
  });
  const miniBtn = { padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${theme.border}`, background: theme.card, color: theme.muted, fontFamily: "'DM Sans', sans-serif" };

  return (
    <Modal title={isEdit ? "Edit Exam" : "Schedule New Exam"} onClose={onClose} width={620}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FormField label="Exam Name" required>
          <TextInput value={name} onChange={setName} placeholder="e.g. Unit Test 1 / Mid-Term" />
          {fieldErr("name")}
        </FormField>

        {/* Academic Year — limited to years configured in Configuration */}
        <FormField label="Academic Year" required>
          <select
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1.5px solid ${theme.border}`, background: theme.card,
              color: theme.text, fontSize: 14, outline: "none",
              fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
            }}
          >
            <option value="">— Select Year —</option>
            {yearOpts.length === 0 && <option value="" disabled>No academic years configured</option>}
            {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {fieldErr("academicYear")}
        </FormField>

        {/* Classes multi-select */}
        <FormField label="For Classes" required>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => setSelectedClasses(classOpts)} style={miniBtn}>Select all</button>
            <button type="button" onClick={() => setSelectedClasses([])} style={miniBtn}>Clear</button>
            <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{selectedClasses.length} selected</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {classOpts.length === 0 && <span style={{ fontSize: 12, color: theme.muted }}>No classes configured</span>}
            {classOpts.map(c => (
              <button type="button" key={c} onClick={() => toggle(selectedClasses, setSelectedClasses, c)} style={chip(selectedClasses.includes(c))}>{c}</button>
            ))}
          </div>
          {fieldErr("classes")}
        </FormField>

        {/* Subjects multi-select */}
        <FormField label="Subjects" required>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => setSelectedSubjects(subjectOpts)} style={miniBtn}>Select all</button>
            <button type="button" onClick={() => setSelectedSubjects([])} style={miniBtn}>Clear</button>
            <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{selectedSubjects.length} selected</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {subjectOpts.length === 0 && <span style={{ fontSize: 12, color: theme.muted }}>No subjects configured</span>}
            {subjectOpts.map(s => (
              <button type="button" key={s} onClick={() => toggle(selectedSubjects, setSelectedSubjects, s)} style={chip(selectedSubjects.includes(s))}>{s}</button>
            ))}
          </div>
          {fieldErr("subjects")}
        </FormField>

        <FormRow>
          <FormField label="Exam Date">
            <TextInput type="date" value={date} onChange={setDate} />
          </FormField>
          <FormField label="Default Max Marks">
            <TextInput type="number" value={maxMarks} onChange={setMaxMarks} placeholder="e.g. 100" />
          </FormField>
        </FormRow>

        <FormField label="Duration">
          <TextInput value={duration} onChange={setDuration} placeholder="e.g. 3 hours" />
        </FormField>

        <FormField label="Special Instructions">
          <TextareaInput value={instructions} onChange={setInstructions} placeholder="Any special instructions for students…" rows={2} />
        </FormField>

        <div style={{ fontSize: 12, color: theme.muted, background: theme.bg, borderRadius: 8, padding: "9px 12px", lineHeight: 1.5 }}>
          ℹ️ This creates <b>one exam record</b> noting the selected classes & subjects. Set each paper's date, time & max marks under <b>Exams → Exam Timetable</b>.
        </div>

        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update Exam" : "Create Exam"} />
      </form>
    </Modal>
  );
}
