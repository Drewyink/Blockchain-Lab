import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const missions = await prisma.mission.findMany({
    where: { learningPath: { academy: { slug: "blockchain" } } },
    orderBy: [{ learningPath: { order: "asc" } }, { order: "asc" }],
    include: { competencies: { include: { competency: true } }, learningPath: true },
  });

  const attempts = await prisma.missionAttempt.findMany({ where: { userId } });
  const competencies = await prisma.learnerCompetency.findMany({
    where: { userId },
    include: { competency: true },
  });
  const credentials = await prisma.credential.findMany({ where: { userId } });

  const missionProgress = missions.map((m) => {
    const missionAttempts = attempts.filter((a) => a.missionId === m.id);
    const passed = missionAttempts.some((a) => a.status === "success");
    return {
      slug: m.slug,
      order: m.order,
      title: m.title,
      mode: m.mode,
      primitiveKey: m.primitiveKey,
      learningPath: m.learningPath.slug,
      passed,
      attemptCount: missionAttempts.length,
    };
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
    missions: missionProgress,
    competencies: competencies.map((c) => ({
      code: c.competency.code,
      name: c.competency.name,
      masteryScore: c.masteryScore,
      demonstrated: c.demonstrated,
      demonstratedInAssessment: c.demonstratedInAssessment,
    })),
    credentials: credentials.map((c) => ({ title: c.title, verificationId: c.verificationId, issuedAt: c.issuedAt })),
  });
}
