export function ChainLinkDivider({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="h-2 w-2 rotate-45 border border-echolink-orange/50 bg-echolink-orange/10" />
          {i < count - 1 && <div className="h-px w-6 bg-gradient-to-r from-echolink-orange/50 to-echolink-orange/10" />}
        </div>
      ))}
    </div>
  );
}
