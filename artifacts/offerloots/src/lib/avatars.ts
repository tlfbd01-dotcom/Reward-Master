export interface AvatarOption {
  id: string;
  gender: "male" | "female";
  label: string;
  url: string;
}

const BG_COLORS = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";
const BASE = `https://api.dicebear.com/9.x/adventurer/svg?backgroundColor=${BG_COLORS}&seed=`;

const MALE_SEEDS = [
  "Felix", "Liam", "Noah", "Oliver", "James",
  "William", "Benjamin", "Lucas", "Henry", "Alexander",
];

const FEMALE_SEEDS = [
  "Sophia", "Emma", "Olivia", "Ava", "Isabella",
  "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
];

export const AVATARS: AvatarOption[] = [
  ...MALE_SEEDS.map((seed, i) => ({
    id: `m_${seed.toLowerCase()}`,
    gender: "male" as const,
    label: `Male ${i + 1}`,
    url: `${BASE}${seed}`,
  })),
  ...FEMALE_SEEDS.map((seed, i) => ({
    id: `f_${seed.toLowerCase()}`,
    gender: "female" as const,
    label: `Female ${i + 1}`,
    url: `${BASE}${seed}`,
  })),
];

export function getAvatarUrl(avatarId: string | null | undefined): string | null {
  if (!avatarId) return null;
  const found = AVATARS.find((a) => a.id === avatarId);
  return found ? found.url : null;
}
