export function CompetencyBar({
  name,
  score,
  demonstratedInAssessment,
}: {
  name: string;
  score: number;
  demonstratedInAssessment: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-lab-300">{name}</p>
        <span className="font-mono text-xs text-lab-400">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-lab-700">
        <div
          className={`h-full rounded-full ${demonstratedInAssessment ? "bg-signal-valid" : "bg-echolink-orange"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
