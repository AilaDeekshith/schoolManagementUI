// components/forms/AddStudentForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

const INITIAL = {
  name: "", dob: "", gender: "", class: "", roll: "",
  guardian: "", contact: "", address: "", bloodGroup: "", fees: "Pending",
};

export default function AddStudentForm({ onClose, onAdd }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.dob)             e.dob      = "Date of birth is required";
    if (!form.gender)          e.gender   = "Select gender";
    if (!form.class)           e.class    = "Select class";
    if (!form.guardian.trim()) e.guardian = "Guardian name is required";
    if (!form.contact.trim())  e.contact  = "Contact is required";
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onAdd({
      ...form,
      id: "S" + String(Date.now()).slice(-4),
      status: "Active",
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
    <Modal title="Add New Student" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FormRow>
          {field("name", "Full Name", true,
            <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Ananya Reddy" />)}
          {field("dob", "Date of Birth", true,
            <TextInput type="date" value={form.dob} onChange={set("dob")} />)}
        </FormRow>

        <FormRow>
          {field("gender", "Gender", true,
            <SelectInput value={form.gender} onChange={set("gender")} placeholder="Select gender"
              options={["Male", "Female", "Other"]} />)}
          {field("class", "Class", true,
            <SelectInput value={form.class} onChange={set("class")} placeholder="Select class"
              options={["6-A","6-B","7-A","7-B","7-C","8-A","8-B","9-A","9-B","10-A","10-B"]} />)}
        </FormRow>

        <FormRow>
          {field("roll", "Roll Number", false,
            <TextInput value={form.roll} onChange={set("roll")} placeholder="e.g. 12" type="number" />)}
          {field("bloodGroup", "Blood Group", false,
            <SelectInput value={form.bloodGroup} onChange={set("bloodGroup")} placeholder="Select"
              options={["A+","A-","B+","B-","AB+","AB-","O+","O-"]} />)}
        </FormRow>

        <FormRow>
          {field("guardian", "Guardian Name", true,
            <TextInput value={form.guardian} onChange={set("guardian")} placeholder="e.g. Ravi Reddy" />)}
          {field("contact", "Contact Number", true,
            <TextInput value={form.contact} onChange={set("contact")} placeholder="10-digit mobile" type="tel" />)}
        </FormRow>

        {field("address", "Address", false,
          <TextInput value={form.address} onChange={set("address")} placeholder="Full residential address" />)}

        {field("fees", "Fee Status", false,
          <SelectInput value={form.fees} onChange={set("fees")}
            options={["Paid", "Pending", "Overdue"]} />)}

        <FormActions onCancel={onClose} submitLabel="Add Student" />
      </form>
    </Modal>
  );
}