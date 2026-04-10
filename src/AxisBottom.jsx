const TICK_LENGTH = 6;

export const AxisBottom = ({ xScale, pixelsPerTick, boundsHeight }) => {
  const range = xScale.range();
  const width = range[1] - range[0];
  const numberOfTicksTarget = Math.floor(width / pixelsPerTick);

  return (
    <>
      <line
        x1={range[0]} y1={0} x2={range[1]} y2={0}
        stroke="currentColor" fill="none"
      />
      {xScale.ticks(numberOfTicksTarget).map((value) => (
        <g key={value} transform={`translate(${xScale(value)}, 0)`}>
          <line y1={0} y2={-boundsHeight} stroke="currentColor" opacity={0.1} />
          <line y2={TICK_LENGTH} stroke="currentColor" />
          <text
            style={{
              fontSize: "10px",
              textAnchor: "middle",
              transform: "translateY(20px)",
            }}
          >
            {value}
          </text>
        </g>
      ))}
    </>
  );
};