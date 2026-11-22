import React, { useMemo } from 'react'

const CONFETTI_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#3b82f6',
  '#ef4444',
]

export const ConfettiEffect: React.FC = () => {
  const pieces = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.8 + (i % 5) * 1.5) % 96}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${(i % 6) * 0.15}s`,
      size:
        i % 3 === 0
          ? 'w-2 h-4 rounded-xs'
          : i % 3 === 1
            ? 'w-2.5 h-2.5 rounded-full'
            : 'w-3 h-2 rounded-xs',
      duration: `${1.8 + (i % 4) * 0.25}s`,
    }))
  }, [])

  return (
    <div
      data-testid="confetti-effect"
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-20"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute top-0 opacity-0 animate-[confettiDrop_2.5s_ease-out_forwards] ${p.size}`}
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}
