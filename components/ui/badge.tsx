import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-secondary-foreground border-border/60",
        outline:
          "bg-transparent text-foreground/80 border-border",
        gold:
          "border-[color-mix(in_oklch,var(--gold)_30%,transparent)] bg-[color-mix(in_oklch,var(--gold)_18%,transparent)] text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))]",
        success:
          "border-[color-mix(in_oklch,var(--success)_25%,transparent)] bg-[color-mix(in_oklch,var(--success)_12%,transparent)] text-[color-mix(in_oklch,var(--success)_60%,var(--ink))]",
        warning:
          "border-[color-mix(in_oklch,var(--warning)_30%,transparent)] bg-[color-mix(in_oklch,var(--warning)_15%,transparent)] text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]",
        destructive:
          "border-[color-mix(in_oklch,var(--destructive)_30%,transparent)] bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)] text-[color-mix(in_oklch,var(--destructive)_60%,var(--ink))]",
        muted:
          "bg-muted text-muted-foreground border-border/40",
      },
      size: {
        default: "h-5",
        sm: "h-4 px-1 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
