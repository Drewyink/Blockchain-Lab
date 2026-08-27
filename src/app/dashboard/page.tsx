import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUserId } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { CompetencyBar } from "../../components/dashboard/CompetencyBar";
import { MissionCard } from "../../components/dashboard/MissionCard";
import { LEARNING_PATHS } from "../../lib/curriculum";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const paths = await prisma.learningPath.findMany({
    where: { academy: { slug: "blockchain" } },
    orderBy: { order: "asc" },
    include: { missions: { orderBy: { order: "asc" } } },
  });

  const attempts = await prisma.missionAttempt.findMany({ where: { userId } });
  const competencies = await prisma.learnerCompetency.findMany({
    where: { userId },
    include: { competency: true },
    orderBy: { competency: { code: "asc" } },
  });
  const credentials = await prisma.credential.findMany({ where: { userId } });

  const passedMissionIds = new Set(attempts.filter((a) => a.status === "success").map((a) => a.missionId));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Blockchain Academy</p>
          <p className="mt-1">
            <a href="/welcome" className="text-xs text-lab-200 underline hover:text-white">
              Review the basics
            </a>
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Welcome back, {user?.displayName.split(" ")[0]}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {credentials.map((c) => (
            <div key={c.id} className="lab-panel flex items-center gap-3 px-4 py-3">
              <div className="h-2.5 w-2.5 shrink-0 animate-pulse-glow rounded-full bg-signal-valid" />
              <div className="text-sm">
                <p className="font-semibold text-signal-valid">{c.title.split(", ")[1]?.trim() ?? c.title}</p>
                <p className="font-mono text-xs text-lab-400">{c.verificationId}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {paths.map((path, pathIndex) => {
            const pathDef = LEARNING_PATHS.find((p) => p.slug === path.slug);
            const priorPath = paths[pathIndex - 1];
            const priorCredential = priorPath ? credentials.find((c) => c.code === LEARNING_PATHS.find((p) => p.slug === priorPath.slug)?.credential.code) : true;
            const pathUnlocked = pathIndex === 0 || !!priorCredential;

            let unlocked = pathUnlocked;

            return (
              <div key={path.slug}>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">{path.name}</h2>
                  {!pathUnlocked && (
                    <span className="rounded border border-lab-600 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-lab-400">
                      Locked
                    </span>
                  )}
                </div>
                {!pathUnlocked && (
                  <p className="mb-4 text-sm text-lab-400">
                    Complete {priorPath?.name} to unlock this path.
                  </p>
                )}
                <div className="space-y-3">
                  {path.missions.map((m) => {
                    const passed = passedMissionIds.has(m.id);
                    const isUnlocked = unlocked;
                    if (!passed) unlocked = false;
                    return (
                      <MissionCard
                        key={m.slug}
                        slug={m.slug}
                        order={m.order}
                        title={m.title}
                        problemPrompt={m.problemPrompt}
                        mode={m.mode}
                        passed={passed}
                        unlocked={isUnlocked}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold">Competency Map</h2>
          <div className="lab-panel space-y-4 p-5">
            {competencies.length === 0 && (
              <p className="text-sm text-lab-400">Your competencies will appear here as you complete missions.</p>
            )}
            {competencies.map((c) => (
              <CompetencyBar
                key={c.competency.code}
                name={c.competency.name}
                score={c.masteryScore}
                demonstratedInAssessment={c.demonstratedInAssessment}
              />
            ))}
          </div>

          {credentials.length > 0 ? (
            <div className="mt-4 space-y-2">
              {credentials.map((c) => (
                <Link key={c.id} href={`/verify/${c.verificationId}`} className="btn-secondary block w-full text-center">
                  View {c.title.split(", ")[1]?.trim() ?? "credential"}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-lab-600 p-4 text-center text-xs text-lab-400">
              Complete all missions in a path to earn its credential.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
