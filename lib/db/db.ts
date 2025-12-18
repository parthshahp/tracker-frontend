import Dexie, { type Table } from "dexie";

import {
  DB_SCHEMA_VERSION,
  type MetaRow,
  type TagRow,
  type TimeEntryRow,
  type TimeEntryTagRow,
} from "./schema";

class TrackerDatabase extends Dexie {
  tags!: Table<TagRow, string>;
  timeEntries!: Table<TimeEntryRow, string>;
  timeEntryTags!: Table<TimeEntryTagRow, [string, string]>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("tracker");

    this.version(DB_SCHEMA_VERSION).stores({
      tags: "id, userId, &name, updatedAtServer, updatedAtClient",
      timeEntries:
        "id, userId, startAt, endAt, updatedAtServer, updatedAtClient",
      timeEntryTags: "[timeEntryId+tagId], timeEntryId, tagId",
      meta: "key",
    });
  }
}

export const db = new TrackerDatabase();
