// pages/Fees.jsx
import { useState } from "react";                                     // ← CHANGE 1: add useState
import { theme } from "../theme";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import CardWrapper from "../components/CardWrapper";
import Badge from "../components/Badge";
import CollectFeeForm from "../components/forms/CollectFeeForm";       // ← CHANGE 2: add form import
import { fees as initialFees } from "../data/mockData";               // ← CHANGE 3: rename import

export default function Fees() {
  const [fees, setFees]         = useState(initialFees);              // ← CHANGE 4: lift into state
  const [selected, setSelected] = useState(null);                    // ← CHANGE 5: track selected row

  // ← CHANGE 6: update paid/due/status when payment is collected
  const handleCollect = ({ studentId, amount }) => {
    setFees(prev => prev.map(f => {
      if (f.id !== studentId) return f;
      const newPaid = f.paid + amount;
      const newDue  = f.due  - amount;
      return { ...f, paid: newPaid, due: newDue, status: newDue <= 0 ? "Paid" : "Pending" };
    }));
  };

  // ← CHANGE 7: derive stat values from live state instead of hardcoded strings
  const totalCollected = fees.reduce((sum, f) => sum + f.paid, 0);
  const totalPending   = fees.reduce((sum, f) => sum + f.due,  0);
  const overdueAmount  = fees.filter(f => f.status === "Overdue").reduce((sum, f) => sum + f.due, 0);
  const paidCount      = fees.filter(f => f.status === "Paid").length;

  const columns = [
    { key: "id",     label: "Student ID"  },
    { key: "name",   label: "Name"        },
    { key: "class",  label: "Class"       },
    { key: "total",  label: "Total Fees", render: v => `₹${v.toLocaleString()}` },
    { key: "paid",   label: "Paid",       render: v => <span style={{ color: theme.green, fontWeight: 700 }}>₹{v.toLocaleString()}</span> },
    { key: "due",    label: "Due",        render: v => <span style={{ color: v > 0 ? theme.red : theme.muted, fontWeight: v > 0 ? 700 : 400 }}>₹{v.toLocaleString()}</span> },
    { key: "status", label: "Status",     render: v => <Badge status={v} /> },
    {
      key: "action", label: "Action",
      // ← CHANGE 8: Collect button sets selected row to open the form
      render: (_, row) => row.due > 0 ? (
        <button
          onClick={() => setSelected(row)}
          style={{ background: theme.accent + "22", color: theme.accent, border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          Collect
        </button>
      ) : <span style={{ color: theme.muted, fontSize: 12 }}>—</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Fee Management" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {/* ← CHANGE 9: values now derived from live state */}
        <StatCard label="Total Collected" value={`₹${(totalCollected/1000).toFixed(0)}K`} icon="💰" color={theme.green}  />
        <StatCard label="Pending Fees"    value={`₹${(totalPending/1000).toFixed(0)}K`}   icon="⏳" color={theme.accent} />
        <StatCard label="Overdue Fees"    value={`₹${(overdueAmount/1000).toFixed(0)}K`}  icon="⚠️" color={theme.red}    />
        <StatCard label="Students Paid"   value={`${paidCount}/${fees.length}`}            icon="✅" color={theme.blue}   />
      </div>

      <CardWrapper>
        <DataTable columns={columns} data={fees} />
      </CardWrapper>

      {/* ← CHANGE 10: render form when a row is selected */}
      {selected && (
        <CollectFeeForm
          student={selected}
          onClose={() => setSelected(null)}
          onCollect={handleCollect}
        />
      )}
    </div>
  );
}