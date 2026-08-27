/**
 * Echolink Simulation Engine, Blockchain Academy content.
 *
 * Single authored source of truth for the competency graph and every
 * learning path's missions and curated hints. The seed script loads this
 * into the database; the mentor engine reads hints from the database at
 * runtime so hint content can later be authored without a code deploy.
 *
 * Problem-Driven Discovery Principle: every mission's problemPrompt is a
 * question the learner needs answered, never a lecture on the next topic.
 */

export type CompetencyDef = {
  code: string;
  name: string;
  description: string;
  dependsOnCode?: string;
};

export type HintDef = { errorCode: string; level: number; text: string };

export type MissionDef = {
  slug: string;
  order: number;
  title: string;
  problemPrompt: string;
  narrative: string;
  primitiveKey: string;
  mode: "practice" | "assessment";
  competencyCodes: { code: string; weight: number }[];
  config: Record<string, unknown>;
  hints: HintDef[];
};

export type LearningPathDef = {
  slug: string;
  name: string;
  level: number;
  order: number;
  missions: MissionDef[];
  credential: {
    code: string;
    title: string;
    requiredCompetencyCodes: string[];
    minMastery: number;
  };
};

// ============================================================
// LEVEL 1, Blockchain Foundations
// ============================================================

const L1_COMPETENCIES: CompetencyDef[] = [
  {
    code: "BC-DATA-001",
    name: "Blockchain Data Fundamentals",
    description: "Can identify what data must enter a blockchain transaction and why it must be recorded permanently.",
  },
  {
    code: "BC-HASH-001",
    name: "Cryptographic Hashing",
    description: "Can generate a SHA-256 hash and explain why a single-character change produces a completely different digest.",
    dependsOnCode: "BC-DATA-001",
  },
  {
    code: "BC-BLOCK-001",
    name: "Block Construction",
    description: "Can assemble a valid block from its required fields: number, timestamp, data, previous hash, nonce, hash.",
    dependsOnCode: "BC-HASH-001",
  },
  {
    code: "BC-CHAIN-001",
    name: "Cryptographic Block Linking",
    description: "Can link blocks so each one's previousHash matches the prior block's actual hash, forming a chain.",
    dependsOnCode: "BC-BLOCK-001",
  },
  {
    code: "BC-INTEGRITY-001",
    name: "Chain Integrity",
    description: "Can verify that every block in a chain is internally consistent and correctly linked to its neighbor.",
    dependsOnCode: "BC-CHAIN-001",
  },
  {
    code: "BC-TAMPER-001",
    name: "Tamper Detection",
    description: "Can identify which block was altered and explain the downstream effect on every later block.",
    dependsOnCode: "BC-INTEGRITY-001",
  },
  {
    code: "BC-FORENSICS-001",
    name: "Tamper Detection & Forensic Chain Investigation",
    description: "Can independently investigate a compromised chain, isolate the altered block, and reconstruct a valid chain, without step-by-step guidance.",
    dependsOnCode: "BC-TAMPER-001",
  },
  {
    code: "BC-KEY-001",
    name: "Public/Private Key Fundamentals",
    description: "Can generate a cryptographic keypair and explain the relationship between a private key, public key, and wallet address.",
  },
  {
    code: "BC-SIGN-001",
    name: "Digital Signature Fundamentals",
    description: "Can sign a transaction with a private key, verify it with the matching public key, and explain why the wrong key fails verification.",
    dependsOnCode: "BC-KEY-001",
  },
];

const L1_MISSIONS: MissionDef[] = [
  {
    slug: "m01-transaction-data",
    order: 1,
    title: "What Are We Protecting?",
    problemPrompt:
      "Your organization needs to record that Manufacturer transferred Batch MED-9842 to Distributor-17. Once you write this down, how would anyone ever know if it got changed later?",
    narrative:
      "Every blockchain starts with ordinary data, a transaction. Before we protect it, we have to define exactly what it is.",
    primitiveKey: "transaction-form",
    mode: "practice",
    competencyCodes: [{ code: "BC-DATA-001", weight: 1 }],
    config: {
      fields: ["sender", "receiver", "assetOrAmount"],
      seedPrompt: { sender: "Manufacturer", receiver: "Distributor-17", assetOrAmount: "Batch MED-9842" },
    },
    hints: [
      { errorCode: "EMPTY_FIELD", level: 1, text: "A transaction needs to say who sent it, who received it, and what was sent. Which of those is still blank?" },
      { errorCode: "EMPTY_FIELD", level: 2, text: "Fill in sender, receiver, and the asset or amount, all three are required before this transaction means anything." },
    ],
  },
  {
    slug: "m02-hashing",
    order: 2,
    title: "How Would We Know It Changed?",
    problemPrompt:
      "Take the transaction you just created. Generate its fingerprint. Now change one character of the data, what happens to that fingerprint?",
    narrative:
      "A hash is a fingerprint for data. SHA-256 turns any input into a fixed-length digest, and changing even one character produces a completely different result, the avalanche effect.",
    primitiveKey: "hash-engine",
    mode: "practice",
    competencyCodes: [{ code: "BC-HASH-001", weight: 1 }],
    config: { algorithm: "SHA-256" },
    hints: [
      { errorCode: "NO_HASH_GENERATED", level: 1, text: "Press Calculate Hash first, you need a fingerprint of the original data before you can compare anything." },
      { errorCode: "NO_CHANGE_MADE", level: 1, text: "Try editing the transaction data slightly, then recalculate. Compare the two hashes character by character." },
      { errorCode: "NO_CHANGE_MADE", level: 2, text: "Change just one character, like $100 to $101, and press Calculate Hash again. Look at how much of the hash is different." },
    ],
  },
  {
    slug: "m03-build-a-block",
    order: 3,
    title: "How Do We Package This?",
    problemPrompt:
      "A single hash proves data hasn't changed, but it doesn't say when it happened, or what came before it. What else does a permanent record need?",
    narrative:
      "A block packages transaction data together with a block number, a timestamp, a nonce, and, critically, the hash of the block before it.",
    primitiveKey: "block-builder",
    mode: "practice",
    competencyCodes: [{ code: "BC-BLOCK-001", weight: 1 }],
    config: { isGenesis: true },
    hints: [
      { errorCode: "HASH_NOT_RECALCULATED", level: 1, text: "You've filled in the block's fields, but the Hash field still doesn't match. Try pressing Calculate Hash." },
      { errorCode: "HASH_NOT_RECALCULATED", level: 2, text: "The Hash field has to be generated from the other fields, number, timestamp, data, previous hash, and nonce, combined together." },
      { errorCode: "MISSING_FIELD", level: 1, text: "Every field in this block is required. Check which one is still empty." },
    ],
  },
  {
    slug: "m04-build-a-blockchain",
    order: 4,
    title: "How Do These Blocks Connect?",
    problemPrompt:
      "You have one block. Now record three more transactions. How should Block 2 prove it comes after Block 1, without anyone being able to fake the order?",
    narrative:
      "Each new block's Previous Hash field must equal the actual hash of the block before it. That link is what turns a pile of blocks into a chain.",
    primitiveKey: "chain-builder",
    mode: "practice",
    competencyCodes: [{ code: "BC-CHAIN-001", weight: 1 }],
    config: { targetChainLength: 4 },
    hints: [
      { errorCode: "PREVIOUS_HASH_MISMATCH", level: 1, text: "Look at the relationship between this block and the one immediately before it. What value should connect them?" },
      { errorCode: "PREVIOUS_HASH_MISMATCH", level: 2, text: "Compare this block's Previous Hash field with the calculated hash of the preceding block." },
      { errorCode: "PREVIOUS_HASH_MISMATCH", level: 3, text: "The Previous Hash must equal the hash generated by the previous block. Copy that value in, then recalculate this block's own hash." },
    ],
  },
  {
    slug: "m05-chain-integrity",
    order: 5,
    title: "Is Everything Still Consistent?",
    problemPrompt:
      "Your chain has four linked blocks. Before we test what happens under attack, can you prove, right now, that every block is valid?",
    narrative:
      "Chain integrity means every block's own hash is correct AND every block's previous-hash link is correct. Validating the whole chain is the baseline before we try to break it.",
    primitiveKey: "chain-integrity",
    mode: "practice",
    competencyCodes: [{ code: "BC-INTEGRITY-001", weight: 1 }],
    config: {},
    hints: [{ errorCode: "VALIDATION_NOT_RUN", level: 1, text: "Press Validate Chain to check every block's hash and link at once." }],
  },
  {
    slug: "m06-attack-the-chain",
    order: 6,
    title: "Can You Compromise What You Built?",
    problemPrompt: "Go back into Block 2 and change the transaction data. Just that one field. Watch what happens to everything after it.",
    narrative:
      "Changing historical data changes that block's hash, which breaks every block after it, since their Previous Hash fields no longer match. This is tamper-evidence in action.",
    primitiveKey: "attack-chain",
    mode: "practice",
    competencyCodes: [{ code: "BC-TAMPER-001", weight: 1 }],
    config: { targetBlockIndex: 1 },
    hints: [
      { errorCode: "NO_TAMPER_ATTEMPTED", level: 1, text: "Open an earlier block, not the last one, and change its transaction data." },
      { errorCode: "TAMPER_TOO_SUBTLE", level: 1, text: "Make sure you actually changed the data field value, then recalculate that block's hash to see the mismatch appear." },
    ],
  },
  {
    slug: "m07-repair-and-validate",
    order: 7,
    title: "Can You Find and Fix the Damage?",
    problemPrompt: "Your chain is now showing invalid blocks. Identify exactly which block was altered, and restore the chain to a valid state.",
    narrative:
      "Detecting a break is only half the skill. Now you need to isolate the root cause and repair the chain, recompute the tampered block's hash and re-link everything after it.",
    primitiveKey: "forensic-inspector",
    mode: "practice",
    competencyCodes: [
      { code: "BC-TAMPER-001", weight: 1 },
      { code: "BC-INTEGRITY-001", weight: 1 },
    ],
    config: {},
    hints: [
      { errorCode: "WRONG_BLOCK_FLAGGED", level: 1, text: "Every block after the tampered one will also show invalid. Look for the earliest block that fails, that's the actual source." },
      { errorCode: "REPAIR_INCOMPLETE", level: 1, text: "Fixing the tampered block's hash isn't enough, every block after it still has the old Previous Hash. Relink each one in order." },
      { errorCode: "REPAIR_INCOMPLETE", level: 2, text: "Work forward from the tampered block: recalculate its hash, then update the next block's Previous Hash to match, and recalculate that block too. Repeat to the end." },
    ],
  },
  {
    slug: "m08-keys",
    order: 8,
    title: "How Do We Prove Ownership?",
    problemPrompt: "Right now, anyone could type 'Alice' into the sender field. What would actually prove a transaction came from Alice?",
    narrative: "A private key is a secret only the owner holds. A public key is derived from it and can be shared freely. Together they establish a cryptographic identity, a wallet.",
    primitiveKey: "keypair-visualizer",
    mode: "practice",
    competencyCodes: [{ code: "BC-KEY-001", weight: 1 }],
    config: { algorithm: "Ed25519" },
    hints: [{ errorCode: "NO_KEYPAIR_GENERATED", level: 1, text: "Press Generate Keypair to create your private key and its matching public key." }],
  },
  {
    slug: "m09-signatures",
    order: 9,
    title: "How Do We Prove Authorization?",
    problemPrompt: "You have a keypair now. Sign a transaction with your private key, then verify it with your public key. What happens if you verify with someone else's public key instead?",
    narrative: "A digital signature proves the holder of a private key authorized this exact transaction. Anyone with the matching public key can verify it, but only the real key pair will verify successfully.",
    primitiveKey: "signature-visualizer",
    mode: "practice",
    competencyCodes: [{ code: "BC-SIGN-001", weight: 1 }],
    config: {},
    hints: [
      { errorCode: "NOT_SIGNED_YET", level: 1, text: "Sign the transaction with your private key first, that's what produces the signature." },
      { errorCode: "VERIFY_WRONG_KEY_EXPECTED", level: 1, text: "Try verifying with the wrong public key on purpose. Notice that verification fails, that's exactly what should happen." },
    ],
  },
  {
    slug: "m10-forensic-investigation",
    order: 10,
    title: "Can You Solve This Independently?",
    problemPrompt: "A blockchain has been compromised. You have no step-by-step instructions this time. Investigate it, identify what happened, and reconstruct a valid chain.",
    narrative: "This is your Level 1 practical assessment. It draws on every competency you've demonstrated so far. Attempts and hints are limited and recorded as part of your evidence.",
    primitiveKey: "forensic-assessment",
    mode: "assessment",
    competencyCodes: [
      { code: "BC-FORENSICS-001", weight: 3 },
      { code: "BC-TAMPER-001", weight: 2 },
      { code: "BC-INTEGRITY-001", weight: 2 },
      { code: "BC-HASH-001", weight: 1 },
      { code: "BC-CHAIN-001", weight: 1 },
    ],
    config: {
      rubric: [
        { key: "identifiesCompromisedBlock", points: 20, label: "Identifies compromised block" },
        { key: "identifiesAlteredData", points: 15, label: "Identifies altered transaction/data" },
        { key: "detectsHashMismatch", points: 15, label: "Detects hash mismatch" },
        { key: "explainsDownstreamImpact", points: 15, label: "Explains downstream chain impact" },
        { key: "determinesValidPriorState", points: 10, label: "Determines valid previous state" },
        { key: "repairsChain", points: 15, label: "Repairs/reconstructs chain" },
        { key: "validatesFinalChain", points: 10, label: "Validates final blockchain" },
      ],
      maxHints: 1,
      maxAttempts: 3,
      passThresholdPct: 70,
    },
    hints: [{ errorCode: "STUCK_NO_PROGRESS", level: 1, text: "Start by validating the whole chain. That will tell you which block is the earliest point of failure." }],
  },
];

const L1_PATH: LearningPathDef = {
  slug: "blockchain-foundations-l1",
  name: "Blockchain Foundations, Level 1",
  level: 1,
  order: 1,
  missions: L1_MISSIONS,
  credential: {
    code: "BLOCKCHAIN-FOUNDATIONS-L1",
    title: "Echolink Blockchain Foundations, Level 1",
    requiredCompetencyCodes: L1_COMPETENCIES.map((c) => c.code),
    minMastery: 70,
  },
};

// ============================================================
// LEVEL 2, Blockchain Network Engineer
// ============================================================

const L2_COMPETENCIES: CompetencyDef[] = [
  {
    code: "BC-NODE-001",
    name: "Distributed Nodes & Replication",
    description: "Can explain why a single-machine blockchain is fragile and how replicating it across nodes solves that.",
    dependsOnCode: "BC-INTEGRITY-001",
  },
  {
    code: "BC-PROPAGATION-001",
    name: "Transaction Propagation",
    description: "Can explain how a transaction reaches every node in a network and why nodes may see it at different times.",
    dependsOnCode: "BC-NODE-001",
  },
  {
    code: "BC-POW-001",
    name: "Proof-of-Work Mining",
    description: "Can perform a real proof-of-work search, finding a nonce that produces a hash meeting a difficulty target.",
    dependsOnCode: "BC-HASH-001",
  },
  {
    code: "BC-FORK-001",
    name: "Fork Resolution (Longest Chain Rule)",
    description: "Can identify competing chain branches and determine which one the network should treat as canonical.",
    dependsOnCode: "BC-POW-001",
  },
  {
    code: "BC-NETVALID-001",
    name: "Network-Level Validation",
    description: "Can identify which node in a network is broadcasting an invalid block.",
    dependsOnCode: "BC-FORK-001",
  },
  {
    code: "BC-NETFORENSICS-001",
    name: "Network Forensics & Consensus Investigation",
    description: "Can independently resolve a live fork and identify a malicious node in a multi-node network, without step-by-step guidance.",
    dependsOnCode: "BC-NETVALID-001",
  },
];

const L2_MISSIONS: MissionDef[] = [
  {
    slug: "n01-distributed-nodes",
    order: 1,
    title: "What If Your Machine Fails?",
    problemPrompt:
      "Your blockchain lives on one machine. If that machine is destroyed, or its owner secretly replaces the chain, how would anyone know the truth?",
    narrative:
      "The answer is redundancy: give multiple nodes their own copy of the same chain. If they all agree, no single machine can quietly rewrite history.",
    primitiveKey: "node-network",
    mode: "practice",
    competencyCodes: [{ code: "BC-NODE-001", weight: 1 }],
    config: { nodeCount: 5 },
    hints: [{ errorCode: "NODES_NOT_REPLICATED", level: 1, text: "Press Replicate to Network, each node needs its own copy of your current chain." }],
  },
  {
    slug: "n02-transaction-propagation",
    order: 2,
    title: "How Does Everyone Find Out?",
    problemPrompt:
      "You submit a new transaction. It only exists on your machine right now. How does every other node learn about it, and do they all learn about it at the same moment?",
    narrative:
      "Nodes broadcast transactions to their peers, who broadcast to their peers. This is gossip propagation, it takes a short, uneven amount of time, which is exactly why networks need consensus rules for what counts as \"agreed.\"",
    primitiveKey: "propagation",
    mode: "practice",
    competencyCodes: [{ code: "BC-PROPAGATION-001", weight: 1 }],
    config: {},
    hints: [{ errorCode: "NOT_BROADCAST", level: 1, text: "Press Broadcast Transaction and watch the order nodes receive it in, it isn't instantaneous or simultaneous." }],
  },
  {
    slug: "n03-proof-of-work",
    order: 3,
    title: "Who Gets to Add the Next Block?",
    problemPrompt:
      "Anyone could claim the right to add the next block. What would stop someone from just adding blocks as fast as they want, with no cost at all?",
    narrative:
      "Proof-of-work makes adding a block expensive: you must find a nonce whose block hash starts with a required number of zeros. That takes real, unfaked computational effort, which is exactly what makes it hard to fake.",
    primitiveKey: "mining-lab",
    mode: "practice",
    competencyCodes: [{ code: "BC-POW-001", weight: 1 }],
    config: { difficulty: 4 },
    hints: [
      { errorCode: "MINING_NOT_STARTED", level: 1, text: "Press Start Mining, the engine will search nonce values until it finds one that satisfies the difficulty target." },
      { errorCode: "DIFFICULTY_NOT_MET", level: 1, text: "Keep mining, the hash needs to start with the required number of zeros. Higher difficulty means more attempts." },
    ],
  },
  {
    slug: "n04-fork-resolution",
    order: 4,
    title: "Two Nodes Disagree. Who's Right?",
    problemPrompt:
      "Node C proposes one next block. Node D proposes a different one, both at the same height. The network now has two competing versions. Which one should everyone follow?",
    narrative:
      "This is a fork. Most networks resolve it with the longest-chain rule: whichever branch has more accumulated proof-of-work becomes canonical, and the other is abandoned.",
    primitiveKey: "fork-resolution",
    mode: "practice",
    competencyCodes: [{ code: "BC-FORK-001", weight: 1 }],
    config: {},
    hints: [
      { errorCode: "WRONG_BRANCH_CHOSEN", level: 1, text: "Don't just look at which block came first, compare the total accumulated work behind each branch." },
      { errorCode: "WRONG_BRANCH_CHOSEN", level: 2, text: "The longest valid chain, the one with the most proof-of-work behind it, is the one the network adopts." },
    ],
  },
  {
    slug: "n05-malicious-node",
    order: 5,
    title: "Can You Spot the Bad Actor?",
    problemPrompt: "One node in your network just broadcast a block that doesn't check out. Which node is it, and how do you know?",
    narrative:
      "Every node can independently validate any block it receives, hash correctness, previous-hash linkage, all of it. A network doesn't have to trust any single node; it just has to be able to check.",
    primitiveKey: "malicious-detector",
    mode: "practice",
    competencyCodes: [{ code: "BC-NETVALID-001", weight: 1 }],
    config: { nodeCount: 5 },
    hints: [{ errorCode: "WRONG_NODE_FLAGGED", level: 1, text: "Validate the block each node is broadcasting individually, one of them won't pass hash or link validation." }],
  },
  {
    slug: "n06-network-assessment",
    order: 6,
    title: "Can You Resolve This Network Independently?",
    problemPrompt: "A 5-node network has an active fork, and one of the nodes is broadcasting an invalid block. No step-by-step instructions this time, resolve it.",
    narrative: "This is your Level 2 practical assessment. It draws on node replication, propagation, proof-of-work, fork resolution, and network validation together.",
    primitiveKey: "network-assessment",
    mode: "assessment",
    competencyCodes: [
      { code: "BC-NETFORENSICS-001", weight: 3 },
      { code: "BC-FORK-001", weight: 2 },
      { code: "BC-NETVALID-001", weight: 2 },
      { code: "BC-POW-001", weight: 1 },
      { code: "BC-NODE-001", weight: 1 },
    ],
    config: {
      rubric: [
        { key: "identifiesMaliciousNode", points: 25, label: "Identifies the malicious node" },
        { key: "identifiesInvalidBlock", points: 15, label: "Identifies the invalid block it broadcast" },
        { key: "choosesCanonicalBranch", points: 25, label: "Chooses the correct canonical branch" },
        { key: "explainsLongestChainRule", points: 15, label: "Correctly applies the longest-chain rule" },
        { key: "resolvesNetworkState", points: 20, label: "Resolves the network to a single valid state" },
      ],
      maxHints: 1,
      maxAttempts: 3,
      passThresholdPct: 70,
    },
    hints: [{ errorCode: "STUCK_NO_PROGRESS", level: 1, text: "Start by validating each node's proposed block independently, then compare accumulated work across branches." }],
  },
];

const L2_PATH: LearningPathDef = {
  slug: "blockchain-network-l2",
  name: "Blockchain Network Engineer, Level 2",
  level: 2,
  order: 2,
  missions: L2_MISSIONS,
  credential: {
    code: "BLOCKCHAIN-NETWORK-L2",
    title: "Echolink Blockchain Network Engineer, Level 2",
    requiredCompetencyCodes: L2_COMPETENCIES.map((c) => c.code),
    minMastery: 70,
  },
};

// ============================================================
// Combined exports
// ============================================================

export const COMPETENCIES: CompetencyDef[] = [...L1_COMPETENCIES, ...L2_COMPETENCIES];
export const LEARNING_PATHS: LearningPathDef[] = [L1_PATH, L2_PATH];

export const BADGES = [
  { code: "BC-HASHING-INTEGRITY", name: "Hashing & Chain Integrity", description: "Demonstrated cryptographic hashing, block construction, and chain integrity." },
  { code: "BC-CRYPTOGRAPHY", name: "Blockchain Cryptography", description: "Demonstrated public/private key generation and digital signature verification." },
  { code: "BC-FORENSICS", name: "Tamper Detection & Forensics", description: "Demonstrated independent investigation and repair of a compromised chain." },
  { code: "BC-NETWORK", name: "Distributed Networks & Consensus", description: "Demonstrated node replication, propagation, proof-of-work, and fork resolution." },
  { code: "BC-NETFORENSICS", name: "Network Forensics", description: "Demonstrated independent resolution of a live fork and malicious-node identification." },
];

export const LEVEL1_CREDENTIAL = L1_PATH.credential;
export const LEVEL2_CREDENTIAL = L2_PATH.credential;
