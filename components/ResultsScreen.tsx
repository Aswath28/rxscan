'use client'

import { PrescriptionAnalysis } from '@/types/prescription'
import { BackIcon, PlusIcon, IconButton, SectionHead } from './rx/primitives'
import { SavingsHero } from './rx/SavingsHero'
import { RetakeHero } from './rx/RetakeHero'
import { AISummary } from './rx/AISummary'
import { MedicineCard } from './rx/MedicineCard'
import {
  InteractionAlert,
  DoctorNotes,
  EmptyMedicinesState,
  HelpfulTip,
} from './rx/Callouts'

interface ResultsScreenProps {
  analysis: PrescriptionAnalysis
  isDemo?: boolean
  onBack: () => void
  onScanAnother: () => void
  onRetake: () => void
  onManualEntry: () => void
  onShareWhatsApp?: () => void
  onSaveToMyMedicines?: () => void
  onFindNearby?: (medicineId: string) => void
}

export default function ResultsScreen({
  analysis,
  isDemo = false,
  onBack,
  onScanAnother,
  onRetake,
  onManualEntry,
  onShareWhatsApp,
  onSaveToMyMedicines,
  onFindNearby,
}: ResultsScreenProps) {
  // Low-confidence = no USABLE results. A scan with some untrusted matches
  // still counts as low-confidence; one trusted match means we have something.
  const trustedMatches = analysis.medicines.filter(
    (m) => m.showMatchedName !== false
  )
  const isLowConfidence =
    trustedMatches.length === 0 &&
    (analysis.quality === 'poor' || analysis.aiConfidence < 50)

  const hasSavings = analysis.totalSavings > 0

  const dateLabel = new Date(analysis.prescriptionDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const titleLine = analysis.doctorName
    ? `${analysis.doctorName} • ${dateLabel}`
    : dateLabel

  return (
    <div className="min-h-screen bg-rx-bg text-rx-ink mx-auto max-w-[420px] md:border md:border-rx-hairline">
      {/* ─── Top nav ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3.5 pb-3 pt-2">
        <IconButton ariaLabel="Back" onClick={onBack}>
          <BackIcon className="h-4 w-4" />
        </IconButton>
        <div className="text-center">
          <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-rx-ink-subtle">
            Prescription
          </div>
          <div className="text-[13px] font-medium text-rx-ink">{titleLine}</div>
        </div>
        <IconButton ariaLabel="More options">
          <PlusIcon className="h-4 w-4" />
        </IconButton>
      </header>

      {/* ─── Body ────────────────────────────────────────────── */}
      <main className="px-3.5 pb-32">
        {/* Adaptive hero: savings vs. retake */}
        {isLowConfidence ? (
          <RetakeHero onRetake={onRetake} onManualEntry={onManualEntry} />
        ) : hasSavings ? (
          <SavingsHero
            savings={analysis.totalSavings}
            brandTotal={analysis.totalBrandPrice}
            genericTotal={analysis.totalGenericPrice}
          />
        ) : null}

        {/* AI summary — always shown, tone adapts to confidence */}
        <AISummary summary={analysis.aiSummary} confidence={analysis.aiConfidence} />

        {/* Low-confidence branch */}
        {isLowConfidence && analysis.doctorNotes.length > 0 && (
          <>
            <SectionHead
              title="Doctor's notes"
              count={`${analysis.doctorNotes.length} item${
                analysis.doctorNotes.length === 1 ? '' : 's'
              }`}
            />
            <DoctorNotes notes={analysis.doctorNotes} />
            <HelpfulTip text="Ask your pharmacist to write the medicine names on a fresh sheet — cleaner handwriting scans more reliably." />
          </>
        )}

        {/* Medicines section */}
        <SectionHead
          title="Medicines"
          count={
            analysis.medicines.length > 0
              ? `${analysis.medicines.length} found`
              : '0 identified'
          }
        />

        {analysis.medicines.length > 0 ? (
          analysis.medicines.map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              onFindNearby={onFindNearby ? () => onFindNearby(med.id) : undefined}
            />
          ))
        ) : (
          <EmptyMedicinesState />
        )}

        {/* Safety check */}
        {analysis.interactions.length > 0 && (
          <>
            <SectionHead
              title="Safety check"
              count={`${analysis.interactions.length} alert${
                analysis.interactions.length === 1 ? '' : 's'
              }`}
            />
            {analysis.interactions.map((interaction, i) => (
              <InteractionAlert key={i} interaction={interaction} />
            ))}
          </>
        )}

        {/* Scan new — out of the sticky footer, sits as a subtle text action here */}
        {!isLowConfidence && (
          <div className="mt-4 text-center">
            <button
              onClick={onScanAnother}
              className="inline-flex items-center gap-1.5 rounded-full border border-rx-hairline bg-transparent px-4 py-2 text-[12px] font-medium text-rx-ink-muted transition-colors active:bg-rx-surface"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="3.5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="6" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Scan another prescription
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-5 pb-1 pt-4 text-center text-[11px] leading-[1.5] text-rx-ink-subtle">
          RxScan helps you understand your prescription. It is not medical advice.
        </div>
      </main>

      {/* ─── Sticky footer — two-tier hierarchy ─────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 mx-auto max-w-[420px] border-t border-rx-hairline bg-rx-card px-3.5 pb-3.5 pt-3">
        {isLowConfidence ? (
          <div className="flex gap-2">
            <button
              onClick={onRetake}
              className="flex-1 rounded-full bg-rx-pine-700 px-4 py-3 text-center text-[13px] font-medium text-rx-surface active:opacity-90"
            >
              Retake photo
            </button>
            <button
              onClick={onManualEntry}
              className="flex-1 rounded-full border border-rx-hairline bg-transparent px-4 py-[11px] text-center text-[13px] font-medium text-rx-ink active:bg-rx-surface"
            >
              Enter manually
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {!isDemo && onShareWhatsApp && (
              <button
                onClick={onShareWhatsApp}
                className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-rx-pine-700 px-4 py-3 text-center text-[13px] font-medium text-rx-surface active:opacity-90"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1a6 6 0 00-5.3 8.8L1 13l3.3-.7A6 6 0 107 1zm0 11a5 5 0 01-2.5-.7l-.2-.1-2 .4.4-1.9-.1-.2A5 5 0 117 12z" fill="currentColor"/>
                  <path d="M5.3 4c-.1-.3-.3-.3-.4-.3h-.3a.7.7 0 00-.5.3c-.2.2-.7.7-.7 1.6 0 1 .7 1.9.8 2 .1.2 1.4 2.1 3.4 2.9 1.6.6 2 .5 2.3.5.3 0 1.1-.5 1.3-.9.2-.5.2-.9.1-1 0-.1-.1-.1-.3-.2-.2-.1-1.1-.6-1.3-.7-.2 0-.3 0-.4.1l-.6.7c-.1.1-.2.2-.4 0-.2 0-.7-.2-1.4-.8-.5-.5-.9-1-1-1.2-.1-.2 0-.3.1-.4l.3-.3.1-.3v-.3c-.1 0-.4-1-.6-1.4z" fill="currentColor"/>
                </svg>
                Share on WhatsApp
              </button>
            )}
            {!isDemo && onSaveToMyMedicines && (
              <button
                onClick={onSaveToMyMedicines}
                className="flex-1 rounded-full border border-rx-hairline bg-transparent px-4 py-[11px] text-center text-[13px] font-medium text-rx-ink active:bg-rx-surface"
              >
                Save
              </button>
            )}
            {isDemo && (
              <button
                onClick={onScanAnother}
                className="flex-1 rounded-full bg-rx-pine-700 px-4 py-3 text-center text-[13px] font-medium text-rx-surface active:opacity-90"
              >
                Scan your prescription
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}