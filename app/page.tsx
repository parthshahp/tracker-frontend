import { Suspense } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { CompletedTimeEntries } from "./(home)/components/completed-time-entries";
import { TimeTrackerPanel } from "./(home)/components/time-tracker-panel";

export default function Page() {
  return (
    <main className="flex min-h-screen justify-center bg-background p-6">
      <div className="fixed right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-5xl flex-col items-center gap-6">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-6">
            <Suspense
              fallback={
                <div className="text-sm text-muted-foreground">
                  Loading timer…
                </div>
              }
            >
              <TimeTrackerPanel />
            </Suspense>
          </CardContent>
        </Card>

        <Suspense
          fallback={
            <div className="text-sm text-muted-foreground">
              Loading completed entries…
            </div>
          }
        >
          <CompletedTimeEntries />
        </Suspense>
      </div>
    </main>
  );
}
