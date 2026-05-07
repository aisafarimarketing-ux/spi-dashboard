import * as React from "react"

import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "border-border/70 bg-surface-2 text-muted-foreground inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] border px-1 font-mono text-[10px] font-medium leading-none",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
