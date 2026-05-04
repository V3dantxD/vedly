export default function ActivityLoading() {
  return (
    <div style={{ maxWidth: "680px" }}>
      <div className="skeleton" style={{ height: "28px", width: "150px", marginBottom: "1.25rem" }} />

      {/* Filter tabs skeleton */}
      <div className="skeleton" style={{ height: "40px", borderRadius: "10px", marginBottom: "1.25rem" }} />

      {/* Activity items */}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", padding: "0.875rem 0", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div className="skeleton" style={{ width: "38px", height: "38px", borderRadius: "50%" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: "14px", width: `${180 + (i % 3) * 40}px`, marginBottom: "0.4rem" }} />
            <div className="skeleton" style={{ height: "11px", width: "80px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
