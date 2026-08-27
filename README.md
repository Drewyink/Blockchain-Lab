# Echolink Blockchain Foundations & Network Engineer — Levels 1 & 2

The Echolink Simulation Engine's first academy: a hands-on blockchain lab
where learners build, break, and repair a real blockchain — real SHA-256
hashing, real Ed25519 keypairs and signatures, real proof-of-work mining —
across two full levels and 16 missions, ending each level in an
independent forensic assessment and a verifiable credential.

**Level 1 — Blockchain Foundations** (10 missions): data → hashing →
blocks → chains → integrity → tamper → repair → keys → signatures →
independent forensic investigation.

**Level 2 — Blockchain Network Engineer** (6 missions): why a
single-machine chain is fragile → node replication → transaction
propagation → real proof-of-work mining → fork resolution (longest-chain
rule) → spotting a malicious node → an independent network forensics
assessment (hidden fork + hidden malicious node, graded against a rubric).

Level 2 unlocks on the dashboard once the Level 1 credential is earned.

## Architecture

The engine is academy-agnostic by design (see `prisma/schema.prisma`):
`Academy → LearningPath → Mission`, a `Competency` graph that is the real
backbone of certification (missions test competencies, not the other way
around), an `EvidenceEvent` log that every learner action writes to, and a
`Credential` model with a public verification ID. Blockchain is simply the
first academy running on this engine, and Level 1 / Level 2 are two
`LearningPath` rows on it — a future Project Scheduling, ERP, or EDI
academy, or a Level 3 (smart contracts), reuses every table here
unchanged.

- `src/lib/curriculum.ts` — the authored competency graph and every
  learning path's missions and curated mentor hints (`LEARNING_PATHS`
  array). Single source of truth; loaded into the database by
  `prisma/seed.ts`, which now loops generically over every learning path.
- `src/lib/crypto.ts` — real cryptography (SHA-256, Ed25519). Nothing is
  simulated.
- `src/lib/sandbox-engine.ts` — the mission logic for both levels: build
  blocks, extend chains, validate, tamper, repair (Level 1); replicate to
  nodes, propagate transactions, mine via real proof-of-work, resolve
  forks, detect malicious nodes (Level 2). Returns structured error codes
  that drive the mentor.
- `src/lib/mentor.ts` — reads curated hints from the database by error
  code + escalation level. The mentor never freely reasons about what to
  reveal.
- `src/app/api/assessment/*` (Level 1) and `src/app/api/assessment/network/*`
  (Level 2) — each level's fork/snapshot capstone flow: the assessment
  never touches the learner's practice sandbox, and the "answer key"
  (which block was tampered, which node is malicious) is stripped before
  the response reaches the client.

## Local development

You'll need Node 20+ and a Postgres database.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and SESSION_SECRET
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

> Note: `prisma generate` downloads a query-engine binary from
> `binaries.prisma.sh`. If you're running this in a network-restricted
> sandbox, that domain needs to be reachable — it is on Render and on a
> normal developer machine.

## Deploying to Render

**Option A — one-click via `render.yaml`:** push this repo to GitHub, then
in Render choose "New +" → "Blueprint" and point it at the repo. Render
will read `render.yaml`, provision a free Postgres instance, wire up
`DATABASE_URL` automatically, generate a `SESSION_SECRET`, and run the
build (`prisma generate` → `next build` → `prisma db push` → seed).

**Option B — manual:**
1. Create a Postgres instance in Render, copy its internal connection string.
2. Create a Web Service from this repo. Runtime: Node.
3. Build command: `npm install && npm run build && npx prisma db push && npx tsx prisma/seed.ts`
4. Start command: `npm run start`
5. Environment variables: `DATABASE_URL` (from step 1), `SESSION_SECRET`
   (any long random string — `openssl rand -base64 32`), `NODE_ENV=production`.
6. Deploy.

The seed script is idempotent (it upserts), so it's safe to leave in the
build command — every deploy re-syncs the curriculum content without
duplicating rows.

## Adding your logo

Drop your logo file into `/public/logo.svg` (or `.png`), then replace the
placeholder markup in `src/components/layout/Logo.tsx` with:

```tsx
<img src="/logo.svg" alt="Echolink Solutions" className="h-8 w-auto" />
```

## What's built vs. what's next

**Built (this repo):** the full Level 1 and Level 2 learner experience —
all 16 missions across both levels, the visual primitive library,
persistent sandbox, mentor/hint engine, competency graph, evidence log,
both levels' fork-and-grade capstone assessments, level-gating on the
dashboard, and public credential verification for both credentials.

**Deliberately not built yet:** instructor/university/enterprise
dashboards, and Level 3+ (smart contracts, DApps, enterprise integration,
decentralized AI). The engine's schema already has the room
(`Organization`, `OrganizationMember` roles) for the dashboards to plug in
without a rebuild, and adding Level 3 means adding one more
`LearningPath` — the pattern is now established by Levels 1 and 2.

