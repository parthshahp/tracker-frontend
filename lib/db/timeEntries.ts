import { db } from "./db";
import type { TimeEntryRow } from "./schema";

function nowISO() {
  return new Date().toISOString();
}

export async function startTimer() {
  const timestamp = nowISO();
  const row: TimeEntryRow = {
    id: crypto.randomUUID(),
    userId: null,
    startAt: timestamp,
    endAt: null,
    isDeleted: 0,
    createdAt: timestamp,
    updatedAtClient: timestamp,
    updatedAtServer: null,
  };

  await db.timeEntries.add(row);
  return row;
}

export async function stopLatestRunningTimer() {
  const running = await getLatestRunningTimeEntry();
  if (!running) return null;

  const endTimestamp = nowISO();
  await db.timeEntries.update(running.id, {
    endAt: endTimestamp,
    updatedAtClient: endTimestamp,
  });

  return { ...running, endAt: endTimestamp };
}

export function getLatestRunningTimeEntry() {
  return db.timeEntries
    .orderBy("startAt")
    .filter((entry) => entry.endAt === null)
    .last();
}
