import { prisma } from "./db";

/**
 * Every meaningful learner action becomes an EvidenceEvent. Competency
 * mastery is a rollup of these events, not of course completion — this is
 * what the eventual credential-verification record is built from.
 */

export async function logEvidence(params: {
  userId: string;
  missionSlug: string;
  competencyCode?: string;
  action: string;
  result: "success" | "failure";
  hintLevel?: number;
  attemptNum?: number;
  mode?: "practice" | "assessment";
  metadata?: Record<string, unknown>;
}) {
  await prisma.evidenceEvent.create({
    data: {
      userId: params.userId,
      missionSlug: params.missionSlug,
      competencyCode: params.competencyCode,
      action: params.action,
      result: params.result,
      hintLevel: params.hintLevel ?? 0,
      attemptNum: params.attemptNum ?? 1,
      mode: params.mode ?? "practice",
      metadata: params.metadata as any,
    },
  });
}

/** Simple, defensible mastery formula: start at 100, deduct for hints used
 *  and for attempts beyond the first, floor at 40 for any passing result.
 *  This keeps "passed on attempt 1 with no hints" meaningfully stronger on
 *  the credential than "passed on attempt 4 with 2 hints," without
 *  punishing experimentation during practice mode. */
export function calculateMasteryScore(params: { hintsUsed: number; attemptNum: number }): number {
  const hintPenalty = Math.min(params.hintsUsed, 3) * 10;
  const attemptPenalty = Math.max(0, params.attemptNum - 1) * 5;
  return Math.max(40, 100 - hintPenalty - attemptPenalty);
}

export async function recordCompetencyDemonstration(params: {
  userId: string;
  academySlug: string;
  competencyCode: string;
  masteryScore: number;
  isAssessment: boolean;
}) {
  const competency = await prisma.competency.findFirst({
    where: { code: params.competencyCode, academy: { slug: params.academySlug } },
  });
  if (!competency) return;

  const existing = await prisma.learnerCompetency.findUnique({
    where: { userId_competencyId: { userId: params.userId, competencyId: competency.id } },
  });

  const nextScore = existing ? Math.max(existing.masteryScore, params.masteryScore) : params.masteryScore;

  await prisma.learnerCompetency.upsert({
    where: { userId_competencyId: { userId: params.userId, competencyId: competency.id } },
    update: {
      masteryScore: nextScore,
      demonstrated: true,
      demonstratedInAssessment: existing?.demonstratedInAssessment || params.isAssessment,
    },
    create: {
      userId: params.userId,
      competencyId: competency.id,
      masteryScore: params.masteryScore,
      demonstrated: true,
      demonstratedInAssessment: params.isAssessment,
    },
  });
}
