import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { calculateMasteryScore, logEvidence, recordCompetencyDemonstration } from "@/lib/evidence";
import { LEARNING_PATHS } from "@/lib/curriculum";
import { randomBytes } from "crypto";

const ACADEMY_SLUG = "blockchain";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const status = body.status === "success" ? "success" : "failure";

  const mission = await prisma.mission.findFirst({
    where: { slug: params.slug },
    include: { competencies: { include: { competency: true } }, learningPath: true },
  });
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

  const pathDef = LEARNING_PATHS.find((p) => p.slug === mission.learningPath.slug);

  const priorAttempts = await prisma.missionAttempt.count({ where: { userId, missionId: mission.id } });
  const attemptNum = priorAttempts + 1;
  const hintsUsed = await prisma.hintEvent.count({ where: { userId, missionSlug: mission.slug } });

  await prisma.missionAttempt.create({
    data: {
      userId,
      missionId: mission.id,
      mode: mission.mode,
      status,
      scorePct: status === "success" ? calculateMasteryScore({ hintsUsed, attemptNum }) : null,
      attemptNum,
    },
  });

  await logEvidence({
    userId,
    missionSlug: mission.slug,
    action: status === "success" ? "MISSION_COMPLETE" : "MISSION_ATTEMPT_FAILED",
    result: status,
    hintLevel: hintsUsed,
    attemptNum,
    mode: mission.mode as "practice" | "assessment",
  });

  let credentialIssued: { title: string; verificationId: string } | null = null;

  if (status === "success") {
    const masteryScore = calculateMasteryScore({ hintsUsed, attemptNum });
    for (const mc of mission.competencies) {
      await recordCompetencyDemonstration({
        userId,
        academySlug: ACADEMY_SLUG,
        competencyCode: mc.competency.code,
        masteryScore,
        isAssessment: mission.mode === "assessment",
      });
    }

    if (pathDef) {
      credentialIssued = await maybeIssueCredential(userId, pathDef);
    }
  }

  return NextResponse.json({ ok: true, attemptNum, hintsUsed, credentialIssued });
}

async function maybeIssueCredential(userId: string, pathDef: (typeof LEARNING_PATHS)[number]) {
  const existing = await prisma.credential.findFirst({ where: { userId, code: pathDef.credential.code } });
  if (existing) return null;

  const learnerCompetencies = await prisma.learnerCompetency.findMany({
    where: { userId, competency: { code: { in: pathDef.credential.requiredCompetencyCodes } } },
    include: { competency: true },
  });

  const satisfied = pathDef.credential.requiredCompetencyCodes.every((code) => {
    const rec = learnerCompetencies.find((lc) => lc.competency.code === code);
    return rec && rec.demonstrated && rec.masteryScore >= pathDef.credential.minMastery;
  });

  if (!satisfied) return null;

  const verificationId = `ECH-${randomBytes(4).toString("hex").toUpperCase()}`;
  const snapshot = Object.fromEntries(learnerCompetencies.map((lc) => [lc.competency.code, lc.masteryScore]));

  const credential = await prisma.credential.create({
    data: {
      userId,
      code: pathDef.credential.code,
      title: pathDef.credential.title,
      verificationId,
      competencySnapshot: snapshot as any,
    },
  });

  return { title: credential.title, verificationId: credential.verificationId };
}
