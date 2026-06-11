import { Router, type IRouter } from "express";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

const SETTINGS_DIR = join(process.cwd(), "data");
const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json");

type MailSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
  requireEmailVerification: boolean;
};

const defaults: MailSettings = {
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  fromName: "OfferLoots",
  fromEmail: "noreply@offerloots.com",
  requireEmailVerification: false,
};

let cached: MailSettings = { ...defaults };

try {
  if (existsSync(SETTINGS_FILE)) {
    const raw = readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.mail) cached = { ...defaults, ...parsed.mail };
  }
} catch {}

function persist() {
  try {
    if (!existsSync(SETTINGS_DIR)) mkdirSync(SETTINGS_DIR, { recursive: true });
    writeFileSync(SETTINGS_FILE, JSON.stringify({ mail: cached }, null, 2));
  } catch {}
}

export function getMailSettings(): MailSettings {
  return cached;
}

router.get("/admin/mail-settings", requireAdmin, (_req, res): void => {
  res.json({ ...cached, smtpPass: cached.smtpPass ? "••••••••" : "" });
});

router.post("/admin/mail-settings", requireAdmin, (req, res): void => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail, requireEmailVerification } = req.body;
  cached = {
    smtpHost: smtpHost ?? cached.smtpHost,
    smtpPort: Number(smtpPort ?? cached.smtpPort) || cached.smtpPort,
    smtpUser: smtpUser ?? cached.smtpUser,
    smtpPass: smtpPass && smtpPass !== "••••••••" ? smtpPass : cached.smtpPass,
    fromName: fromName ?? cached.fromName,
    fromEmail: fromEmail ?? cached.fromEmail,
    requireEmailVerification: requireEmailVerification !== undefined
      ? Boolean(requireEmailVerification)
      : cached.requireEmailVerification,
  };
  persist();
  res.json({ success: true, message: "Mail settings saved successfully." });
});

export default router;
