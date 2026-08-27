import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import {
  SandboxState,
  attackBlock,
  broadcastTransaction,
  buildGenesisBlock,
  chooseBranch,
  computeHashDemo,
  extendChain,
  generateFork,
  generateSandboxKeypair,
  guessMaliciousNode,
  mineStep,
  repairFrom,
  replicateToNodes,
  setTransactionField,
  setupMaliciousNetwork,
  signTransaction,
  validateChain,
  verifyTransactionSignature,
} from "@/lib/sandbox-engine";

const ACADEMY_SLUG = "blockchain";

type ActionBody = { action: string; payload?: Record<string, any> };

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as ActionBody | null;
  if (!body?.action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

  const academy = await prisma.academy.findUnique({ where: { slug: ACADEMY_SLUG } });
  if (!academy) return NextResponse.json({ error: "Academy not seeded" }, { status: 500 });

  const sandboxRow = await prisma.sandboxInstance.findUnique({
    where: { userId_academyId: { userId, academyId: academy.id } },
  });
  const state = (sandboxRow?.state as unknown as SandboxState) ?? { blocks: [] };

  const payload = body.payload ?? {};
  let result;

  switch (body.action) {
    case "SET_TRANSACTION_FIELD":
      result = setTransactionField(state, payload as any);
      break;
    case "COMPUTE_HASH_DEMO":
      result = computeHashDemo(state, String(payload.text ?? ""));
      break;
    case "BUILD_GENESIS_BLOCK":
      result = buildGenesisBlock(state, { data: String(payload.data ?? ""), nonce: String(payload.nonce ?? "") });
      break;
    case "EXTEND_CHAIN":
      result = extendChain(state, {
        data: String(payload.data ?? ""),
        nonce: String(payload.nonce ?? ""),
        previousHashProvided: String(payload.previousHashProvided ?? ""),
      });
      break;
    case "VALIDATE_CHAIN":
      result = { ok: true as const, state, data: validateChain(state) };
      break;
    case "ATTACK_BLOCK":
      result = attackBlock(state, Number(payload.blockIndex), String(payload.newData ?? ""));
      break;
    case "REPAIR_FROM":
      result = repairFrom(state, Number(payload.startIndex ?? 0), String(payload.correctedData ?? ""));
      break;
    case "GENERATE_KEYPAIR":
      result = generateSandboxKeypair(state);
      break;
    case "SIGN_TRANSACTION":
      result = signTransaction(state, String(payload.message ?? ""));
      break;
    case "VERIFY_SIGNATURE":
      result = verifyTransactionSignature(state, Boolean(payload.useWrongKey));
      break;
    case "REPLICATE_TO_NODES":
      result = replicateToNodes(state, Number(payload.nodeCount ?? 5));
      break;
    case "BROADCAST_TRANSACTION":
      result = broadcastTransaction(state, String(payload.message ?? ""));
      break;
    case "MINE_STEP":
      result = mineStep(state, Number(payload.difficulty ?? 4), String(payload.data ?? ""), Number(payload.batchSize ?? 20000));
      break;
    case "GENERATE_FORK":
      result = generateFork(state);
      break;
    case "CHOOSE_BRANCH":
      result = chooseBranch(state, payload.choice === "B" ? "B" : "A");
      break;
    case "SETUP_MALICIOUS_NETWORK":
      result = setupMaliciousNetwork(state, Number(payload.nodeCount ?? 5));
      break;
    case "GUESS_MALICIOUS_NODE":
      result = guessMaliciousNode(state, String(payload.nodeId ?? ""));
      break;
    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }

  await prisma.sandboxInstance.upsert({
    where: { userId_academyId: { userId, academyId: academy.id } },
    update: { state: result.state as any },
    create: { userId, academyId: academy.id, state: result.state as any },
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, errorCode: result.errorCode, state: result.state }, { status: 200 });
  }
  return NextResponse.json({ ok: true, data: (result as any).data, state: result.state }, { status: 200 });
}
