// pages/SyllabusDashboard.jsx — grade-wise syllabus completion overview
import { useState, useEffect } from "react";
import { theme, subjectColors } from "../theme";
import { syllabusAPI, configAPI } from "../api/apiService";

// ── Colour tokens (match the Syllabus module teal) ──────────────────────
const TEAL   = "#0D9488";
const TEAL_L = "#CCFBF1";
const TEAL_B = "#99F6E4";

const pctColor = pct => (pct >= 100 ? theme.green : pct >= 50 ? TEAL : pct > 0 ? theme.orange : theme.muted);

// ── Progress ring (conic-gradient donut) ────────────────────────────────
function Ring({ pct, size = 128, color }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `conic-gradient(${color} ${pct * 3.6}deg, #E5E7EB 0deg)`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: size - 24, height: size - 24, borderRadius: "50%", background: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</div>
        <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginTop: 3 }}>Complete</div>
      </div>
    </div>
  );
}

// ── Linear progress bar ─────────────────────────────────────────────────
function Bar({ pct, color }) {
  return (
    <div style={{ height: 8, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

// ── Compute completion stats for one syllabus ───────────────────────────
function statsOf(syl) {
  const topics      = syl.topics || [];
  const total       = topics.length;
  const completed   = topics.filter(t => t.status === "COMPLETED").length;
  const inProgress  = topics.filter(t => t.status === "IN_PROGRESS").length;
  const notStarted  = topics.filter(t => t.status === "NOT_STARTED").length;
  const pending     = total - completed;
  const pct         = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, inProgress, notStarted, pending, pct, pendingPct: total === 0 ? 0 : 100 - pct };
}

// ── Per-subject card ────────────────────────────────────────────────────
function SubjectCard({ syl }) {
  const [open, setOpen] = useState(false);
  const s = statsOf(syl);
  const color = subjectColors[syl.subjectName] || TEAL;

  const topics = syl.topics || [];
  const completedTopics = topics.filter(t => t.status === "COMPLETED");
  const pendingTopics   = topics.filter(t => t.status !== "COMPLETED");

  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16,
      overflow: "hidden", boxShadow: "0 1px 4px rgba(16,24,64,0.05)",
    }}>
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, flexShrink: 0 }}>
            {syl.subjectName?.charAt(0).toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: theme.text, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{syl.subjectName}</div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
              {syl.academicYear}{syl.totalHours ? ` · ${syl.totalHours}h` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: pctColor(s.pct), lineHeight: 1 }}>{s.pct}%</div>
            <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase" }}>finished</div>
          </div>
        </div>

        {/* Progress */}
        <Bar pct={s.pct} color={pctColor(s.pct)} />

        {/* Finished / pending split */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
          <span style={{ color: theme.green }}>Finished {s.pct}%</span>
          <span style={{ color: s.pendingPct > 0 ? theme.orange : theme.muted }}>Pending {s.pendingPct}%</span>
        </div>

        {/* Count chips */}
        {s.total === 0 ? (
          <div style={{ fontSize: 12, color: theme.muted, fontStyle: "italic", padding: "2px 0" }}>No topics added yet.</div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip label="Total" value={s.total} color={theme.text} />
            <Chip label="Completed" value={s.completed} color={theme.green} />
            <Chip label="In Progress" value={s.inProgress} color={theme.orange} />
            <Chip label="Pending" value={s.pending} color={s.pending > 0 ? theme.red : theme.muted} />
          </div>
        )}

        {/* Expandable topic breakdown */}
        {s.total > 0 && (
          <>
            <button onClick={() => setOpen(o => !o)} style={{
              alignSelf: "flex-start", background: "transparent", border: "none", cursor: "pointer",
              color: TEAL, fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans',sans-serif", padding: 0,
            }}>
              {open ? "▲ Hide topics" : "▼ View topics"}
            </button>
            {open && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                <TopicList title={`Completed (${completedTopics.length})`} color={theme.green} topics={completedTopics} mark="✓" />
                <TopicList title={`Pending (${pendingTopics.length})`} color={theme.orange} topics={pendingTopics} mark="○" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: color + "14", border: `1px solid ${color}2E`, borderRadius: 20, padding: "3px 10px" }}>
      <span style={{ fontSize: 13, fontWeight: 900, color }}>{value}</span>
      <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function TopicList({ title, color, topics, mark }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>{title}</div>
      {topics.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.muted, fontStyle: "italic" }}>None</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {topics.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: theme.text }}>
              <span style={{ color, fontWeight: 900, flexShrink: 0 }}>{mark}</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.title}{t.isKeyTopic ? " ⭐" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════
export default function SyllabusDashboard() {
  const [grades, setGrades]           = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [years, setYears]             = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [syllabi, setSyllabi]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [gradeLoading, setGradeLoading] = useState(false);

  const loadData = async (grade, year) => {
    setGradeLoading(true);
    const data = await syllabusAPI.getFiltered({ grade, year: year || undefined }).catch(() => []);
    setSyllabi(data);
    setGradeLoading(false);
  };

  const selectGrade = (grade) => {
    setSelectedGrade(grade);
    loadData(grade, selectedYear);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    if (selectedGrade) loadData(selectedGrade, year);
  };

  // Load grades + years, then pick a random default grade on open.
  useEffect(() => {
    configAPI.getAcademicYears().then(list => setYears((list || []).map(y => y.year))).catch(() => {});
    configAPI.getGrades()
      .then(gs => {
        setGrades(gs || []);
        if (gs && gs.length > 0) {
          const randomGrade = gs[Math.floor(Math.random() * gs.length)];
          selectGrade(randomGrade.name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Overall (grade-level) roll-up ──────────────────────────────────
  const totals = syllabi.reduce((a, syl) => {
    const s = statsOf(syl);
    a.subjects  += 1;
    a.topics    += s.total;
    a.completed += s.completed;
    a.inProgress += s.inProgress;
    a.pending   += s.pending;
    return a;
  }, { subjects: 0, topics: 0, completed: 0, inProgress: 0, pending: 0 });
  const overallPct  = totals.topics === 0 ? 0 : Math.round((totals.completed / totals.topics) * 100);
  const fullyDone   = syllabi.filter(syl => { const s = statsOf(syl); return s.total > 0 && s.completed === s.total; }).length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center", color: theme.muted }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
        <div style={{ fontWeight: 600 }}>Loading dashboard…</div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 24 }}>
      {/* ── Header + grade dropdown ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>Syllabus Dashboard</div>
            <div style={{ fontSize: 12, color: theme.muted }}>Grade-wise completion of every subject's topics</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: .6 }}>Grade</span>
            <select
              value={selectedGrade || ""}
              onChange={e => selectGrade(e.target.value)}
              disabled={grades.length === 0}
              style={{
                padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${TEAL_B}`,
                background: TEAL_L, color: TEAL, fontSize: 13, fontWeight: 800,
                outline: "none", cursor: grades.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans',sans-serif", minWidth: 150,
              }}>
              <option value="" disabled>— Select Grade —</option>
              {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: .6 }}>Year</span>
            <select
              value={selectedYear}
              onChange={e => selectYear(e.target.value)}
              style={{
                padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${TEAL_B}`,
                background: TEAL_L, color: TEAL, fontSize: 13, fontWeight: 800,
                outline: "none", cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", minWidth: 130,
              }}>
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {grades.length === 0 ? (
        <div style={{ padding: "10px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: 13, color: "#92400E" }}>
          ⚠️ No grades found — first add grades in <strong>Configuration → Grades</strong>.
        </div>
      ) : gradeLoading ? (
        <div style={{ color: theme.muted, padding: "20px 0" }}>Loading {selectedGrade}…</div>
      ) : syllabi.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px", border: `2px dashed ${TEAL_B}`,
          borderRadius: 16, background: "#F0FDFA", color: theme.muted,
        }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, marginBottom: 6 }}>No syllabi for {selectedGrade}</div>
          <div style={{ fontSize: 13 }}>Create subject syllabi under <strong>Syllabus → Manage Syllabus</strong>.</div>
        </div>
      ) : (
        <>
          {/* ── Overall summary card ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
            background: `linear-gradient(135deg, ${TEAL_L} 0%, #E0FDF4 100%)`,
            border: `1px solid ${TEAL_B}`, borderRadius: 18, padding: "22px 26px", marginBottom: 22,
          }}>
            <Ring pct={overallPct} color={pctColor(overallPct)} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 11, color: TEAL, fontWeight: 800, letterSpacing: .8, textTransform: "uppercase", marginBottom: 4 }}>
                {selectedGrade} · Overall Progress
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: theme.text, marginBottom: 14 }}>
                {overallPct}% of the syllabus finished · {100 - overallPct}% pending
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <MiniStat label="Subjects" value={totals.subjects} color={theme.text} icon="📚" />
                <MiniStat label="Fully Done" value={fullyDone} color={theme.green} icon="🏆" />
                <MiniStat label="Total Topics" value={totals.topics} color={theme.blue} icon="📋" />
                <MiniStat label="Completed" value={totals.completed} color={theme.green} icon="✅" />
                <MiniStat label="In Progress" value={totals.inProgress} color={theme.orange} icon="🟡" />
                <MiniStat label="Pending" value={totals.pending} color={theme.red} icon="⏳" />
              </div>
            </div>
          </div>

          {/* ── Per-subject cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {syllabi.map(syl => <SubjectCard key={syl.id} syl={syl} />)}
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, color, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#ffffffcc", border: `1px solid ${theme.border}`, borderRadius: 12, padding: "8px 14px" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: .4 }}>{label}</div>
      </div>
    </div>
  );
}
