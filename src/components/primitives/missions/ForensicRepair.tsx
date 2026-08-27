"use client";

import { useState } from "react";
import { sandboxAction } from "../../../lib/api-client";
import { SandboxState, validateChain } from "../../../lib/sandbox-engine";
import { ChainRenderer } from "../../../components/primitives/ChainRenderer";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
};

export function ForensicRepair({ state, onStateChange, onError, onSuccess }: Props) {
  const [validity, setValidity] = useState(validateChain(state));
  const [selected, setSelected] = useState<number | null>(null);
  const [correctedData, setCorrectedData] = useState("");
  const [repaired, setRepaired] = useState(validity.every((v) => v.valid));

  const earliestInvalid = validity.findIndex((v) => !v.valid);

  async function submitRepair() {
    if (selected === null) return;
    if (earliestInvalid !== -1 && selected !== earliestInvalid) {
      onError("WRONG_BLOCK_FLAGGED");
      return;
    }
    const res = await sandboxAction("REPAIR_FROM", { startIndex: selected, correctedData });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    setValidity(validateChain(res.state));
    setRepaired(true);
    onSuccess();
  }

  const displayBlocks = state.blocks.map((b, i) => ({
    ...b,
    hashValid: validity[i]?.hashValid,
    linkValid: validity[i]?.linkValid,
  }));

  return (
    <div className="space-y-5">
      <ChainRenderer blocks={displayBlocks} />

      {!repaired && (
        <div className="space-y-3 border-t border-lab-700 pt-4">
          <p className="text-sm text-lab-300">Which block was the source of the compromise?</p>
          <div className="flex flex-wrap gap-2">
            {state.blocks.map((b, i) => (
              <button
                key={b.blockNumber}
                onClick={() => setSelected(i)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                  selected === i ? "border-echolink-orange bg-echolink-orange/10 text-echolink-orange" : "border-lab-600 text-lab-300"
                }`}
              >
                Block #{b.blockNumber}
              </button>
            ))}
          </div>
          {selected !== null && (
            <input
              className="lab-input"
              placeholder="What should this block's data actually be?"
              value={correctedData}
              onChange={(e) => setCorrectedData(e.target.value)}
            />
          )}
          <button onClick={submitRepair} disabled={selected === null} className="btn-primary">
            Repair chain from this block
          </button>
        </div>
      )}

      {repaired && <p className="text-sm text-signal-valid">Chain restored, every block is valid again.</p>}
    </div>
  );
}
