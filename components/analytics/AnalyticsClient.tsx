"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

type Range = "1month" | "3months" | "6months" | "all";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316", Travel: "#60a5fa", Accommodation: "#a78bfa",
  Utilities: "#fbbf24", Entertainment: "#f472b6", Shopping: "#22d3ee",
  Healthcare: "#f87171", Education: "#34d399", Other: "#9ca3af",
};

const ALL_CATEGORIES = ["Food", "Travel", "Accommodation", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Other"];

const RANGES: { value: Range; label: string }[] = [
  { value: "1month", label: "This month" },
  { value: "3months", label: "3 months" },
  { value: "6months", label: "6 months" },
  { value: "all", label: "All time" },
];

interface MonthlyData {
  month: string;
  total: number;
  [key: string]: string | number;
}

interface CategoryData { name: string; value: number }
interface PaidVsOwed { month: string; paid: number; owed: number }

const customTooltipStyle = {
  background: "#1e2535",
  border: "1px solid #2a3347",
  borderRadius: "10px",
  color: "#f0f4ff",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "12px",
};

export default function AnalyticsClient() {
  const [range, setRange] = useState<Range>("6months");
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [paidVsOwed, setPaidVsOwed] = useState<PaidVsOwed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [range]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const data = await res.json();
      setMonthly(data.monthlySpending ?? []);
      setCategories(data.categoryBreakdown ?? []);
      setPaidVsOwed(data.paidVsOwed ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    toast.loading("Preparing export...");
    try {
      const res = await fetch("/api/analytics/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vedly-expenses-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("Exported!");
    } catch {
      toast.dismiss();
      toast.error("Export failed");
    }
  }

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  };

  const formatINR = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const totalSpent = monthly.reduce((s, m) => s + (m.total ?? 0), 0);
  const usedCategories = ALL_CATEGORIES.filter((c) => monthly.some((m) => (m[c] as number) > 0));

  return (
    <div className="fade-in" style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: 0 }}>Analytics</h2>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: "3px" }}>
            {RANGES.map(({ value, label }) => (
              <button key={value} onClick={() => setRange(value)} style={{
                padding: "0.35rem 0.75rem", borderRadius: "7px",
                background: range === value ? "var(--color-surface)" : "transparent",
                border: "none", cursor: "pointer",
                color: range === value ? "var(--color-text-primary)" : "var(--color-text-muted)",
                fontSize: "0.78rem", fontWeight: range === value ? 600 : 400,
                fontFamily: "var(--font-body)", transition: "all 150ms",
                whiteSpace: "nowrap",
              }}>{label}</button>
            ))}
          </div>
          <button
            onClick={handleExport}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 0.875rem", borderRadius: "var(--radius-md)",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)", cursor: "pointer",
              fontSize: "0.8rem", fontFamily: "var(--font-body)",
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: "300px", borderRadius: "var(--radius-lg)" }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <StatCard label="Total Spent" value={formatINR(totalSpent)} />
            <StatCard label="Total Paid" value={formatINR(paidVsOwed.reduce((s, m) => s + m.paid, 0))} />
            <StatCard label="Avg / Month" value={formatINR(monthly.length ? totalSpent / monthly.length : 0)} />
          </div>

          {/* Monthly spending bar chart */}
          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 600 }}>
              Monthly Spending by Category
            </h3>
            {monthly.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthly} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: "#8894b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: "#8894b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => formatINR(v)} labelFormatter={formatMonth} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#8894b0" }} />
                  {usedCategories.map((cat) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} radius={cat === usedCategories[usedCategories.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Category pie */}
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>
                This Month by Category
              </h3>
              {categories.length === 0 ? <EmptyChart /> : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {categories.map((entry, index) => (
                          <Cell key={index} fill={CATEGORY_COLORS[entry.name] ?? "#9ca3af"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => formatINR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                    {categories.map((c) => (
                      <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CATEGORY_COLORS[c.name] ?? "#9ca3af", flexShrink: 0 }} />
                        <span style={{ color: "var(--color-text-muted)" }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Paid vs Owed line chart */}
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>
                You Paid vs You Owe
              </h3>
              {paidVsOwed.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={paidVsOwed} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
                    <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: "#8894b0", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: "#8894b0", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => formatINR(v)} labelFormatter={formatMonth} />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#8894b0" }} />
                    <Line type="monotone" dataKey="paid" stroke="#5BC5A7" strokeWidth={2} dot={false} name="You Paid" />
                    <Line type="monotone" dataKey="owed" stroke="#f87171" strokeWidth={2} dot={false} name="You Owe" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.375rem", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
      No data for this period
    </div>
  );
}
