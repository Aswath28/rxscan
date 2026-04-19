'use client'

interface SavingsHeroProps {
  savings: number
  brandTotal: number
  genericTotal: number
}

export function SavingsHero({ savings, brandTotal, genericTotal }: SavingsHeroProps) {
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`
  const pct = brandTotal > 0 ? Math.round((savings / brandTotal) * 100) : 0

  return (
    <div className="relative mb-5 mt-2 overflow-hidden rounded-[24px] bg-rx-hero-bg px-5 py-5 shadow-rx-hero">
      {/* Decorative glow — subtle depth, no noise */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rx-mint opacity-[0.08] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-rx-mint opacity-[0.05] blur-2xl" />

      {/* Label */}
      <div className="relative flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-rx-mint">
          <path d="M7 1.5l1.5 4L12.5 7l-4 1.5L7 12.5 5.5 8.5 1.5 7l4-1.5L7 1.5z" fill="currentColor" />
        </svg>
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-rx-mint">
          You could save
        </div>
      </div>

      {/* Big savings number — this is the emotional peak */}
      <div className="relative mt-2 flex items-baseline gap-2">
        <span className="text-[44px] font-extrabold leading-none tracking-[-0.02em] text-white">
          {fmt(savings)}
        </span>
        {pct > 0 && (
          <span className="rounded-full bg-rx-mint px-2 py-0.5 text-[11px] font-bold text-rx-hero-bg">
            {pct}% off
          </span>
        )}
      </div>

      {/* Subtitle */}
      <div className="relative mt-1.5 text-[13px] leading-snug text-rx-cream-muted">
        by switching to CDSCO-certified generics
      </div>

      {/* Branded vs Generic comparison pills */}
      <div className="relative mt-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-[11px] text-white/60">Branded</span>
          <span className="text-[13px] font-semibold text-white/90 line-through decoration-white/40">
            {fmt(brandTotal)}
          </span>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-rx-mint">
          <path d="M3 6h6M7 3l2 3-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex items-center gap-1.5 rounded-full bg-rx-mint px-3 py-1.5">
          <span className="text-[11px] font-semibold text-rx-hero-bg/70">Generic</span>
          <span className="text-[13px] font-bold text-rx-hero-bg">
            {fmt(genericTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}