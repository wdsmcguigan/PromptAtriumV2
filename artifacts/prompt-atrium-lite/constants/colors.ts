const dark = {
  text: "#f9fafa",
  tint: "#146eff",
  background: "#111317",
  foreground: "#f9fafa",
  card: "#1a1d23",
  cardForeground: "#f9fafa",
  primary: "#146eff",
  primaryForeground: "#ffffff",
  secondary: "#23272f",
  secondaryForeground: "#d3d7de",
  muted: "#1f2229",
  mutedForeground: "#b0b5bf",
  accent: "#23272f",
  accentForeground: "#d3d7de",
  destructive: "#ff4d4d",
  destructiveForeground: "#ffffff",
  border: "#3e4451",
  input: "#2c313a",
  ring: "#146eff",
};

const colors = {
  light: dark,
  dark,
  radius: 8,
};

export const gradients = {
  library: ["#0066ff", "#8b6bff"] as const,
  community: ["#ffa500", "#ff6600"] as const,
  tools: ["#8b6bff", "#00bfff"] as const,
  codex: ["#10b981", "#3b82f6"] as const,
};

export default colors;
