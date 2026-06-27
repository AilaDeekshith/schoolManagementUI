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
import { studentAPI } from "../api/apiService";
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
});

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

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
  }, []);

  // ── add ────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    try {
      await studentAPI.create({
        name: formData.name,
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || null,
        address: formData.address || null,
        className: formData.class,
        rollNumber: formData.roll ? Number(formData.roll) : null,
        guardianName: formData.guardian,
        contactNumber: formData.contact,
        status: formData.status || 'ACTIVE'
      });
      fetchStudents();
    } catch (err) {
      alert("Failed to add student: " + err.message);
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
    { key: "name", label: "Name" },
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
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            background: theme.red + "18",
            color: theme.red,
            border: `1px solid ${theme.red}33`,
            borderRadius: 6,
            padding: "3px 10px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Delete
        </button>
      ),
    },
  ];

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
        {!loading && !error && <DataTable columns={columns} data={filtered} />}
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
        <AddStudentForm onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
