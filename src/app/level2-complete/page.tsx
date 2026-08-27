import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "../../lib/auth";
import { prisma } from "../../lib/db";

export default async function Level2CompletePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const credential = await prisma.credential.findFirst({ where: { userId, code: "BLOCKCHAIN-NETWORK-L2" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <p className="eyebrow">Level 2 Complete</p>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
        Your blockchain now lives on a network, not one machine.
      </h1>

      {credential && (
        <div className="mx-auto mt-6 inline-block rounded-lg border border-signal-valid/40 bg-signal-valid/10 px-4 py-2 font-mono text-xs text-signal-valid">
          {credential.title} · {credential.verificationId}
        </div>
      )}

      <div className="mt-10 space-y-3 text-left text-lab-300">
        <p>You've replicated a chain across nodes, propagated a transaction, mined a real proof-of-work block, resolved a fork, and spotted a malicious node.</p>
        <p>That's everything it takes to operate a basic blockchain network.</p>
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
