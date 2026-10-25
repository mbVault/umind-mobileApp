/** Psychologist-only tokens on top of shared product theme. */
import { colors as shared, avatarColors } from "../theme";

export const psychColors = {
  ...shared,
  expert: "#D9F5EA",
  expertInk: "#0B6B4B",
  onlineDot: "#0E9F6E",
  flagBg: "#FBEDE7",
  flagBorder: "#E9C3B6",
  flagInk: "#8E3A22",
  disabledBg: "#EDE3DA",
  disabledInk: "#5F5A73",
} as const;

export { avatarColors };
export { spacing, radius, typeScale, fonts } from "../theme";
