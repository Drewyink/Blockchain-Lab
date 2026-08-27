"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function Header() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => setSignedIn(r.ok))
      .catch(() => setSignedIn(false));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-lab-700 bg-lab-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {signedIn ? (
            <Link href="/dashboard" className="btn-secondary !px-3 !py-2 text-xs sm:!px-4 sm:!py-2.5 sm:text-sm">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary !px-3 !py-2 text-xs sm:!px-4 sm:!py-2.5 sm:text-sm">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary !px-3 !py-2 text-xs sm:!px-4 sm:!py-2.5 sm:text-sm">
                Start Building
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
