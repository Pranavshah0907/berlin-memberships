"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await getSupabaseBrowser().auth.signInWithPassword({
      email, password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-9 space-y-6">
      <label className="block">
        <span className="text-[12px] tracking-smallcap uppercase text-muted">Email</span>
        <input
          type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full bg-transparent border-b hairline border-b-hairline py-2.5 text-[16px] outline-none focus:border-b-ink transition-colors"
        />
      </label>
      <label className="block">
        <span className="text-[12px] tracking-smallcap uppercase text-muted">Password</span>
        <input
          type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full bg-transparent border-b hairline border-b-hairline py-2.5 text-[16px] outline-none focus:border-b-ink transition-colors"
        />
      </label>

      {error && (
        <div className="text-[13px] text-rust border-l-2 border-rust pl-3 py-1">
          {error}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="group relative mt-2 w-full py-3.5 bg-ink text-paper text-[14px] tracking-smallcap uppercase overflow-hidden disabled:opacity-50"
      >
        <span className="relative z-10">{loading ? "Signing in…" : "Enter"}</span>
        <span className="absolute inset-0 bg-gradient-to-r from-ember to-sunrise opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </form>
  );
}
