"use client";
'use client'

import { useState } from 'react'
import { useMemo } from 'react'
import type { RegiaoEntrega } from '@/lib/types'

interface RegionalMapProps {
  data: Array<{ regiao: RegiaoEntrega; count: number }>
  className?: string
}

// Approximate SVG coordinate positions for each region on a simplified RJ map
const REGION_POSITIONS: Record<RegiaoEntrega, { cx: number; cy: number; label: string }> = {
  'Zona Norte': { cx: 62, cy: 28, label: 'Zona Norte' },
  'Zona Sul': { cx: 38, cy: 68, label: 'Zona Sul' },
  'Zona Oeste': { cx: 20, cy: 55, label: 'Zona Oeste' },
  'Centro': { cx: 54, cy: 52, label: 'Centro' },
  'Baixada': { cx: 78, cy: 45, label: 'Baixada' },
  'Grande RJ': { cx: 60, cy: 12, label: 'Grande RJ' },
}

// Color scale based on normalized intensity (0-1)
function getIntensityColor(intensity: number): string {
  if (intensity >= 0.8) return '#22C55E' // green - high
  if (intensity >= 0.6) return '#4ADE80'
  if (intensity >= 0.4) return '#38BDF8' // sky blue - medium
  if (intensity >= 0.2) return '#F59E0B' // amber - low
  return '#6B7280' // gray - very low / zero
}

interface TooltipState {
  regiao: string
  count: number
  x: number
  y: number
  visible: boolean
}

export function RegionalMap({ data, className }: RegionalMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    regiao: '',
    count: 0,
    x: 0,
    y: 0,
    visible: false,
  })

  const { dataMap, max } = useMemo(() => {
    const m = new Map<RegiaoEntrega, number>(
      data.map(d => [d.regiao, d.count])
    )
    const maxVal = Math.max(...data.map(d => d.count), 1)
    return { dataMap: m, max: maxVal }
  }, [data])

  const handleMouseEnter = (
    regiao: string,
    count: number,
    e: React.MouseEvent<SVGGElement>
  ) => {
    const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
    setTooltip({
      regiao,
      count,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
    if (!tooltip.visible) return
    const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
    setTooltip(prev => ({
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }))
  }

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }

  return (
    <div className={`relative select-none ${className ?? ''}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* RJ outline - simplified polygon */}
        <path
          d="M 10,60 C 12,50 15,45 18,42 C 22,38 28,35 32,38
             C 36,42 38,48 40,52 C 42,56 44,62 48,65
             C 52,68 55,66 58,62 C 61,58 63,52 66,48
             C 69,44 72,40 76,38 C 80,36 84,38 86,42
             C 88,46 86,50 82,52 C 78,54 74,56 70,58
             C 66,60 62,64 58,66 C 54,68 50,70 46,68
             C 42,66 38,62 34,60 C 30,58 26,56 22,58
             C 18,60 14,64 10,60 Z"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="0.8"
        />

        {/* Water / Guanabara Bay hint */}
        <ellipse cx="62" cy="38" rx="6" ry="4" fill="#0f172a" stroke="#1e293b" strokeWidth="0.3" />

        {/* Region circles */}
        {(Object.entries(REGION_POSITIONS) as [RegiaoEntrega, { cx: number; cy: number; label: string }][]).map(
          ([regiao, { cx, cy, label }]) => {
            const count = dataMap.get(regiao) ?? 0
            const intensity = max === 0 ? 0 : count / max
            const radius = Math.max(4, Math.min(14, 4 + intensity * 10))
            const color = getIntensityColor(intensity)

            return (
              <g
                key={regiao}
                onMouseEnter={e => handleMouseEnter(label, count, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring for non-zero counts */}
                {count > 0 && (
                  <circle cx={cx} cy={cy} r={radius + 2} fill="none" stroke={color} strokeWidth="0.3" opacity="0.4" />
                )}
                {/* Main circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={color}
                  fillOpacity="0.85"
                  stroke={color}
                  strokeWidth="0.4"
                />
                {/* Count label */}
                {radius >= 8 && (
                  <text
                    x={cx}
                    y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="3"
                    fontWeight="bold"
                    fill="white"
                    fontFamily="inherit"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {count}
                  </text>
                )}
                {/* Region name label */}
                <text
                  x={cx}
                  y={cy - radius - 1.8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2.8"
                  fill="#94a3b8"
                  fontFamily="inherit"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {label}
                </text>
              </g>
            )
          }
        )}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-10 pointer-events-none bg-slate-900 border border-slate-600 rounded px-3 py-1.5 shadow-xl text-xs"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 28,
            minWidth: 120,
          }}
        >
          <div className="font-semibold text-slate-100">{tooltip.regiao}</div>
          <div className="text-slate-400 mt-0.5">
            {tooltip.count} atendimento{tooltip.count !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
        <span className="text-[10px] text-slate-400 mr-1">Intensidade:</span>
        {[
          { color: '#22C55E', label: 'Alta' },
          { color: '#38BDF8', label: 'Média' },
          { color: '#F59E0B', label: 'Baixa' },
          { color: '#6B7280', label: 'Nenhum' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, opacity: 0.85 }} />
            <span className="text-[10px] text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
