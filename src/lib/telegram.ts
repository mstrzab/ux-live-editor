import crypto from "crypto";

export function verifyTelegramAuth(data: Record<string, string>, botToken: string): boolean {
  const { hash, signature, ...rest } = data;

  const checkHash = hash || signature;
  if (!checkHash) return false;

  // Mini App initData: key=value pairs joined with &
  const checkString = Object.keys(rest)
    .filter((key) => key !== "hash" && key !== "signature")
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  return hmac === checkHash;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}
