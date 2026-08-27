import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { NetworkTeaser } from "../../components/primitives/NetworkTeaser";

export default async function Level1CompletePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const credential = await prisma.credential.findFirst({ where: { userId, code: "BLOCKCHAIN-FOUNDATIONS-L1" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <p className="eyebrow">Level 1 Complete</p>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
        Your blockchain is secure — against the threat you understand.
      </h1>

      {credential && (
        <div className="mx-auto mt-6 inline-block rounded-lg border border-signal-valid/40 bg-signal-valid/10 px-4 py-2 font-mono text-xs text-signal-valid">
          {credential.title} · {credential.verificationId}
        </div>
      )}

      <div className="mt-10 space-y-3 text-left text-lab-300">
        <p>You can hash data. You can build blocks. You can detect and repair tampering. You can prove ownership and authorize a transaction.</p>
        <p className="font-semibold text-white">But there's a problem.</p>
        <p>This entire blockchain exists on one machine.</p>
        <p>What happens if that machine fails? What happens if its owner secretly replaces the whole chain? Who decides which version is true?</p>
      </div>

      <div className="my-10">
        <NetworkTeaser />
      </div>

      <div className="lab-panel p-6 text-left">
        <p className="eyebrow">Next: Level 2</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Blockchain Network Engineer</h2>
        <p className="mt-1 text-sm text-lab-400">Nodes · Distributed Ledgers · Peer-to-Peer Networks · Consensus · Validators</p>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
        {credential && (
          <Link href={`/verify/${credential.verificationId}`} className="btn-primary">
            View your credential
          </Link>
        )}
      </div>
    </div>
  );
}
