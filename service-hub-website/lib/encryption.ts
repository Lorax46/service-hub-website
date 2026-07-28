import crypto from "node:crypto"

// Criptografia simétrica (AES-256-GCM) para a apikey do n8n.
// Chave derivada de SESSION_SECRET (mesmo segredo usado pelo JWT da sessão).

const ALGO = "aes-256-gcm"

function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET não definida — impossível criptografar/descriptografar a apikey.")
  }
  return crypto.createHash("sha256").update(secret).digest()
}

export function encryptString(plain: string): { ciphertext: string; nonce: string } {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, deriveKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    ciphertext: Buffer.concat([enc, tag]).toString("base64"),
    nonce: iv.toString("base64"),
  }
}

export function decryptString(ciphertext: string, nonce: string): string {
  const data = Buffer.from(ciphertext, "base64")
  const iv = Buffer.from(nonce, "base64")
  const tag = data.subarray(data.length - 16)
  const enc = data.subarray(0, data.length - 16)
  const decipher = crypto.createDecipheriv(ALGO, deriveKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8")
}
