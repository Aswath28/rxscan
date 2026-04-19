import { Interaction, DoctorNote } from '@/types/prescription'
import { AlertTriangleIcon, ClockIcon, HeartIcon, DocumentIcon } from './primitives'

interface InteractionAlertProps {
  interaction: Interaction
}

export function InteractionAlert({ interaction }: InteractionAlertProps) {
  const severityLabel = {
    severe: 'Severe interaction',
    moderate: 'Moderate interaction',
    mild: 'Minor interaction',
  }[interaction.severity]

  return (
    <div className="mb-2 flex items-start gap-3 rounded-[18px] bg-rx-clay-50 px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-rx-clay-600">
        <AlertTriangleIcon className="h-[15px] w-[15px] text-rx-surface" />
      </div>
      <div className="flex-1">
        <div className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-rx-clay-700">
          {severityLabel}
        </div>
        <div className="mb-1 text-[14px] font-medium text-rx-clay-900">
          {interaction.drug1} + {interaction.drug2}
        </div>
        <div className="text-[12px] leading-[1.5] text-rx-clay-700">
          {interaction.effect} {interaction.recommendation}
        </div>
      </div>
    </div>
  )
}

interface DoctorNotesProps {
  notes: DoctorNote[]
}

export function DoctorNotes({ notes }: DoctorNotesProps) {
  if (notes.length === 0) return null

  return (
    <div className="rounded-2xl border border-rx-hairline bg-rx-card p-1">
      {notes.map((note, i) => {
        const isCondition = note.kind === 'condition'
        const iconBg = isCondition ? 'bg-rx-sand-50' : 'bg-rx-clay-50'
        const iconText = isCondition ? 'text-rx-sand-700' : 'text-rx-clay-700'
        const Icon = isCondition ? ClockIcon : HeartIcon

        return (
          <div
            key={i}
            className={`flex items-center gap-3 px-3.5 py-3 ${
              i > 0 ? 'border-t border-rx-hairline' : ''
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${iconBg}`}
            >
              <Icon className={`h-[15px] w-[15px] ${iconText}`} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-rx-ink-subtle">
                {isCondition ? 'Condition noted' : 'Symptom noted'}
              </div>
              <div className="text-[13px] font-medium text-rx-ink">{note.value}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function EmptyMedicinesState() {
  return (
    <div className="rounded-2xl border border-dashed border-rx-hairline bg-rx-card px-4 py-[22px] text-center">
      <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-rx-bg">
        <DocumentIcon className="h-[22px] w-[22px] text-rx-ink-subtle" />
      </div>
      <div className="text-[12px] leading-[1.5] text-rx-ink-muted">
        No medicine names could be
        <br />
        read clearly from this prescription.
      </div>
    </div>
  )
}

interface HelpfulTipProps {
  text: string
}

export function HelpfulTip({ text }: HelpfulTipProps) {
  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-[14px] border border-rx-hairline bg-rx-surface px-3.5 py-3">
      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-rx-dust-600" />
      <div className="text-[12px] leading-snug text-rx-ink-muted">{text}</div>
    </div>
  )
}