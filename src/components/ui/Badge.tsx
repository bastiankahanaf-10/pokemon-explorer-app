import { cn, getTypeBadgeClass } from "@/lib/utils";

export function Badge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        getTypeBadgeClass(label),
      )}
    >
      {label}
    </span>
  );
}
