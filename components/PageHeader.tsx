export default function PageHeader({
  eyebrow, title, subtitle,
}: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="px-12 pt-14 pb-8 border-b hairline">
      <div className="flex items-end justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] tracking-smallcap uppercase text-muted">{eyebrow}</div>
          <h1 className="mt-3 font-display text-[68px] leading-[0.92] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-5 max-w-3xl text-[16px] text-muted leading-relaxed">{subtitle}</p>}
        </div>
        <div className="shrink-0 text-right text-[13px] tracking-smallcap uppercase text-muted">
          {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>
    </header>
  );
}
