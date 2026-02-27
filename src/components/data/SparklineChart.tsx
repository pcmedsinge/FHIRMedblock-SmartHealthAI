// -----------------------------------------------------------
// SparklineChart — Small inline trend chart for labs
// -----------------------------------------------------------
// Uses Recharts to render a tiny, glanceable line chart.
// Shows 2+ data points as a smooth trend line with area fill.
// No axes, no labels — just the visual trend shape.
// -----------------------------------------------------------

import {
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Area,
  AreaChart,
  Tooltip,
} from "recharts";
import { TRANSITIONS } from "../../config/designSystem";

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface SparklineChartProps {
  /** Array of data points (must have at least 2) */
  data: DataPoint[];
  /** Reference range for normal values */
  referenceRange?: { low?: number; high?: number };
  /** Height of the sparkline in pixels */
  height?: number;
  /** Color theme */
  color?: "emerald" | "red" | "amber" | "blue";
  /** Whether the trend is rising (affects color) */
  trendDirection?: "rising" | "falling" | "stable";
}

const COLOR_MAP = {
  emerald: { stroke: "#059669", fill: "#d1fae5", tip: "#065f46" },
  red: { stroke: "#dc2626", fill: "#fee2e2", tip: "#991b1b" },
  amber: { stroke: "#d97706", fill: "#fef3c7", tip: "#92400e" },
  blue: { stroke: "#2563eb", fill: "#dbeafe", tip: "#1e40af" },
};

const CustomTooltip = ({
  active,
  payload,
  color,
}: {
  active?: boolean;
  payload?: { payload: DataPoint }[];
  color: string;
}) => {
  if (!active || !payload?.[0]) return null;
  const pt = payload[0].payload;
  return (
    <div className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
      <div className="font-bold" style={{ color }}>
        {pt.value} {pt.label ?? ""}
      </div>
      <div className="text-slate-300">{pt.date}</div>
    </div>
  );
};

const SparklineChart = ({
  data,
  referenceRange,
  height = 48,
  color = "emerald",
  trendDirection,
}: SparklineChartProps) => {
  if (data.length < 2) return null;

  // Auto-select color based on trend if not explicitly set
  const effectiveColor =
    trendDirection === "rising"
      ? "red"
      : trendDirection === "falling"
        ? "amber"
        : color;

  const { stroke, fill, tip } = COLOR_MAP[effectiveColor];

  // Calculate Y domain with padding
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.2 || 1;
  const yMin = min - padding;
  const yMax = max + padding;

  return (
    <div className={`w-full ${TRANSITIONS.fast}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
          {/* Normal range band */}
          {referenceRange?.low != null && (
            <ReferenceLine
              y={referenceRange.low}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth={0.5}
            />
          )}
          {referenceRange?.high != null && (
            <ReferenceLine
              y={referenceRange.high}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth={0.5}
            />
          )}

          <defs>
            <linearGradient id={`spark-${effectiveColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fill} stopOpacity={0.8} />
              <stop offset="95%" stopColor={fill} stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <Tooltip
            content={<CustomTooltip color={tip} />}
            cursor={false}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#spark-${effectiveColor})`}
            dot={{ r: 2.5, fill: stroke, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: stroke, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;
