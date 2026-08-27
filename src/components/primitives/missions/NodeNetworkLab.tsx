"use client";

import { sandboxAction } from "@/lib/api-client";
import { SandboxState } from "@/lib/sandbox-engine";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
  nodeCount: number;
};

export function NodeNetworkLab({ state, onStateChange, onError, onSuccess, nodeCount }: Props) {
  const nodes = state.network?.nodes ?? [];

  async function replicate() {
    const res = await sandboxAction("REPLICATE_TO_NODES", { nodeCount });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    onSuccess();
  }

  return (
    <div className="space-y-6">
      {nodes.length === 0 && (
        <button onClick={replicate} className="btn-primary">
          Replicate to Network
        </button>
      )}

      {nodes.length > 0 && (
        <div className="animate-rise-in grid grid-cols-2 gap-3 sm:grid-cols-3">
          {nodes.map((n) => (
            <div key={n.id} className="rounded-lg border border-signal-valid/40 bg-signal-valid/5 p-3 text-center">
              <p className="font-display text-sm font-semibold text-white">{n.label}</p>
              <p className="mt-1 font-mono text-[10px] text-lab-400">{n.chainHashSnapshot.slice(0, 10)}…</p>
              <p className="mt-1 text-[10px] text-signal-valid">In sync</p>
            </div>
          ))}
        </div>
      )}

      {nodes.length > 0 && (
        <p className="text-sm text-signal-valid">
          Every node now holds an identical copy of your chain. No single machine can quietly rewrite it anymore.
        </p>
      )}
    </div>
  );
}
