import { color, font } from "./tokens";

// GRIDLINE chart vocabulary — shared by all five chart components so
// axes, grids, and tooltips are identical everywhere. Chart tick labels
// follow the app-wide rule: numbers and axis text are always mono.

export const chartAxisTick = {
  fontSize: 11,
  fill: color.ink60,
  fontFamily: font.mono,
};

export const chartGridStroke = color.gridline;

export const chartTooltipStyle = {
  fontSize: "12px",
  fontFamily: font.mono,
  borderRadius: "8px",
  border: `1px solid ${color.gridline}`,
  color: color.ink,
};

export const chartSeriesColor = color.ultramarine;

export const chartEmptyStyle = {
  fontSize: "13px",
  color: color.ink60,
  fontFamily: font.body,
};