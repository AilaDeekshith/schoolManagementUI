// components/forms/AddAdmissionForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, TextareaInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const INITIAL = {
  name: "", dob: "", gender: "", applyClass: "",
  guardian: "", contact: "", email: "",
  prevSchool: "", reason: "",
};

export default function AddAdmissionForm({ onClose, onAdd }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = "Applicant name is required";
    if (!form.applyClass)        e.applyClass = "Select a class";
    if (!form.guardian.trim())   e.guardian   = "Guardian name is required";
    if (!form.contact.trim())    e.contact    = "Contact number is required";
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onAdd({
      ...form,
      id: "A" + Date.now().toString().slice(-6),
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
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
    <Modal title="New Admission Application" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Applicant */}
        <div style={{ fontFamily: "monospace", fontSize: 11, color: theme.accent, letterSpacing: 1, marginBottom: -8 }}>
          APPLICANT DETAILS
        </div>

        <FormRow>
          {field("name", "Full Name", true,
            <TextInput value={form.name} onChange={set("name")} placeholder="Student's full name" />)}
          {field("dob", "Date of Birth", false,
            <TextInput type="date" value={form.dob} onChange={set("dob")} />)}
        </FormRow>

        <FormRow>
          {field("gender", "Gender", false,
            <SelectInput value={form.gender} onChange={set("gender")} placeholder="Select gender"
              options={["Male","Female","Other"]} />)}
          {field("applyClass", "Applying for Class", true,
            <SelectInput value={form.applyClass} onChange={set("applyClass")} placeholder="Select class"
              options={["1","2","3","4","5","6-A","6-B","7-A","7-B","7-C","8-A","8-B","9-A","9-B","10-A","10-B"]} />)}
        </FormRow>

        {/* Guardian */}
        <div style={{ fontFamily: "monospace", fontSize: 11, color: theme.accent, letterSpacing: 1, marginBottom: -8, marginTop: 4 }}>
          GUARDIAN DETAILS
        </div>

        <FormRow>
          {field("guardian", "Guardian Name", true,
            <TextInput value={form.guardian} onChange={set("guardian")} placeholder="Parent / Guardian" />)}
          {field("contact", "Contact Number", true,
            <TextInput value={form.contact} onChange={set("contact")} placeholder="10-digit mobile" type="tel" />)}
        </FormRow>

        {field("email", "Guardian Email", false,
          <TextInput type="email" value={form.email} onChange={set("email")} placeholder="guardian@email.com" />)}

        {/* Previous school */}
        <div style={{ fontFamily: "monospace", fontSize: 11, color: theme.accent, letterSpacing: 1, marginBottom: -8, marginTop: 4 }}>
          PREVIOUS SCHOOL (OPTIONAL)
        </div>

        {field("prevSchool", "Previous School Name", false,
          <TextInput value={form.prevSchool} onChange={set("prevSchool")} placeholder="Last attended school" />)}

        {field("reason", "Reason for Admission", false,
          <TextareaInput value={form.reason} onChange={set("reason")} placeholder="Brief reason for seeking admission…" rows={3} />)}

        <FormActions onCancel={onClose} submitLabel="Submit Application" />
      </form>
    </Modal>
  );
}