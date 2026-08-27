"use client";

import { useState } from "react";
import { sandboxAction } from "../../../lib/api-client";
import { SandboxState } from "../../../lib/sandbox-engine";
import { ChainRenderer } from "../../../components/primitives/ChainRenderer";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
  targetLength: number;
};

export function ChainBuilder({ state, onStateChange, onError, onSuccess, targetLength }: Props) {
  const [data, setData] = useState("");
  const [nonce, setNonce] = useState("0");
  const [previousHashProvided, setPreviousHashProvided] = useState("");
  const [mismatchMessage, setMismatchMessage] = useState<string | null>(null);

  const last = state.blocks[state.blocks.length - 1];
  const doneCount = state.blocks.length;
  const reachedTarget = doneCount >= targetLength;

  async function extend() {
    setMismatchMessage(null);
    const res = await sandboxAction("EXTEND_CHAIN", { data, nonce, previousHashProvided });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      if (res.errorCode === "PREVIOUS_HASH_MISMATCH") {
        setMismatchMessage(
          "That doesn't match yet. Previous hash has to be exactly Block " + last!.blockNumber + "'s Hash value, not its own Prev Hash field. Use the button below to fill it in correctly."
        );
      }
      return;
    }
    setData("");
    setNonce("0");
    setPreviousHashProvided("");
    if (res.state.blocks.length >= targetLength) onSuccess();
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-lab-300">
        {doneCount} of {targetLength} blocks built.
      </p>
      <ChainRenderer blocks={state.blocks} />

      {!reachedTarget && last && (
        <div className="space-y-3 border-t border-lab-700 pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-lab-200">Block {last.blockNumber + 1}, data</label>
            <input className="lab-input" value={data} onChange={(e) => setData(e.target.value)} placeholder="New transaction..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-lab-200">Previous hash</label>
              <input
                className="lab-input"
                value={previousHashProvided}
                onChange={(e) => setPreviousHashProvided(e.target.value)}
                placeholder="Paste the hash of the block before this one"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviousHashProvided(last.hash);
                  setMismatchMessage(null);
                }}
                className="btn-secondary mt-2 w-full !py-1.5 text-xs"
              >
                Fill in Block {last.blockNumber}'s hash
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-lab-200">Nonce</label>
              <input className="lab-input" value={nonce} onChange={(e) => setNonce(e.target.value)} />
            </div>
          </div>

          {mismatchMessage && (
            <p className="animate-rise-in rounded-lg border border-signal-invalid/40 bg-signal-invalid/10 p-3 text-sm text-signal-invalid">
              {mismatchMessage}
            </p>
          )}

          <button onClick={extend} className="btn-primary">
            Calculate Hash, Add to Chain
          </button>
        </div>
      )}

      {reachedTarget && <p className="text-sm text-signal-valid">Chain built, every block links to the one before it.</p>}
    </div>
  );
}
