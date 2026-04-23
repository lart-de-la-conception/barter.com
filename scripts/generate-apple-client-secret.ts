import { readFileSync } from "node:fs";
import { createPrivateKey, createSign } from "node:crypto";

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getPrivateKeyPem() {
  const inlineKey = process.env.APPLE_PRIVATE_KEY?.trim();
  if (inlineKey) {
    return inlineKey.includes("\\n") ? inlineKey.replace(/\\n/g, "\n") : inlineKey;
  }

  const path = requireEnv("APPLE_PRIVATE_KEY_PATH");
  return readFileSync(path, "utf8");
}

function getExpirySeconds() {
  const rawDays = process.env.APPLE_EXPIRY_DAYS?.trim();
  if (!rawDays) {
    return 60 * 60 * 24 * 180;
  }

  const days = Number(rawDays);
  if (!Number.isFinite(days) || days <= 0 || days > 180) {
    throw new Error("APPLE_EXPIRY_DAYS must be a number between 1 and 180.");
  }

  return Math.floor(days * 24 * 60 * 60);
}

function main() {
  const teamId = requireEnv("APPLE_TEAM_ID");
  const keyId = requireEnv("APPLE_KEY_ID");
  const clientId = requireEnv("APPLE_CLIENT_ID");
  const privateKeyPem = getPrivateKeyPem();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + getExpirySeconds();

  const header = {
    alg: "ES256",
    kid: keyId,
  };

  const payload = {
    iss: teamId,
    iat: now,
    exp,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign({
    key: createPrivateKey(privateKeyPem),
    dsaEncoding: "ieee-p1363",
  });

  const token = `${unsignedToken}.${base64UrlEncode(signature)}`;
  process.stdout.write(`${token}\n`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unable to generate Apple client secret.";
  process.stderr.write(`${message}\n`);
  process.stderr.write(
    "Required env vars: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, and either APPLE_PRIVATE_KEY_PATH or APPLE_PRIVATE_KEY.\n",
  );
  process.exit(1);
}
