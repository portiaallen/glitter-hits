"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function toChartData(breakdown: Record<string, number>) {
  return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
}

export function AnalyticsCharts({
  deviceBreakdown,
  countryBreakdown,
  qualityBreakdown,
}: {
  deviceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  qualityBreakdown: Record<string, number>;
}) {
  const charts = [
    { title: "Devices", data: toChartData(deviceBreakdown) },
    { title: "Countries", data: toChartData(countryBreakdown) },
    { title: "Traffic quality", data: toChartData(qualityBreakdown) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {charts.map((chart) => (
        <div key={chart.title} className="gh-glass p-4">
          <h3 className="mb-3 text-sm font-semibold">{chart.title}</h3>
          {chart.data.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No data yet.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="#b7a8d4" fontSize={11} />
                  <YAxis stroke="#b7a8d4" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#120a24",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="#ff4fd8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
