'use client'

import { useState } from 'react'
import { Medicine } from '@/types/prescription'
import { ConfidencePill } from './primitives'

interface MedicineCardProps {
  medicine: Medicine
  onFindNearby?: () => void
}

// ──────────────────────────────────────────────────
// Category → color mapping
// Each medicine type gets its own pastel avatar
// ──────────────────────────────────────────────────
type CategoryStyle = {
  bg: string
  text: string
  IconComponent: React.ComponentType<{ className?: string }>
}

function PillCapsuleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 14.5L14.5 4a4.95 4.95 0 017 7L11 21.5a4.95 4.95 0 01-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 9.5l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function HeartPulseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 20.5s-8-5-8-11.5a4.5 4.5 0 018-2.83A4.5 4.5 0 0120 9c0 6.5-8 11.5-8 11.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function DropletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3s-6 7-6 11a6 6 0 0012 0c0-4-6-11-6-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function LungIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v10M7 13v5a2 2 0 104 0v-5M17 13v5a2 2 0 11-4 0v-5M7 13c-2 0-3 2-3 5a2 2 0 004 0M17 13c2 0 3 2 3 5a2 2 0 01-4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ThermometerIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3a2 2 0 00-2 2v9.5a4 4 0 104 0V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="2" fill="currentColor" />
    </svg>
  )
}

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function TabletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function categoryToStyle(category?: string | null, formulation?: string | null): CategoryStyle {
  const c = (category || '').toLowerCase()
  const f = (formulation || '').toLowerCase()

  // Syrup / drops / cough
  if (f.includes('syrup') || f.includes('syp') || f.includes('drop') || c.includes('cough') || c.includes('mucolytic') || c.includes('respiratory') || c.includes('expectorant')) {
    return { bg: 'bg-rx-sky-50', text: 'text-rx-sky-700', IconComponent: LungIcon }
  }

  // Antibiotic
  if (c.includes('antibiotic') || c.includes('antimicrobial') || c.includes('antifungal')) {
    return { bg: 'bg-rx-coral-50', text: 'text-rx-coral-700', IconComponent: PillCapsuleIcon }
  }

  // Gastric / PPI / anti-emetic
  if (c.includes('gastric') || c.includes('anti-emetic') || c.includes('antiemetic') || c.includes('ppi') || c.includes('proton pump') || c.includes('antacid')) {
    return { bg: 'bg-rx-amber-50', text: 'text-rx-amber-700', IconComponent: DropletIcon }
  }

  // Antihistamine / allergy
  if (c.includes('antihistamine') || c.includes('allergy') || c.includes('allergic')) {
    return { bg: 'bg-rx-lavender-50', text: 'text-rx-lavender-700', IconComponent: SparkleIcon }
  }

  // Cardiac / BP / hypertension / statin
  if (c.includes('cardiac') || c.includes('cardiovascular') || c.includes('heart') || c.includes('blood pressure') || c.includes('hypertension') || c.includes('statin') || c.includes('cholesterol') || c.includes('antiplatelet') || c.includes('anticoagulant') || c.includes('beta blocker')) {
    return { bg: 'bg-rx-rose-50', text: 'text-rx-rose-700', IconComponent: HeartPulseIcon }
  }

  // Pain / fever / NSAID / analgesic
  if (c.includes('pain') || c.includes('fever') || c.includes('analgesic') || c.includes('nsaid') || c.includes('antipyretic') || c.includes('anti-inflammatory')) {
    return { bg: 'bg-rx-peach-50', text: 'text-rx-peach-700', IconComponent: ThermometerIcon }
  }

  // Diabetes / metabolic
  if (c.includes('diabetes') || c.includes('diabetic') || c.includes('sglt') || c.includes('dpp') || c.includes('insulin') || c.includes('metabolic') || c.includes('biguanide')) {
    return { bg: 'bg-rx-diabetes-50', text: 'text-rx-diabetes-700', IconComponent: TabletIcon }
  }

  // Vitamin / supplement
  if (c.includes('vitamin') || c.includes('supplement') || c.includes('mineral') || c.includes('calcium') || c.includes('iron')) {
    return { bg: 'bg-rx-diabetes-50', text: 'text-rx-diabetes-700', IconComponent: SparkleIcon }
  }

  // Fallback — neutral
  return { bg: 'bg-rx-surface', text: 'text-rx-ink-muted', IconComponent: TabletIcon }
}

export function MedicineCard({ medicine, onFindNearby }: MedicineCardProps) {
  const [expanded, setExpanded] = useState(false)
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

  // Trust flags — default true for demo mode
  const showMatchedName = medicine.showMatchedName ?? true
  const showPricing = medicine.showPricing ?? true
  const isUntrusted = !showMatchedName

  const style = categoryToStyle(medicine.category, medicine.iconKind)
  const { IconComponent } = style

  const hasRichContent = !!(
    medicine.whatItIs ||
    medicine.whatItDoes ||
    medicine.howToTake ||
    (medicine.sideEffects && medicine.sideEffects.length > 0)
  )

  return (
    <div className="mb-2 rounded-[18px] border border-rx-hairline bg-rx-card px-4 pb-3.5 pt-3.5 shadow-rx-card">
      {/* Header row — avatar + name */}
      <div className="mb-2.5 flex gap-3">
        {/* Colored category avatar */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
            isUntrusted ? 'bg-rx-surface' : style.bg
          }`}
        >
          <IconComponent
            className={`h-[22px] w-[22px] ${
              isUntrusted ? 'text-rx-ink-subtle' : style.text
            }`}
          />
        </div>

        <div className="min-w-0 flex-1 pt-[1px]">
          {isUntrusted ? (
            // Untrusted — show OCR only, no fake match
            <>
              <div className="text-[11px] font-medium text-rx-ink-subtle">
                Prescription says
              </div>
              <div className="text-[16px] font-bold leading-tight text-rx-ink">
                {medicine.ocrReading}
              </div>
              <div className="mt-2 rounded-[10px] bg-rx-sand-50 px-2.5 py-1.5 text-[11px] leading-snug text-rx-sand-700">
                We couldn't confidently match this. Please verify with your pharmacist.
              </div>
            </>
          ) : (
            // Trusted — full match display
            <>
              <div className="text-[11px] font-medium text-rx-ink-subtle">
                Prescription says{' '}
                <span className="text-rx-ink-muted">"{medicine.ocrReading}"</span>
              </div>
              <div className="text-[16px] font-bold leading-[1.2] tracking-[-0.01em] text-rx-ink">
                {medicine.matchedName}
              </div>
              {medicine.category && (
                <div className={`text-[12px] font-medium ${style.text}`}>
                  {medicine.category}
                </div>
              )}
              <ConfidencePill level={medicine.confidence} />
            </>
          )}
        </div>
      </div>

      {/* Attribute chips */}
      {medicine.attributes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {medicine.attributes.map((attr) => (
            <div
              key={attr}
              className="rounded-[8px] bg-rx-surface px-2.5 py-[5px] text-[11px] font-semibold text-rx-ink"
            >
              {attr}
            </div>
          ))}
        </div>
      )}

      {/* Pricing block */}
      {showPricing && medicine.pricing && (
        <div className="mb-2.5 rounded-[14px] bg-rx-surface px-3.5 py-3">
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-muted">
            Generic price
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-extrabold tracking-[-0.02em] text-rx-ink">
              {fmt(medicine.pricing.genericPrice)}
            </span>
            <span className="text-[13px] text-rx-ink-subtle line-through">
              {fmt(medicine.pricing.brandPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Action chips */}
      {!isUntrusted && (
        <div className="flex flex-wrap gap-1.5">
          {hasRichContent && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 rounded-full border border-rx-hairline bg-transparent px-3 py-[7px] text-[12px] font-semibold text-rx-ink transition-colors active:bg-rx-surface"
            >
              {expanded ? 'Hide details' : 'See details'}
              <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          )}
          {medicine.availableAtJanAushadhi && onFindNearby && (
            <button
              onClick={onFindNearby}
              className="inline-flex items-center gap-1 rounded-full border border-rx-hairline bg-transparent px-3 py-[7px] text-[12px] font-semibold text-rx-ink transition-colors active:bg-rx-surface"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1a3 3 0 00-3 3c0 2.5 3 5 3 5s3-2.5 3-5a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="5" cy="4" r="1" fill="currentColor" />
              </svg>
              At Jan Aushadhi
            </button>
          )}
        </div>
      )}

      {/* Expanded rich content */}
      {expanded && hasRichContent && !isUntrusted && (
        <div className="mt-3 border-t border-rx-hairline pt-3">
          {medicine.whatItIs && (
            <div className="mb-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                What it is
              </div>
              <div className="text-[13px] leading-[1.5] text-rx-ink">{medicine.whatItIs}</div>
            </div>
          )}
          {medicine.whatItDoes && (
            <div className="mb-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                What it does for you
              </div>
              <div className="text-[13px] leading-[1.5] text-rx-ink">{medicine.whatItDoes}</div>
            </div>
          )}
          {medicine.howToTake && (
            <div className="mb-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                How to take
              </div>
              <div className="text-[13px] leading-[1.5] text-rx-ink">{medicine.howToTake}</div>
            </div>
          )}
          {medicine.sideEffects && medicine.sideEffects.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                Common side effects
              </div>
              <div className="flex flex-wrap gap-1.5">
                {medicine.sideEffects.map((se) => (
                  <span
                    key={se}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.bg} ${style.text}`}
                  >
                    {se}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}