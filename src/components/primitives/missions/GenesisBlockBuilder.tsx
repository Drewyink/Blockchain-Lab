"use client";

import { useState } from "react";
import { sandboxAction } from "../../../lib/api-client";
import { SandboxState } from "../../../lib/sandbox-engine";
import { BlockVisual } from "../../../components/primitives/BlockVisual";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
};

export function GenesisBlockBuilder({ state, onStateChange, onError, onSuccess }: Props) {
  const existing = state.blocks[0];
  const [data, setData] = useState(
    existing?.data ??
      (state.transactionDraft
        ? `${state.transactionDraft.sender} sent ${state.transactionDraft.assetOrAmount} to ${state.transactionDraft.receiver}`
        : "")
  );
  const [nonce, setNonce] = useState(existing?.nonce ?? "0");
  const [built, setBuilt] = useState(!!existing);

  async function build() {
    const res = await sandboxAction("BUILD_GENESIS_BLOCK", { data, nonce });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    setBuilt(true);
    onSuccess();
  }

  const block = state.blocks[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-lab-300">Transaction data</label>
          <textarea className="lab-input min-h-[70px]" value={data} onChange={(e) => setData(e.target.value)} disabled={built} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-lab-300">Nonce</label>
          <input className="lab-input" value={nonce} onChange={(e) => setNonce(e.target.value)} disabled={built} />
          <p className="mt-1 text-[11px] text-lab-500">
            An arbitrary number included in the hash calculation, any value works for now.
          </p>
        </div>
      </div>

      {!built && (
        <button onClick={build} className="btn-primary">
          Calculate Hash → Add to Chain
        </button>
      )}

      {block && (
        <div className="animate-rise-in">
          <p className="mb-2 text-xs uppercase tracking-wider text-lab-400">Genesis block</p>
          <BlockVisual {...block} hashValid />
        </div>
      )}
    </div>
  );
}
