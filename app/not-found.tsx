import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--color-background)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "5rem", marginBottom: "1rem", lineHeight: 1 }}>🔍</div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "2rem",
          fontWeight: 700, margin: "0 0 0.5rem", color: "var(--color-text-primary)",
          letterSpacing: "-0.02em",
        }}>
          404
        </h1>
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "1.25rem",
          fontWeight: 600, margin: "0 0 0.75rem", color: "var(--color-text-primary)",
        }}>
          Page not found
        </h2>
        <p style={{
          color: "var(--color-text-secondary)", fontSize: "0.9rem",
          marginBottom: "2rem", lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ padding: "0.625rem 1.5rem", fontSize: "0.9rem" }}>
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
