import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUserId } from "../../../../lib/auth";
import { SandboxState } from "../../../../lib/sandbox-engine";
import { LEARNING_PATHS } from "../../../../lib/curriculum";

const ACADEMY_SLUG = "blockchain";
const MISSION_SLUG = "m10-forensic-investigation";

const FAKE_TAMPER_VALUES = [
  "Manufacturer transferred Batch MED-9842 to UNKNOWN-RECEIVER",
  "Manufacturer transferred Batch MED-0000 to Distributor-17",
  "Manufacturer transferred 9,900 units to Distributor-17",
];

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const l1Path = LEARNING_PATHS.find((p) => p.slug === "blockchain-foundations-l1")!;
  const missionDef = l1Path.missions.find((m) => m.slug === MISSION_SLUG)!;
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
    return NextResponse.json(
      { error: "Build and validate a chain of at least 4 blocks in earlier missions before attempting this assessment." },
      { status: 400 }
    );
  }

  // fork the state, assessment never mutates the learner's practice chain
  const forked: SandboxState = JSON.parse(JSON.stringify(liveState));
  const tamperableRange = forked.blocks.length - 1; // never the last block, so there's a visible downstream cascade
  const tamperedIndex = 1 + Math.floor(Math.random() * (tamperableRange - 1 || 1));
  const fakeValue = FAKE_TAMPER_VALUES[Math.floor(Math.random() * FAKE_TAMPER_VALUES.length)];

  const target = forked.blocks[tamperedIndex];
  forked.blocks[tamperedIndex] = { ...target, data: fakeValue, preTamperData: target.data };

  const assessment = await prisma.assessmentInstance.create({
    data: {
      userId,
      missionId: mission.id,
      snapshot: forked as any,
      status: "in_progress",
    },
  });

  // strip preTamperData before sending to the client, that's the answer key
  const blocksForClient = forked.blocks.map(({ preTamperData, ...b }) => b);

  return NextResponse.json({
    assessmentId: assessment.id,
    blocks: blocksForClient,
    attemptsRemaining: maxAttempts - priorInstances - 1,
    rubric: (missionDef.config as any).rubric,
  });
}
