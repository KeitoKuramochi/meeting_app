'use client'

export type DurationPreset = 30 | 60 | 90 | 120 | 'other'

export const DURATION_PRESETS: { value: DurationPreset; label: string }[] = [
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 90, label: '1時間30分' },
  { value: 120, label: '2時間' },
  { value: 'other', label: 'その他' },
]

export function resolveDurationMinutes(
  preset: DurationPreset | null,
  custom: string
): number | null {
  if (preset === null) return null
  if (preset === 'other') {
    const parsed = parseInt(custom, 10)
    return isNaN(parsed) || parsed <= 0 ? null : parsed
  }
  return preset
}

// 分数から、既存プリセットに一致すればそのプリセットを、しなければ「その他」を返す（フォームの初期値復元用）
export function minutesToPreset(
  minutes: number | null | undefined
): { preset: DurationPreset | null; custom: string } {
  if (minutes == null) return { preset: null, custom: '' }
  const known = DURATION_PRESETS.find((p) => p.value === minutes)
  if (known) return { preset: known.value, custom: '' }
  return { preset: 'other', custom: String(minutes) }
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

// 開始日時 + 所要時間(分) から終了日時を計算する
export function computeEndDateTime(
  date: string,
  time: string,
  durationMinutes: number
): { date: string; time: string } {
  const start = new Date(`${date}T${time}:00`)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  const yyyy = end.getFullYear()
  const mm = String(end.getMonth() + 1).padStart(2, '0')
  const dd = String(end.getDate()).padStart(2, '0')
  const hh = String(end.getHours()).padStart(2, '0')
  const mi = String(end.getMinutes()).padStart(2, '0')
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` }
}

type DurationPickerProps = {
  selectedPreset: DurationPreset | null
  customMinutes: string
  onPresetChange: (preset: DurationPreset) => void
  onCustomChange: (value: string) => void
}

// 所要時間選択UI（種まきフォーム・確定フロー・別日提案フロー・手動確定フローで共通利用）
export function DurationPicker({
  selectedPreset,
  customMinutes,
  onPresetChange,
  onCustomChange,
}: DurationPickerProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onPresetChange(value)}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={
              selectedPreset === value
                ? { border: '2px solid #d4a030', background: '#fef3c7', color: '#92400e' }
                : { border: '1.5px solid #c8953a', background: '#fffdf7', color: '#6b4c0a' }
            }
          >
            {label}
          </button>
        ))}
      </div>
      {selectedPreset === 'other' && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={480}
              value={customMinutes}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="例：45"
              className="w-24 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              style={{ border: '1.5px solid #c8953a', background: '#fffdf7', color: '#2c1a0e' }}
            />
            <span className="text-sm" style={{ color: '#6b4c0a' }}>分</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: '#8b6914' }}>1〜480分（最大8時間）</p>
        </div>
      )}
    </div>
  )
}
