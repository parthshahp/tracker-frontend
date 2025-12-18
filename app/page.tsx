"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

import { MultiSelectCombobox } from "@/components/multi-select-combobox";
import type { MultiSelectOption } from "@/components/multi-select-combobox";
import { CreateTagDialog } from "@/components/create-tag-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getLatestRunningTimeEntry,
  startTimer,
  stopLatestRunningTimer,
} from "@/lib/db/timeEntries";
import { createTag, getAllTags } from "@/lib/db/tags";
import {
  getTagsForTimeEntry,
  setTagsForTimeEntry,
} from "@/lib/db/timeEntryTags";
import { DEFAULT_TAG_COLOR } from "@/lib/tags/constants";

function formatDuration(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const segments = [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ];
  return segments.join(":");
}

export default function Page() {
  const runningEntry = useLiveQuery(getLatestRunningTimeEntry, [], null);
  const tags = useLiveQuery(getAllTags, [], []);
  const runningEntryId = runningEntry?.id ?? null;
  const [selectedTags, setSelectedTags] = useState<MultiSelectOption[]>([]);
  const [createDialogState, setCreateDialogState] = useState<{
    dialogKey: string;
    defaultName: string;
    resolve: (value: MultiSelectOption | null) => void;
  } | null>(null);
  const tagOptions = useMemo(
    () =>
      (tags ?? []).map((tag) => ({
        label: tag.name,
        value: tag.id,
        color: tag.color ?? DEFAULT_TAG_COLOR,
      })),
    [tags],
  );
  const [now, setNow] = useState(() => Date.now());
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setSelectedTags((current) =>
      current
        .map((selected) => {
          const updated = tagOptions.find((option) => option.value === selected.value);
          return updated ?? selected;
        })
        .filter((option) =>
          tagOptions.some((candidate) => candidate.value === option.value),
        ),
    );
  }, [tagOptions]);

  useEffect(() => {
    if (!runningEntryId) {
      return;
    }

    let isCancelled = false;
    const hydrate = async () => {
      const rows = await getTagsForTimeEntry(runningEntryId);
      if (isCancelled) return;
      const next = rows.map((tag) => ({
        label: tag.name,
        value: tag.id,
        color: tag.color ?? DEFAULT_TAG_COLOR,
      }));
      setSelectedTags(next);
    };

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, [runningEntryId]);

  const handleCreateTag = useCallback((label: string) => {
    const normalizedLabel = label.trim();
    return new Promise<MultiSelectOption | null>((resolve) => {
      setCreateDialogState((current) => {
        current?.resolve(null);
        return {
          dialogKey: crypto.randomUUID(),
          defaultName: normalizedLabel || label,
          resolve,
        };
      });
    });
  }, []);

  const handleDialogDismiss = useCallback(() => {
    setCreateDialogState((current) => {
      if (!current) {
        return null;
      }
      current.resolve(null);
      return null;
    });
  }, []);

  const handleDialogSubmit = useCallback(
    async ({ name, color }: { name: string; color: string }) => {
      if (!createDialogState) {
        return;
      }

      try {
        const created = await createTag(name, color);
        const option: MultiSelectOption = {
          label: created.name,
          value: created.id,
          color: created.color ?? DEFAULT_TAG_COLOR,
        };
        createDialogState.resolve(option);
        setCreateDialogState(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create tag";
        toast.error(message);
        throw error;
      }
    },
    [createDialogState],
  );

  const handleTagSelectionChange = useCallback(
    (next: MultiSelectOption[]) => {
      setSelectedTags(next);
      if (!runningEntryId) {
        return;
      }
      const tagIds = next.map((tag) => tag.value);
      void setTagsForTimeEntry(runningEntryId, tagIds).catch((error) => {
        console.error("Failed to update running entry tags", error);
      });
    },
    [runningEntryId],
  );

  useEffect(() => {
    if (!runningEntry) {
      setNow(Date.now());
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [runningEntry]);

  const elapsedSeconds = useMemo(() => {
    if (!runningEntry) return 0;
    const start = new Date(runningEntry.startAt).getTime();
    return Math.floor((now - start) / 1000);
  }, [now, runningEntry]);

  const handleToggleTimer = useCallback(async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const tagIds = selectedTags.map((tag) => tag.value);
      if (runningEntry) {
        await stopLatestRunningTimer(tagIds);
      } else {
        await startTimer(tagIds);
      }
      setNow(Date.now());
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, runningEntry, selectedTags]);

  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Local timer & tags</CardTitle>
            <CardDescription>
              Start a timer to create a local time entry and tag it whenever
              you&apos;re ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-3xl font-semibold tracking-tight">
                  {formatDuration(elapsedSeconds)}
                </p>
              </div>
              <Button onClick={handleToggleTimer} disabled={isToggling} size="lg">
                {runningEntry ? "Stop timer" : "Start timer"}
              </Button>
            </div>

            <MultiSelectCombobox
              id="tag-selector"
              name="tag-selector"
              placeholder="Search tags"
              options={tagOptions}
              value={selectedTags}
              onChange={handleTagSelectionChange}
              onCreateOption={handleCreateTag}
            />
          </CardContent>
        </Card>
      </main>

      {createDialogState ? (
        <CreateTagDialog
          key={createDialogState.dialogKey}
          open
          defaultName={createDialogState.defaultName}
          onDismiss={handleDialogDismiss}
          onSubmit={handleDialogSubmit}
        />
      ) : null}
    </>
  );
}
