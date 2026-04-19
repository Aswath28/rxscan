import { Confidence } from '@/types/prescription'

export function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" fill="none" className={className}>
      <path d="M5 1l1 2.5 2.5 1-2.5 1L5 8 4 5.5 1.5 4.5 4 3.5 5 1z" fill="currentColor" />
    </svg>
  )
}

export function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function BackIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AlertTriangleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 15 15" fill="none" className={className}>
      <path d="M7.5 2l6 11h-12l6-11z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 6v3M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function CapsuleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 3a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V6a3 3 0 00-3-3H6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function RoundPillIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5l10 10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function TabletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="4" y="6" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function CameraIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="9" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="14" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9V7.5A1.5 1.5 0 0111.5 6h5A1.5 1.5 0 0118 7.5V9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 15 15" fill="none" className={className}>
      <path d="M7.5 4v3.5L10 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function HeartIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 15 15" fill="none" className={className}>
      <path d="M7.5 12s-5-3-5-7a3.3 3.3 0 016.7 0 3.3 3.3 0 016.7 0c0 4-5 7-5 7" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function DocumentIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" className={className}>
      <rect x="4" y="3" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 8h8M7 11h6M7 14h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

interface ConfidencePillProps {
  level: Confidence
}

export function ConfidencePill({ level }: ConfidencePillProps) {
  // High confidence is the expected state — don't add visual noise.
  // Only surface the pill when the user should verify manually.
  if (level === 'high') return null

  const styles = {
    medium: 'bg-rx-sand-50 text-rx-sand-700',
    low: 'bg-rx-clay-50 text-rx-clay-700',
  }
  const labels = {
    medium: 'Tap to verify',
    low: 'Tap to verify',
  }
  return (
    <span
      className={`mt-1 inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] text-[10px] font-medium ${styles[level]}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
      {labels[level]}
    </span>
  )
}

interface ConfidenceBarProps {
  value: number
  tone?: 'dust' | 'clay'
}

export function ConfidenceBar({ value, tone = 'dust' }: ConfidenceBarProps) {
  const fill = tone === 'clay' ? 'bg-rx-clay-600' : 'bg-rx-dust-600'
  const text = tone === 'clay' ? 'text-rx-clay-700' : 'text-rx-dust-600'
  return (
    <div className="flex items-center gap-2">
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-rx-dust-600/15">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${value}%` }} />
      </div>
      <div className={`min-w-[60px] text-right text-[11px] font-medium ${text}`}>
        {value}% confidence
      </div>
    </div>
  )
}

interface SectionHeadProps {
  title: string
  count?: string
}

export function SectionHead({ title, count }: SectionHeadProps) {
  return (
    <div className="flex items-baseline justify-between px-1 pb-2 pt-3.5">
      <div className="text-[15px] font-medium tracking-tight text-rx-ink">{title}</div>
      {count && (
        <div className="text-[11px] font-medium uppercase tracking-wider text-rx-ink-subtle">
          {count}
        </div>
      )}
    </div>
  )
}

interface IconButtonProps {
  onClick?: () => void
  ariaLabel: string
  children: React.ReactNode
}

export function IconButton({ onClick, ariaLabel, children }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-rx-surface text-rx-ink transition-colors active:bg-rx-pine-50"
    >
      {children}
    </button>
  )
}