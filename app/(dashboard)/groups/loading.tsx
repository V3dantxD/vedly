export default function GroupsLoading() {
  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div className="skeleton" style={{ height: "24px", width: "130px" }} />
        <div className="skeleton" style={{ height: "36px", width: "120px", borderRadius: "10px" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
              <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "10px", flexShrink: 0 }} />
              <div>
                <div className="skeleton" style={{ height: "16px", width: "120px", marginBottom: "0.4rem" }} />
                <div className="skeleton" style={{ height: "12px", width: "80px" }} />
              </div>
            </div>
            <div style={{ display: "flex" }}>
              {[1, 2, 3].map((j) => (
                <div key={j} style={{ marginLeft: j > 1 ? "-8px" : 0 }}>
                  <div className="skeleton" style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
