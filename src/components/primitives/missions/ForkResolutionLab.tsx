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

export function ForkResolutionLab({ state, onStateChange, onError, onSuccess }: Props) {
  const [resolved, setResolved] = useState(false);
  const fork = state.network?.fork;

  async function generate() {
    const res = await sandboxAction("GENERATE_FORK", {});
    onStateChange(res.state);
  }

  async function choose(branch: "A" | "B") {
    const res = await sandboxAction("CHOOSE_BRANCH", { choice: branch });
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    setResolved(true);
    onSuccess();
  }

  return (
    <div className="space-y-5">
      {!fork && (
        <button onClick={generate} className="btn-primary">
          Simulate a Fork
        </button>
      )}

      {fork && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(["A", "B"] as const).map((letter) => {
            const branch = letter === "A" ? fork.branchA : fork.branchB;
            return (
              <button
                key={letter}
                onClick={() => !resolved && choose(letter)}
                disabled={resolved}
                className="lab-panel space-y-2 p-4 text-left transition hover:border-echolink-orange/50 disabled:opacity-60"
              >
                <p className="font-display text-sm font-semibold text-white">{branch.label}</p>
                <p className="font-mono text-xs text-lab-400">Blocks proposed: {branch.blockCount}</p>
                <p className="font-mono text-xs text-echolink-orange">Accumulated work: {branch.work}</p>
              </button>
            );
          })}
        </div>
      )}

      {resolved && (
        <p className="text-sm text-signal-valid">
          Correct — the network adopts the branch with the most accumulated proof-of-work, not just whichever block
          arrived first.
        </p>
      )}
    </div>
  );
}
