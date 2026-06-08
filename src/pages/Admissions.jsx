// pages/Admissions.jsx
import { useState } from "react";
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import CardWrapper from "../components/CardWrapper";
import Badge from "../components/Badge";
import { admissions as initialAdmissions } from "../data/mockData";  // ← CHANGE 1: rename import
import AddAdmissionForm from "../components/forms/AddAdmissionForm";  // ← CHANGE 2: add form import

const FILTERS = ["All", "Approved", "Pending", "Under Review", "Rejected"];

export default function Admissions() {
  const [activeFilter, setActiveFilter]   = useState("All");
  const [admissions, setAdmissions]       = useState(initialAdmissions); // ← CHANGE 3: lift into state
  const [addOpen, setAddOpen]             = useState(false);             // ← CHANGE 4: add open state

  const filtered = activeFilter === "All"
    ? admissions
    : admissions.filter(a => a.status === activeFilter);

  // ← CHANGE 5: add new application to state
  const handleAdd = record => {
    setAdmissions(prev => [record, ...prev]);
  };

  // ← CHANGE 6: approve/reject handlers that update status in state
  const handleApprove = id =>
    setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status: "Approved" } : a));

  const handleReject = id =>
    setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status: "Rejected" } : a));

  const columns = [
    { key: "id",         label: "App. ID"        },
    { key: "name",       label: "Applicant Name" },
    { key: "applyClass", label: "Class Applied"  },
    { key: "guardian",   label: "Guardian"       },
    { key: "contact",    label: "Contact"        },
    { key: "date",       label: "Date"           },
    { key: "status",     label: "Status", render: v => <Badge status={v} /> },
    {
      key: "actions", label: "Actions",
      // ← CHANGE 7: buttons now call the handlers above
      render: (_, row) => (
        <div style={{ display: "flex", gap: 8 }}>
          {row.status !== "Approved" && (
            <button
              onClick={() => handleApprove(row.id)}
              style={{ background: theme.green + "22", color: theme.green, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Approve
            </button>
          )}
          {row.status !== "Rejected" && (
            <button
              onClick={() => handleReject(row.id)}
              style={{ background: theme.red + "22", color: theme.red, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Reject
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* ← CHANGE 8: wire onAction to open form */}
      <PageHeader title="Admissions" actionLabel="+ New Application" onAction={() => setAddOpen(true)} />

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            background: activeFilter === f ? theme.accent : theme.card,
            color: activeFilter === f ? "#0D1117" : theme.muted,
            border: `1px solid ${activeFilter === f ? theme.accent : theme.border}`,
            borderRadius: 8, padding: "7px 16px", fontSize: 13,
            cursor: "pointer", fontWeight: 600, transition: "all 0.15s",
          }}>
            {f}
          </button>
        ))}
      </div>

      <CardWrapper>
        <DataTable columns={columns} data={filtered} />
      </CardWrapper>

      {/* ← CHANGE 9: render modal when open */}
      {addOpen && (
        <AddAdmissionForm
          onClose={() => setAddOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}