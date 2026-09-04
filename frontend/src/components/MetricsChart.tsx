import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricsChartProps {
  title: string
  data: { time: string; value: number }[]
  color?: string
  unit?: string
}

export function MetricsChart({ title, data, color = '#3b82f6', unit = '' }: MetricsChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#F3F4F6' }}
            itemStyle={{ color }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {unit && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unit: {unit}</p>
      )}
    </div>
  )
}
