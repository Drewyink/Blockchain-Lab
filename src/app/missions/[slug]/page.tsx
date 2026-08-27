import { redirect, notFound } from "next/navigation";
import { getSessionUserId } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { emptyState, SandboxState } from "../../../lib/sandbox-engine";
import { MissionPlayer } from "../../../components/mission/MissionPlayer";

export default async function MissionPage({ params }: { params: { slug: string } }) {
  const userId = await getSessionUserId();
  if (!userId) redirect(`/login`);

  const mission = await prisma.mission.findFirst({
    where: { slug: params.slug },
    include: { learningPath: true },
  });
  if (!mission) notFound();

  const academy = await prisma.academy.findUnique({ where: { slug: "blockchain" } });
  const sandboxRow = await prisma.sandboxInstance.findUnique({
    where: { userId_academyId: { userId, academyId: academy!.id } },
  });
  const initialState = (sandboxRow?.state as unknown as SandboxState) ?? emptyState();

  const pathMissions = await prisma.mission.findMany({
    where: { learningPathId: mission.learningPathId },
    orderBy: { order: "asc" },
    select: { slug: true, order: true },
  });
  const nextMission = pathMissions.find((m) => m.order === mission.order + 1);

  let completeRedirect = "/dashboard";
  if (nextMission) {
    completeRedirect = `/missions/${nextMission.slug}`;
  } else if (mission.learningPath.level === 1) {
    completeRedirect = "/level1-complete";
  } else if (mission.learningPath.level === 2) {
    completeRedirect = "/level2-complete";
  }

  return (
    <MissionPlayer
      mission={{
        slug: mission.slug,
        order: mission.order,
        title: mission.title,
        problemPrompt: mission.problemPrompt,
        narrative: mission.narrative,
        primitiveKey: mission.primitiveKey,
        mode: mission.mode,
        config: mission.config as Record<string, unknown>,
      }}
      initialState={initialState}
      completeRedirect={completeRedirect}
    />
  );
}
