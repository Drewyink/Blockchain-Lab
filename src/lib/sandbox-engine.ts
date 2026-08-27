import { blockFingerprint, generateKeypair, hashHex, signMessage, verifySignature, walletAddress } from "./crypto";

/**
 * The sandbox owns technical state. Every action here is a real operation
 * (real SHA-256, real Ed25519) against the learner's persistent
 * blockchain — nothing is faked for effect. Functions return both the new
 * state and a structured result: { ok, errorCode?, data? }. errorCode maps
 * directly to a HintDefinition row so the mentor never has to guess what
 * went wrong — the engine already knows.
 */

export type SandboxBlock = {
  blockNumber: number;
  timestamp: string;
  data: string;
  previousHash: string;
  nonce: string;
  hash: string;
  /** Set only when this block has been tampered with — holds the true
   *  original data so repair can be graded against reality, not just
   *  internal self-consistency. Never sent to the client until the
   *  learner has attempted a repair. */
  preTamperData?: string;
};

export type NetworkNode = {
  id: string;
  label: string;
  chainHashSnapshot: string; // hash of the node's last block, used to prove replication
  isMalicious?: boolean;
  broadcastBlock?: { blockNumber: number; timestamp: string; data: string; previousHash: string; nonce: string; hash: string };
};

export type PropagationLogEntry = { nodeId: string; receivedAtMs: number };

export type ForkBranch = { label: string; blockCount: number; work: number };

export type SandboxState = {
  blocks: SandboxBlock[];
  keypair?: { privateKeyHex: string; publicKeyHex: string; walletAddress: string };
  hashDemo?: { original: string; originalHash: string; modified?: string; modifiedHash?: string };
  lastSignature?: { message: string; signature: string };
  transactionDraft?: { sender: string; receiver: string; assetOrAmount: string };
  network?: {
    nodes: NetworkNode[];
    propagation?: { message: string; log: PropagationLogEntry[] };
    mining?: { difficulty: number; attempts: number; timestamp?: string; found?: { nonce: string; hash: string } };
    fork?: { branchA: ForkBranch; branchB: ForkBranch };
  };
};

export type EngineResult<T = unknown> =
  | { ok: true; state: SandboxState; data?: T }
  | { ok: false; state: SandboxState; errorCode: string };

export function emptyState(): SandboxState {
  return { blocks: [] };
}

// ---------- Mission 1: transaction data ----------

export function setTransactionField(
  state: SandboxState,
  fields: Partial<{ sender: string; receiver: string; assetOrAmount: string }>
): EngineResult {
  const draft = { ...(state.transactionDraft ?? { sender: "", receiver: "", assetOrAmount: "" }), ...fields };
  const next = { ...state, transactionDraft: draft };
  const allFilled = draft.sender.trim() && draft.receiver.trim() && draft.assetOrAmount.trim();
  if (!allFilled) return { ok: false, state: next, errorCode: "EMPTY_FIELD" };
  return { ok: true, state: next };
}

// ---------- Mission 2: hashing ----------

export function computeHashDemo(state: SandboxState, text: string): EngineResult {
  if (!text.trim()) return { ok: false, state, errorCode: "NO_HASH_GENERATED" };
  const existing = state.hashDemo;
  if (!existing) {
    const next = { ...state, hashDemo: { original: text, originalHash: hashHex(text) } };
    return { ok: true, state: next };
  }
  // second call = the "modify and compare" step
  if (text === existing.original) {
    return { ok: false, state, errorCode: "NO_CHANGE_MADE" };
  }
  const modifiedHash = hashHex(text);
  const next = { ...state, hashDemo: { ...existing, modified: text, modifiedHash } };
  return { ok: true, state: next, data: { avalanche: modifiedHash !== existing.originalHash } };
}

// ---------- Mission 3: build a block (genesis) ----------

export function buildGenesisBlock(
  state: SandboxState,
  input: { data: string; nonce: string }
): EngineResult<SandboxBlock> {
  if (!input.data.trim() || !input.nonce.trim()) {
    return { ok: false, state, errorCode: "MISSING_FIELD" };
  }
  const timestamp = new Date().toISOString();
  const hash = blockFingerprint({
    blockNumber: 0,
    timestamp,
    data: input.data,
    previousHash: "0".repeat(64),
    nonce: input.nonce,
  });
  const block: SandboxBlock = {
    blockNumber: 0,
    timestamp,
    data: input.data,
    previousHash: "0".repeat(64),
    nonce: input.nonce,
    hash,
  };
  return { ok: true, state: { ...state, blocks: [block] }, data: block };
}

// ---------- Mission 4: extend the chain ----------

export function extendChain(
  state: SandboxState,
  input: { data: string; nonce: string; previousHashProvided: string }
): EngineResult<SandboxBlock> {
  const last = state.blocks[state.blocks.length - 1];
  if (!last) return { ok: false, state, errorCode: "MISSING_FIELD" };
  if (input.previousHashProvided.trim() !== last.hash) {
    return { ok: false, state, errorCode: "PREVIOUS_HASH_MISMATCH" };
  }
  const timestamp = new Date().toISOString();
  const blockNumber = last.blockNumber + 1;
  const hash = blockFingerprint({
    blockNumber,
    timestamp,
    data: input.data,
    previousHash: last.hash,
    nonce: input.nonce,
  });
  const block: SandboxBlock = { blockNumber, timestamp, data: input.data, previousHash: last.hash, nonce: input.nonce, hash };
  return { ok: true, state: { ...state, blocks: [...state.blocks, block] }, data: block };
}

// ---------- Mission 5 & 7: validation ----------

export type BlockValidity = { blockNumber: number; hashValid: boolean; linkValid: boolean; valid: boolean };

export function validateChain(state: SandboxState): BlockValidity[] {
  return state.blocks.map((b, i) => {
    const recomputed = blockFingerprint({
      blockNumber: b.blockNumber,
      timestamp: b.timestamp,
      data: b.data,
      previousHash: b.previousHash,
      nonce: b.nonce,
    });
    const hashValid = recomputed === b.hash;
    const prior = state.blocks[i - 1];
    const linkValid = i === 0 ? b.previousHash === "0".repeat(64) : b.previousHash === prior.hash;
    return { blockNumber: b.blockNumber, hashValid, linkValid, valid: hashValid && linkValid };
  });
}

// ---------- Mission 6: attack the chain ----------

export function attackBlock(state: SandboxState, blockIndex: number, newData: string): EngineResult {
  const target = state.blocks[blockIndex];
  if (!target) return { ok: false, state, errorCode: "NO_TAMPER_ATTEMPTED" };
  if (newData.trim() === target.data.trim()) {
    return { ok: false, state, errorCode: "TAMPER_TOO_SUBTLE" };
  }
  const blocks = state.blocks.map((b, i) =>
    i === blockIndex ? { ...b, data: newData, preTamperData: b.preTamperData ?? b.data } : b
  );
  // NOTE: hash is deliberately NOT recomputed here — that mismatch is the point.
  return { ok: true, state: { ...state, blocks } };
}

// ---------- Mission 7 & 10: repair ----------

/** Repair requires supplying the corrected data for the tampered block —
 *  recomputing hashes from the block's current (tampered) data would just
 *  make the fabricated version internally consistent, which is the
 *  opposite of what forensic repair means. correctnessKnown is false only
 *  when the block was never actually tampered (nothing to restore). */
export function repairFrom(
  state: SandboxState,
  startIndex: number,
  correctedData: string
): EngineResult<{ validity: BlockValidity[]; restoredTruth: boolean }> {
  const blocks = [...state.blocks];
  const target = blocks[startIndex];
  if (!target) return { ok: false, state, errorCode: "REPAIR_INCOMPLETE" };

  const restoredTruth = target.preTamperData !== undefined ? correctedData.trim() === target.preTamperData.trim() : true;

  for (let i = startIndex; i < blocks.length; i++) {
    const b = blocks[i];
    const data = i === startIndex ? correctedData : b.data;
    const previousHash = i === 0 ? "0".repeat(64) : blocks[i - 1].hash;
    const hash = blockFingerprint({ blockNumber: b.blockNumber, timestamp: b.timestamp, data, previousHash, nonce: b.nonce });
    blocks[i] = { ...b, data, previousHash, hash, preTamperData: i === startIndex ? undefined : b.preTamperData };
  }
  const next = { ...state, blocks };
  const validity = validateChain(next);
  const allValid = validity.every((v) => v.valid);
  if (!allValid || !restoredTruth) return { ok: false, state: next, errorCode: "REPAIR_INCOMPLETE" };
  return { ok: true, state: next, data: { validity, restoredTruth } };
}

// ---------- Mission 8: keys ----------

export function generateSandboxKeypair(state: SandboxState): EngineResult<{ publicKeyHex: string; walletAddress: string }> {
  const kp = generateKeypair();
  const address = walletAddress(kp.publicKeyHex);
  const next = { ...state, keypair: { ...kp, walletAddress: address } };
  return { ok: true, state: next, data: { publicKeyHex: kp.publicKeyHex, walletAddress: address } };
}

// ---------- Mission 9: signatures ----------

export function signTransaction(state: SandboxState, message: string): EngineResult<{ signature: string }> {
  if (!state.keypair) return { ok: false, state, errorCode: "NOT_SIGNED_YET" };
  const signature = signMessage(message, state.keypair.privateKeyHex);
  const next = { ...state, lastSignature: { message, signature } };
  return { ok: true, state: next, data: { signature } };
}

export function verifyTransactionSignature(
  state: SandboxState,
  useWrongKey: boolean
): EngineResult<{ valid: boolean; expectedOutcome: boolean }> {
  if (!state.keypair || !state.lastSignature) return { ok: false, state, errorCode: "NOT_SIGNED_YET" };
  const keyToUse = useWrongKey ? generateKeypair().publicKeyHex : state.keypair.publicKeyHex;
  const valid = verifySignature(state.lastSignature.message, state.lastSignature.signature, keyToUse);
  const expectedOutcome = useWrongKey ? !valid : valid;
  return { ok: true, state, data: { valid, expectedOutcome } };
}

// ============================================================
// Level 2 — Distributed nodes, propagation, mining, consensus
// ============================================================

const NODE_LABELS = ["Node A", "Node B", "Node C", "Node D", "Node E", "Node F"];

export function replicateToNodes(state: SandboxState, nodeCount: number): EngineResult<NetworkNode[]> {
  const last = state.blocks[state.blocks.length - 1];
  if (!last) return { ok: false, state, errorCode: "NODES_NOT_REPLICATED" };
  const nodes: NetworkNode[] = Array.from({ length: nodeCount }).map((_, i) => ({
    id: `node-${i}`,
    label: NODE_LABELS[i] ?? `Node ${i + 1}`,
    chainHashSnapshot: last.hash,
  }));
  const next = { ...state, network: { ...(state.network ?? { nodes: [] }), nodes } };
  return { ok: true, state: next, data: nodes };
}

export function broadcastTransaction(state: SandboxState, message: string): EngineResult<PropagationLogEntry[]> {
  const nodes = state.network?.nodes ?? [];
  if (nodes.length === 0) return { ok: false, state, errorCode: "NOT_BROADCAST" };
  if (!message.trim()) return { ok: false, state, errorCode: "NOT_BROADCAST" };

  let cursor = 0;
  const log: PropagationLogEntry[] = nodes
    .map((n) => {
      cursor += 40 + Math.floor(Math.random() * 260);
      return { nodeId: n.id, receivedAtMs: cursor };
    })
    .sort((a, b) => a.receivedAtMs - b.receivedAtMs);

  const next = { ...state, network: { ...state.network!, propagation: { message, log } } };
  return { ok: true, state: next, data: log };
}

/** Real proof-of-work: mines in bounded batches so a single request never
 *  blocks for long. The client calls this repeatedly (each call resumes
 *  from the stored attempt count) until `found` comes back true — that
 *  polling loop is itself the "mining is taking real, visible effort"
 *  lesson, not a cosmetic spinner. */
export function mineStep(
  state: SandboxState,
  difficulty: number,
  data: string,
  batchSize = 20000
): EngineResult<{ found: boolean; attempts: number; nonce?: string; hash?: string }> {
  const last = state.blocks[state.blocks.length - 1];
  if (!last) return { ok: false, state, errorCode: "MINING_NOT_STARTED" };

  const existing = state.network?.mining;
  const timestamp = existing?.timestamp ?? new Date().toISOString();
  const startAttempts = existing?.attempts ?? 0;
  const blockNumber = last.blockNumber + 1;
  const target = "0".repeat(difficulty);

  for (let i = 0; i < batchSize; i++) {
    const nonce = String(startAttempts + i);
    const hash = blockFingerprint({ blockNumber, timestamp, data, previousHash: last.hash, nonce });
    if (hash.startsWith(target)) {
      const block: SandboxBlock = { blockNumber, timestamp, data, previousHash: last.hash, nonce, hash };
      const network = {
        ...(state.network ?? { nodes: [] }),
        mining: { difficulty, attempts: startAttempts + i + 1, timestamp, found: { nonce, hash } },
      };
      return {
        ok: true,
        state: { ...state, blocks: [...state.blocks, block], network },
        data: { found: true, attempts: startAttempts + i + 1, nonce, hash },
      };
    }
  }

  const network = { ...(state.network ?? { nodes: [] }), mining: { difficulty, attempts: startAttempts + batchSize, timestamp } };
  return { ok: true, state: { ...state, network }, data: { found: false, attempts: startAttempts + batchSize } };
}

export function generateFork(state: SandboxState): EngineResult<{ branchA: ForkBranch; branchB: ForkBranch }> {
  const workA = 3 + Math.floor(Math.random() * 3); // 3-5
  let workB = 3 + Math.floor(Math.random() * 3);
  while (workB === workA) workB = 3 + Math.floor(Math.random() * 3); // ensure a clear correct answer

  const branchA: ForkBranch = { label: "Node C's branch", blockCount: 1, work: workA };
  const branchB: ForkBranch = { label: "Node D's branch", blockCount: 1, work: workB };
  const next = { ...state, network: { ...(state.network ?? { nodes: [] }), fork: { branchA, branchB } } };
  return { ok: true, state: next, data: { branchA, branchB } };
}

export function chooseBranch(state: SandboxState, choice: "A" | "B"): EngineResult<{ correct: boolean }> {
  const fork = state.network?.fork;
  if (!fork) return { ok: false, state, errorCode: "WRONG_BRANCH_CHOSEN" };
  const correctChoice = fork.branchA.work > fork.branchB.work ? "A" : "B";
  if (choice !== correctChoice) return { ok: false, state, errorCode: "WRONG_BRANCH_CHOSEN" };
  return { ok: true, state, data: { correct: true } };
}

export function setupMaliciousNetwork(state: SandboxState, nodeCount: number): EngineResult<NetworkNode[]> {
  const last = state.blocks[state.blocks.length - 1];
  if (!last) return { ok: false, state, errorCode: "WRONG_NODE_FLAGGED" };

  const blockNumber = last.blockNumber + 1;
  const timestamp = new Date().toISOString();
  const data = "Proposed next block";
  const nonce = "1";
  const correctHash = blockFingerprint({ blockNumber, timestamp, data, previousHash: last.hash, nonce });
  const maliciousIndex = Math.floor(Math.random() * nodeCount);

  const nodes: NetworkNode[] = Array.from({ length: nodeCount }).map((_, i) => {
    const isMalicious = i === maliciousIndex;
    return {
      id: `node-${i}`,
      label: NODE_LABELS[i] ?? `Node ${i + 1}`,
      chainHashSnapshot: last.hash,
      isMalicious,
      broadcastBlock: {
        blockNumber,
        timestamp,
        data: isMalicious ? "Proposed next block (altered)" : data,
        previousHash: last.hash,
        nonce,
        hash: correctHash, // malicious node's hash is now stale relative to its altered data
      },
    };
  });

  const next = { ...state, network: { ...(state.network ?? { nodes: [] }), nodes } };
  return { ok: true, state: next, data: nodes };
}

export function guessMaliciousNode(state: SandboxState, nodeId: string): EngineResult<{ correct: boolean }> {
  const nodes = state.network?.nodes ?? [];
  const actual = nodes.find((n) => n.isMalicious);
  if (!actual) return { ok: false, state, errorCode: "WRONG_NODE_FLAGGED" };
  if (actual.id !== nodeId) return { ok: false, state, errorCode: "WRONG_NODE_FLAGGED" };
  return { ok: true, state, data: { correct: true } };
}
