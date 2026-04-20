import { useId, useState } from 'react'

export function CompareSlider({ beforeUrl, afterUrl }) {
  const id = useId()
  const [value, setValue] = useState(55)

  if (!beforeUrl || !afterUrl) return null

  return (
    <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] overflow-hidden bg-[rgb(var(--surface))] shadow-card">
      <div className="relative aspect-[16/10] w-full">
        <img
          src={beforeUrl}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${value}%)` }}
        >
          <img
            src={afterUrl}
            alt="After"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div
          className="absolute inset-y-0"
          style={{ left: `${value}%` }}
          aria-hidden="true"
        >
          <div className="h-full w-[2px] bg-white/80 shadow" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-black shadow">
            Drag
          </div>
        </div>
      </div>

      <div className="p-4">
        <label htmlFor={id} className="text-xs font-medium text-muted">
          Before / After
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </div>
    </div>
  )
}

