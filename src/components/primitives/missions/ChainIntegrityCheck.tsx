"use client";

import { useState } from "react";
import { sandboxAction } from "../../../lib/api-client";
import { SandboxState, BlockValidity } from "../../../lib/sandbox-engine";
import { ChainRenderer } from "../../../components/primitives/ChainRenderer";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
};

export function ChainIntegrityCheck({ state, onStateChange, onError, onSuccess }: Props) {
  const [validity, setValidity] = useState<BlockValidity[] | null>(null);

  async function validate() {
    const res = await sandboxAction("VALIDATE_CHAIN", {});
    onStateChange(res.state);
    if (!res.ok) {
      onError(res.errorCode!);
      return;
    }
    const result = res.data as BlockValidity[];
    setValidity(result);
    if (result.every((v) => v.valid)) onSuccess();
  }

  const displayBlocks = state.blocks.map((b, i) => ({
    ...b,
    hashValid: validity?.[i]?.hashValid,
    linkValid: validity?.[i]?.linkValid,
  }));

  return (
    <div className="space-y-5">
      <ChainRenderer blocks={displayBlocks} />
      <button onClick={validate} className="btn-primary">
        Validate Chain
      </button>
      {validity && (
        <p className={`text-sm ${validity.every((v) => v.valid) ? "text-signal-valid" : "text-signal-invalid"}`}>
          {validity.every((v) => v.valid)
            ? "Every block's hash and link check out. Your chain is valid."
            : "Something doesn't check out, look closer at each block."}
        </p>
      )}
    </div>
  );
}
