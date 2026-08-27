"use client";

import { useState } from "react";
import { sandboxAction } from "../../../lib/api-client";
import { SandboxState } from "../../../lib/sandbox-engine";
import { blockFingerprint } from "../../../lib/crypto";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
  nodeCount: number;
};

export function MaliciousNodeLab({ state, onStateChange, onError, onSuccess, nodeCount }: Props) {
  const [resolved, setResolved] = useState(false);
  const nodes = state.network?.nodes ?? [];
  const hasBroadcastData = nodes.some((n) => n.broadcastBlock);

  async function setup() {
    const res = await sandboxAction("SETUP_MALICIOUS_NETWORK", { nodeCount });
    onStateChange(res.state);
  }

  async function guess(nodeId: string) {
    const res = await sandboxAction("GUESS_MALICIOUS_NODE", { nodeId });
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    setResolved(true);
    onSuccess();
  }

  return (
    <div className="space-y-5">
      {!hasBroadcastData && (
        <button onClick={setup} className="btn-primary">
          Request Blocks From Network
        </button>
      )}

      {hasBroadcastData && (
        <div className="grid gap-3 sm:grid-cols-2">
          {nodes.map((n) => {
            const b = n.broadcastBlock!;
            const recomputed = blockFingerprint({
              blockNumber: b.blockNumber,
              timestamp: b.timestamp,
              data: b.data,
              previousHash: b.previousHash,
              nonce: b.nonce,
            });
            const looksValid = recomputed === b.hash;
            return (
              <button
                key={n.id}
                onClick={() => !resolved && guess(n.id)}
                disabled={resolved}
                className="lab-panel space-y-1 p-3 text-left font-mono text-xs transition hover:border-echolink-orange/50 disabled:opacity-60"
              >
                <p className="font-display text-sm font-semibold text-white">{n.label}</p>
                <p className="truncate text-lab-300">data: {b.data}</p>
                <p className="truncate text-lab-500">hash: {b.hash.slice(0, 16)}…</p>
                {resolved && (
                  <p className={looksValid ? "text-signal-valid" : "text-signal-invalid"}>
                    {looksValid ? "Hash matches this data ✓" : "Hash does not match this data ✗"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {resolved && (
        <p className="text-sm text-signal-valid">
          Any node can independently validate what it's told — a network doesn't need to trust a single source, only
          be able to check.
        </p>
      )}
    </div>
  );
}
