"use client";

import { BlockVisual } from "./BlockVisual";

export type ChainBlockDisplay = {
  blockNumber: number;
  data: string;
  previousHash: string;
  nonce: string;
  hash: string;
  hashValid?: boolean;
  linkValid?: boolean;
  flagged?: boolean;
};

export function ChainRenderer({ blocks }: { blocks: ChainBlockDisplay[] }) {
  return (
    <div className="flex flex-col items-stretch gap-1 overflow-x-auto pb-2 sm:flex-row sm:items-center sm:gap-0">
      {blocks.map((b, i) => (
        <div key={b.blockNumber} className="flex flex-col items-center sm:flex-row">
          <BlockVisual {...b} compact />
          {i < blocks.length - 1 && (
            <div className="flex h-6 items-center justify-center sm:h-auto sm:w-6" aria-hidden="true">
              <div
                className={`h-4 w-0.5 sm:h-0.5 sm:w-4 ${
                  blocks[i + 1].linkValid === false ? "bg-signal-invalid" : "bg-lab-500"
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
