import { db } from "./db";
import type { TagRow } from "./schema";
import { DEFAULT_TAG_COLOR } from "@/lib/tags/constants";

function nowISO() {
  return new Date().toISOString();
}

export function getAllTags() {
  return db.tags.orderBy("name").toArray();
}

export async function createTag(name: string, color?: string | null) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Tag name cannot be empty");
  }

  const existing = await db.tags.where("name").equals(normalizedName).first();
  if (existing) {
    throw new Error(`Tag "${normalizedName}" already exists`);
  }

  const timestamp = nowISO();
  const row: TagRow = {
    id: crypto.randomUUID(),
    name: normalizedName,
    color: color?.trim() || DEFAULT_TAG_COLOR,
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
      throw new Error(`Tag "${normalizedName}" already exists`);
    }
    throw error;
  }
}
