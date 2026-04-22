import { createClient } from "@supabase/supabase-js";

// Server-side read client using anon key is fine — we'll rely on RLS eventually.
// For now, tables have no RLS, middleware enforces auth.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export type Member = {
  customer_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  plan: "Premium" | "Plus" | "Basic" | null;
  monthly_amount: number | null;
  currency: string;
  status: "active" | "past_due" | "scheduled_to_cancel" | "canceled";
  start_date: string;
  cancel_at: string | null;
  canceled_at: string | null;
  city: string | null;
  country: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
};

export type Payment = {
  invoice_id: string;
  customer_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  payment_date: string | null;
  period_start: string | null;
  period_end: string | null;
  refunded_amount: number;
  failure_reason: string | null;
};

export async function getOverview() {
  const [{ data: mrr }, { data: planStats }, { data: months }] = await Promise.all([
    supabase.from("v_current_mrr").select("*").single(),
    supabase.from("v_plan_stats").select("*"),
    supabase.from("v_revenue_by_month").select("*").order("month", { ascending: true }),
  ]);
  return { mrr, planStats: planStats ?? [], months: months ?? [] };
}

export async function getMembers(): Promise<Member[]> {
  const { data } = await supabase.from("v_members_with_period").select("*").order("start_date", { ascending: false });
  return (data ?? []) as Member[];
}

export async function getPayments(): Promise<Payment[]> {
  const { data } = await supabase
    .from("payments")
    .select("*")
    .order("payment_date", { ascending: false })
    .limit(1000);
  return (data ?? []) as Payment[];
}

export async function getChurned(): Promise<Member[]> {
  const { data } = await supabase
    .from("v_members_with_period")
    .select("*")
    .in("status", ["canceled", "scheduled_to_cancel"])
    .order("canceled_at", { ascending: false, nullsFirst: false });
  return (data ?? []) as Member[];
}
