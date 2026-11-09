"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Unable to sign in. Check your details and try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link className="brand" href="/"><span className="brand-mark">A</span>AdNexa</Link>
        <div className="auth-aside-copy">
          <span className="eyebrow">YOUR ADVERTISING WORKSPACE</span>
          <h1>One place to manage your growth.</h1>
          <p>Sign in to continue to your AdNexa workspace. Your account permissions are checked by the API.</p>
        </div>
        <span className="auth-aside-foot">Independent advertising infrastructure</span>
      </aside>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Enter your account details to sign in.</p>
          <form onSubmit={submit}>
            <div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
            <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" /></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary form-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          </form>
          <p className="form-bottom">New to AdNexa? <Link href="/register">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}
