"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface BarBairrosProps {
  data: Array<{ bairro: string; count: number }>
  className?: string
}

const TOP_N = 10

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-md">
        <p className="text-zinc-400">{payload[0].value} atendimentos</p>
      </div>
    )
  }
  return null
}

export function BarBairros({ data, className = "" }: BarBairrosProps) {
  const top10 = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={top10}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="bairro"
            width={120}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar
            dataKey="count"
            fill="#38BDF8"
            radius={[0, 4, 4, 0]}
            background={{ fill: "#27272a", radius: [0, 4, 4, 0] }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BarBairros
