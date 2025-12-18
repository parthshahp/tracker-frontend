"use client";

import { useCallback, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagColorDot } from "@/components/tag-color-dot";
import { DEFAULT_TAG_COLOR } from "@/lib/tags/constants";

type CreateTagDialogProps = {
  open: boolean;
  defaultName?: string;
  defaultColor?: string;
  onDismiss: () => void;
  onSubmit: (values: { name: string; color: string }) => Promise<void>;
};

export function CreateTagDialog({
  open,
  defaultName = "",
  defaultColor = DEFAULT_TAG_COLOR,
  onDismiss,
  onSubmit,
}: CreateTagDialogProps) {
  const [name, setName] = useState(defaultName);
  const [color, setColor] = useState(defaultColor);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onDismiss();
      }
    },
    [isSubmitting, onDismiss],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Tag name is required");
        return;
      }

      setError(null);
      setIsSubmitting(true);
      try {
        await onSubmit({ name: trimmedName, color });
      } catch (submissionError) {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to save tag";
        setError(message);
        setIsSubmitting(false);
      }
    },
    [name, color, onSubmit],
  );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader className="items-start text-left">
          <AlertDialogTitle>Create a new tag</AlertDialogTitle>
          <AlertDialogDescription>
            Name your tag and pick a color. You can change both later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-tag-name">Name</Label>
            <Input
              id="new-tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Work"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-tag-color">Color</Label>
            <input
              ref={colorInputRef}
              id="new-tag-color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="sr-only"
              disabled={isSubmitting}
              aria-label="Choose tag color"
            />
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              disabled={isSubmitting}
              className="flex items-center gap-3 rounded-md border border-border/70 px-3 py-2 text-left text-sm transition hover:border-border focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TagColorDot color={color} className="h-4 w-4" />
              <span className="font-mono uppercase tracking-wide">
                {color?.toUpperCase()}
              </span>
            </button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onDismiss}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create tag"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
