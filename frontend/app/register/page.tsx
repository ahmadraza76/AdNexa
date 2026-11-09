"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("advertiser");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Unable to create your account. Please review the details.");
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
          <span className="eyebrow">JOIN THE NETWORK</span>
          <h1>Build better connections through advertising.</h1>
          <p>Create an advertiser, publisher or developer account. Admin access is provisioned separately by an operator.</p>
        </div>
        <span className="auth-aside-foot">India-first. Built for a global ecosystem.</span>
      </aside>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <h2>Create your account</h2>
          <p className="auth-subtitle">Start with your basic account information.</p>
          <form onSubmit={submit}>
            <div className="form-field"><label htmlFor="fullName">Full name</label><input id="fullName" autoComplete="name" minLength={2} maxLength={120} required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></div>
            <div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
            <div className="form-field"><label htmlFor="role">I want to join as</label><select id="role" value={role} onChange={(e) => setRole(e.target.value)}><option value="advertiser">Advertiser</option><option value="publisher">Publisher</option><option value="developer">Developer</option></select></div>
            <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 12 characters" /></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary form-submit" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
          </form>
          <p className="form-bottom">Already registered? <Link href="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
