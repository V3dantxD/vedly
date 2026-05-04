import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-background)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        top: "-20%",
        right: "-10%",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(91,197,167,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-20%",
        left: "-10%",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(91,197,167,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="card fade-in" style={{
        width: "100%",
        maxWidth: "420px",
        padding: "2.5rem",
        boxShadow: "var(--shadow-glow)",
        border: "1px solid var(--color-border)",
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
            fontSize: "24px",
          }}>
            💸
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 0.25rem",
            letterSpacing: "-0.02em",
          }}>
            Vedly
          </h1>
          <p style={{
            color: "var(--color-text-secondary)",
            fontSize: "0.9rem",
            margin: 0,
          }}>
            Split expenses, not friendships
          </p>
        </div>

        {/* Features list */}
        <div style={{
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          marginBottom: "1.5rem",
          textAlign: "left",
        }}>
          {[
            { icon: "👥", text: "Split bills with friends & groups" },
            { icon: "📊", text: "Track who owes what, in real-time" },
            { icon: "💰", text: "Settle up easily with one tap" },
          ].map((f) => (
            <div key={f.text} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.4rem 0",
              color: "var(--color-text-secondary)",
              fontSize: "0.875rem",
            }}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Sign in form */}
        <form action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}>
          <button
            type="submit"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              padding: "0.875rem 1.5rem",
              background: "var(--color-surface-2)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
              fontFamily: "var(--font-body)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p style={{
          marginTop: "1.25rem",
          color: "var(--color-text-muted)",
          fontSize: "0.75rem",
        }}>
          By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
