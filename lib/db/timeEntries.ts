import { db } from "./db";
import type { TimeEntryRow } from "./schema";
import { setTagsForTimeEntry } from "./timeEntryTags";

function nowISO() {
  return new Date().toISOString();
}

export async function startTimer(tagIds: string[] = []) {
  const timestamp = nowISO();
  const row: TimeEntryRow = {
    id: crypto.randomUUID(),
    startAt: timestamp,
    endAt: null,
    isDeleted: 0,
    createdAt: timestamp,
    updatedAtClient: timestamp,
    updatedAtServer: null,
  };

  await db.timeEntries.add(row);
  await setTagsForTimeEntry(row.id, tagIds);
  return row;
}

export async function stopLatestRunningTimer(tagIds?: string[]) {
  const running = await getLatestRunningTimeEntry();
  if (!running) return null;

  const endTimestamp = nowISO();
  await db.timeEntries.update(running.id, {
    endAt: endTimestamp,
    updatedAtClient: endTimestamp,
  });
  if (typeof tagIds !== "undefined") {
    await setTagsForTimeEntry(running.id, tagIds);
  }

  return { ...running, endAt: endTimestamp };
}

export function getLatestRunningTimeEntry() {
  return db.timeEntries
    .orderBy("startAt")
    .filter((entry) => entry.endAt === null)
    .last();
}
