/** Curated DiceBear picks — `id` is sent to the backend as `avatarId` (max 50 chars). */
export type AvatarStyleKey = "moods" | "lorelei-neutral";

export type ClientAvatarOption = {
  id: string;
  style: AvatarStyleKey;
  seed: string;
};

export const CLIENT_AVATAR_OPTIONS: ClientAvatarOption[] = [
  { id: "moods:umind-neela", style: "moods", seed: "umind-neela" },
  { id: "moods:umind-raahi", style: "moods", seed: "umind-raahi" },
  { id: "moods:umind-tara", style: "moods", seed: "umind-tara" },
  { id: "ln:umind-kavi", style: "lorelei-neutral", seed: "umind-kavi" },
  { id: "ln:umind-megh", style: "lorelei-neutral", seed: "umind-megh" },
  { id: "ln:umind-arjun", style: "lorelei-neutral", seed: "umind-arjun" },
];

export const DEFAULT_AVATAR_ID = CLIENT_AVATAR_OPTIONS[0].id;
