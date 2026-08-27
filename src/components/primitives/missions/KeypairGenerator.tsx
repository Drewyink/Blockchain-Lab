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

export function KeypairGenerator({ state, onStateChange, onError, onSuccess }: Props) {
  const [revealed, setRevealed] = useState(false);
  const keypair = state.keypair;

  async function generate() {
    const res = await sandboxAction("GENERATE_KEYPAIR", {});
    onStateChange(res.state);
    setRevealed(true);
    onSuccess();
  }

  return (
    <div className="space-y-5">
      {!keypair && (
        <button onClick={generate} className="btn-primary">
          Generate Keypair
        </button>
      )}

      {keypair && (
        <div className="animate-rise-in grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-signal-invalid/40 bg-signal-invalid/5 p-4">
            <p className="text-xs uppercase tracking-wider text-signal-invalid">Private key — never share this</p>
            <p className="mt-2 break-all font-mono text-xs text-lab-200">{keypair.privateKeyHex}</p>
          </div>
          <div className="rounded-lg border border-signal-valid/40 bg-signal-valid/5 p-4">
            <p className="text-xs uppercase tracking-wider text-signal-valid">Public key — safe to share</p>
            <p className="mt-2 break-all font-mono text-xs text-lab-200">{keypair.publicKeyHex}</p>
          </div>
          <div className="sm:col-span-2 rounded-lg border border-lab-600 bg-lab-900 p-4">
            <p className="text-xs uppercase tracking-wider text-lab-400">Wallet address</p>
            <p className="mt-2 break-all font-mono text-xs text-echolink-orange">{keypair.walletAddress}</p>
            <p className="mt-2 text-[11px] text-lab-500">
              Derived from your public key — this is the identity others will see on the network.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
