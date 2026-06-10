import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.SESSION_SECRET ?? "offerloots-dev-secret";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function generateApiKey(): string {
  return "ol_" + Array.from({ length: 40 }, () => Math.random().toString(36)[2]).join("");
}

export function computeRank(totalEarned: number): string {
  if (totalEarned >= 1000) return "Diamond";
  if (totalEarned >= 500) return "Platinum";
  if (totalEarned >= 200) return "Gold";
  if (totalEarned >= 50) return "Silver";
  return "Bronze";
}

export function computeRankProgress(totalEarned: number): number {
  const thresholds = [0, 50, 200, 500, 1000];
  for (let i = thresholds.length - 2; i >= 0; i--) {
    if (totalEarned >= thresholds[i]) {
      const next = thresholds[i + 1];
      if (!next) return 100;
      return Math.min(100, Math.round(((totalEarned - thresholds[i]) / (next - thresholds[i])) * 100));
    }
  }
  return 0;
}

export function getNextRank(rank: string): string | null {
  const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const idx = ranks.indexOf(rank);
  return idx < ranks.length - 1 ? ranks[idx + 1] : null;
}
