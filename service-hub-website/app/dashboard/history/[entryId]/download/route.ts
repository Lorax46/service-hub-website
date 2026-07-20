import fs from "fs/promises"
import path from "path"
import { requirePermission } from "@/lib/auth"
import { getHistoryEntry } from "@/lib/history"
import { permissions } from "@/lib/permissions"

export async function GET(_: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const user = await requirePermission(permissions.history)
  const { entryId } = await params
  const entry = await getHistoryEntry(user.id, entryId)

  if (!entry) {
    return new Response(JSON.stringify({ message: "Registro não encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const filePath = path.join(process.cwd(), "data", "history-files", entry.responsePath)

  try {
    const fileContents = await fs.readFile(filePath, "utf-8")
    return new Response(fileContents, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${entry.downloadFilename.replace(/"/g, "")}"`,
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ message: "Conteúdo de download indisponível" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
