"use client";

import { useState } from "react";
import { sandboxAction } from "../../../lib/api-client";
import { SandboxState } from "../../../lib/sandbox-engine";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
};

export function TransactionForm({ config, state, onStateChange, onError, onSuccess }: Props) {
  const seed = (config.seedPrompt as any) ?? {};
  const [sender, setSender] = useState(state.transactionDraft?.sender ?? "");
  const [receiver, setReceiver] = useState(state.transactionDraft?.receiver ?? "");
  const [assetOrAmount, setAssetOrAmount] = useState(state.transactionDraft?.assetOrAmount ?? "");
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    const res = await sandboxAction("SET_TRANSACTION_FIELD", { sender, receiver, assetOrAmount });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    setSubmitted(true);
    onSuccess();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-lab-600 bg-lab-900 p-4 font-mono text-xs text-lab-400">
        Suggested transaction, feel free to use your own instead:
        <br />
        {seed.sender} → {seed.receiver} → {seed.assetOrAmount}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Sender" value={sender} onChange={setSender} placeholder="Manufacturer" />
        <Field label="Receiver" value={receiver} onChange={setReceiver} placeholder="Distributor-17" />
        <Field label="Asset / Amount" value={assetOrAmount} onChange={setAssetOrAmount} placeholder="Batch MED-9842" />
      </div>

      <button onClick={submit} disabled={submitted} className="btn-primary">
        {submitted ? "Transaction recorded ✓" : "Record transaction"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-lab-300">{label}</label>
      <input
        className="lab-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
