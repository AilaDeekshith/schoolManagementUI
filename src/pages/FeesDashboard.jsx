// pages/FeesDashboard.jsx — class + academic-year fee overview
import { useState, useEffect } from "react";
import { theme } from "../theme";
import { feesAPI, configAPI } from "../api/apiService";

// School academic year for "now" (April–March), e.g. "2026-27" (fallback only)
const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
};

const money = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fedLabel = { fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 };
const fedInput = {
  padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${theme.border}`,
  background: theme.card, color: theme.text, fontSize: 13, outline: "none",
  fontFamily: "'DM Sans', sans-serif", minWidth: 150,
};

// ── Progress ring (conic-gradient donut) ────────────────────────────────
function Ring({ pct, size = 132, color }) {
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
        <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginTop: 3 }}>Collected</div>
      </div>
    </div>
  );
}

// ── Big money / count card ──────────────────────────────────────────────
function StatBig({ label, value, sub, color, icon }) {
  return (
    <div style={{
      flex: "1 1 200px", background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 4px rgba(16,24,64,0.05)",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
        <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ── Student status breakdown card ───────────────────────────────────────
function StudentStat({ label, count, total, color, icon }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ flex: "1 1 180px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(16,24,64,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 12, color: theme.muted, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{count}</span>
        <span style={{ fontSize: 13, color: theme.muted, fontWeight: 600 }}>/ {total} students</span>
      </div>
      <div style={{ height: 6, background: "#E5E7EB", borderRadius: 99, overflow: "hidden", marginTop: 12 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .5s" }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function FeesDashboard() {
  const [classes, setClasses]           = useState([]);
  const [className, setClassName]       = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [fees, setFees]                 = useState([]);
  const [loading, setLoading]           = useState(true);   // initial config load
  const [dataLoading, setDataLoading]   = useState(false);  // per class/year fetch

  // ── Load filter options once ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [grades, cfgYears, prof] = await Promise.all([
        configAPI.getGrades().catch(() => []),
        configAPI.getAcademicYears().catch(() => []),
        configAPI.getProfile().catch(() => ({})),
      ]);
      const classNames = (grades || []).flatMap(g => (g.sections ?? []).map(s => `${g.name}-${s.letter}`));
      const yearList = (cfgYears || []).map(y => y.year);
      const activeYear = (cfgYears || []).find(y => y.active)?.year;
      const profAY = (prof?.academicYear || "").trim();
      const curAY = activeYear || (yearList.includes(profAY) ? profAY : "") || yearList[0] || profAY || currentAcademicYear();
      setClasses(classNames);
      setAcademicYears(Array.from(new Set([curAY, ...yearList])).filter(Boolean));
      setAcademicYear(curAY);
      if (classNames.length) setClassName(classNames[0]);
      setLoading(false);
    })();
  }, []);

  // ── Fetch fees for the selected class + year ──────────────────────
  useEffect(() => {
    if (!className) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDataLoading(true);
    feesAPI.search({ className, academicYear })
      .then(data => { if (!cancelled) setFees(data || []); })
      .catch(() => { if (!cancelled) setFees([]); })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [className, academicYear]);

  // ── Roll-up stats ─────────────────────────────────────────────────
  const rows = fees.map(f => ({
    total: Number(f.totalAmount || 0),
    paid:  Number(f.paidAmount || 0),
    due:   Number(f.dueAmount || 0),
  }));
  const totalAmount   = rows.reduce((s, r) => s + r.total, 0);
  const amountPaid    = rows.reduce((s, r) => s + r.paid, 0);
  const amountPending = rows.reduce((s, r) => s + r.due, 0);
  const collectedPct  = totalAmount > 0 ? Math.round((amountPaid / totalAmount) * 100) : 0;

  const totalStudents  = rows.length;
  const paidCompletely = rows.filter(r => r.total > 0 && r.due <= 0).length;
  const paidPartially  = rows.filter(r => r.paid > 0 && r.due > 0).length;
  const notPaid        = rows.filter(r => r.paid <= 0 && r.due > 0).length;

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
      {/* ── Header + filters ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>Fee Dashboard</div>
            <div style={{ fontSize: 12, color: theme.muted }}>Class-wise fee collection for an academic year</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={fedLabel}>Class</div>
            <select value={className} onChange={e => setClassName(e.target.value)} style={fedInput}>
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={fedLabel}>Academic Year</div>
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={fedInput}>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div style={{ padding: "10px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: 13, color: "#92400E" }}>
          ⚠️ No classes found — add grades & sections in <strong>Configuration → Grades</strong>.
        </div>
      ) : dataLoading ? (
        <div style={{ color: theme.muted, padding: "20px 0" }}>Loading {className}…</div>
      ) : totalStudents === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px", border: `2px dashed ${theme.border}`,
          borderRadius: 16, background: theme.bg, color: theme.muted,
        }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, marginBottom: 6 }}>No fee records</div>
          <div style={{ fontSize: 13 }}>No fees found for {className} in {academicYear}.</div>
        </div>
      ) : (
        <>
          {/* ── Money overview ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
            background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 18,
            padding: "22px 26px", marginBottom: 18, boxShadow: "0 1px 4px rgba(16,24,64,0.05)",
          }}>
            <Ring pct={collectedPct} color={collectedPct >= 100 ? theme.green : collectedPct >= 50 ? theme.blue : theme.orange} />
            <div style={{ flex: 1, minWidth: 240, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <StatBig label="Amount Paid" value={money(amountPaid)} sub={`of ${money(totalAmount)} total`} color={theme.green} icon="💰" />
              <StatBig label="Amount Pending" value={money(amountPending)} sub={amountPending > 0 ? "still to be collected" : "fully collected 🎉"} color={amountPending > 0 ? theme.red : theme.muted} icon="⚠️" />
            </div>
          </div>

          {/* ── Student breakdown ── */}
          <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, margin: "6px 2px 12px", letterSpacing: .3 }}>
            Students · {className} · {academicYear}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <StudentStat label="Paid Completely" count={paidCompletely} total={totalStudents} color={theme.green} icon="✅" />
            <StudentStat label="Paid Partially" count={paidPartially} total={totalStudents} color={theme.orange} icon="🟡" />
            <StudentStat label="Not Paid" count={notPaid} total={totalStudents} color={theme.red} icon="⛔" />
            <StudentStat label="Total Students" count={totalStudents} total={totalStudents} color={theme.blue} icon="👥" />
          </div>
        </>
      )}
    </div>
  );
}
