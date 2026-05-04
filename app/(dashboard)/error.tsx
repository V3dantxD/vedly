"use client";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", padding: "2rem",
    }}>
      <div style={{ textAlign: "center", maxWidth: "380px" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "1.25rem",
          fontWeight: 700, marginBottom: "0.5rem",
        }}>
          Page failed to load
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          {error.message || "Something went wrong loading this page."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)",
              cursor: "pointer", fontSize: "0.875rem", fontFamily: "var(--font-body)",
            }}
          >
            Go back
          </button>
          <button
            onClick={reset}
            className="btn-primary"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
