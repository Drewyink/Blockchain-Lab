"use client";

import { useRef, useState } from "react";
import { sandboxAction } from "@/lib/api-client";
import { SandboxState } from "@/lib/sandbox-engine";
import { BlockVisual } from "@/components/primitives/BlockVisual";

type Props = {
  config: Record<string, unknown>;
  state: SandboxState;
  onStateChange: (s: SandboxState) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
  difficulty: number;
};

export function MiningLab({ state, onStateChange, onError, onSuccess, difficulty }: Props) {
  const [data, setData] = useState("Reward: 1 block subsidy to miner");
  const [mining, setMining] = useState(false);
  const [attempts, setAttempts] = useState(state.network?.mining?.attempts ?? 0);
  const [found, setFound] = useState(!!state.network?.mining?.found);
  const stopRef = useRef(false);

  const minedBlock = found ? state.blocks[state.blocks.length - 1] : null;

  async function startMining() {
    setMining(true);
    stopRef.current = false;
    let isFound = false;
    while (!isFound && !stopRef.current) {
      const res = await sandboxAction("MINE_STEP", { difficulty, data, batchSize: 20000 });
      onStateChange(res.state);
      if (!res.ok) {
        onError(res.errorCode!);
        setMining(false);
        return;
      }
      setAttempts(res.data.attempts);
      isFound = res.data.found;
      if (isFound) {
        setFound(true);
        setMining(false);
        onSuccess();
      }
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-lab-300">Block data</label>
        <input className="lab-input" value={data} onChange={(e) => setData(e.target.value)} disabled={mining || found} />
      </div>

      <p className="text-xs text-lab-400">
        Target: a hash starting with <span className="font-mono text-echolink-orange">{"0".repeat(difficulty)}</span>
      </p>

      {!found && (
        <button onClick={startMining} disabled={mining} className="btn-primary">
          {mining ? "Mining..." : "Start Mining"}
        </button>
      )}

      {mining && (
        <p className="animate-pulse-glow font-mono text-sm text-echolink-orange">
          Searching nonce space... {attempts.toLocaleString()} attempts
        </p>
      )}

      {minedBlock && (
        <div className="animate-rise-in space-y-2">
          <p className="text-sm text-signal-valid">
            Found it after {attempts.toLocaleString()} attempts. That's real, unfaked computational work.
          </p>
          <BlockVisual {...minedBlock} hashValid />
        </div>
      )}
    </div>
  );
}
