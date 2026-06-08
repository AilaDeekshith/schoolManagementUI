// components/Badge.jsx
const statusColors = {
  Active:         { bg: "#D1FAE5", color: "#065F46" },
  Inactive:       { bg: "#FEE2E2", color: "#991B1B" },
  Paid:           { bg: "#D1FAE5", color: "#065F46" },
  Pending:        { bg: "#FEF3C7", color: "#92400E" },
  Overdue:        { bg: "#FEE2E2", color: "#991B1B" },
  Approved:       { bg: "#D1FAE5", color: "#065F46" },
  Rejected:       { bg: "#FEE2E2", color: "#991B1B" },
  "Under Review": { bg: "#DBEAFE", color: "#1E40AF" },
  "On Leave":     { bg: "#FEF3C7", color: "#92400E" },
  Completed:      { bg: "#D1FAE5", color: "#065F46" },
  Upcoming:       { bg: "#EDE9FE", color: "#5B21B6" },
  Scheduled:      { bg: "#DBEAFE", color: "#1E40AF" },
};

export default function Badge({ status }) {
  const c = statusColors[status] || { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span style={{
      background: c.bg,
      color: c.color,
      borderRadius: 6,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.5,
      fontFamily: "monospace",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}