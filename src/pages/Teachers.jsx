// pages/Teachers.jsx
import { useState } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import { teachers as initialTeachers } from "../data/mockData";      // ← CHANGE 1: rename import
import AddTeacherForm from "../components/forms/AddTeacherForm";      // ← CHANGE 2: add form import

function TeacherCard({ teacher }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card,
        border: `1px solid ${hovered ? theme.accent : theme.border}`,
        borderRadius: 14, padding: 22, transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", background: theme.accent + "22",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: theme.accent,
        }}>
          {teacher.name[0]}
        </div>
        <Badge status={teacher.status} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>{teacher.name}</div>
      <div style={{ color: theme.accent, fontWeight: 600, fontSize: 13, margin: "4px 0 10px" }}>{teacher.subject}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          ["🆔", teacher.id],
          ["📚", "Classes: " + teacher.classes],
          ["⏳", "Experience: " + teacher.exp],
          ["📞", teacher.contact],
          ["✉️", teacher.email],
        ].map(([icon, val]) => (
          <div key={val} style={{ display: "flex", gap: 8, color: theme.muted, fontSize: 13 }}>
            <span>{icon}</span><span>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Teachers() {
  const [teachers, setTeachers] = useState(initialTeachers);         // ← CHANGE 3: lift into state
  const [addOpen, setAddOpen]   = useState(false);                   // ← CHANGE 4: add open state

  // ← CHANGE 5: handler that prepends new teacher card
  const handleAdd = record => {
    setTeachers(prev => [record, ...prev]);
  };

  return (
    <div>
      {/* ← CHANGE 6: wire onAction to open the form */}
      <PageHeader title="Teacher Directory" actionLabel="+ Add Teacher" onAction={() => setAddOpen(true)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {teachers.map(t => <TeacherCard key={t.id} teacher={t} />)}
      </div>

      {/* ← CHANGE 7: render modal when open, pass both callbacks */}
      {addOpen && (
        <AddTeacherForm
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}