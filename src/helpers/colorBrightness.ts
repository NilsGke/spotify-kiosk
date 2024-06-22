type HEX = `#${string}`;

/**
 * Calculate brightness value by RGB or HEX color.
 * @param color (String) The color value in RGB or HEX (for example: #000000 || #000 || rgb(0,0,0) || rgba(0,0,0,0))
 * @returns (Number) The brightness value (dark) 0 ... 255 (light)
 */
export default function brightnessByColor(color: HEX) {
  const hasFullSpec = color.length == 7;

  const m = color.substring(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);

  if (m?.[0] === undefined || m[1] === undefined || m[2] === undefined)
    throw Error("color does not match spec (could not find all parts of color");

  const r = parseInt(m[0] + (hasFullSpec ? "" : m[0]), 16),
    g = parseInt(m[1] + (hasFullSpec ? "" : m[1]), 16),
    b = parseInt(m[2] + (hasFullSpec ? "" : m[2]), 16);

  if (typeof r != "undefined") return (r * 299 + g * 587 + b * 114) / 1000;
}
