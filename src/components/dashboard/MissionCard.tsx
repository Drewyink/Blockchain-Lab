import Link from "next/link";

export function MissionCard({
  slug,
  order,
  title,
  problemPrompt,
  mode,
  passed,
  unlocked,
}: {
  slug: string;
  order: number;
  title: string;
  problemPrompt: string;
  mode: string;
  passed: boolean;
  unlocked: boolean;
}) {
  const content = (
    <div
      className={`lab-panel flex items-start gap-4 p-4 transition ${
        unlocked ? "hover:border-echolink-orange/50" : "opacity-50"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold ${
          passed
            ? "bg-signal-valid/15 text-signal-valid"
            : unlocked
              ? "bg-echolink-orange/15 text-echolink-orange"
              : "bg-lab-700 text-lab-400"
        }`}
      >
        {passed ? "✓" : String(order).padStart(2, "0")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
          {mode === "assessment" && (
            <span className="rounded border border-echolink-orange/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-echolink-orange">
              Assessment
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-lab-400">{problemPrompt}</p>
      </div>
    </div>
  );

  if (!unlocked) return <div>{content}</div>;
  return <Link href={`/missions/${slug}`}>{content}</Link>;
}
