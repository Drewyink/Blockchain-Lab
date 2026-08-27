import Link from "next/link";
import { ChainLinkDivider } from "../components/ChainLinkDivider";

const DISCOVERY_ARC = [
  { q: "How would we know if this changed?", a: "Hashing" },
  { q: "How do we package it permanently?", a: "Block Construction" },
  { q: "How do blocks become a chain?", a: "Cryptographic Linking" },
  { q: "What happens when data changes?", a: "Chain Integrity" },
  { q: "Can you compromise what you built?", a: "Attack & Tamper Detection" },
  { q: "Can you find and fix the damage?", a: "Forensic Repair" },
  { q: "How do we prove ownership?", a: "Keys & Wallets" },
  { q: "How do we prove authorization?", a: "Digital Signatures" },
];

const AUDIENCES = [
  {
    title: "Individuals",
    body: "Work through Blockchain Foundations at your own pace, build a portfolio project, and earn a verifiable Level 1 credential.",
  },
  {
    title: "Universities",
    body: "Assign missions, set deadlines, and see real competency reports instead of attendance records.",
  },
  {
    title: "Companies",
    body: "Evaluate blockchain competency across your workforce and identify exactly where the skill gaps are.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
        <p className="eyebrow">Echolink Simulation Engine, Blockchain Academy</p>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Don&rsquo;t watch a blockchain get explained.
          <br />
          <span className="text-echolink-orange">Build one. Break it. Fix it.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-lab-300 sm:text-lg">
          A hands-on lab where you hash real data, link real blocks with real cryptography, tamper with your own
          chain, and repair it, before you ever touch a certificate.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/welcome" className="btn-primary w-full shadow-glow-orange sm:w-auto">
            Learn the basics, then start Mission 01
          </Link>
          <Link href="#journey" className="btn-secondary w-full sm:w-auto">
            See the learner journey
          </Link>
        </div>
      </section>

      <ChainLinkDivider />

      {/* Discovery arc */}
      <section id="journey" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">Problem-driven discovery</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            We never teach a concept because it&rsquo;s next in the curriculum.
          </h2>
          <p className="mt-3 text-lab-300">
            Every mission opens with a problem that makes you need the next idea, not a lecture that assumes you
            already care.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {DISCOVERY_ARC.map((item, i) => (
            <div key={item.a} className="lab-panel flex items-start gap-4 p-4">
              <span className="mt-0.5 font-mono text-xs text-echolink-orange">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-sm text-lab-300">&ldquo;{item.q}&rdquo;</p>
                <p className="mt-1 font-display text-sm font-semibold text-white">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ChainLinkDivider />

      {/* Audiences */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="eyebrow text-center">Built for three audiences, one engine</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="lab-panel p-6">
              <h3 className="font-display text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm text-lab-300">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certification */}
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 text-center sm:px-6">
        <p className="eyebrow">Performance-based certification</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Your credential proves what you demonstrated, not what you watched.
        </h2>
        <p className="mt-3 text-lab-300">
          Every action is logged as evidence. The Level 1 credential ships with a public verification ID and a
          competency-by-competency breakdown, not a certificate of attendance.
        </p>
        <div className="mt-8">
          <Link href="/signup" className="btn-primary shadow-glow-orange">
            Begin Blockchain Foundations
          </Link>
        </div>
      </section>
    </div>
  );
}
