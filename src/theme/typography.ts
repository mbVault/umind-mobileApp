import { TextStyle } from "react-native";

export const fonts = {
  serif: "Fraunces_600SemiBold",
  serifRegular: "Fraunces_400Regular",
  sans: "Manrope_400Regular",
  sansMedium: "Manrope_500Medium",
  sansSemiBold: "Manrope_600SemiBold",
  sansBold: "Manrope_700Bold",
  sansExtraBold: "Manrope_800ExtraBold",
} as const;

export const typeScale = {
  display: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.68,
    color: "#1F1B3A",
  } satisfies TextStyle,
  h1: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.6,
    color: "#1F1B3A",
  } satisfies TextStyle,
  bodyLarge: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: "#5F5A73",
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: "#1F1B3A",
  } satisfies TextStyle,
  button: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: "#FFFFFF",
  } satisfies TextStyle,
  link: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: "#5B45E0",
  } satisfies TextStyle,
} as const;
