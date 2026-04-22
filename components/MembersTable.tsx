"use client";
import { useMemo, useState } from "react";
import type { Member } from "@/lib/data";
import StatusDot from "./StatusDot";

const STATUSES = ["all", "active", "past_due", "scheduled_to_cancel", "canceled"] as const;
const PLANS = ["all", "Premium", "Plus", "Basic"] as const;

function fmtEur(n: number | null) {
  return (n ?? 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function fmtPeriod(s: string | null, e: string | null) {
  if (!s || !e) return "—";
  const a = new Date(s), b = new Date(e);
  const sameYear = a.getFullYear() === b.getFullYear();
  const left  = a.toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  const right = b.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${left} → ${right}`;
}

export default function MembersTable({ members }: { members: Member[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("all");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (plan !== "all" && m.plan !== plan) return false;
      if (q) {
        const hay = `${m.name ?? ""} ${m.email ?? ""} ${m.city ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [members, q, status, plan]);

  const total = filtered.reduce((s, m) => s + (m.monthly_amount ?? 0), 0);

  return (
    <>
      <div className="flex flex-wrap items-end gap-8 mb-10">
        <div className="flex-1 min-w-[280px]">
          <div className="text-[12px] tracking-smallcap uppercase text-muted">Search</div>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, or city"
            className="mt-1.5 w-full bg-transparent border-b hairline border-b-hairline py-2 text-[16px] outline-none focus:border-b-ink"
          />
        </div>
        <div>
          <div className="text-[12px] tracking-smallcap uppercase text-muted">Status</div>
          <div className="mt-1.5 flex gap-0 border hairline">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3.5 py-2 text-[12px] tracking-smallcap uppercase border-r last:border-r-0 hairline ${status === s ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>
                {s.replace("_to_cancel", "")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[12px] tracking-smallcap uppercase text-muted">Plan</div>
          <div className="mt-1.5 flex gap-0 border hairline">
            {PLANS.map((p) => (
              <button key={p} onClick={() => setPlan(p)}
                className={`px-3.5 py-2 text-[12px] tracking-smallcap uppercase border-r last:border-r-0 hairline ${plan === p ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[12px] tracking-smallcap uppercase text-muted">Shown</div>
          <div className="number-display text-[26px] leading-none mt-1.5">{filtered.length}</div>
          <div className="text-[13px] font-mono text-muted mt-1.5">{fmtEur(total)}/mo</div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[12px] tracking-smallcap uppercase text-muted border-b hairline">
            <th className="py-4 pr-4 font-normal w-[3%]">#</th>
            <th className="py-4 pr-4 font-normal w-[24%]">Member</th>
            <th className="py-4 pr-4 font-normal w-[22%]">Email</th>
            <th className="py-4 pr-4 font-normal w-[10%]">Plan</th>
            <th className="py-4 pr-4 font-normal w-[10%]">Monthly</th>
            <th className="py-4 pr-4 font-normal w-[19%]">Current period</th>
            <th className="py-4 pr-4 font-normal w-[12%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((m, i) => (
            <tr key={m.customer_id} className="border-b hairline hover:bg-hairline/30 transition-colors">
              <td className="py-6 pr-4 font-mono text-[14px] text-muted tabular align-top">{String(i + 1).padStart(2, "0")}</td>
              <td className="py-6 pr-4 align-top">
                <div className="flex items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-[22px] leading-tight">{m.name ?? "—"}</div>
                    {m.phone && <div className="text-[14px] font-mono text-muted mt-1">{m.phone}</div>}
                  </div>
                  <MemberInfo
                    location={[m.city, m.country].filter(Boolean).join(", ") || null}
                    since={fmtDate(m.start_date)}
                  />
                </div>
              </td>
              <td className="py-6 pr-4 text-[16px] align-top">{m.email ?? "—"}</td>
              <td className="py-6 pr-4 text-[16px] align-top">{m.plan ?? "—"}</td>
              <td className="py-6 pr-4 font-mono text-[16px] tabular align-top">{fmtEur(m.monthly_amount)}</td>
              <td className="py-6 pr-4 font-mono text-[14px] text-muted align-top">{fmtPeriod(m.current_period_start, m.current_period_end)}</td>
              <td className="py-6 pr-4 align-top"><StatusDot status={m.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-[14px] tracking-smallcap uppercase text-muted">
          No members matching these criteria.
        </div>
      )}
    </>
  );
}

function MemberInfo({ location, since }: { location: string | null; since: string }) {
  return (
    <span className="relative inline-flex group mt-1.5 shrink-0">
      <button
        type="button"
        aria-label="Member details"
        className="w-[18px] h-[18px] rounded-full border hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink focus:outline-none focus:text-ink focus:border-ink transition-colors"
      >
        <span className="font-display italic text-[11px] leading-none">i</span>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 z-10 min-w-[200px] bg-paper border hairline shadow-sm px-4 py-3 text-left opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
      >
        <span className="block text-[10px] tracking-smallcap uppercase text-muted">Location</span>
        <span className="block text-[14px] mt-0.5">{location ?? "—"}</span>
        <span className="block text-[10px] tracking-smallcap uppercase text-muted mt-3">Member since</span>
        <span className="block text-[14px] font-mono mt-0.5">{since}</span>
      </span>
    </span>
  );
}
