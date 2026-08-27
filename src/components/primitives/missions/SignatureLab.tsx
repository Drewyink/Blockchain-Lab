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

export function SignatureLab({ state, onStateChange, onError, onSuccess }: Props) {
  const [message, setMessage] = useState(
    state.transactionDraft
      ? `${state.transactionDraft.sender} sent ${state.transactionDraft.assetOrAmount} to ${state.transactionDraft.receiver}`
      : "Alice sends 100 units to Bob"
  );
  const [verifiedCorrect, setVerifiedCorrect] = useState<boolean | null>(null);
  const [verifiedWrong, setVerifiedWrong] = useState<boolean | null>(null);

  async function sign() {
    if (!state.keypair) {
      onError("NOT_SIGNED_YET");
      return;
    }
    const res = await sandboxAction("SIGN_TRANSACTION", { message });
    onStateChange(res.state);
  }

  async function verify(useWrongKey: boolean) {
    if (!state.lastSignature) {
      onError("NOT_SIGNED_YET");
      return;
    }
    const res = await sandboxAction("VERIFY_SIGNATURE", { useWrongKey });
    if (useWrongKey) {
      setVerifiedWrong(res.data?.valid);
      if (verifiedCorrect) onSuccess();
    } else {
      setVerifiedCorrect(res.data?.valid);
      if (verifiedWrong !== null) onSuccess();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-lab-300">Transaction to sign</label>
        <input className="lab-input" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={sign} className="btn-secondary">
          Sign with private key
        </button>
        <button onClick={() => verify(false)} disabled={!state.lastSignature} className="btn-primary">
          Verify with correct public key
        </button>
        <button onClick={() => verify(true)} disabled={!state.lastSignature} className="btn-secondary">
          Verify with wrong public key
        </button>
      </div>

      {state.lastSignature && (
        <div className="rounded-lg border border-lab-600 bg-lab-900 p-4 font-mono text-xs">
          <p className="text-lab-400">Signature</p>
          <p className="mt-1 break-all text-lab-200">{state.lastSignature.signature}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {verifiedCorrect !== null && (
          <p className={`text-sm ${verifiedCorrect ? "text-signal-valid" : "text-signal-invalid"}`}>
            Correct key → {verifiedCorrect ? "signature verified ✓" : "unexpectedly failed"}
          </p>
        )}
        {verifiedWrong !== null && (
          <p className={`text-sm ${!verifiedWrong ? "text-signal-valid" : "text-signal-invalid"}`}>
            Wrong key → {verifiedWrong ? "unexpectedly verified" : "verification correctly failed ✓"}
          </p>
        )}
      </div>
    </div>
  );
}
