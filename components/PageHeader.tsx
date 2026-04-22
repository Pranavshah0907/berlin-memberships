export default function PageHeader({
  eyebrow, title, subtitle,
}: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="px-6 md:px-10 lg:px-12 pt-10 md:pt-14 pb-8 border-b hairline">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-8">
        <div className="min-w-0 flex-1 order-2 md:order-1">
          <div className="text-[13px] tracking-smallcap uppercase text-muted">{eyebrow}</div>
          <h1 className="mt-3 font-display leading-[0.92] tracking-tight text-[clamp(40px,5.5vw,68px)]">{title}</h1>
          {subtitle && <p className="mt-5 max-w-3xl text-[15px] md:text-[16px] text-muted leading-relaxed">{subtitle}</p>}
        </div>
        <div className="shrink-0 md:text-right text-[13px] tracking-smallcap uppercase text-muted order-1 md:order-2">
          {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>
    </header>
  );
}
