"use client";

const nodes = [
  { label: "Node A", x: 60, y: 40 },
  { label: "Node B", x: 20, y: 140 },
  { label: "Node C", x: 220, y: 140 },
  { label: "Node D", x: 100, y: 220 },
];

export function NetworkTeaser() {
  return (
    <svg viewBox="0 0 280 260" className="mx-auto h-64 w-full max-w-sm" role="img" aria-label="Your machine, surrounded by unknown peer nodes">
      {nodes.map((n, i) => (
        <line
          key={i}
          x1="140"
          y1="130"
          x2={n.x + 20}
          y2={n.y + 15}
          stroke="#3b4351"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="animate-pulse-glow"
        />
      ))}

      {/* your node, center, solid */}
      <g>
        <rect x="105" y="105" width="70" height="50" rx="8" fill="#161a21" stroke="#E8641E" strokeWidth="2" />
        <text x="140" y="135" textAnchor="middle" fill="#E8641E" fontSize="11" fontFamily="monospace" fontWeight="600">
          YOU ✓
        </text>
      </g>

      {/* unknown peer nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={n.y} width="40" height="30" rx="6" fill="#0d0f13" stroke="#5b6472" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x={n.x + 20} y={n.y + 19} textAnchor="middle" fill="#88909c" fontSize="9" fontFamily="monospace">
            ?
          </text>
        </g>
      ))}
    </svg>
  );
}
