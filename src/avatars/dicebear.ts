import "../polyfills";
import { Avatar, Style, type StyleDefinition } from "@dicebear/core";
import type { AvatarStyleKey } from "./catalog";

// Package "exports" block Metro from @dicebear/styles/*.json — load dist via relative path.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moodsDefinition = require("../../node_modules/@dicebear/styles/dist/moods.min.json") as StyleDefinition;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loreleiNeutralDefinition = require("../../node_modules/@dicebear/styles/dist/lorelei-neutral.min.json") as StyleDefinition;

const styleByKey: Record<AvatarStyleKey, Style> = {
  moods: new Style(moodsDefinition as StyleDefinition),
  "lorelei-neutral": new Style(loreleiNeutralDefinition as StyleDefinition),
};

export function createAvatarSvg(style: AvatarStyleKey, seed: string, size: number): string {
  return new Avatar(styleByKey[style], { seed, size }).toString();
}
