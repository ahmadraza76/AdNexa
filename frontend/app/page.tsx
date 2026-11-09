import Link from "next/link";

const features = [
  { icon: "01", title: "One connected network", text: "Bring advertisers and verified publishers into one transparent platform." },
  { icon: "02", title: "Clear campaign controls", text: "Plan budgets, creative formats and targeting from a single workspace." },
  { icon: "03", title: "Publisher-first reporting", text: "Build toward understandable delivery, performance and earnings reports." },
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">A</span>AdNexa</Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#advertisers">For advertisers</a>
          <a href="#publishers">For publishers</a>
          <a href="#platform">Platform</a>
        </nav>
        <div className="nav-actions">
          <Link className="button button-ghost" href="/login">Log in</Link>
          <Link className="button button-primary" href="/register">Get started</Link>
        </div>
      </header>
      <section className="hero">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> INDEPENDENT ADVERTISING NETWORK</span>
          <h1>Advertising that works for <span>both sides.</span></h1>
          <p className="hero-copy">A connected advertising platform for businesses that want to reach audiences and publishers who want more control over their inventory.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/register">Create an account <span aria-hidden="true">↗</span></Link>
            <Link className="button button-ghost" href="/login">Sign in to workspace</Link>
          </div>
          <p className="hero-note">India-first. Built for a global publisher and advertiser ecosystem.</p>
        </div>
        <div className="preview-wrap" aria-label="Illustrative analytics dashboard preview">
          <div className="preview-card">
            <div className="preview-head"><span className="preview-title">Network overview</span><span className="status-pill">PRODUCT PREVIEW</span></div>
            <div className="metric-grid">
              <div className="metric"><div className="metric-label">Campaign workspace</div><div className="metric-value">Ready</div></div>
              <div className="metric"><div className="metric-label">Publisher tools</div><div className="metric-value">Coming</div></div>
            </div>
            <div className="chart" aria-hidden="true">
              {[34, 52, 43, 68, 58, 82, 71, 94, 78, 100, 86, 91].map((height, index) => <i key={index} style={{ height: height + "%" }} />)}
            </div>
            <p className="hero-note">Illustrative interface only — no live traffic or earnings are shown.</p>
          </div>
        </div>
      </section>
      <section className="section" id="platform">
        <div className="section-heading">
          <span className="eyebrow">THE PLATFORM</span>
          <h2>Built around transparency and control.</h2>
          <p>AdNexa is being developed as a first-party ad network. Campaign delivery, reporting and financial features will be enabled only as their real services are implemented and verified.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => <article className="feature" key={feature.icon}><span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}
        </div>
      </section>
      <footer className="footer">© {new Date().getFullYear()} AdNexa. Independent advertising infrastructure.</footer>
    </main>
  );
}
