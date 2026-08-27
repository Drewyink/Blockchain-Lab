"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "signup" ? { email, password, displayName } : { email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="lab-panel w-full max-w-sm space-y-4 p-6 sm:p-8">
      <div>
        <h1 className="font-display text-xl font-semibold">
          {mode === "signup" ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-1 text-sm text-lab-300">
          {mode === "signup" ? "Your sandbox and progress start here." : "Continue where your blockchain left off."}
        </p>
      </div>

      {mode === "signup" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-lab-300">Name</label>
          <input
            className="lab-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={80}
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-lab-300">Email</label>
        <input
          type="email"
          className="lab-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-lab-300">Password</label>
        <input
          type="password"
          className="lab-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      {error && <p className="text-sm text-signal-invalid">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
