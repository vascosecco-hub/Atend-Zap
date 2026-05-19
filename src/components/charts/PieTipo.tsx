"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PieTipoProps {
  data: Array<{ tipo: string; count: number }>
  className?: string
}

const TIPO_COLORS: Record<string, string> = {
  entrega: "#38BDF8",
  consulta: "#22C55E",
  retirada: "#F59E0B",
  presencial: "#8B5CF6",
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-md">
        <p className="text-zinc-200">{payload[0].name}</p>
        <p className="text-zinc-400">{payload[0].value} atendimentos</p>
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
          {entry.value}
        </li>
      ))}
    </ul>
  )
}

export function PieTipo({ data, className = "" }: PieTipoProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="tipo"
            cx="50%"
            cy="50%"
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell
                key={entry.tipo}
                fill={TIPO_COLORS[entry.tipo] ?? "#6B7280"}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PieTipo
