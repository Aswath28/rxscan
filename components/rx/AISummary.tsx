import { SparkleIcon, ConfidenceBar } from './primitives'

interface AISummaryProps {
  summary: string
  confidence: number
}

export function AISummary({ summary, confidence }: AISummaryProps) {
  const tone = confidence < 50 ? 'clay' : 'dust'

  return (
    <div className="mb-2.5 rounded-2xl border border-rx-hairline bg-rx-card px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-rx-dust-50">
          <SparkleIcon className="h-2.5 w-2.5 text-rx-dust-600" />
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-rx-dust-600">
          AI summary
        </div>
      </div>

      <div className="mb-3 text-[13px] leading-[1.5] text-rx-ink">{summary}</div>

      <ConfidenceBar value={confidence} tone={tone} />
    </div>
  )
}