// pages/ExamMarksSection.jsx — dedicated "Enter Marks" section under Exams
import { useState, useEffect } from "react";
import { theme } from "../theme";
import { examAPI, configAPI, loadAcademicYears } from "../api/apiService";
import StickyHeader from "../components/StickyHeader";
import ExamMarks from "./ExamMarks";

const fmtDate = (d) => {
  if (!d) return "";
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

// Map a raw Exam entity to the shape ExamMarks expects.
const toMarksExam = (e) => ({
  id: e.id,
  name: e.name,
  subjects: e.subjects || [],
  classes: e.classes || [],
  date: e.examDate,
  maxMarks: e.maxMarks ?? 100,
});

const inp = {
  padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${theme.border}`,
  background: theme.bg, color: theme.text, fontSize: 13.5, outline: "none",
  fontFamily: "'DM Sans', sans-serif", minWidth: 300,
};

const filterSel = {
  padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${theme.border}`,
  background: theme.bg, color: theme.text, fontSize: 13, fontWeight: 700,
  outline: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};

export default function ExamMarksSection() {
  const [exams, setExams]   = useState([]);
  const [examId, setExamId] = useState("");
  const [years, setYears]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [yearFilter, setYearFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");

  useEffect(() => {
    loadAcademicYears().then(({ years, current }) => { setYears(years); if (current) setYearFilter(current); }).catch(() => {});
    configAPI.getGrades()
      .then((grades) => setClasses((grades || []).flatMap((g) => (g.sections ?? []).map((s) => `${g.name}-${s.letter}`))))
      .catch(() => {});
  }, []);

  // Exams are fetched from the backend, already filtered by the selected year/class.
  useEffect(() => {
    examAPI.getAll({
      academicYear: yearFilter === "All" ? undefined : yearFilter,
      className: classFilter === "All" ? undefined : classFilter,
    }).then((d) => setExams(d || [])).catch(() => setExams([]));
  }, [yearFilter, classFilter]);

  const selected = exams.find((e) => String(e.id) === String(examId));

  return (
    <div>
      <StickyHeader>
        <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>Enter Exam Marks</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>
          Select an exam, then record each student's marks by subject and class.
        </div>
      </StickyHeader>

      {/* Filters + exam selector */}
      <div style={{ background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Academic Year</span>
          <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setExamId(""); }} style={filterSel}>
            <option value="All">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Class</span>
          <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setExamId(""); }} style={filterSel}>
            <option value="All">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>Select Exam</span>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} style={inp}>
            <option value="">— Choose an exam —</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.academicYear ? ` · ${e.academicYear}` : ""}{e.classes?.length ? ` · ${e.classes.length} class${e.classes.length === 1 ? "" : "es"}` : ""}{e.examDate ? ` · ${fmtDate(e.examDate)}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!examId || !selected ? (
        <div style={{ textAlign: "center", padding: "56px 0", color: theme.muted, background: "#fff", border: `1px dashed ${theme.border}`, borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✍️</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>Select an exam to enter marks</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Choose an exam above to record and review its marks.</div>
        </div>
      ) : (
        <ExamMarks key={selected.id} exam={toMarksExam(selected)} embedded />
      )}
    </div>
  );
}
