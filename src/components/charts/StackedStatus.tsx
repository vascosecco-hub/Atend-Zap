"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface StackedStatusProps {
  data: Array<{
    mes: string
    agendado: number
    confirmado: number
    em_rota: number
    entregue: number
  }>
  className?: string
}

const STATUS_COLORS: Record<string, string> = {
  agendado: "#FBBF24",
  confirmado: "#38BDF8",
  em_rota: "#8B5CF6",
  entregue: "#22C55E",
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-md">
        <p className="mb-2 font-medium text-zinc-200">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex justify-between gap-6 text-zinc-400">
            <span className="capitalize">{entry.name.replace("_", " ")}</span>
            <span className="text-zinc-200">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const CustomLegend = ({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>
}) => {
  if (!payload) return null
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-4">
      {payload.map((entry, index) => (
        <li
          key={index}
          className="flex items-center gap-1.5 text-sm text-zinc-400"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.value.replace("_", " ")}</span>
        </li>
      ))}
    </ul>
  )
}

export function StackedStatus({ data, className = "" }: StackedStatusProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
        >
          <XAxis
            dataKey="mes"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="agendado" stackId="a" fill={STATUS_COLORS.agendado} radius={[0, 0, 0, 0]} />
          <Bar dataKey="confirmado" stackId="a" fill={STATUS_COLORS.confirmado} radius={[0, 0, 0, 0]} />
          <Bar dataKey="em_rota" stackId="a" fill={STATUS_COLORS.em_rota} radius={[0, 0, 0, 0]} />
          <Bar
            dataKey="entregue"
            stackId="a"
            fill={STATUS_COLORS.entregue}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StackedStatus
