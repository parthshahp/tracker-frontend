import { db } from "./db";
import type { TagRow } from "./schema";

export async function getTagsForTimeEntry(timeEntryId: string) {
  const rows = await db.timeEntryTags.where("timeEntryId").equals(timeEntryId).toArray();
  if (!rows.length) {
    return [] as TagRow[];
  }
  const tags = await db.tags.bulkGet(rows.map((row) => row.tagId));
  return tags.filter((tag): tag is TagRow => Boolean(tag));
}

export async function setTagsForTimeEntry(timeEntryId: string, tagIds: string[]) {
  const uniqueIds = Array.from(new Set(tagIds));
  await db.transaction("rw", db.timeEntryTags, async () => {
    await db.timeEntryTags.where("timeEntryId").equals(timeEntryId).delete();
    if (!uniqueIds.length) return;
    await db.timeEntryTags.bulkAdd(
      uniqueIds.map((tagId) => ({
        timeEntryId,
        tagId,
      })),
    );
  });
}
