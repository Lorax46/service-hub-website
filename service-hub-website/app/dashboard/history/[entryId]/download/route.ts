import fs from "fs/promises"
import path from "path"
import { requireAuth } from "@/lib/auth"
import { getHistoryEntry } from "@/lib/history"

export async function GET(_: Request, { params }: { params: { entryId: string } }) {
  const user = await requireAuth()
  const entry = await getHistoryEntry(user.id, params.entryId)

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
