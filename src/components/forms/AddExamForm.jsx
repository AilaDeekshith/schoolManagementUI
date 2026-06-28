// components/forms/AddExamForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, TextareaInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const BLANK = {
  name: "", subject: "", class: "All",
  date: "", maxMarks: "", duration: "",
  examiner: "", instructions: "",
};

export default function AddExamForm({ onClose, onAdd, onEdit, initial, teachers = [], classOptions = [] }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(isEdit ? {
    name: initial.name ?? "",
    subject: initial.subject ?? "",
    class: initial.class ?? "All",
    date: initial.date ?? "",
    maxMarks: initial.maxMarks ? String(initial.maxMarks) : "",
    duration: initial.duration ?? "",
    examiner: initial.examiner ?? "",
    instructions: initial.instructions ?? "",
  } : BLANK);
  const [errors, setErrors] = useState({});

  const set = key => val => setForm(f => ({ ...f, [key]: val }));
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
    if (isEdit) onEdit({ ...form, maxMarks: Number(form.maxMarks) });
    else        onAdd({ ...form, maxMarks: Number(form.maxMarks) });
    onClose();
  };

  const field = (key, label, required, children) => (
    <FormField label={label} required={required}>
      {children}
      {errors[key] && <span style={{ color: theme.red, fontSize: 11 }}>{errors[key]}</span>}
    </FormField>
  );

  return (
    <Modal title={isEdit ? "Edit Exam" : "Schedule New Exam"} onClose={onClose}>
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
              options={["All", ...(classOptions.length ? classOptions : ["6-A","6-B","7-A","7-B","7-C","8-A","8-B","9-A","9-B","10-A","10-B"])]} />)}
        </FormRow>

        <FormRow>
          {field("maxMarks", "Maximum Marks", true,
            <TextInput type="number" value={form.maxMarks} onChange={set("maxMarks")} placeholder="e.g. 100" />)}
          {field("duration", "Duration", false,
            <TextInput value={form.duration} onChange={set("duration")} placeholder="e.g. 3 hours" />)}
        </FormRow>

        {field("examiner", "Examiner / Invigilator", false,
          <SelectInput value={form.examiner} onChange={set("examiner")}
            placeholder="Select a teacher"
            options={teacherOptions} />)}

        {field("instructions", "Special Instructions", false,
          <TextareaInput value={form.instructions} onChange={set("instructions")}
            placeholder="Any special instructions for students…" rows={3} />)}

        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update Exam" : "Schedule Exam"} />
      </form>
    </Modal>
  );
}
