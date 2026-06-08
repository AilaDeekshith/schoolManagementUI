// pages/Students.jsx
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import { theme } from "../theme";
import CardWrapper from "../components/CardWrapper";
import Badge from "../components/Badge";
import { students as initialStudents } from "../data/mockData"; // ← CHANGE 1: rename import
import AddStudentForm from "../components/forms/Addstudentform"; // ← CHANGE 2: fix import path
import StudentProfile from "./StudentProfile";

export default function Students() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState(initialStudents); // ← CHANGE 3: lift into state
  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null); // State for selected student profile

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.class.includes(search) ||
      s.id.includes(search),
  );

  // ← CHANGE 4: handler that adds new student to state
  const handleAdd = (record) => {
    setStudents((prev) => [record, ...prev]);
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "class", label: "Class" },
    { key: "roll", label: "Roll No." },
    { key: "gender", label: "Gender" },
    { key: "dob", label: "Date of Birth" },
    { key: "guardian", label: "Guardian" },
    { key: "contact", label: "Contact" },
    { key: "status", label: "Status", render: (v) => <Badge status={v} /> },
    { key: "fees", label: "Fees", render: (v) => <Badge status={v} /> },
  ];

  return (
    <>
      { selectedStudent == null ? (<div>
        <PageHeader
          title="Student Records"
          actionLabel="+ Add Student"
          onAction={() => setAddOpen(true)}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, class, ID…"
        />
        <CardWrapper>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: 11,
                        fontFamily: "monospace",
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        color: theme.muted,
                        borderBottom: `1px solid ${theme.border}`,
                        background: theme.surface,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${theme.border}22`,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = theme.surface)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => setSelectedStudent(row)} // Example click handler for rows with 'Roll No.' column
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: "13px 16px",
                          color: col.key === "name" ? theme.text : theme.muted,
                          fontWeight: col.key === "name" ? 600 : 400,
                          fontSize: 14,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardWrapper>

        {/* ← CHANGE 5: render as modal overlay, pass both callbacks */}
        {addOpen && (
          <AddStudentForm onClose={() => setAddOpen(false)} onAdd={handleAdd} />
        )}
      </div>) : (
        <StudentProfile student={selectedStudent} onBack={() => setSelectedStudent(null)} />
      )}
    </>
  );
}
