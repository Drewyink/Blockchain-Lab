"use client";

import { useState } from "react";
import { postJSON } from "../../../lib/api-client";
import { ChainRenderer } from "../../../components/primitives/ChainRenderer";

type RubricItem = { key: string; points: number; label: string };
type BlockLite = { blockNumber: number; data: string; previousHash: string; nonce: string; hash: string };
type Validity = { blockNumber: number; hashValid: boolean; linkValid: boolean; valid: boolean };

export function ForensicAssessment({
  missionSlug,
  config,
  onComplete,
}: {
  missionSlug: string;
  config: Record<string, unknown>;
  onComplete: (passed: boolean) => void;
}) {
  const rubric = (config.rubric as RubricItem[]) ?? [];
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BlockLite[]>([]);
  const [validity, setValidity] = useState<Validity[] | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [claimedBlockIndex, setClaimedBlockIndex] = useState<number | null>(null);
  const [claimedFieldAltered, setClaimedFieldAltered] = useState("data");
  const [downstream, setDownstream] = useState<Set<number>>(new Set());
  const [correctedData, setCorrectedData] = useState("");

  const [result, setResult] = useState<{
    passed: boolean;
    scorePct: number;
    breakdown: { label: string; earned: number; possible: number }[];
  } | null>(null);

  async function start() {
    setError(null);
    setResult(null);
    setValidity(null);
    setClaimedBlockIndex(null);
    setDownstream(new Set());
    setCorrectedData("");
    try {
      const res = await postJSON<{ assessmentId: string; blocks: BlockLite[]; attemptsRemaining: number }>(
        "/api/assessment/start",
        {}
      );
      setAssessmentId(res.assessmentId);
      setBlocks(res.blocks);
      setAttemptsRemaining(res.attemptsRemaining);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function runValidation() {
    if (!assessmentId) return;
    const res = await postJSON<{ validity: Validity[] }>("/api/assessment/validate", { assessmentId });
    setValidity(res.validity);
  }

  function toggleDownstream(i: number) {
    setDownstream((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function submit() {
    if (!assessmentId || claimedBlockIndex === null) return;
    const res = await postJSON<{
      passed: boolean;
      scorePct: number;
      breakdown: { label: string; earned: number; possible: number }[];
      credentialIssued: any;
    }>("/api/assessment/submit", {
      assessmentId,
      answers: {
        claimedBlockIndex,
        claimedFieldAltered,
        downstreamIndices: Array.from(downstream),
        correctedData,
      },
    });
    setResult(res);
    onComplete(res.passed);
  }

  const displayBlocks = blocks.map((b, i) => ({
    ...b,
    hashValid: validity?.[i]?.hashValid,
    linkValid: validity?.[i]?.linkValid,
    flagged: claimedBlockIndex === i,
  }));

  if (!assessmentId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-lab-300">
          This assessment forks your blockchain, your practice environment stays exactly as you left it. You have
          {" "}
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
          {result.passed ? "Assessment passed" : "Not yet, review and try again"} · {result.scorePct}%
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
    <div className="space-y-5">
      <ChainRenderer blocks={displayBlocks} />
      <button onClick={runValidation} className="btn-secondary">
        Validate Chain
      </button>

      <div className="space-y-4 border-t border-lab-700 pt-4">
        <div>
          <p className="mb-2 text-xs font-medium text-lab-300">Which block was compromised?</p>
          <div className="flex flex-wrap gap-2">
            {blocks.map((b, i) => (
              <button
                key={b.blockNumber}
                onClick={() => setClaimedBlockIndex(i)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                  claimedBlockIndex === i ? "border-echolink-orange bg-echolink-orange/10 text-echolink-orange" : "border-lab-600 text-lab-300"
                }`}
              >
                Block #{b.blockNumber}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-lab-300">What field was altered?</p>
          <select className="lab-input" value={claimedFieldAltered} onChange={(e) => setClaimedFieldAltered(e.target.value)}>
            <option value="data">Transaction data</option>
            <option value="hash">Hash</option>
            <option value="nonce">Nonce</option>
            <option value="timestamp">Timestamp</option>
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-lab-300">Which blocks became invalid as a result? (select all)</p>
          <div className="flex flex-wrap gap-2">
            {blocks.map((b, i) => (
              <button
                key={b.blockNumber}
                onClick={() => toggleDownstream(i)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                  downstream.has(i) ? "border-signal-invalid bg-signal-invalid/10 text-signal-invalid" : "border-lab-600 text-lab-300"
                }`}
              >
                #{b.blockNumber}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-lab-300">Reconstruct the correct data for the compromised block</label>
          <input className="lab-input" value={correctedData} onChange={(e) => setCorrectedData(e.target.value)} />
        </div>

        <button onClick={submit} disabled={claimedBlockIndex === null} className="btn-primary">
          Submit Investigation
        </button>
      </div>
    </div>
  );
}
