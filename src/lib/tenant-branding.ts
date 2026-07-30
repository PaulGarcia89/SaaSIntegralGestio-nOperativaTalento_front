const FALLBACK = "#0EA5B7";

export function createTenantTheme(input?: string) {
  const hex = /^#[0-9a-f]{6}$/i.test(input ?? "") ? input! : FALLBACK;
  const red = parseInt(hex.slice(1, 3), 16) / 255;
  const green = parseInt(hex.slice(3, 5), 16) / 255;
  const blue = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue); const min = Math.min(red, green, blue); const delta = max - min;
  let hue = 0;
  if (delta) { if (max === red) hue = 60 * (((green - blue) / delta) % 6); else if (max === green) hue = 60 * ((blue - red) / delta + 2); else hue = 60 * ((red - green) / delta + 4); }
  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return { hex, primary: `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.max(38, Math.min(48, Math.round(lightness * 100)))}%`, foreground: luminance > 0.42 ? "222 47% 11%" : "0 0% 100%", accent: `${Math.round(hue)} ${Math.max(35, Math.round(saturation * 100))}% 93%` };
}
