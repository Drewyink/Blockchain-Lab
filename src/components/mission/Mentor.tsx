"use client";

import { useState } from "react";
import { requestHint } from "@/lib/api-client";

export function Mentor({
  missionSlug,
  narrative,
  lastErrorCode,
  maxHintLevel,
}: {
  missionSlug: string;
  narrative: string;
  lastErrorCode: string | null;
  maxHintLevel?: number;
}) {
  const [hints, setHints] = useState<{ text: string; level: number }[]>([]);
  const [loading, setLoading] = useState(false);

  async function askForHint() {
    if (!lastErrorCode) return;
    setLoading(true);
    try {
      const res = await requestHint(missionSlug, lastErrorCode, maxHintLevel);
      setHints((h) => [...h, { text: res.hint, level: res.level }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lab-panel flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-echolink-orange" />
        <h3 className="font-mono text-xs uppercase tracking-wider text-lab-300">Mentor</h3>
      </div>
      <p className="text-sm text-lab-300">{narrative}</p>

      {hints.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-lab-700 pt-4">
          {hints.map((h, i) => (
            <div key={i} className="animate-rise-in rounded-lg bg-lab-800 p-3 text-sm text-lab-200">
              {h.text}
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          onClick={askForHint}
          disabled={!lastErrorCode || loading}
          className="btn-secondary w-full !py-2 text-xs"
        >
          {loading ? "Thinking..." : lastErrorCode ? "Ask for a hint" : "Try the task first"}
        </button>
      </div>
    </div>
  );
}
