"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "./logout-button";

type Account = {
  id: number;
  email: string;
  full_name: string;
  roles: string[];
  is_email_verified: boolean;
};

export function DashboardSession() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSession(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        signal,
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.detail || "Unable to load your account. Please try again.");
        return;
      }
      setAccount(data.user as Account);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError("AdNexa API is unavailable. Check your connection and retry.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadSession(controller.signal);
    return () => controller.abort();
    // loadSession is intentionally invoked once for the initial session check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <main className="dashboard"><section className="dashboard-main"><p>Verifying your secure session...</p></section></main>;
  }

  if (error) {
    return (
      <main className="dashboard">
        <section className="dashboard-main">
          <div className="dashboard-card">
            <h1>Unable to load your workspace</h1>
            <p role="alert">{error}</p>
            <button className="button button-primary" onClick={() => void loadSession()}>Try again</button>
            <button className="button button-ghost" onClick={() => router.replace("/login")}>Sign in again</button>
          </div>
        </section>
      </main>
    );
  }

  if (!account) return null;

  return (
    <main className="dashboard">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">A</span>AdNexa</Link>
        <LogoutButton />
      </header>
      <section className="dashboard-main">
        <span className="eyebrow"><span className="eyebrow-dot" /> ACCOUNT WORKSPACE</span>
        <h1 style={{ fontFamily: "Manrope, sans-serif", fontSize: 38, letterSpacing: "-1.8px", marginBottom: 8 }}>Welcome, {account.full_name}</h1>
        <p style={{ color: "var(--muted)" }}>Your account is authenticated through the AdNexa API.</p>
        <div className="dashboard-card">
          <h2 style={{ marginTop: 0, fontFamily: "Manrope, sans-serif" }}>Account details</h2>
          <p><strong>Email:</strong> {account.email}</p>
          <p><strong>Account roles:</strong> {account.roles.join(", ")}</p>
          <p><strong>Email verification:</strong> {account.is_email_verified ? "Verified" : "Not verified yet"}</p>
        </div>
        <div className="dashboard-card">
          <h2 style={{ marginTop: 0, fontFamily: "Manrope, sans-serif" }}>Your workspace is being prepared</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>Campaign management, publisher inventory, live reporting and financial tools will appear here only after their backend services are implemented. No sample earnings or simulated traffic are displayed.</p>
        </div>
      </section>
    </main>
  );
}
