// pages/Dashboard.jsx
import { theme } from "../theme";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { admissions, exams } from "../data/mockData";

function SectionCard({ title, children, accent }) {
  return (
    <div style={{
      background: theme.card,
      borderRadius: 14,
      border: `1px solid ${theme.border}`,
      padding: 24,
      boxShadow: "0 2px 12px #6C63FF0A",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent || theme.accent }} />
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: theme.text, marginBottom: 4 }}>
          Welcome back, <span style={{ background: "linear-gradient(90deg, #6C63FF, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Admin</span> 👋
        </h2>
        <p style={{ color: theme.muted, fontSize: 14 }}>Here's what's happening at Sunrise Public School today.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Students"     value="1,240" icon="🎓" color="#6C63FF" />
        <StatCard label="Teachers"           value="68"    icon="👩‍🏫" color="#3B82F6" />
        <StatCard label="Classes"            value="24"    icon="🏫" color="#10B981" />
        <StatCard label="Pending Admissions" value="14"    icon="📋" color="#A855F7" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Admissions */}
        <SectionCard title="Recent Admissions" accent="#6C63FF">
          {admissions.slice(0, 3).map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
              <div>
                <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                <div style={{ color: theme.muted, fontSize: 12 }}>Class {a.applyClass} · {a.date}</div>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
        </SectionCard>

        {/* Upcoming Exams */}
        <SectionCard title="Upcoming Exams" accent="#A855F7">
          {exams.filter(e => e.status !== "Completed").map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
              <div>
                <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                <div style={{ color: theme.muted, fontSize: 12 }}>{e.subject} · {e.date}</div>
              </div>
              <Badge status={e.status} />
            </div>
          ))}
        </SectionCard>

        {/* Fee Overview */}
        <div style={{ background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}`, padding: 24, gridColumn: "1 / -1", boxShadow: "0 2px 12px #6C63FF0A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: "#10B981" }} />
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>Fee Collection Overview</h3>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "Total Collected", value: "₹1,44,000", color: "#10B981", bg: "#D1FAE5" },
              { label: "Pending Amount",  value: "₹21,000",   color: "#F59E0B", bg: "#FEF3C7" },
              { label: "Overdue Amount",  value: "₹45,000",   color: "#EF4444", bg: "#FEE2E2" },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, background: item.bg, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ color: item.color, fontSize: 22, fontWeight: 800 }}>{item.value}</div>
                <div style={{ color: item.color + "BB", fontSize: 12, marginTop: 4, fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}