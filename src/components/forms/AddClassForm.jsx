// components/forms/AddClassForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const INITIAL = {
  name: "", section: "", room: "",
  classTeacher: "", capacity: "", monitor: "",
};

// ── CHANGE: accept `teachers` prop instead of hardcoded TEACHER_OPTIONS ──
export default function AddClassForm({ onClose, onAdd, teachers = [] }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  // ── CHANGE: build teacher name options dynamically from the prop ──
  const teacherOptions = teachers.map(t => t.name);

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Class name is required";
    if (!form.section.trim()) e.section = "Section is required";
    if (!form.room.trim())    e.room    = "Room number is required";
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onAdd({
      name: `${form.name}-${form.section}`,
      room: form.room,
      classTeacher: form.classTeacher || "—",
      strength: 0,
      monitor: form.monitor || "—",
      capacity: form.capacity,
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
    <Modal title="Add New Class" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FormRow>
          {field("name", "Class / Grade", true,
            <SelectInput value={form.name} onChange={set("name")} placeholder="Select grade"
              options={["1","2","3","4","5","6","7","8","9","10","11","12"]} />)}
          {field("section", "Section", true,
            <SelectInput value={form.section} onChange={set("section")} placeholder="Select section"
              options={["A","B","C","D","E"]} />)}
        </FormRow>

        <FormRow>
          {field("room", "Room Number", true,
            <TextInput value={form.room} onChange={set("room")} placeholder="e.g. 201" />)}
          {field("capacity", "Max Capacity", false,
            <TextInput type="number" value={form.capacity} onChange={set("capacity")} placeholder="e.g. 40" />)}
        </FormRow>

        {/* ── CHANGE: options now come from live teachers prop ── */}
        {field("classTeacher", "Class Teacher", false,
          <SelectInput value={form.classTeacher} onChange={set("classTeacher")}
            placeholder="Select a teacher"
            options={teacherOptions} />)}

        {field("monitor", "Class Monitor", false,
          <TextInput value={form.monitor} onChange={set("monitor")} placeholder="Student's full name" />)}

        <FormActions onCancel={onClose} submitLabel="Create Class" />
      </form>
    </Modal>
  );
}