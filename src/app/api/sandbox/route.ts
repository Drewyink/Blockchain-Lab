import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";
import { emptyState } from "../../../lib/sandbox-engine";

const ACADEMY_SLUG = "blockchain";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const academy = await prisma.academy.findUnique({ where: { slug: ACADEMY_SLUG } });
  if (!academy) return NextResponse.json({ error: "Academy not seeded" }, { status: 500 });

  let sandbox = await prisma.sandboxInstance.findUnique({
    where: { userId_academyId: { userId, academyId: academy.id } },
  });

  if (!sandbox) {
    sandbox = await prisma.sandboxInstance.create({
      data: { userId, academyId: academy.id, state: emptyState() as any },
    });
  }

  return NextResponse.json({ state: sandbox.state });
}
