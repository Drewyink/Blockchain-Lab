"use client";

type BlockVisualProps = {
  blockNumber: number;
  timestamp?: string;
  data: string;
  previousHash: string;
  nonce: string;
  hash: string;
  hashValid?: boolean;
  linkValid?: boolean;
  flagged?: boolean;
  compact?: boolean;
};

function truncate(hex: string, n = 10) {
  if (!hex) return "";
  return `${hex.slice(0, n)}…${hex.slice(-4)}`;
}

export function BlockVisual({
  blockNumber,
  data,
  previousHash,
  nonce,
  hash,
  hashValid,
  linkValid,
  flagged,
  compact,
}: BlockVisualProps) {
  const invalid = hashValid === false || linkValid === false;
  const state = flagged ? "flagged" : invalid ? "invalid" : hashValid === true ? "valid" : "neutral";

  const borderClass =
    state === "invalid"
      ? "border-signal-invalid shadow-glow-invalid animate-cascade-fail"
      : state === "valid"
        ? "border-signal-valid shadow-glow-valid"
        : state === "flagged"
          ? "border-signal-pending"
          : "border-lab-500";

  return (
    <div
      className={`w-full shrink-0 rounded-lg border-2 bg-lab-900 p-3 font-mono transition-colors duration-500 ${borderClass} ${
        compact ? "sm:w-56" : "sm:w-64"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-lab-400">Block #{blockNumber}</span>
        {state === "valid" && <span className="text-[10px] font-bold text-signal-valid">VALID</span>}
        {state === "invalid" && <span className="text-[10px] font-bold text-signal-invalid">INVALID</span>}
        {state === "flagged" && <span className="text-[10px] font-bold text-signal-pending">FLAGGED</span>}
      </div>
      <dl className="space-y-1 text-[11px]">
        <Row label="Data" value={data || ", "} mono truncateLen={20} />
        <Row label="Prev Hash" value={previousHash ? truncate(previousHash) : ", "} />
        <Row label="Nonce" value={nonce || ", "} />
        <Row label="Hash" value={hash ? truncate(hash) : ", "} highlight={state} />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
  truncateLen,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: string;
  truncateLen?: number;
}) {
  const display = truncateLen && value.length > truncateLen ? `${value.slice(0, truncateLen)}…` : value;
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-lab-400">{label}</dt>
      <dd
        className={`truncate text-right ${
          highlight === "invalid" ? "text-signal-invalid" : highlight === "valid" ? "text-signal-valid" : "text-lab-200"
        }`}
        title={value}
      >
        {display}
      </dd>
    </div>
  );
}
