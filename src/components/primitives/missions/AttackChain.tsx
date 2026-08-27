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

export function AttackChain({ state, onStateChange, onError, onSuccess }: Props) {
  const attackable = state.blocks.slice(0, -1);
  const [blockIndex, setBlockIndex] = useState(attackable.length > 0 ? 0 : -1);
  const [newData, setNewData] = useState("");
  const [attacked, setAttacked] = useState(false);
  const [validity, setValidity] = useState<ReturnType<typeof validateChain> | null>(null);

  async function attack() {
    const res = await sandboxAction("ATTACK_BLOCK", { blockIndex, newData });
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    const v = await sandboxAction("VALIDATE_CHAIN", {});
    onStateChange(v.state);
    const result = v.data;
    setValidity(result);
    setAttacked(true);
    if (result && result.some((b: any) => !b.valid)) onSuccess();
  }

  const displayBlocks = state.blocks.map((b, i) => ({
    ...b,
    hashValid: validity?.[i]?.hashValid,
    linkValid: validity?.[i]?.linkValid,
  }));

  return (
    <div className="space-y-5">
      <ChainRenderer blocks={displayBlocks} />

      {!attacked && (
        <div className="space-y-3 border-t border-lab-700 pt-4">
          <p className="text-sm text-lab-300">Pick an earlier block and change its data — see what happens downstream.</p>
          <div className="flex flex-wrap gap-2">
            {attackable.map((b, i) => (
              <button
                key={b.blockNumber}
                onClick={() => setBlockIndex(i)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                  blockIndex === i ? "border-echolink-orange bg-echolink-orange/10 text-echolink-orange" : "border-lab-600 text-lab-300"
                }`}
              >
                Block #{b.blockNumber}
              </button>
            ))}
          </div>
          <input
            className="lab-input"
            placeholder="New (fabricated) transaction data"
            value={newData}
            onChange={(e) => setNewData(e.target.value)}
          />
          <button onClick={attack} className="btn-primary">
            Tamper with this block
          </button>
        </div>
      )}

      {attacked && validity && (
        <p className="text-sm text-signal-invalid">
          Changing that block's data broke its hash — and every block after it, since their Previous Hash fields no
          longer match. That's tamper-evidence.
        </p>
      )}
    </div>
  );
}
