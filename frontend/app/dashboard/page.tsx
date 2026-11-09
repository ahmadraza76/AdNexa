import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { LogoutButton } from "./logout-button";

type Account = {
  id: number;
  email: string;
  full_name: string;
  roles: string[];
  is_email_verified: boolean;
};

export default async function DashboardPage() {
  const token = (await cookies()).get("adnexa_access_token")?.value;
  if (!token) redirect("/login");

  let account: Account;
  try {
    const response = await backendFetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) redirect("/login");
    account = await response.json();
  } catch {
    redirect("/login");
  }

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
