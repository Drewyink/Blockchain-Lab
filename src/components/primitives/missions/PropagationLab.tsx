"use client";

import { useState } from "react";
import { sandboxAction } from "@/lib/api-client";
import { SandboxState } from "@/lib/sandbox-engine";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
};

export function PropagationLab({ state, onStateChange, onError, onSuccess }: Props) {
  const [message, setMessage] = useState("New transaction: Distributor-17 sends Batch MED-9842 to Pharmacy-4");
  const nodes = state.network?.nodes ?? [];
  const log = state.network?.propagation?.log;

  async function broadcast() {
    const res = await sandboxAction("BROADCAST_TRANSACTION", { message });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    onSuccess();
  }

  const nodeLabel = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="space-y-5">
      {nodes.length === 0 && <p className="text-sm text-lab-400">Go back to Mission 1 and replicate your chain to the network first.</p>}

      {nodes.length > 0 && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-lab-300">Transaction to broadcast</label>
            <input className="lab-input" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button onClick={broadcast} className="btn-primary">
            Broadcast Transaction
          </button>

          {log && (
            <div className="animate-rise-in space-y-2 rounded-lg border border-lab-600 bg-lab-900 p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-lab-400">Propagation order</p>
              {log.map((entry, i) => (
                <div key={entry.nodeId} className="flex items-center justify-between text-sm">
                  <span className="text-lab-200">
                    {i + 1}. {nodeLabel(entry.nodeId)}
                  </span>
                  <span className="font-mono text-xs text-echolink-orange">+{entry.receivedAtMs}ms</span>
                </div>
              ))}
              <p className="pt-2 text-sm text-signal-valid">
                Every node received it — but not at the same instant. That gap is exactly why networks need consensus
                rules for what counts as "agreed."
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
