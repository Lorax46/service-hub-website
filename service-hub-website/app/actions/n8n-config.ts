"use server"

import { requirePermission, type User } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { query } from "@/lib/db"
import { encryptString } from "@/lib/encryption"

export interface N8nConfigState {
  success: boolean
  message: string
}

export async function saveN8nConfigAction(
  _prev: N8nConfigState | null,
  formData: FormData,
): Promise<N8nConfigState> {
  const user = await requirePermission(permissions.manageUsers)

  const baseUrl = (formData.get("baseUrl") as string | null)?.trim()
  const apiKey = (formData.get("apiKey") as string | null) ?? ""

  if (!baseUrl) {
    return { success: false, message: "A URL base do n8n é obrigatória." }
  }

  let normalizedUrl: string
  try {
    normalizedUrl = new URL(baseUrl).toString().replace(/\/+$/, "")
  } catch {
    return { success: false, message: "URL base inválida. Use algo como https://n8n.exemplo.com" }
  }

  let enc: string | null = null
  let nonce: string | null = null
  if (apiKey) {
    const e = encryptString(apiKey)
    enc = e.ciphertext
    nonce = e.nonce
  }

  try {
    await query(
      `INSERT INTO n8n_config (id, base_url, api_key_encrypted, api_key_nonce, updated_at, updated_by)
       VALUES (1, $1, $2, $3, now(), $4)
       ON CONFLICT (id) DO UPDATE SET
         base_url = EXCLUDED.base_url,
         api_key_encrypted = COALESCE(EXCLUDED.api_key_encrypted, n8n_config.api_key_encrypted),
         api_key_nonce = COALESCE(EXCLUDED.api_key_nonce, n8n_config.api_key_nonce),
         updated_at = now(),
         updated_by = EXCLUDED.updated_by`,
      [normalizedUrl, enc, nonce, (user as User).id],
    )
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? `Erro ao salvar: ${err.message}` : "Erro ao salvar configuração.",
    }
  }

  return { success: true, message: "Conexão com o n8n salva com sucesso." }
}
