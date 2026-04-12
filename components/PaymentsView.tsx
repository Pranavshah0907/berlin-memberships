"use client";
import { useMemo, useState } from "react";
import type { Payment } from "@/lib/data";
import StatusDot from "./StatusDot";

const STATUSES = ["all", "succeeded", "failed", "refunded"] as const;

function fmtEur(n: number) {
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PaymentsView({
  payments, nameByCustomer,
}: { payments: Payment[]; nameByCustomer: Record<string, string> }) {
  const today = new Date();
  const yearAgo = new Date(today); yearAgo.setFullYear(today.getFullYear() - 1);

  const [from, setFrom] = useState(toInputDate(yearAgo));
  const [to, setTo] = useState(toInputDate(today));
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  function setRange(days: number | "ytd" | "all") {
    const now = new Date();
    const t = toInputDate(now);
    if (days === "all") {
      setFrom("2020-01-01");
      setTo(t);
      return;
    }
    if (days === "ytd") {
      setFrom(toInputDate(new Date(now.getFullYear(), 0, 1)));
      setTo(t);
      return;
    }
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    setFrom(toInputDate(d));
    setTo(t);
  }

  const filtered = useMemo(() => {
    const fromT = new Date(from).getTime();
    const toT = new Date(to).getTime() + 24 * 3600 * 1000; // inclusive
    return payments
      .filter((p) => {
        const invoiceDate = p.period_start ?? p.payment_date;
        const t = new Date(invoiceDate).getTime();
        if (t < fromT || t > toT) return false;
        if (status !== "all" && p.status !== status) return false;
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.period_start ?? a.payment_date).getTime();
        const db = new Date(b.period_start ?? b.payment_date).getTime();
        return db - da; // newest first
      });
  }, [payments, from, to, status]);

  const net = filtered.reduce((s, p) => s + (p.status === "succeeded" ? Number(p.amount) : 0) - Number(p.refunded_amount), 0);
  const failed = filtered.filter(p => p.status === "failed").length;

  function downloadCsv() {
    const rows = [
      ["Invoice", "Date", "Customer", "Amount", "Status", "Refunded", "Period start", "Period end"],
      ...filtered.map((p) => [
        p.invoice_id,
        fmtDate(p.payment_date),
        p.customer_id ? (nameByCustomer[p.customer_id] ?? p.customer_id) : "",
        p.amount.toString(),
        p.status,
        p.refunded_amount.toString(),
        fmtDate(p.period_start),
        fmtDate(p.period_end),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${from}_${to}.csv`;
    a.click();
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-8 mb-10">
        <div>
          <div className="text-[12px] tracking-smallcap uppercase text-muted">From</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="mt-1.5 bg-transparent border-b hairline border-b-hairline py-2 text-[15px] font-mono outline-none focus:border-b-ink" />
        </div>
        <div>
          <div className="text-[12px] tracking-smallcap uppercase text-muted">To</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="mt-1.5 bg-transparent border-b hairline border-b-hairline py-2 text-[15px] font-mono outline-none focus:border-b-ink" />
        </div>
        <div>
          <div className="text-[12px] tracking-smallcap uppercase text-muted">Quick range</div>
          <div className="mt-1.5 flex gap-0 border hairline">
            {[
              { label: "30 d", v: 30 as const },
              { label: "90 d", v: 90 as const },
              { label: "YTD", v: "ytd" as const },
              { label: "1 yr", v: 365 as const },
              { label: "All", v: "all" as const },
            ].map((r) => (
              <button key={r.label} onClick={() => setRange(r.v)}
                className="px-3.5 py-2 text-[12px] tracking-smallcap uppercase border-r last:border-r-0 hairline text-muted hover:bg-ink hover:text-paper transition-colors">
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[12px] tracking-smallcap uppercase text-muted">Status</div>
          <div className="mt-1.5 flex gap-0 border hairline">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3.5 py-2 text-[12px] tracking-smallcap uppercase border-r last:border-r-0 hairline ${status === s ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-end gap-8">
          <div className="text-right">
            <div className="text-[12px] tracking-smallcap uppercase text-muted">Net in range</div>
            <div className="number-display text-[38px] leading-none mt-1.5">{fmtEur(net)}</div>
            <div className="text-[13px] font-mono text-muted mt-1.5">
              {filtered.length} records · {failed} failed
            </div>
          </div>
          <button onClick={downloadCsv}
            className="px-5 py-3 border hairline text-[12px] tracking-smallcap uppercase hover:bg-ink hover:text-paper transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[12px] tracking-smallcap uppercase text-muted border-b hairline">
            <th className="py-4 pr-4 font-normal w-[14%]">Invoice date</th>
            <th className="py-4 pr-4 font-normal w-[22%]">Customer</th>
            <th className="py-4 pr-4 font-normal w-[22%]">Invoice</th>
            <th className="py-4 pr-4 font-normal w-[16%]">Billing period</th>
            <th className="py-4 pr-4 font-normal w-[12%]">Status</th>
            <th className="py-4 pr-4 font-normal w-[14%] text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const invoiceDate = p.period_start ?? p.payment_date;
            const settledLater =
              p.period_start &&
              p.payment_date &&
              Math.abs(new Date(p.payment_date).getTime() - new Date(p.period_start).getTime()) > 2 * 86400 * 1000;
            return (
              <tr key={p.invoice_id} className="border-b hairline hover:bg-hairline/30 transition-colors">
                <td className="py-5 pr-4 font-mono text-[14px]">
                  {fmtDate(invoiceDate)}
                  {settledLater && (
                    <div className="text-[11px] text-muted mt-0.5">settled {fmtDate(p.payment_date)}</div>
                  )}
                </td>
                <td className="py-5 pr-4 text-[16px]">{p.customer_id ? (nameByCustomer[p.customer_id] ?? "—") : "—"}</td>
                <td className="py-5 pr-4 font-mono text-[12px] text-muted truncate">{p.invoice_id}</td>
                <td className="py-5 pr-4 font-mono text-[13px] text-muted">
                  {p.period_start ? fmtDate(p.period_start) : "—"} → {p.period_end ? fmtDate(p.period_end) : "—"}
                </td>
                <td className="py-5 pr-4"><StatusDot status={p.status} /></td>
                <td className="py-5 pr-4 font-mono text-[15px] tabular text-right">
                  {fmtEur(Number(p.amount))}
                  {Number(p.refunded_amount) > 0 && (
                    <div className="text-[12px] text-rust">−{fmtEur(Number(p.refunded_amount))}</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-[14px] tracking-smallcap uppercase text-muted">
          No payments in this range.
        </div>
      )}
    </>
  );
}
