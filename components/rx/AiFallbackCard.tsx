'use client'

import { useEffect, useState } from 'react'
import { Medicine } from '@/types/prescription'

interface AiFallbackCardProps {
  medicine: Medicine
}

interface AiResponse {
  recognized?: boolean
  molecule?: string | null
  drugClass?: string | null
  explanation?: {
    whatItIs?: string | null
    whatItDoes?: string | null
    howToTake?: string | null
    sideEffects?: string[]
    importantWarning?: string | null
  }
  reason?: string
}

export function AiFallbackCard({ medicine }: AiFallbackCardProps) {
  const [aiData, setAiData] = useState<AiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [unrecognized, setUnrecognized] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch('/api/explain-medicine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicineName: medicine.ocrReading,
        dosage: medicine.attributes?.join(' · ') || null,
        unverified: true,
      }),
    })
      .then((r) => r.json())
      .then((data: AiResponse) => {
        if (cancelled) return
        if (data.recognized === false) {
          setUnrecognized(true)
        } else {
          setAiData(data)
        }
      })
      .catch(() => {
        if (!cancelled) setUnrecognized(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [medicine.ocrReading])

  // Haiku didn't recognize it either — render the existing
  // "verify with your pharmacist" treatment.
  if (unrecognized) {
    return (
      <div className="mb-2 rounded-[18px] border border-rx-hairline bg-rx-card px-4 pb-3.5 pt-3.5 shadow-rx-card">
        <div className="mb-2.5 flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-rx-surface">
            <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px] text-rx-ink-subtle">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 pt-[1px]">
            <div className="text-[11px] font-medium text-rx-ink-subtle">Prescription says</div>
            <div className="text-[16px] font-bold leading-tight text-rx-ink">
              {medicine.ocrReading}
            </div>
            <div className="mt-2 rounded-[10px] bg-rx-sand-50 px-2.5 py-1.5 text-[11px] leading-snug text-rx-sand-700">
              We couldn&apos;t confidently match this. Please verify with your pharmacist.
            </div>
          </div>
        </div>
        {medicine.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
      </div>
    )
  }

  const hasRichContent = !!(
    aiData?.explanation?.whatItDoes ||
    aiData?.explanation?.howToTake ||
    (aiData?.explanation?.sideEffects && aiData.explanation.sideEffects.length > 0)
  )

  // Recognized OR loading — render the AI fallback card
  return (
    <div className="mb-2 overflow-hidden rounded-[18px] border border-rx-hairline bg-rx-card shadow-rx-card">
      {/* AI source badge */}
      <div className="flex items-center gap-2 bg-rx-sky-50 px-4 py-2.5">
        <svg
          className="h-3.5 w-3.5 text-rx-sky-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span className="text-[11px] font-semibold text-rx-sky-700">
          AI explanation — not from verified database
        </span>
      </div>

      {/* Header */}
      <div className="px-4 pt-3.5">
        <div className="text-[11px] font-medium text-rx-ink-subtle">Prescription says</div>
        <div className="text-[16px] font-bold leading-tight text-rx-ink">
          {medicine.ocrReading}
        </div>
        {medicine.attributes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
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
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-4 py-5 text-center text-[12px] text-rx-ink-subtle">
          Looking up this medicine…
        </div>
      )}

      {/* Likely block — always visible when we have data */}
      {aiData && !loading && (
        <div className="px-4 pt-3 pb-3.5">
          {aiData.molecule && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                Likely
              </div>
              <div className="mt-1 text-[14px] font-semibold text-rx-ink">{aiData.molecule}</div>
              {aiData.drugClass && (
                <div className="mt-1.5 inline-block rounded-full bg-rx-surface px-2.5 py-1 text-[11px] font-semibold text-rx-ink-muted">
                  {aiData.drugClass}
                </div>
              )}
            </div>
          )}

          {/* See details toggle — same shape as verified card */}
          {hasRichContent && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 rounded-full border border-rx-hairline bg-transparent px-3 py-[7px] text-[12px] font-semibold text-rx-ink transition-colors active:bg-rx-surface"
              >
                {expanded ? 'Hide details' : 'See details'}
                <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 3.5L5 6.5L8 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>
          )}

          {/* Expanded rich content */}
          {expanded && hasRichContent && (
            <div className="mt-3 border-t border-rx-hairline pt-3">
              {aiData.explanation?.whatItDoes && (
                <div className="mb-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                    What this medicine does
                  </div>
                  <div className="text-[13px] leading-[1.5] text-rx-ink">
                    {aiData.explanation.whatItDoes}
                  </div>
                </div>
              )}

              {aiData.explanation?.howToTake && (
                <div className="mb-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                    How to take
                  </div>
                  <div className="text-[13px] leading-[1.5] text-rx-ink">
                    {aiData.explanation.howToTake}
                  </div>
                </div>
              )}

              {aiData.explanation?.sideEffects &&
                aiData.explanation.sideEffects.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rx-ink-subtle">
                      Common side effects
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiData.explanation.sideEffects.map((se: string) => (
                        <span
                          key={se}
                          className="rounded-full bg-rx-surface px-2.5 py-1 text-[11px] font-semibold text-rx-ink-muted"
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
      )}

      {/* No-pricing strip */}
      <div className="border-t border-rx-hairline bg-rx-surface px-4 py-2.5">
        <div className="text-[11px] text-rx-ink-muted">
          Generic alternatives not available for this medicine
        </div>
      </div>

      {/* AI disclaimer */}
      <div className="bg-rx-sky-50 px-4 py-2.5">
        <div className="text-[11px] leading-[1.4] text-rx-sky-700">
          This explanation was generated by AI. Verify with your pharmacist before relying on it.
        </div>
      </div>
    </div>
  )
}
