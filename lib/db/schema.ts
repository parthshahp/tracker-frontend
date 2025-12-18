export type ISODateString = string;

export type BaseRow = {
  id: string;
  isDeleted: number;
  createdAt: ISODateString;
  updatedAtClient: ISODateString;
  updatedAtServer?: ISODateString | null;
};

export type TagRow = Omit<BaseRow, "isDeleted"> & {
  name: string;
  color?: string | null;
};

export type TimeEntryRow = BaseRow & {
  startAt: ISODateString;
  endAt?: ISODateString | null;
  note?: string | null;
};

export type TimeEntryTagRow = {
  timeEntryId: string;
  tagId: string;
};

export type MetaKey =
  | "schemaVersion"
  | "lastPulledAtServer"
  | "lastPushedAtServer";

export type MetaRow = {
  key: MetaKey;
  value: string | null;
  updatedAt: ISODateString;
};

export const DB_SCHEMA_VERSION = 1 as const;
