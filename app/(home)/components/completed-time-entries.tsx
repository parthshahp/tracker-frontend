"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TagRow, TimeEntryRow } from "@/lib/db/schema";
import { deleteTimeEntry, getCompletedTimeEntries } from "@/lib/db/timeEntries";
import { getTagsForTimeEntry } from "@/lib/db/timeEntryTags";
import { DEFAULT_TAG_COLOR } from "@/lib/tags/constants";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    timeStyle: "short",
  });
}

function formatDuration(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [
    hours ? `${hours}h` : null,
    minutes || hours ? `${minutes.toString().padStart(2, "0")}m` : null,
    `${seconds.toString().padStart(2, "0")}s`,
  ].filter(Boolean);

  return parts.join(" ");
}

type CompletedEntry = TimeEntryRow & { endAt: string; tags: TagRow[] };

export function CompletedTimeEntries() {
  const entries = useLiveQuery<CompletedEntry[]>(async () => {
    const completed = await getCompletedTimeEntries();
    const withTags = await Promise.all(
      completed.map(async (entry) => ({
        ...entry,
        endAt: entry.endAt as string,
        tags: await getTagsForTimeEntry(entry.id),
      })),
    );

    return withTags;
  }, []);

  const handleDelete = useCallback((entryId: string) => {
    deleteTimeEntry(entryId).catch((error) => {
      console.error("Failed to delete time entry", error);
    });
  }, []);

  const content = useMemo(() => {
    if (!entries?.length) {
      return (
        <p className="text-sm text-muted-foreground">
          No completed entries yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
            role="article"
          >
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex flex-1 flex-wrap gap-2">
                {entry.tags.length
                  ? entry.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        style={{
                          backgroundColor: tag.color ?? DEFAULT_TAG_COLOR,
                          color: "white",
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  : (
                    <span className="text-xs text-muted-foreground">No tags</span>
                  )}
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-3 text-right">
                <p className="text-xs text-muted-foreground">
                  {formatTime(entry.startAt)} – {formatTime(entry.endAt)}
                </p>
                <div className="flex items-center gap-2 font-semibold tabular-nums">
                  <span>{formatDuration(entry.startAt, entry.endAt)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete time entry"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [entries, handleDelete]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Completed time entries</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
