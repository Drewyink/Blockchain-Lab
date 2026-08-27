/**
 * Placeholder brand mark built to spec: orange "ES" box next to "ECHOLINK"
 * with "SOLUTIONS" letterspaced beneath. Swap for /public/logo.svg (or .png)
 * when the real logo file is available, replace the JSX below with
 * an <img src="/logo.svg" alt="Echolink Solutions" /> tag.
 */
export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const boxSize = size === "sm" ? "h-7 w-7 text-sm" : "h-9 w-9 text-base";
  const wordSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${boxSize} shrink-0 items-center justify-center rounded-[6px] bg-echolink-orange font-display font-bold text-white`}
      >
        ES
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-semibold ${wordSize} tracking-tight text-white`}>ECHOLINK</span>
        <span className="font-mono text-[9px] tracking-[0.3em] text-lab-400">SOLUTIONS</span>
      </div>
    </div>
  );
}
