// components/forms/AddTeacherForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const BLANK = {
  name: "", subject: "", email: "", contact: "",
  classes: "", exp: "", qualification: "", status: "ACTIVE",
};

export default function AddTeacherForm({ onClose, onAdd, onEdit, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(isEdit ? {
    name: initial.name ?? "",
    subject: initial.subject ?? "",
    email: initial.email ?? "",
    contact: initial.contact ?? "",
    classes: initial.classes ?? "",
    exp: initial.exp ?? "",
    qualification: initial.qualification ?? "",
    status: initial.status === "Active" ? "ACTIVE"
          : initial.status === "On Leave" ? "ON_LEAVE"
          : initial.status === "Inactive" ? "INACTIVE"
          : (initial.status ?? "ACTIVE"),
  } : BLANK);
  const [errors, setErrors] = useState({});

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.subject)        e.subject = "Subject is required";
    if (!form.email.trim())   e.email   = "Email is required";
    if (!form.contact.trim()) e.contact = "Contact is required";
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

  return (
    <Modal title={isEdit ? "Edit Teacher" : "Add New Teacher"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FormRow>
          {field("name", "Full Name", true,
            <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Dr. Rekha Iyer" />)}
          {field("subject", "Subject", true,
            <SelectInput value={form.subject} onChange={set("subject")} placeholder="Select subject"
              options={["Mathematics","Physics","Chemistry","Biology","English","History","Geography","Computer","P.E.","Art","Music"]} />)}
        </FormRow>

        <FormRow>
          {field("email", "Email", true,
            <TextInput type="email" value={form.email} onChange={set("email")} placeholder="teacher@school.in" />)}
          {field("contact", "Contact Number", true,
            <TextInput value={form.contact} onChange={set("contact")} placeholder="10-digit mobile" type="tel" />)}
        </FormRow>

        <FormRow>
          {field("qualification", "Qualification", false,
            <TextInput value={form.qualification} onChange={set("qualification")} placeholder="e.g. M.Sc, B.Ed" />)}
          {field("exp", "Experience", false,
            <TextInput value={form.exp} onChange={set("exp")} placeholder="e.g. 5 yrs" />)}
        </FormRow>

        {field("classes", "Assigned Classes", false,
          <TextInput value={form.classes} onChange={set("classes")} placeholder="e.g. 10-A, 9-B" />)}

        {field("status", "Status", false,
          <SelectInput value={form.status} onChange={set("status")}
            options={["ACTIVE", "ON_LEAVE", "INACTIVE"]} />)}

        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update Teacher" : "Add Teacher"} />
      </form>
    </Modal>
  );
}
