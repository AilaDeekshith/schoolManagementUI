// pages/Exams.jsx
import { useState } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import { exams as initialExams, teachers } from "../data/mockData";  // ← CHANGE 1: rename + import teachers
import AddExamForm from "../components/forms/AddExamForm";            // ← CHANGE 2: add form import

function ExamCard({ exam }) {
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: theme.muted }}>{exam.id}</span>
        <Badge status={exam.status} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 4 }}>{exam.name}</div>
      <div style={{ color: theme.accent, fontWeight: 600, fontSize: 13, marginBottom: 14 }}>{exam.subject}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <div><span style={{ color: theme.muted }}>Date: </span><span style={{ color: theme.text, fontWeight: 600 }}>{exam.date}</span></div>
        <div><span style={{ color: theme.muted }}>Max Marks: </span><span style={{ color: theme.text, fontWeight: 600 }}>{exam.maxMarks}</span></div>
      </div>
    </div>
  );
}

export default function Exams() {
  const [exams, setExams]   = useState(initialExams);  // ← CHANGE 3: lift into state
  const [addOpen, setAddOpen] = useState(false);       // ← CHANGE 4: add open state

  // ← CHANGE 5: handler that appends the new exam card
  const handleAdd = record => {
    setExams(prev => [...prev, record]);
  };

  return (
    <div>
      {/* ← CHANGE 6: wire onAction to open form */}
      <PageHeader title="Examinations" actionLabel="+ Schedule Exam" onAction={() => setAddOpen(true)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {exams.map(e => <ExamCard key={e.id} exam={e} />)}
      </div>

      {/* ← CHANGE 7: render modal, pass teachers so examiner dropdown is live */}
      {addOpen && (
        <AddExamForm
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
          teachers={teachers}
        />
      )}
    </div>
  );
}