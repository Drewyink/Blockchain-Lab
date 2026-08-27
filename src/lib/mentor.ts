import { prisma } from "./db";

/**
 * Mentor architecture (locked): Structured Sandbox Event -> Error
 * Classification -> Hint Policy -> Curated Hint Bank -> (optional tone
 * pass) -> Learner. The mentor never freely reasons about what to reveal , 
 * it selects from pre-authored hint text tied to the exact error code the
 * sandbox engine detected. This function is the only place hint content is
 * fetched from.
 */

export async function getHint(params: {
  missionSlug: string;
  errorCode: string;
  attemptCountForError: number; // how many times this exact error has occurred
  maxLevel?: number; // caps escalation, e.g. during assessment mode
}) {
  const mission = await prisma.mission.findFirst({ where: { slug: params.missionSlug } });
  if (!mission) return null;

  const level = Math.min(params.attemptCountForError, params.maxLevel ?? 3);

  const hint = await prisma.hintDefinition.findFirst({
    where: { missionId: mission.id, errorCode: params.errorCode, level: { lte: level } },
    orderBy: { level: "desc" },
  });

  return hint;
}
