"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#0f1117", color: "#f0f4ff", fontFamily: "DM Sans, sans-serif", margin: 0 }}>
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "2rem",
        }}>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💥</div>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#8894b0", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              An unexpected error occurred. Don't worry, your data is safe.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.5rem",
                background: "#5BC5A7", color: "#0f1117",
                border: "none", borderRadius: "10px",
                fontWeight: 600, cursor: "pointer", fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
