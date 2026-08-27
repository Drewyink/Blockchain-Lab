import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUserId } from "../../../../lib/auth";
import { SandboxState, repairFrom, validateChain } from "../../../../lib/sandbox-engine";
import { LEARNING_PATHS, LEVEL1_CREDENTIAL } from "../../../../lib/curriculum";
import { calculateMasteryScore, logEvidence, recordCompetencyDemonstration } from "../../../../lib/evidence";
import { randomBytes } from "crypto";

const ACADEMY_SLUG = "blockchain";
const MISSION_SLUG = "m10-forensic-investigation";

type Answers = {
  claimedBlockIndex: number;
  claimedFieldAltered: string; // expects "data"
  downstreamIndices: number[];
  correctedData: string;
};

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const assessmentId = body?.assessmentId as string | undefined;
  const answers = body?.answers as Answers | undefined;
  if (!assessmentId || !answers) return NextResponse.json({ error: "Missing assessmentId or answers" }, { status: 400 });

  const instance = await prisma.assessmentInstance.findUnique({ where: { id: assessmentId } });
  if (!instance || instance.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (instance.status !== "in_progress") {
    return NextResponse.json({ error: "This assessment has already been completed." }, { status: 400 });
  }

  const snapshot = instance.snapshot as unknown as SandboxState;
  const tamperedIndex = snapshot.blocks.findIndex((b) => b.preTamperData !== undefined);
  const trueDownstream = snapshot.blocks.map((_, i) => i).filter((i) => i > tamperedIndex);
  const validityBefore = validateChain(snapshot);

  const l1Path = LEARNING_PATHS.find((p) => p.slug === "blockchain-foundations-l1")!;
  const missionDef = l1Path.missions.find((m) => m.slug === MISSION_SLUG)!;
  const rubric = (missionDef.config as any).rubric as { key: string; points: number; label: string }[];
  const points: Record<string, number> = {};

  points.identifiesCompromisedBlock = answers.claimedBlockIndex === tamperedIndex ? 20 : 0;
  points.identifiesAlteredData = answers.claimedFieldAltered === "data" ? 15 : 0;
  points.detectsHashMismatch =
    validityBefore[answers.claimedBlockIndex] && !validityBefore[answers.claimedBlockIndex].hashValid ? 15 : 0;

  const submittedSet = new Set(answers.downstreamIndices ?? []);
  const trueSet = new Set(trueDownstream);
  const downstreamExactMatch =
    submittedSet.size === trueSet.size && [...submittedSet].every((i) => trueSet.has(i));
  points.explainsDownstreamImpact = downstreamExactMatch ? 15 : 0;

  const repairResult = repairFrom(snapshot, answers.claimedBlockIndex, answers.correctedData);
  points.determinesValidPriorState = repairResult.ok ? 10 : 0;
  points.repairsChain = repairResult.ok ? 15 : 0;
  points.validatesFinalChain = repairResult.ok ? 10 : 0;

  const totalScore = rubric.reduce((sum, r) => sum + (points[r.key] ?? 0), 0);
  const totalPossible = rubric.reduce((sum, r) => sum + r.points, 0);
  const scorePct = Math.round((totalScore / totalPossible) * 100);
  const passed = scorePct >= (missionDef.config as any).passThresholdPct;

  await prisma.assessmentInstance.update({
    where: { id: assessmentId },
    data: { status: passed ? "passed" : "failed", score: scorePct, completedAt: new Date() },
  });

  const mission = await prisma.mission.findFirst({
    where: { slug: MISSION_SLUG },
    include: { competencies: { include: { competency: true } } },
  });

  const priorAttempts = await prisma.missionAttempt.count({ where: { userId, missionId: mission!.id } });
  const hintsUsed = await prisma.hintEvent.count({ where: { userId, missionSlug: MISSION_SLUG } });

  await prisma.missionAttempt.create({
    data: {
      userId,
      missionId: mission!.id,
      mode: "assessment",
      status: passed ? "success" : "failure",
      scorePct,
      attemptNum: priorAttempts + 1,
    },
  });

  await logEvidence({
    userId,
    missionSlug: MISSION_SLUG,
    action: "FORENSIC_ASSESSMENT_SUBMITTED",
    result: passed ? "success" : "failure",
    hintLevel: hintsUsed,
    attemptNum: priorAttempts + 1,
    mode: "assessment",
    metadata: { points, scorePct },
  });

  let credentialIssued: { title: string; verificationId: string } | null = null;

  if (passed && mission) {
    for (const mc of mission.competencies) {
      await recordCompetencyDemonstration({
        userId,
        academySlug: ACADEMY_SLUG,
        competencyCode: mc.competency.code,
        masteryScore: scorePct,
        isAssessment: true,
      });
    }
    credentialIssued = await maybeIssueLevel1Credential(userId);
  }

  return NextResponse.json({
    passed,
    scorePct,
    breakdown: rubric.map((r) => ({ label: r.label, earned: points[r.key] ?? 0, possible: r.points })),
    credentialIssued,
  });
}

async function maybeIssueLevel1Credential(userId: string) {
  const existing = await prisma.credential.findFirst({ where: { userId, code: LEVEL1_CREDENTIAL.code } });
  if (existing) return null;

  const learnerCompetencies = await prisma.learnerCompetency.findMany({
    where: { userId, competency: { code: { in: LEVEL1_CREDENTIAL.requiredCompetencyCodes } } },
    include: { competency: true },
  });

  const satisfied = LEVEL1_CREDENTIAL.requiredCompetencyCodes.every((code) => {
    const rec = learnerCompetencies.find((lc) => lc.competency.code === code);
    return rec && rec.demonstrated && rec.masteryScore >= LEVEL1_CREDENTIAL.minMastery;
  });
  if (!satisfied) return null;

  const verificationId = `ECH-${randomBytes(4).toString("hex").toUpperCase()}`;
  const snapshot = Object.fromEntries(learnerCompetencies.map((lc) => [lc.competency.code, lc.masteryScore]));

  const credential = await prisma.credential.create({
    data: { userId, code: LEVEL1_CREDENTIAL.code, title: LEVEL1_CREDENTIAL.title, verificationId, competencySnapshot: snapshot as any },
  });

  return { title: credential.title, verificationId: credential.verificationId };
}
