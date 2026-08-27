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

export function HashEngineDemo({ state, onStateChange, onError, onSuccess }: Props) {
  const [text, setText] = useState(
    state.transactionDraft
      ? `${state.transactionDraft.sender} sent ${state.transactionDraft.assetOrAmount} to ${state.transactionDraft.receiver}`
      : ""
  );
  const [demo, setDemo] = useState(state.hashDemo);
  const [done, setDone] = useState(false);

  async function calculate() {
    const res = await sandboxAction("COMPUTE_HASH_DEMO", { text });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    setDemo(res.state.hashDemo);
    if (res.data?.avalanche) {
      setDone(true);
      onSuccess();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-lab-300">Transaction data</label>
        <textarea
          className="lab-input min-h-[80px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <button onClick={calculate} className="btn-primary">
        Calculate SHA-256 Hash
      </button>

      {demo?.originalHash && (
        <div className="animate-rise-in space-y-3 rounded-lg border border-lab-600 bg-lab-900 p-4 font-mono text-xs">
          <div>
            <p className="text-lab-400">Original hash</p>
            <p className="break-all text-lab-200">{demo.originalHash}</p>
          </div>
          {demo.modifiedHash && (
            <div className={demo.modifiedHash !== demo.originalHash ? "text-signal-valid" : "text-signal-invalid"}>
              <p className="text-lab-400">Hash after your edit</p>
              <p className="break-all">{demo.modifiedHash}</p>
            </div>
          )}
        </div>
      )}

      {demo?.originalHash && !done && (
        <p className="text-sm text-lab-400">
          Now change one character above and press Calculate Hash again to see the avalanche effect.
        </p>
      )}
      {done && <p className="text-sm text-signal-valid">One character changed the entire fingerprint. That's the avalanche effect.</p>}
    </div>
  );
}
