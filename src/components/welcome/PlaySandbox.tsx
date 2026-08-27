"use client";

import { useState } from "react";
import { hashHex } from "../../lib/crypto";

export function PlaySandbox() {
  const [text, setText] = useState("Alice sends 100 units to Bob");

  const hash = hashHex(text);

  return (
    <div className="lab-panel p-5 sm:p-6">
      <p className="eyebrow">Try it yourself, nothing here is graded</p>
      <h3 className="mt-2 font-display text-lg font-semibold text-white">Type anything. Watch the hash change.</h3>
      <p className="mt-2 text-sm text-lab-200">
        This is a real SHA-256 hash, calculated live as you type. Change one character and watch how much of the
        result changes.
      </p>

      <div className="mt-4">
        <textarea
          className="lab-input min-h-[70px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="mt-4 rounded-lg border border-lab-600 bg-lab-900 p-4">
        <p className="text-xs uppercase tracking-wider text-lab-300">SHA-256 hash</p>
        <p className="mt-2 break-all font-mono text-sm text-echolink-orange">{hash}</p>
      </div>
    </div>
  );
}
