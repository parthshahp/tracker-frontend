import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimeTrackerPanel } from "./(home)/components/time-tracker-panel";

export default function Page() {
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
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading timer…</div>}>
            <TimeTrackerPanel />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
