"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

import type { MultiSelectOption } from "@/components/multi-select-combobox";
import { CreateTagDialog } from "@/components/create-tag-dialog";
import { TimerDisplay } from "./timer-display";
import { TagSelector } from "./tag-selector";
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

export function TimeTrackerPanel() {
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
          const updated = tagOptions.find(
            (option) => option.value === selected.value,
          );
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

    hydrate();

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
      setTagsForTimeEntry(runningEntryId, tagIds).catch((error) => {
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
      <TimerDisplay
        elapsedSeconds={elapsedSeconds}
        isRunning={Boolean(runningEntry)}
        isToggling={isToggling}
        onToggle={handleToggleTimer}
      />

      <TagSelector
        options={tagOptions}
        value={selectedTags}
        onChange={handleTagSelectionChange}
        onCreateOption={handleCreateTag}
      />

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
