"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type Row = { month: string; revenue: number };

export default function RevenueChart({ data }: { data: Row[] }) {
  const rows = data.map(d => ({
    month: new Date(d.month).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    revenue: Number(d.revenue),
  }));
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sunriseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4B942" stopOpacity={0.45}/>
              <stop offset="100%" stopColor="#F4B942" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E6DFD2" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="month" stroke="#6F6A62" tickLine={false} axisLine={false}
            style={{ fontSize: 13, fontFamily: "DM Mono" }} />
          <YAxis stroke="#6F6A62" tickLine={false} axisLine={false}
            style={{ fontSize: 13, fontFamily: "DM Mono" }} />
          <Tooltip
            contentStyle={{
              background: "#FBF8F3", border: "1px solid #E6DFD2", borderRadius: 0,
              fontFamily: "DM Mono", fontSize: 13,
            }}
            formatter={(v: number) => [`€${v.toFixed(2)}`, "Revenue"]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#C15A1A" strokeWidth={1.5} fill="url(#sunriseFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
