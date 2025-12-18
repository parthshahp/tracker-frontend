"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { MultiSelectCombobox } from "@/components/multi-select-combobox";
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
  const tagOptions = useMemo(
    () =>
      (tags ?? []).map((tag) => ({
        label: tag.name,
        value: tag.id,
      })),
    [tags],
  );
  const [now, setNow] = useState(() => Date.now());
  const [isToggling, setIsToggling] = useState(false);

  const handleCreateTag = useCallback(async (label: string) => {
    const created = await createTag(label);
    return { label: created.name, value: created.id };
  }, []);

  useEffect(() => {
    if (!runningEntry) {
      setNow(Date.now());
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [runningEntry?.id]);

  const elapsedSeconds = useMemo(() => {
    if (!runningEntry) return 0;
    const start = new Date(runningEntry.startAt).getTime();
    return Math.floor((now - start) / 1000);
  }, [now, runningEntry]);

  const handleToggleTimer = useCallback(async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (runningEntry) {
        await stopLatestRunningTimer();
      } else {
        await startTimer();
      }
      setNow(Date.now());
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, runningEntry]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Local timer & tags</CardTitle>
          <CardDescription>
            Start a timer to create a local time entry and tag it whenever you&apos;re ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {runningEntry ? "Timer running" : "No active timer"}
              </p>
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
            onCreateOption={handleCreateTag}
          />
        </CardContent>
      </Card>
    </main>
  );
}
