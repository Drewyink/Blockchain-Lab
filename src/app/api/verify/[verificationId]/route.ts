import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(_req: Request, { params }: { params: { verificationId: string } }) {
  const credential = await prisma.credential.findUnique({
    where: { verificationId: params.verificationId },
    include: { user: { select: { displayName: true } } },
  });

  if (!credential) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    title: credential.title,
    holder: credential.user.displayName,
    issuedAt: credential.issuedAt,
    verificationId: credential.verificationId,
    competencySnapshot: credential.competencySnapshot,
  });
}
