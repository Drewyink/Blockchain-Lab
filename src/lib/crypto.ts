import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";
import { ed25519 } from "@noble/curves/ed25519";

/**
 * This is the platform's real cryptography layer — not a simulated
 * stand-in. Learners are hashing actual SHA-256 digests and signing with
 * actual Ed25519 keypairs. The "learning" is in the guided problem design
 * around this code, not in faking the math.
 */

export function hashHex(input: string): string {
  return bytesToHex(sha256(utf8ToBytes(input)));
}

/** Canonical serialization of a block's fields for hashing. Field order matters
 *  intentionally — learners discover that changing order changes the hash too. */
export function blockFingerprint(fields: {
  blockNumber: number;
  timestamp: string;
  data: string;
  previousHash: string;
  nonce: string;
}): string {
  return hashHex(
    `${fields.blockNumber}|${fields.timestamp}|${fields.data}|${fields.previousHash}|${fields.nonce}`
  );
}

export function generateKeypair() {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return {
    privateKeyHex: bytesToHex(privateKey),
    publicKeyHex: bytesToHex(publicKey),
  };
}

export function signMessage(messageUtf8: string, privateKeyHex: string): string {
  const sig = ed25519.sign(utf8ToBytes(messageUtf8), hexToBytes(privateKeyHex));
  return bytesToHex(sig);
}

export function verifySignature(
  messageUtf8: string,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  try {
    return ed25519.verify(
      hexToBytes(signatureHex),
      utf8ToBytes(messageUtf8),
      hexToBytes(publicKeyHex)
    );
  } catch {
    return false;
  }
}

/** Deterministic wallet-address-style short form of a public key, for display. */
export function walletAddress(publicKeyHex: string): string {
  const h = hashHex(publicKeyHex);
  return `0x${h.slice(0, 40)}`;
}
