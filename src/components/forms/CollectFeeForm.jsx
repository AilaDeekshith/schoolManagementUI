// components/forms/CollectFeeForm.jsx
import { useState } from "react";
import Modal from "../Modal";
import { FormField, TextInput, SelectInput, FormRow, FormActions } from "../FormField";
import { theme } from "../../theme";

export default function CollectFeeForm({ student, onClose, onCollect }) {
  const [amount, setAmount]   = useState(student?.due || "");
  const [method, setMethod]   = useState("Cash");
  const [txnId, setTxnId]     = useState("");
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [error, setError]     = useState("");

  const handleSubmit = e => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount"); return; }
    if (Number(amount) > student.due)   { setError(`Cannot exceed due amount ₹${student.due.toLocaleString()}`); return; }
    onCollect({ feeId: student.id, amount: Number(amount), method, txnId, date });
    onClose();
  };

  return (
    <Modal title="Collect Fee Payment" onClose={onClose}>
      {/* Student summary */}
      <div style={{
        background: theme.surface, border: `1px solid ${theme.border}`,
        borderRadius: 10, padding: "14px 18px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>{student?.name}</div>
          <div style={{ color: theme.muted, fontSize: 13 }}>Class {student?.class} · ID: {student?.id}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: theme.red, fontWeight: 800, fontSize: 18 }}>₹{student?.due?.toLocaleString()}</div>
          <div style={{ color: theme.muted, fontSize: 12 }}>Outstanding</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <FormRow>
          <FormField label="Amount to Collect" required>
            <TextInput type="number" value={amount} onChange={setAmount} placeholder={`Max ₹${student?.due}`} />
            {error && <span style={{ color: theme.red, fontSize: 11 }}>{error}</span>}
          </FormField>
          <FormField label="Payment Date" required>
            <TextInput type="date" value={date} onChange={setDate} />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Payment Method">
            <SelectInput value={method} onChange={setMethod}
              options={["Cash","Cheque","Online Transfer","UPI","Demand Draft"]} />
          </FormField>
          <FormField label="Transaction / Receipt ID">
            <TextInput value={txnId} onChange={setTxnId} placeholder="e.g. UPI12345678" />
          </FormField>
        </FormRow>

        <FormActions onCancel={onClose} submitLabel="Confirm Payment" />
      </form>
    </Modal>
  );
}