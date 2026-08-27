import Link from "next/link";
import { PlaySandbox } from "../../components/welcome/PlaySandbox";
import { ChainLinkDivider } from "../../components/ChainLinkDivider";

const EXPLAINERS = [
  {
    title: "What is a blockchain?",
    body: "A blockchain is a record of transactions, stored as a chain of blocks. Each block links to the one before it, so if anyone changes an old entry, every block after it visibly breaks. That's what makes the record hard to quietly alter.",
  },
  {
    title: "What is a hash?",
    body: "A hash is a fingerprint for data. You put any text in, and you get back a fixed-length code. Change even one character of the input, and the whole fingerprint changes completely. That's how a blockchain proves data hasn't been touched.",
  },
  {
    title: "What is a block?",
    body: "A block packages a piece of data together with a timestamp, a reference number, and, most importantly, the hash of the block that came before it. That last part is what turns a pile of blocks into a chain.",
  },
  {
    title: "What are public and private keys?",
    body: "A private key is a secret only you hold. A public key is derived from it and can be shared freely. Together they let you prove a transaction really came from you, without ever having to reveal your private key.",
  },
];

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="eyebrow text-center">Before you start</p>
      <h1 className="mt-3 text-center font-display text-3xl font-semibold sm:text-4xl">
        Four ideas worth knowing first
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-base text-lab-200">
        You'll build all of this yourself in the missions ahead. This page is just here so none of it is a surprise
        when you get there.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {EXPLAINERS.map((e) => (
          <div key={e.title} className="lab-panel p-5">
            <h2 className="font-display text-base font-semibold text-white">{e.title}</h2>
            <p className="mt-2 text-sm text-lab-200">{e.body}</p>
          </div>
        ))}
      </div>

      <ChainLinkDivider />

      <div className="mt-6">
        <PlaySandbox />
      </div>

      <div className="mt-10 text-center">
        <Link href="/signup" className="btn-primary shadow-glow-orange">
          Start Mission 01
        </Link>
      </div>
    </div>
  );
}
