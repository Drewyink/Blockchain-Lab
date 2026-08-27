"use client";

import { useState } from "react";
import { postJSON } from "../../../lib/api-client";
import { blockFingerprint } from "../../../lib/crypto";

type RubricItem = { key: string; points: number; label: string };
type NodeLite = {
  id: string;
  label: string;
  chainHashSnapshot: string;
  broadcastBlock?: { blockNumber: number; timestamp: string; data: string; previousHash: string; nonce: string; hash: string };
};
type ForkBranch = { label: string; blockCount: number; work: number };

export function NetworkAssessment({
  missionSlug,
  config,
  onComplete,
}: {
  missionSlug: string;
  config: Record<string, unknown>;
  onComplete: (passed: boolean) => void;
}) {
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NodeLite[]>([]);
  const [fork, setFork] = useState<{ branchA: ForkBranch; branchB: ForkBranch } | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [maliciousNodeId, setMaliciousNodeId] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState("data");
  const [branchChoice, setBranchChoice] = useState<"A" | "B" | null>(null);
  const [canonicalWorkValue, setCanonicalWorkValue] = useState("");

  const [result, setResult] = useState<{
    passed: boolean;
    scorePct: number;
    breakdown: { label: string; earned: number; possible: number }[];
  } | null>(null);

  async function start() {
    setError(null);
    setResult(null);
    setMaliciousNodeId(null);
    setBranchChoice(null);
    setCanonicalWorkValue("");
    try {
      const res = await postJSON<{ assessmentId: string; nodes: NodeLite[]; fork: any; attemptsRemaining: number }>(
        "/api/assessment/network/start",
        {}
      );
      setAssessmentId(res.assessmentId);
      setNodes(res.nodes);
      setFork(res.fork);
      setAttemptsRemaining(res.attemptsRemaining);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function submit() {
    if (!assessmentId || maliciousNodeId === null || branchChoice === null) return;
    const res = await postJSON<{
      passed: boolean;
      scorePct: number;
      breakdown: { label: string; earned: number; possible: number }[];
    }>("/api/assessment/network/submit", {
      assessmentId,
      answers: {
        maliciousNodeId,
        invalidField,
        branchChoice,
        canonicalWorkValue: Number(canonicalWorkValue),
      },
    });
    setResult(res);
    onComplete(res.passed);
  }

  if (!assessmentId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-lab-300">
          This assessment presents a 5-node network with an active fork and one malicious node. You have{" "}
          {(config as any).maxAttempts} attempts and {(config as any).maxHints} hint available.
        </p>
        {error && <p className="text-sm text-signal-invalid">{error}</p>}
        <button onClick={start} className="btn-primary">
          Begin Assessment
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="animate-rise-in space-y-4">
        <p className={`font-display text-lg font-semibold ${result.passed ? "text-signal-valid" : "text-signal-invalid"}`}>
          {result.passed ? "Assessment passed" : "Not yet — review and try again"} · {result.scorePct}%
        </p>
        <div className="space-y-2">
          {result.breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between text-sm">
              <span className="text-lab-300">{b.label}</span>
              <span className={b.earned === b.possible ? "text-signal-valid" : "text-lab-400"}>
                {b.earned}/{b.possible}
              </span>
            </div>
          ))}
        </div>
        {!result.passed && attemptsRemaining !== null && attemptsRemaining > 0 && (
          <button onClick={start} className="btn-secondary">
            Try again ({attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} left)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium text-lab-300">Which node is broadcasting an invalid block?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {nodes.map((n) => {
            const b = n.broadcastBlock;
            const recomputed = b
              ? blockFingerprint({ blockNumber: b.blockNumber, timestamp: b.timestamp, data: b.data, previousHash: b.previousHash, nonce: b.nonce })
              : null;
            const looksValid = b ? recomputed === b.hash : null;
            return (
              <button
                key={n.id}
                onClick={() => setMaliciousNodeId(n.id)}
                className={`rounded-lg border p-3 text-left font-mono text-xs ${
                  maliciousNodeId === n.id ? "border-echolink-orange bg-echolink-orange/10" : "border-lab-600"
                }`}
              >
                <p className="font-display text-sm font-semibold text-white">{n.label}</p>
                {b && <p className="mt-1 truncate text-lab-300">data: {b.data}</p>}
                {looksValid !== null && (
                  <p className={looksValid ? "mt-1 text-signal-valid" : "mt-1 text-signal-invalid"}>
                    {looksValid ? "self-consistent" : "hash mismatch"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-lab-300">What field did it alter?</p>
        <select className="lab-input" value={invalidField} onChange={(e) => setInvalidField(e.target.value)}>
          <option value="data">Transaction data</option>
          <option value="hash">Hash</option>
          <option value="previousHash">Previous hash</option>
          <option value="nonce">Nonce</option>
        </select>
      </div>

      {fork && (
        <div>
          <p className="mb-2 text-xs font-medium text-lab-300">Which branch should the network adopt?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["A", "B"] as const).map((letter) => {
              const branch = letter === "A" ? fork.branchA : fork.branchB;
              return (
                <button
                  key={letter}
                  onClick={() => setBranchChoice(letter)}
                  className={`rounded-lg border p-3 text-left ${
                    branchChoice === letter ? "border-echolink-orange bg-echolink-orange/10" : "border-lab-600"
                  }`}
                >
                  <p className="font-display text-sm font-semibold text-white">{branch.label}</p>
                  <p className="font-mono text-xs text-lab-400">Work: {branch.work}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-lab-300">What is the winning branch's accumulated work value?</label>
        <input className="lab-input" value={canonicalWorkValue} onChange={(e) => setCanonicalWorkValue(e.target.value)} placeholder="e.g. 4" />
      </div>

      <button onClick={submit} disabled={maliciousNodeId === null || branchChoice === null} className="btn-primary">
        Submit Investigation
      </button>
    </div>
  );
}
