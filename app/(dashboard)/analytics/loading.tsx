export default function AnalyticsLoading() {
  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div className="skeleton" style={{ height: "28px", width: "120px" }} />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div className="skeleton" style={{ height: "36px", width: "260px", borderRadius: "10px" }} />
          <div className="skeleton" style={{ height: "36px", width: "110px", borderRadius: "10px" }} />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{ height: "12px", width: "80px", marginBottom: "0.5rem" }} />
            <div className="skeleton" style={{ height: "28px", width: "110px" }} />
          </div>
        ))}
      </div>

      {/* Main bar chart */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="skeleton" style={{ height: "18px", width: "220px", marginBottom: "1.25rem" }} />
        <div className="skeleton" style={{ height: "280px", borderRadius: "8px" }} />
      </div>

      {/* Two charts side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {[1, 2].map((i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{ height: "18px", width: "160px", marginBottom: "1rem" }} />
            <div className="skeleton" style={{ height: "220px", borderRadius: "8px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
