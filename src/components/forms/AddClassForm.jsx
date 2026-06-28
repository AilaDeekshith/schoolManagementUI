// components/forms/AddClassForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const BLANK = {
  name: "", section: "", room: "",
  classTeacher: "", capacity: "", monitor: "",
};

// grades: [{ id, name, sections: [{ id, letter }] }]
export default function AddClassForm({ onClose, onAdd, onEdit, initial, teachers = [], grades = [] }) {
  const isEdit = !!initial;

  const [form, setForm] = useState(isEdit ? {
    name: initial.name ?? "",
    section: initial.section ?? "",
    room: initial.room ?? "",
    classTeacher: initial.classTeacher === "—" ? "" : (initial.classTeacher ?? ""),
    capacity: initial.capacity ? String(initial.capacity) : "",
    monitor: initial.monitor === "—" ? "" : (initial.monitor ?? ""),
  } : BLANK);
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const gradeNames = grades.map(g => g.name);
  const sectionLetters = (grades.find(g => g.name === form.name)?.sections ?? []).map(s => s.letter);
  const teacherOptions = teachers.map(t => t.name);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Grade is required";
    if (!form.room.trim()) e.room = "Room number is required";
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    const combinedName = form.section ? `${form.name}-${form.section}` : form.name;
    if (isEdit) onEdit({ ...form, combinedName });
    else        onAdd({ ...form, name: combinedName });
    onClose();
  };

  const field = (key, label, required, children) => (
    <FormField label={label} required={required}>
      {children}
      {errors[key] && <span style={{ color: theme.red, fontSize: 11 }}>{errors[key]}</span>}
    </FormField>
  );

  return (
    <Modal title={isEdit ? "Edit Class" : "Add New Class"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FormRow>
          {field("name", "Grade", true,
            <SelectInput
              value={form.name}
              onChange={v => { set("name", v); set("section", ""); }}
              placeholder="Select grade"
              options={gradeNames.length ? gradeNames : ["1","2","3","4","5","6","7","8","9","10","11","12"]}
            />
          )}
          {field("section", "Section", false,
            <SelectInput
              value={form.section}
              onChange={v => set("section", v)}
              placeholder={sectionLetters.length ? "Select section" : "— no sections configured —"}
              options={sectionLetters.length ? sectionLetters : ["A","B","C","D","E"]}
            />
          )}
        </FormRow>

        <FormRow>
          {field("room", "Room Number", true,
            <TextInput value={form.room} onChange={v => set("room", v)} placeholder="e.g. 201" />)}
          {field("capacity", "Max Capacity", false,
            <TextInput type="number" value={form.capacity} onChange={v => set("capacity", v)} placeholder="e.g. 40" />)}
        </FormRow>

        {field("classTeacher", "Class Teacher", false,
          <SelectInput value={form.classTeacher} onChange={v => set("classTeacher", v)}
            placeholder="Select a teacher"
            options={teacherOptions} />)}

        {field("monitor", "Class Monitor", false,
          <TextInput value={form.monitor} onChange={v => set("monitor", v)} placeholder="Student's full name" />)}

        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update Class" : "Create Class"} />
      </form>
    </Modal>
  );
}
