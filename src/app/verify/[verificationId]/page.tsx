import { notFound } from "next/navigation";
import { prisma } from "../../../lib/db";
import { COMPETENCIES } from "../../../lib/curriculum";

export default async function VerifyPage({ params }: { params: { verificationId: string } }) {
  const credential = await prisma.credential.findUnique({
    where: { verificationId: params.verificationId },
    include: { user: { select: { displayName: true } } },
  });

  if (!credential) notFound();

  const snapshot = credential.competencySnapshot as Record<string, number>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="lab-panel p-6 sm:p-10">
        <div className="flex items-center gap-2 text-signal-valid">
          <div className="h-2.5 w-2.5 rounded-full bg-signal-valid" />
          <p className="font-mono text-xs uppercase tracking-widest">Credential Verified</p>
        </div>

        <h1 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">{credential.title}</h1>
        <p className="mt-1 text-lab-300">Issued to {credential.user.displayName}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-lab-700 py-4 text-sm">
          <div>
            <p className="text-lab-400">Verification ID</p>
            <p className="mt-0.5 font-mono text-white">{credential.verificationId}</p>
          </div>
          <div>
            <p className="text-lab-400">Issued</p>
            <p className="mt-0.5 text-white">{new Date(credential.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs uppercase tracking-wider text-lab-400">Demonstrated competencies</p>
          <div className="space-y-3">
            {Object.entries(snapshot).map(([code, score]) => {
              const meta = COMPETENCIES.find((c) => c.code === code);
              return (
                <div key={code}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-lab-200">{meta?.name ?? code}</span>
                    <span className="font-mono text-xs text-lab-400">{score}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-lab-700">
                    <div className="h-full rounded-full bg-signal-valid" style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
