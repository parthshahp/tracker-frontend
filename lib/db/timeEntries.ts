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

export function getCompletedTimeEntries() {
  return db.timeEntries
    .orderBy("endAt")
    .filter((entry) => entry.endAt !== null && entry.isDeleted === 0)
    .reverse()
    .toArray();
}

export async function deleteTimeEntry(timeEntryId: string) {
  const timestamp = nowISO();
  await db.transaction("rw", db.timeEntries, db.timeEntryTags, async () => {
    await db.timeEntries.update(timeEntryId, {
      isDeleted: 1,
      updatedAtClient: timestamp,
    });
    await db.timeEntryTags.where("timeEntryId").equals(timeEntryId).delete();
  });
}
