// pages/Classes.jsx
import { useState } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import { classList as initialClasses, teachers } from "../data/mockData"; // ← CHANGE 1: rename + import teachers
import AddClassForm from "../components/forms/AddClassForm";               // ← CHANGE 2: add form import

function ClassCard({ cls }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card,
        border: `1px solid ${hovered ? theme.blue : theme.border}`,
        borderRadius: 14, padding: 22, position: "relative",
        overflow: "hidden", transition: "border-color 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: -10, right: -10, width: 80, height: 80,
        borderRadius: "50%", background: theme.blue + "11",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 900, color: theme.blue + "55", pointerEvents: "none",
      }}>{cls.name}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: theme.blue }}> Class {cls.name}</div>
      <div style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>Room #{cls.room}</div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
        {[
          ["👩‍🏫", "Class Teacher", cls.classTeacher],
          ["👥", "Strength",      cls.strength + " students"],
          ["⭐", "Monitor",       cls.monitor],
        ].map(([icon, label, val]) => (
          <div key={label} style={{ display: "flex", gap: 8, fontSize: 13 }}>
            <span>{icon}</span>
            <span style={{ color: theme.muted }}>{label}:</span>
            <span style={{ color: theme.text, fontWeight: 600 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Classes() {
  const [classes, setClasses] = useState(initialClasses);  // ← CHANGE 3: lift into state
  const [addOpen, setAddOpen] = useState(false);           // ← CHANGE 4: add open state

  // ← CHANGE 5: handler that appends new class card
  const handleAdd = record => {
    setClasses(prev => [...prev, record]);
  };

  return (
    <div>
      {/* ← CHANGE 6: wire onAction to open form */}
      <PageHeader title="Classes" actionLabel="+ New Class" onAction={() => setAddOpen(true)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {classes.map(c => <ClassCard key={c.name} cls={c} />)}
      </div>

      {/* ← CHANGE 7: render modal, pass teachers so dropdown is populated from live data */}
      {addOpen && (
        <AddClassForm
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
          teachers={teachers}
        />
      )}
    </div>
  );
}