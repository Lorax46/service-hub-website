import fs from "fs/promises"
import path from "path"

export type HistoryEntryStatus = "completed" | "failed"
export type HistoryEntryType = "document" | "query" | "workflow" | "automation"

export interface HistoryEntry {
  id: string
  userId: string
  type: HistoryEntryType
  title: string
  description: string
  webhook: string
  flowId?: string
  request: Record<string, any>
  responseSummary: unknown
  responsePath: string
  status: HistoryEntryStatus
  error?: string
  createdAt: string
  completedAt: string
  downloadFilename: string
}

const historyDir = path.join(process.cwd(), "data")
const historyFilePath = path.join(historyDir, "history.json")
const historyFilesDir = path.join(historyDir, "history-files")

async function ensureHistoryStore() {
  await fs.mkdir(historyFilesDir, { recursive: true })

  try {
    await fs.access(historyFilePath)
  } catch {
    await fs.writeFile(historyFilePath, "[]", "utf-8")
  }
}

async function readHistory(): Promise<HistoryEntry[]> {
  await ensureHistoryStore()

  try {
    const content = await fs.readFile(historyFilePath, "utf-8")
    return JSON.parse(content) as HistoryEntry[]
  } catch {
    return []
  }
}

async function writeHistory(entries: HistoryEntry[]) {
  await ensureHistoryStore()
  await fs.writeFile(historyFilePath, JSON.stringify(entries, null, 2), "utf-8")
}

function safeFilename(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9-_\.]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120)
}

async function writeResponseFile(entryId: string, response: unknown) {
  const filename = `${entryId}.json`
  const filePath = path.join(historyFilesDir, filename)
  await fs.writeFile(filePath, JSON.stringify(response, null, 2), "utf-8")
  return filename
}

export async function appendHistoryEntry(entry: Omit<HistoryEntry, "id" | "createdAt" | "completedAt" | "responsePath">) {
  const entries = await readHistory()
  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const responseFilename = await writeResponseFile(id, entry.responseSummary)

  const newEntry: HistoryEntry = {
    ...entry,
    id,
    responsePath: responseFilename,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  }

  entries.push(newEntry)
  await writeHistory(entries)

  return newEntry
}

export async function getHistoryForUser(userId: string) {
  const entries = await readHistory()
  return entries.filter((entry) => entry.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getHistoryEntry(userId: string, entryId: string) {
  const entries = await readHistory()
  return entries.find((entry) => entry.userId === userId && entry.id === entryId)
}
