import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { SandboxState, validateChain } from "@/lib/sandbox-engine";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const assessmentId = body?.assessmentId as string | undefined;
  if (!assessmentId) return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });

  const instance = await prisma.assessmentInstance.findUnique({ where: { id: assessmentId } });
  if (!instance || instance.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshot = instance.snapshot as unknown as SandboxState;
  const validity = validateChain(snapshot);
  return NextResponse.json({ validity });
}
