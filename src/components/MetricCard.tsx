import type { Metric } from '../api/types'
import { Sparkline } from './Sparkline'

/** Metrics where a falling number is the good outcome. */
const LOWER_IS_BETTER = new Set(['attrition', 'time-to-hire'])

function format(metric: Metric) {
  if (metric.unit === 'percent') return `${metric.value.toFixed(1)}%`
  if (metric.unit === 'days') return `${metric.value}d`
  return metric.value.toLocaleString()
}

export function MetricCard({ metric }: { metric: Metric }) {
  const invert = LOWER_IS_BETTER.has(metric.key)
  const good = invert ? metric.deltaPct < 0 : metric.deltaPct > 0
  const sign = metric.deltaPct > 0 ? '+' : ''

  return (
    <article className="metric">
      <p className="eyebrow">{metric.label}</p>
      <p className="metric__value">{format(metric)}</p>
      <div className="metric__foot">
        <span className={`delta ${good ? 'delta--good' : 'delta--bad'}`}>
          {sign}
          {metric.deltaPct.toFixed(1)}%
          <span className="sr-only"> versus the same period last quarter</span>
        </span>
        <Sparkline points={metric.series} invert={invert} />
      </div>
    </article>
  )
}
