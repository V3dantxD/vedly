export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Greeting skeleton */}
      <div className="skeleton" style={{ height: "16px", width: "180px", marginBottom: "0.5rem" }} />
      <div className="skeleton" style={{ height: "28px", width: "320px", marginBottom: "1.75rem" }} />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="skeleton" style={{ height: "12px", width: "100px", marginBottom: "0.5rem" }} />
            <div className="skeleton" style={{ height: "32px", width: "140px" }} />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: "36px", width: "130px", borderRadius: "10px" }} />
        <div className="skeleton" style={{ height: "36px", width: "120px", borderRadius: "10px" }} />
      </div>

      {/* Two column cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {[1, 2].map((card) => (
          <div key={card} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div className="skeleton" style={{ height: "18px", width: "130px" }} />
              <div className="skeleton" style={{ height: "14px", width: "60px" }} />
            </div>
            {[1, 2, 3, 4].map((row) => (
              <div key={row} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                <div className="skeleton" style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: "13px", width: "100px", marginBottom: "0.3rem" }} />
                  <div className="skeleton" style={{ height: "11px", width: "70px" }} />
                </div>
                <div className="skeleton" style={{ height: "14px", width: "60px" }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
