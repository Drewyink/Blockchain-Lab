import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getHint } from "@/lib/mentor";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const missionSlug = body?.missionSlug as string | undefined;
  const errorCode = body?.errorCode as string | undefined;
  const maxLevel = body?.maxLevel as number | undefined;
  if (!missionSlug || !errorCode) {
    return NextResponse.json({ error: "missionSlug and errorCode are required" }, { status: 400 });
  }

  const priorCount = await prisma.hintEvent.count({ where: { userId, missionSlug, errorCode } });
  const attemptCountForError = priorCount + 1;

  const hint = await getHint({ missionSlug, errorCode, attemptCountForError, maxLevel });

  await prisma.hintEvent.create({
    data: { userId, missionSlug, errorCode, level: hint?.level ?? attemptCountForError },
  });

  return NextResponse.json({
    hint: hint?.text ?? "Take another look at how this concept works — you're close.",
    level: hint?.level ?? attemptCountForError,
  });
}
