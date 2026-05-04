export default function SettingsLoading() {
  return (
    <div style={{ maxWidth: "520px" }}>
      <div className="skeleton" style={{ height: "28px", width: "100px", marginBottom: "1.5rem" }} />

      {/* Profile card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="skeleton" style={{ height: "16px", width: "70px", marginBottom: "1.25rem" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <div className="skeleton" style={{ width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0 }} />
          <div>
            <div className="skeleton" style={{ height: "16px", width: "120px", marginBottom: "0.4rem" }} />
            <div className="skeleton" style={{ height: "13px", width: "180px", marginBottom: "0.4rem" }} />
            <div className="skeleton" style={{ height: "20px", width: "140px", borderRadius: "99px" }} />
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <div className="skeleton" style={{ height: "12px", width: "100px", marginBottom: "0.4rem" }} />
            <div className="skeleton" style={{ height: "40px", borderRadius: "10px" }} />
          </div>
        ))}
      </div>

      {/* Notifications card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="skeleton" style={{ height: "16px", width: "110px", marginBottom: "1.25rem" }} />
        {[1, 2].map((i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
            <div>
              <div className="skeleton" style={{ height: "14px", width: "150px", marginBottom: "0.3rem" }} />
              <div className="skeleton" style={{ height: "11px", width: "220px" }} />
            </div>
            <div className="skeleton" style={{ width: "44px", height: "24px", borderRadius: "99px" }} />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="skeleton" style={{ height: "44px", borderRadius: "10px", marginBottom: "0.75rem" }} />
      <div className="skeleton" style={{ height: "44px", borderRadius: "10px" }} />
    </div>
  );
}
