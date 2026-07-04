import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getRandomEmptyQuote } from "../utils/quotes";

/**
 * Weekly progress bar chart.
 * Shows hours studied for the last 7 calendar days.
 *
 * If no data, renders a huge faded background empty-state quote.
 *
 * @param {{ reports: Array<{ date: string, hours: number }> }} props
 */
export default function ProgressChart({ reports = [] }) {
  // Build last-7-day data
  const today = new Date();

  const getLocalString = (dVal) => {
    const d = new Date(dVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = getLocalString(d);
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const match = reports.find((r) => {
      const rDate = getLocalString(r.date);
      return rDate === iso;
    });
    last7.push({
      name: dayLabel,
      hours: match ? Number(match.hours) : 0,
    });
  }

  const hasData = last7.some((d) => d.hours > 0);

  // Gradient colors based on hours
  const getBarColor = (hours) => {
    if (hours >= 4) return "#a855f7";
    if (hours >= 2) return "#6366f1";
    if (hours > 0) return "#818cf8";
    return "#334155";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip__label">{label}</p>
          <p className="chart-tooltip__value">{payload[0].value}h studied</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="progress-chart">
      <h3 className="progress-chart__title">📊 Last 7 Days</h3>

      {!hasData && (
        <div className="empty-state">
          <span className="empty-state__text">{getRandomEmptyQuote()}</span>
        </div>
      )}

      <div className={`progress-chart__container ${!hasData ? "progress-chart__container--empty" : ""}`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={last7} barSize={32} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]} animationDuration={800}>
              {last7.map((entry, idx) => (
                <Cell key={idx} fill={getBarColor(entry.hours)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
