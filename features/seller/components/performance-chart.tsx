"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface MonthlyPoint {
  month: string;
  earnings: number;
  unlocks: number;
}

/** Recharts requires a Client Component boundary — the seller analytics
 *  page (Server Component) computes the monthly buckets from Prisma data
 *  and passes them in as plain serializable props. */
export function PerformanceChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            fontSize: 13,
          }}
        />
        <Line type="monotone" dataKey="earnings" stroke="hsl(var(--brand))" strokeWidth={2} dot={false} name="Points earned" />
        <Line type="monotone" dataKey="unlocks" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="Unlocks" />
      </LineChart>
    </ResponsiveContainer>
  );
}
