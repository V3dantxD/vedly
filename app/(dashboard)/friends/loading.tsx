export default function FriendsLoading() {
  return (
    <div style={{ maxWidth: "700px" }}>
      {/* Add friend card skeleton */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="skeleton" style={{ height: "18px", width: "120px", marginBottom: "1rem" }} />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div className="skeleton" style={{ flex: 1, height: "40px", borderRadius: "10px" }} />
          <div className="skeleton" style={{ width: "120px", height: "40px", borderRadius: "10px" }} />
        </div>
      </div>

      {/* Friend cards */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
          <div className="skeleton" style={{ width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: "15px", width: "130px", marginBottom: "0.375rem" }} />
            <div className="skeleton" style={{ height: "12px", width: "180px" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="skeleton" style={{ height: "18px", width: "80px", marginBottom: "0.3rem" }} />
            <div className="skeleton" style={{ height: "12px", width: "55px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
