interface SparklineProps {
  points: number[]
  /** Down is good for attrition and time-to-hire. */
  invert?: boolean
}

const W = 132
const H = 34
const PAD = 3

export function Sparkline({ points, invert = false }: SparklineProps) {
  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  // A flat series would divide by zero; draw it down the middle instead.
  const span = max - min || 1

  const coords = points.map((value, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((value - min) / span) * (H - PAD * 2)
    return [x, y] as const
  })

  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${PAD},${H} ${line} ${W - PAD},${H}`
  const [lastX, lastY] = coords[coords.length - 1]
  const rising = points[points.length - 1] >= points[0]
  const good = invert ? !rising : rising

  return (
    <svg
      className={`spark ${good ? 'spark--good' : 'spark--bad'}`}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="presentation"
      focusable="false"
    >
      <polygon className="spark__area" points={area} />
      <polyline className="spark__line" points={line} />
      <circle className="spark__dot" cx={lastX} cy={lastY} r="2.6" />
    </svg>
  )
}
