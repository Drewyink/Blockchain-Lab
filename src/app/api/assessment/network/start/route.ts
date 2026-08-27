import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { SandboxState, setupMaliciousNetwork, generateFork } from "@/lib/sandbox-engine";
import { LEARNING_PATHS } from "@/lib/curriculum";

const ACADEMY_SLUG = "blockchain";
const MISSION_SLUG = "n06-network-assessment";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const pathDef = LEARNING_PATHS.find((p) => p.slug === "blockchain-network-l2")!;
  const missionDef = pathDef.missions.find((m) => m.slug === MISSION_SLUG)!;
  const maxAttempts = (missionDef.config as any).maxAttempts as number;

  const mission = await prisma.mission.findFirst({ where: { slug: MISSION_SLUG } });
  if (!mission) return NextResponse.json({ error: "Mission not seeded" }, { status: 500 });

  const priorInstances = await prisma.assessmentInstance.count({ where: { userId, missionId: mission.id } });
  if (priorInstances >= maxAttempts) {
    return NextResponse.json({ error: "No assessment attempts remaining for this mission." }, { status: 403 });
  }

  const academy = await prisma.academy.findUnique({ where: { slug: ACADEMY_SLUG } });
  const sandboxRow = await prisma.sandboxInstance.findUnique({
    where: { userId_academyId: { userId, academyId: academy!.id } },
  });
  const liveState = (sandboxRow?.state as unknown as SandboxState) ?? { blocks: [] };

  if (liveState.blocks.length < 4) {
    return NextResponse.json({ error: "Build a valid chain in earlier missions before attempting this assessment." }, { status: 400 });
  }

  let working: SandboxState = JSON.parse(JSON.stringify(liveState));
  const nodeResult = setupMaliciousNetwork(working, 5);
  working = nodeResult.state;
  const forkResult = generateFork(working);
  working = forkResult.state;

  const assessment = await prisma.assessmentInstance.create({
    data: {
      userId,
      missionId: mission.id,
      snapshot: working as any,
      status: "in_progress",
    },
  });

  // strip which node is malicious before sending to the client — that's the answer key
  const nodesForClient = working.network!.nodes.map(({ isMalicious, ...n }) => n);

  return NextResponse.json({
    assessmentId: assessment.id,
    nodes: nodesForClient,
    fork: working.network!.fork,
    attemptsRemaining: maxAttempts - priorInstances - 1,
    rubric: (missionDef.config as any).rubric,
  });
}
