// components/forms/AddExamForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, TextareaInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const INITIAL = {
  name: "", subject: "", class: "All",
  date: "", maxMarks: "", duration: "",
  examiner: "", instructions: "",
};

// ── CHANGE: accept `teachers` prop for the examiner dropdown ──
export default function AddExamForm({ onClose, onAdd, teachers = [] }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  // ── CHANGE: build examiner options dynamically from the prop ──
  const teacherOptions = ["", ...teachers.map(t => t.name)];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name     = "Exam name is required";
    if (!form.subject)     e.subject  = "Subject is required";
    if (!form.date)        e.date     = "Date is required";
    if (!form.maxMarks)    e.maxMarks = "Max marks required";
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onAdd({
      ...form,
      id: "E" + String(Date.now()).slice(-3),
      status: "Scheduled",
      maxMarks: Number(form.maxMarks),
    });
    onClose();
  };

  const field = (key, label, required, children) => (
    <FormField label={label} required={required}>
      {children}
      {errors[key] && <span style={{ color: theme.red, fontSize: 11 }}>{errors[key]}</span>}
    </FormField>
  );

  return (
    <Modal title="Schedule New Exam" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FormRow>
          {field("name", "Exam Name", true,
            <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Unit Test 1" />)}
          {field("subject", "Subject", true,
            <SelectInput value={form.subject} onChange={set("subject")} placeholder="Select subject"
              options={["All Subjects","Mathematics","Physics","Chemistry","Biology","English","History","Geography","Computer","P.E."]} />)}
        </FormRow>

        <FormRow>
          {field("date", "Exam Date", true,
            <TextInput type="date" value={form.date} onChange={set("date")} />)}
          {field("class", "For Class", false,
            <SelectInput value={form.class} onChange={set("class")}
              options={["All","6-A","6-B","7-A","7-B","7-C","8-A","8-B","9-A","9-B","10-A","10-B"]} />)}
        </FormRow>

        <FormRow>
          {field("maxMarks", "Maximum Marks", true,
            <TextInput type="number" value={form.maxMarks} onChange={set("maxMarks")} placeholder="e.g. 100" />)}
          {field("duration", "Duration", false,
            <TextInput value={form.duration} onChange={set("duration")} placeholder="e.g. 3 hours" />)}
        </FormRow>

        {/* ── CHANGE: SelectInput with live teacher names instead of plain TextInput ── */}
        {field("examiner", "Examiner / Invigilator", false,
          <SelectInput value={form.examiner} onChange={set("examiner")}
            placeholder="Select a teacher"
            options={teacherOptions} />)}

        {field("instructions", "Special Instructions", false,
          <TextareaInput value={form.instructions} onChange={set("instructions")}
            placeholder="Any special instructions for students…" rows={3} />)}

        <FormActions onCancel={onClose} submitLabel="Schedule Exam" />
      </form>
    </Modal>
  );
}