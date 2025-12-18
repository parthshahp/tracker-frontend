import { DEFAULT_TAG_COLOR } from "@/lib/tags/constants";
import { cn } from "@/lib/utils";

type TagColorDotProps = {
  color?: string | null;
  className?: string;
};

export function TagColorDot({ color, className }: TagColorDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-3 w-3 shrink-0 rounded-full border",
        className,
      )}
      style={{ backgroundColor: color || DEFAULT_TAG_COLOR }}
    />
  );
}
