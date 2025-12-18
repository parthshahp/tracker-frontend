import { db } from "./db";
import type { TagRow } from "./schema";

const DEFAULT_TAG_COLOR = "#000000";

function nowISO() {
  return new Date().toISOString();
}

export function getAllTags() {
  return db.tags.orderBy("name").toArray();
}

export async function createTag(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Tag name cannot be empty");
  }

  const existing = await db.tags.where("name").equals(normalizedName).first();
  if (existing) {
    return existing;
  }

  const timestamp = nowISO();
  const row: TagRow = {
    id: crypto.randomUUID(),
    userId: null,
    name: normalizedName,
    color: DEFAULT_TAG_COLOR,
    isDeleted: 0,
    createdAt: timestamp,
    updatedAtClient: timestamp,
    updatedAtServer: null,
  };

  try {
    await db.tags.add(row);
    return row;
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error);
    if (message.includes("constraint") || message.includes("unique")) {
      const duplicate = await db.tags.where("name").equals(normalizedName).first();
      if (duplicate) {
        return duplicate;
      }
    }
    throw error;
  }
}
