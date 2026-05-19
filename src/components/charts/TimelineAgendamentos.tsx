"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface TimelineAgendamentosProps {
  data: Array<{ data: string; count: number }>
  className?: string
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-md">
        <p className="text-zinc-200">{label}</p>
        <p className="text-zinc-400">{payload[0].value} agendamentos</p>
      </div>
    )
  }
  return null
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

export function TimelineAgendamentos({
  data,
  className = "",
}: TimelineAgendamentosProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 24, bottom: 4, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#3f3f46"
            vertical={false}
          />
          <XAxis
            dataKey="data"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
            tickFormatter={formatDate}
          />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#38BDF8"
            strokeWidth={2}
            dot={{ fill: "#38BDF8", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TimelineAgendamentos
