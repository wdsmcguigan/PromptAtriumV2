/**
 * Semantic design tokens for PromptAtrium Mobile.
 *
 * Derived directly from the sibling web artifact's tokens
 * (artifacts/prompt-atrium/src/index.css). The web app is dark-first —
 * its :root and .dark blocks are identical — so both `light` and `dark`
 * here use the same dark brand palette to keep one cohesive identity.
 */

const dark = {
  // Legacy aliases kept for scaffold components
  text: "#f9fafa",
  tint: "#146eff",

  // Core surfaces
  background: "#111317",
  foreground: "#f9fafa",

  // Cards / elevated surfaces
  card: "#1a1d23",
  cardForeground: "#f9fafa",

  // Primary action color
  primary: "#146eff",
  primaryForeground: "#ffffff",

  // Secondary surfaces
  secondary: "#23272f",
  secondaryForeground: "#d3d7de",

  // Muted / subdued
  muted: "#1f2229",
  mutedForeground: "#b0b5bf",

  // Accent highlights
  accent: "#23272f",
  accentForeground: "#d3d7de",

  // Destructive
  destructive: "#ff4d4d",
  destructiveForeground: "#ffffff",

  // Borders / inputs
  border: "#3e4451",
  input: "#2c313a",
  ring: "#146eff",
};

const colors = {
  light: dark,
  dark,
  radius: 8,
};

/**
 * Brand feature gradients, mirrored from the web app's section accents.
 */
export const gradients = {
  library: ["#0066ff", "#8b6bff"] as const,
  community: ["#ffa500", "#ff6600"] as const,
  tools: ["#8b6bff", "#00bfff"] as const,
  codex: ["#10b981", "#3b82f6"] as const,
};

export default colors;
