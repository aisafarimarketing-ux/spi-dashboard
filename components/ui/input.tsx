import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border/70 bg-surface text-foreground placeholder:text-muted-foreground/80 flex h-8 w-full rounded-md border px-2.5 text-[12.5px] outline-none transition-colors",
        "hover:border-border focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "[&[type=number]]:font-mono [&[type=number]]:tabular-nums",
        className
      )}
      {...props}
    />
  )
}

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-border/70 bg-surface text-foreground placeholder:text-muted-foreground/80 flex min-h-[60px] w-full rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none transition-colors",
        "hover:border-border focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Input, Textarea }
