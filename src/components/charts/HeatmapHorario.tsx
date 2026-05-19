"use client";
import { cn } from "@/lib/utils"

interface HeatmapHorarioProps {
  data: Array<{ day: string; hour: number; count: number }>
  className?: string
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

function getColor(count: number, maxCount: number): string {
  if (maxCount === 0) return "rgba(38, 189, 248, 0.05)"
  const intensity = count / maxCount
  // Map 0->0.05, 1->1 opacity on primary color #26BDF8
  const alpha = 0.05 + intensity * 0.7
  return `rgba(38, 189, 248, ${alpha.toFixed(3)})`
}

export function HeatmapHorario({ data, className = "" }: HeatmapHorarioProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  // Build lookup map: "day-hour" -> count
  const countMap = new Map<string, number>()
  for (const d of data) {
    countMap.set(`${d.day}-${d.hour}`, d.count)
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      {/* Hour labels across the top */}
      <div className="mb-1 flex">
        <div className="w-10 flex-shrink-0" />
        <div className="flex flex-1 gap-0.5">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex-1 text-center text-xs text-zinc-500"
            >
              {hour}h
            </div>
          ))}
        </div>
      </div>

      {/* Rows: one per day */}
      <div className="flex flex-col gap-1">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-1">
            {/* Day label */}
            <div className="w-10 flex-shrink-0 text-xs text-zinc-400">{day}</div>

            {/* Cells */}
            <div className="flex flex-1 gap-0.5">
              {HOURS.map((hour) => {
                const count = countMap.get(`${day}-${hour}`) ?? 0
                const bg = getColor(count, maxCount)
                return (
                  <div
                    key={hour}
                    className="flex-1 rounded-sm transition-colors hover:ring-1 hover:ring-zinc-600"
                    style={{ backgroundColor: bg }}
                    title={`${day} ${hour}h: ${count} atendimentos`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Color scale legend */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-zinc-500">Menos</span>
        <div className="flex gap-0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((intensity) => {
            const alpha = 0.05 + intensity * 0.7
            return (
              <div
                key={intensity}
                className="h-3 w-6 rounded-sm"
                style={{
                  backgroundColor: `rgba(38, 189, 248, ${alpha.toFixed(3)})`,
                }}
              />
            )
          })}
        </div>
        <span className="text-xs text-zinc-500">Mais</span>
      </div>
    </div>
  )
}

export default HeatmapHorario
