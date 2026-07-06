// pages/Students.jsx
import { useState, useEffect } from "react";
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
});

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selected, setSelected] = useState(null);

  // ── fetch ──────────────────────────────────────────────────
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentAPI.getAll();
      setStudents(data.map(toRow));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
    configAPI.getGrades().then(grades => {
      setClassOptions(grades.flatMap(g =>
        (g.sections ?? []).map(s => `${g.name}-${s.letter}`)
      ));
    }).catch(() => {});
  }, []);

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
  });

  // ── add ────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      await studentAPI.create(toPayload(formData));
      fetchStudents();
    } catch (err) {
      alert("Failed to add student: " + err.message);
    }
  };

  // ── edit ───────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    try {
      await studentAPI.update(editTarget.id, toPayload(formData));
      fetchStudents();
    } catch (err) {
      alert("Failed to update student: " + err.message);
    }
  };

  // ── delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await studentAPI.delete(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  // ── filter ─────────────────────────────────────────────────
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.class || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(s.id || "").includes(search),
  );

  const columns = [
    { key: "id", label: "ID" },
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
        placeholder="Search by name, class or ID…"
      />

      <CardWrapper>
        {loading && <LoadingSpinner message="Loading students…" />}
        {error && <ErrorMessage message={error} onRetry={fetchStudents} />}
        {!loading && !error && (
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={setSelected}
          />
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
          {filtered.length} of {students.length} records
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
