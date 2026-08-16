import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-medium ring-offset-background transition-[color,background-color,border-color,transform] duration-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-slate-900 bg-slate-950 text-primary-foreground hover:bg-slate-800 active:bg-slate-700",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "border-input bg-background text-slate-900 hover:bg-accent hover:text-accent-foreground active:bg-slate-200 dark:active:bg-slate-700",
        secondary:
          "border-slate-200 bg-secondary text-secondary-foreground hover:bg-slate-200 active:bg-slate-300",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-slate-200 dark:active:bg-slate-700",
        link: "border-transparent px-0 text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * Marks an async action as in flight: renders a spinner, sets aria-busy and
   * blocks further input. Ignored when asChild is set, because Slot forwards to a
   * single child element.
   */
  pending?: boolean
  /**
   * Visible text shown in place of the children while pending. Required for
   * icon-only controls, where a frozen spinner under reduced motion would be the
   * only cue that anything is happening.
   */
  pendingLabel?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      pending = false,
      pendingLabel,
      disabled,
      children,
      onClick,
      onKeyDown,
      tabIndex,
      ...props
    },
    ref
  ) => {
    const inactive = disabled === true || pending
    const classes = cn(buttonVariants({ variant, size, className }))

    if (asChild) {
      // Slot forwards onto a real element such as <a>, where `disabled` is not a
      // valid attribute. Express the same contract semantically and block
      // activation, so an inert control cannot be clicked or keyed through.
      return (
        <Slot
          className={classes}
          ref={ref}
          aria-disabled={inactive || undefined}
          data-disabled={inactive ? "" : undefined}
          aria-busy={pending || undefined}
          tabIndex={inactive ? -1 : tabIndex}
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            if (inactive) {
              event.preventDefault()
              event.stopPropagation()
              return
            }
            onClick?.(event as React.MouseEvent<HTMLButtonElement>)
          }}
          onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
            if (inactive && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault()
              return
            }
            onKeyDown?.(event as React.KeyboardEvent<HTMLButtonElement>)
          }}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={classes}
        ref={ref}
        aria-busy={pending || undefined}
        disabled={inactive}
        tabIndex={tabIndex}
        onClick={onClick}
        onKeyDown={onKeyDown}
        {...props}
      >
        {pending ? (
          <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
        ) : null}
        {pending && pendingLabel !== undefined ? pendingLabel : children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
