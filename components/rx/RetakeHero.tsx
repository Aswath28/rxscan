import { CameraIcon } from './primitives'

interface RetakeHeroProps {
  title?: string
  message?: string
  onRetake: () => void
  onManualEntry: () => void
}

export function RetakeHero({
  title = "This one's tricky",
  message = "The handwriting was too blurry to confidently read medicine names. Let's try again.",
  onRetake,
  onManualEntry,
}: RetakeHeroProps) {
  return (
    <div className="mb-2.5 rounded-[20px] bg-rx-clay-50 px-5 py-[22px] text-center">
      <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-rx-clay-600">
        <CameraIcon className="h-7 w-7 text-rx-surface" />
      </div>

      <div className="mb-1.5 text-[20px] font-medium -tracking-[0.01em] text-rx-clay-900">
        {title}
      </div>

      <div className="mb-4 px-2 text-[13px] leading-snug text-rx-clay-700">{message}</div>

      <div className="flex justify-center gap-2">
        <button
          onClick={onRetake}
          className="rounded-full bg-rx-clay-900 px-[18px] py-2.5 text-[13px] font-medium text-rx-surface transition-opacity active:opacity-90"
        >
          Retake photo
        </button>
        <button
          onClick={onManualEntry}
          className="rounded-full border border-rx-clay-900 bg-transparent px-[18px] py-[9px] text-[13px] font-medium text-rx-clay-900 transition-colors active:bg-rx-clay-900/5"
        >
          Enter manually
        </button>
      </div>
    </div>
  )
}