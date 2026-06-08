// pages/StudentProfile.jsx
import { theme } from "../theme";
import Badge from "../components/Badge";

// ── mock extra details keyed by student ID ──────────────────
const EXTRA = {
  S001: {
    email: "ananya.reddy@student.in", address: "12, Jubilee Hills, Hyderabad",
    bloodGroup: "B+", nationality: "Indian", religion: "Hindu",
    admissionDate: "2018-06-01", busRoute: "Route 4 – Jubilee Hills",
    medicalNotes: "No known allergies",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "History"],
    attendance: 92,
    marks: [
      { exam: "Unit Test 1",   subject: "Mathematics", marks: 46, max: 50 },
      { exam: "Unit Test 1",   subject: "Physics",     marks: 42, max: 50 },
      { exam: "Mid Term Exam", subject: "Mathematics", marks: 88, max: 100 },
      { exam: "Mid Term Exam", subject: "English",     marks: 91, max: 100 },
    ],
    feeHistory: [
      { date: "2024-04-01", amount: 22500, method: "UPI",  status: "Paid" },
      { date: "2024-07-01", amount: 22500, method: "Cash", status: "Paid" },
    ],
  },
  S002: {
    email: "rohan.sharma@student.in", address: "45, Secunderabad Colony",
    bloodGroup: "O+", nationality: "Indian", religion: "Hindu",
    admissionDate: "2019-06-01", busRoute: "Route 2 – Secunderabad",
    medicalNotes: "Mild asthma – carries inhaler",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "Hindi"],
    attendance: 78,
    marks: [
      { exam: "Unit Test 1",   subject: "Mathematics", marks: 38, max: 50 },
      { exam: "Mid Term Exam", subject: "Physics",     marks: 72, max: 100 },
    ],
    feeHistory: [
      { date: "2024-04-01", amount: 21000, method: "Cheque", status: "Paid" },
    ],
  },
  S003: {
    email: "priya.nair@student.in", address: "88, Kukatpally Housing Board",
    bloodGroup: "A+", nationality: "Indian", religion: "Hindu",
    admissionDate: "2020-06-01", busRoute: "Route 7 – Kukatpally",
    medicalNotes: "None",
    subjects: ["Mathematics", "English", "Science", "Social", "Hindi"],
    attendance: 96,
    marks: [
      { exam: "Unit Test 1",   subject: "Mathematics", marks: 49, max: 50 },
      { exam: "Mid Term Exam", subject: "English",     marks: 95, max: 100 },
    ],
    feeHistory: [
      { date: "2024-04-01", amount: 20000, method: "UPI",  status: "Paid" },
      { date: "2024-07-01", amount: 20000, method: "UPI",  status: "Paid" },
    ],
  },
  S004: {
    email: "kiran.kumar@student.in", address: "23, Gachibowli Tech Park Road",
    bloodGroup: "AB+", nationality: "Indian", religion: "Hindu",
    admissionDate: "2018-06-01", busRoute: "Route 9 – Gachibowli",
    medicalNotes: "Diabetic – requires snacks at break",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "History"],
    attendance: 61,
    marks: [
      { exam: "Unit Test 1",   subject: "Mathematics", marks: 28, max: 50 },
      { exam: "Mid Term Exam", subject: "Physics",     marks: 55, max: 100 },
    ],
    feeHistory: [],
  },
  S005: {
    email: "sneha.patel@student.in", address: "67, Madhapur Main Road",
    bloodGroup: "O-", nationality: "Indian", religion: "Jain",
    admissionDate: "2021-06-01", busRoute: "Route 3 – Madhapur",
    medicalNotes: "Vegetarian dietary preference noted",
    subjects: ["Mathematics", "English", "Science", "Social", "Gujarati"],
    attendance: 89,
    marks: [
      { exam: "Unit Test 1",   subject: "Mathematics", marks: 44, max: 50 },
      { exam: "Mid Term Exam", subject: "English",     marks: 87, max: 100 },
    ],
    feeHistory: [
      { date: "2024-04-01", amount: 19000, method: "Online Transfer", status: "Paid" },
      { date: "2024-07-01", amount: 19000, method: "Online Transfer", status: "Paid" },
    ],
  },
};

// ── helpers ──────────────────────────────────────────────────
function getAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function AttendanceBar({ pct }) {
  const color = pct >= 85 ? theme.green : pct >= 70 ? theme.orange : theme.red;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: theme.muted }}>Attendance</span>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: theme.border, borderRadius: 99 }}>
        <div style={{ height: 8, width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function SectionTitle({ children, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color || theme.accent }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {children}
      </span>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: `1px solid ${theme.border}` }}>
      <span style={{ fontSize: 16, flexShrink: 0, width: 22 }}>{icon}</span>
      <span style={{ color: theme.muted, fontSize: 13, minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{value || "—"}</span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────
export default function StudentProfile({ student, onBack }) {

    console.log("Rendering profile for", student.name);

  const extra = EXTRA[student.id] || {};
  const age   = getAge(student.dob);

  // avatar initials + gradient
  const initials = student.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const avatarGradients = [
    "linear-gradient(135deg, #6C63FF, #A855F7)",
    "linear-gradient(135deg, #3B82F6, #06B6D4)",
    "linear-gradient(135deg, #10B981, #3B82F6)",
    "linear-gradient(135deg, #F59E0B, #EF4444)",
    "linear-gradient(135deg, #EC4899, #A855F7)",
  ];
  const gradient = avatarGradients[parseInt(student.id.replace("S", "")) % avatarGradients.length];

  return (
    <div>
      {/* ── Back button ── */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 20, justifyContent: "center",
          background: "transparent", border: `1px solid ${theme.border}`,
          borderRadius: 8, padding: "8px 16px", cursor: "pointer",
          color: theme.muted, fontSize: 13, fontWeight: 600,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted; }}
      >
        Back to Students
      </button>

      {/* ── Hero card ── */}
      <div style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 16, padding: 28, marginBottom: 20,
        display: "flex", gap: 24, alignItems: "flex-start",
        boxShadow: "0 2px 16px #6C63FF0D",
      }}>
        {/* Avatar */}
        <div style={{
          width: 90, height: 90, borderRadius: 20, background: gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, fontWeight: 900, color: "#fff", flexShrink: 0,
          boxShadow: "0 4px 16px #6C63FF33",
        }}>
          {initials}
        </div>

        {/* Name block */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: theme.text }}>{student.name}</h2>
            <Badge status={student.status} />
            <Badge status={student.fees} />
          </div>
          <div style={{ color: theme.muted, fontSize: 14, marginTop: 4 }}>
            {student.id} &nbsp;·&nbsp; Class {student.class} &nbsp;·&nbsp; Roll #{student.roll} &nbsp;·&nbsp; Age {age} yrs
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Blood Group", value: extra.bloodGroup || "—", color: theme.red    },
              { label: "Gender",      value: student.gender,          color: theme.blue   },
              { label: "Nationality", value: extra.nationality || "—",color: theme.green  },
              { label: "Attendance",  value: (extra.attendance || 0) + "%", color: extra.attendance >= 85 ? theme.green : theme.orange },
            ].map(chip => (
              <div key={chip.label} style={{
                background: chip.color + "15", border: `1px solid ${chip.color}33`,
                borderRadius: 8, padding: "6px 14px",
              }}>
                <div style={{ fontSize: 10, color: chip.color, fontFamily: "monospace", letterSpacing: 1, fontWeight: 700 }}>{chip.label.toUpperCase()}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: chip.color }}>{chip.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2-column grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* Personal Details */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#6C63FF">Personal Details</SectionTitle>
          <InfoRow icon="🎂" label="Date of Birth"   value={`${student.dob} (Age ${age})`} />
          <InfoRow icon="⚧"  label="Gender"          value={student.gender} />
          <InfoRow icon="🩸" label="Blood Group"     value={extra.bloodGroup} />
          <InfoRow icon="🌍" label="Nationality"     value={extra.nationality} />
          <InfoRow icon="🛐" label="Religion"        value={extra.religion} />
          <InfoRow icon="📧" label="Email"           value={extra.email} />
          <InfoRow icon="🏠" label="Address"         value={extra.address} />
        </div>

        {/* Academic Details */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#3B82F6">Academic Details</SectionTitle>
          <InfoRow icon="🏫" label="Class"           value={student.class} />
          <InfoRow icon="🔢" label="Roll Number"     value={String(student.roll)} />
          <InfoRow icon="📅" label="Admission Date"  value={extra.admissionDate} />
          <InfoRow icon="📚" label="Subjects"        value={extra.subjects?.join(", ")} />
          <InfoRow icon="🚌" label="Bus Route"       value={extra.busRoute} />
          <InfoRow icon="🏥" label="Medical Notes"   value={extra.medicalNotes} />
          <div style={{ marginTop: 16 }}>
            <AttendanceBar pct={extra.attendance || 0} />
          </div>
        </div>

        {/* Guardian Details */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#10B981">Guardian Details</SectionTitle>
          <InfoRow icon="👤" label="Guardian Name"   value={student.guardian} />
          <InfoRow icon="📞" label="Contact"         value={student.contact} />
        </div>

        {/* Fee Summary */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#F59E0B">Fee Summary</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ color: theme.muted, fontSize: 13 }}>Overall Status</span>
            <Badge status={student.fees} />
          </div>
          {extra.feeHistory?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Date", "Amount", "Method", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: theme.muted, fontFamily: "monospace", fontSize: 10, letterSpacing: 1, borderBottom: `1px solid ${theme.border}` }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {extra.feeHistory.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}55` }}>
                    <td style={{ padding: "8px 8px", color: theme.muted }}>{f.date}</td>
                    <td style={{ padding: "8px 8px", color: theme.green, fontWeight: 700 }}>₹{f.amount.toLocaleString()}</td>
                    <td style={{ padding: "8px 8px", color: theme.muted }}>{f.method}</td>
                    <td style={{ padding: "8px 8px" }}><Badge status={f.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: theme.muted, fontSize: 13, padding: "12px 0" }}>No payment records found.</div>
          )}
        </div>

        {/* Exam Marks – full width */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22, gridColumn: "1 / -1", boxShadow: "0 1px 8px #6C63FF08" }}>
          <SectionTitle color="#A855F7">Exam Performance</SectionTitle>
          {extra.marks?.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {extra.marks.map((m, i) => {
                const pct = Math.round((m.marks / m.max) * 100);
                const color = pct >= 80 ? theme.green : pct >= 60 ? theme.orange : theme.red;
                return (
                  <div key={i} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{m.subject}</div>
                        <div style={{ fontSize: 11, color: theme.muted, fontFamily: "monospace" }}>{m.exam}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color }}>{m.marks}</div>
                        <div style={{ fontSize: 11, color: theme.muted }}>/ {m.max}</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: theme.border, borderRadius: 99 }}>
                      <div style={{ height: 6, width: `${pct}%`, background: color, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 4, textAlign: "right" }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: theme.muted, fontSize: 13 }}>No exam records found.</div>
          )}
        </div>

      </div>
    </div>
  );
}