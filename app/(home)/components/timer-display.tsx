"use client";

import { Button } from "@/components/ui/button";

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

export type TimerDisplayProps = {
  elapsedSeconds: number;
  isRunning: boolean;
  isToggling: boolean;
  onToggle: () => void;
};

export function TimerDisplay({
  elapsedSeconds,
  isRunning,
  isToggling,
  onToggle,
}: TimerDisplayProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-3xl font-semibold tracking-tight">
          {formatDuration(elapsedSeconds)}
        </p>
      </div>
      <Button onClick={onToggle} disabled={isToggling} size="lg">
        {isRunning ? "Stop timer" : "Start timer"}
      </Button>
    </div>
  );
}
