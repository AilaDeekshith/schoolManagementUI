// pages/Students.jsx
import { useState, useEffect } from "react";
import { toast } from "../toast";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import DataTable from "../components/DataTable";
import CardWrapper from "../components/CardWrapper";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import AddStudentForm from "../components/forms/Addstudentform";
import StudentProfile from "./StudentProfile";
import { studentAPI, configAPI } from "../api/apiService";
import { theme } from "../theme";

// ── helpers ───────────────────────────────────────────────────
const mapStatus = (s) => (s === "ACTIVE" ? "Active" : "Inactive");
const mapFeeStatus = (s) =>
  s === "PAID" ? "Paid" : s === "OVERDUE" ? "Overdue" : "Pending";

const toRow = (s) => ({
  id: s.id,
  code: s.studentCode,
  name: s.name,
  class: s.className,
  roll: s.rollNumber,
  gender: s.gender,
  dob: s.dob,
  guardian: s.guardianName,
  contact: s.contactNumber,
  email: s.email,
  address: s.address,
  bloodGroup: s.bloodGroup,
  status: mapStatus(s.status),
  fees: mapFeeStatus(s.feeStatus),
  photoBase64: s.photoBase64 ?? "",
  // extended details (for edit prefill)
  fatherName: s.fatherName,
  motherName: s.motherName,
  fatherOccupation: s.fatherOccupation,
  motherOccupation: s.motherOccupation,
  emergencyContact: s.emergencyContact,
  aadharNumber: s.aadharNumber,
  category: s.category,
  nationality: s.nationality,
  religion: s.religion,
  admissionDate: s.admissionDate,
});

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selected, setSelected] = useState(null);

  // ── fetch (search runs on the backend) ─────────────────────
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const name = debouncedSearch.trim();
      const data = name ? await studentAPI.search(name) : await studentAPI.getAll();
      setStudents(data.map(toRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    configAPI.getGrades().then(grades => {
      setClassOptions(grades.flatMap(g =>
        (g.sections ?? []).map(s => `${g.name}-${s.letter}`)
      ));
    }).catch(() => {});
  }, []);

  // Debounce typing so we hit the backend once the user pauses.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Any change to the search triggers a backend call (also runs on mount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const toPayload = (formData) => ({
    name: formData.name,
    dob: formData.dob,
    gender: formData.gender,
    bloodGroup: formData.bloodGroup || null,
    address: formData.address || null,
    className: formData.class,
    rollNumber: formData.roll ? Number(formData.roll) : null,
    guardianName: formData.guardian,
    contactNumber: formData.contact,
    status: formData.status || 'ACTIVE',
    photoBase64: formData.photoBase64 || null,
    // extended details
    fatherName: formData.fatherName || null,
    motherName: formData.motherName || null,
    fatherOccupation: formData.fatherOccupation || null,
    motherOccupation: formData.motherOccupation || null,
    emergencyContact: formData.emergencyContact || null,
    aadharNumber: formData.aadharNumber || null,
    category: formData.category || null,
    email: formData.email || null,
    nationality: formData.nationality || null,
    religion: formData.religion || null,
    admissionDate: formData.admissionDate || null,
  });

  // ── add ────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      await studentAPI.create(toPayload(formData));
      fetchStudents();
    } catch (err) {
      toast.error("Failed to add student: " + err.message);
    }
  };

  // ── edit ───────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    try {
      await studentAPI.update(editTarget.id, toPayload(formData));
      fetchStudents();
    } catch (err) {
      toast.error("Failed to update student: " + err.message);
    }
  };

  // ── delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await studentAPI.delete(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const columns = [
    { key: "code", label: "Student ID", render: (v) => v || "—" },
    {
      key: "name", label: "Name",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: row.photoBase64 ? "transparent" : "#EDE9FE",
            border: "1.5px solid #E5E7EB", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#6C63FF",
          }}>
            {row.photoBase64
              ? <img src={row.photoBase64} alt={v} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : v.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ),
    },
    { key: "class", label: "Class" },
    { key: "roll", label: "Roll No." },
    { key: "gender", label: "Gender" },
    { key: "dob", label: "DOB" },
    { key: "guardian", label: "Guardian" },
    { key: "contact", label: "Contact" },
    { key: "bloodGroup", label: "Blood" },
    { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
    { key: "fees", label: "Fees", render: (v) => <Badge status={v} /> },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setEditTarget(row); }}
            style={{ background: theme.blue + "15", color: theme.blue, border: `1px solid ${theme.blue}33`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
          >Edit</button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            style={{ background: theme.red + "18", color: theme.red, border: `1px solid ${theme.red}33`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
          >Delete</button>
        </div>
      ),
    },
  ];

  if (selected) {
    return (
      <StudentProfile student={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div>
      <PageHeader
        title="Student Records"
        actionLabel="+ Add Student"
        onAction={() => setAddOpen(true)}
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by student name…"
      />

      <CardWrapper>
        {loading && <LoadingSpinner message="Loading students…" />}
        {error && <ErrorMessage message={error} onRetry={fetchStudents} />}
        {!loading && !error && (
          students.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: theme.muted }}>
              {debouncedSearch ? `No students match “${debouncedSearch}”.` : "No students found."}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={students}
              onRowClick={setSelected}
            />
          )
        )}
      </CardWrapper>

      {!loading && !error && (
        <div
          style={{
            marginTop: 8,
            color: theme.muted,
            fontSize: 12,
            textAlign: "right",
          }}
        >
          {students.length} record{students.length !== 1 ? "s" : ""}
        </div>
      )}

      {addOpen && (
        <AddStudentForm onClose={() => setAddOpen(false)} onAdd={handleAdd} classOptions={classOptions} />
      )}
      {editTarget && (
        <AddStudentForm onClose={() => setEditTarget(null)} onEdit={handleEdit} initial={editTarget} classOptions={classOptions} />
      )}
    </div>
  );
}
