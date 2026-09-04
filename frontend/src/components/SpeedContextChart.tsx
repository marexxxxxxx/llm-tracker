import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'

interface SpeedContextChartProps {
  title: string
  data: { x: number; y: number }[]
  color?: string
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

export function SpeedContextChart({
  title,
  data,
  color = '#8b5cf6',
}: SpeedContextChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="x"
            name="Context usage"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v: number) => pct(v)}
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis dataKey="y" name="Tokens/s" stroke="#9CA3AF" fontSize={12} width={60} />
          <ZAxis range={[40, 40]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: number, name: string) =>
              name === 'x'
                ? [pct(value), 'Context usage']
                : [value.toFixed(1), 'Tokens/s']
            }
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#F3F4F6' }}
            itemStyle={{ color }}
          />
          <Scatter data={data} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Y: Tokens/s &middot; X: KV-cache usage
      </p>
    </div>
  )
}
