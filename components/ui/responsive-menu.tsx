"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

// ─── Context ──────────────────────────────────────────────────────────────────

type Mode = "desktop" | "mobile"

type ResponsiveMenuContextValue = {
  mode: Mode
  setOpen: (open: boolean) => void
}

const ResponsiveMenuContext =
  React.createContext<ResponsiveMenuContextValue | null>(null)

function useResponsiveMenuContext(component: string) {
  const ctx = React.useContext(ResponsiveMenuContext)
  if (!ctx) {
    throw new Error(`${component} must be used inside <ResponsiveMenu>`)
  }
  return ctx
}

// ─── Shared classes ───────────────────────────────────────────────────────────
// Mobile items mirror the visual language of DropdownMenuItem but scaled up
// for touch (h-12, text-base). Keep these in sync with dropdown-menu.tsx.

const MOBILE_ITEM_BASE =
  "group/responsive-menu-item relative flex w-full cursor-default items-center gap-2 rounded-md px-3 h-12 text-base outline-hidden select-none [&_svg:not([class*='size-'])]:size-5 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-accent text-accent-foreground active:bg-accent/70 disabled:pointer-events-none disabled:opacity-50"

const MOBILE_ITEM_DESTRUCTIVE =
  "data-[variant=destructive]:bg-destructive/10 dark:data-[variant=destructive]:bg-destructive/20 data-[variant=destructive]:text-destructive data-[variant=destructive]:*:[svg]:text-destructive"

// ─── Root ─────────────────────────────────────────────────────────────────────

type ResponsiveMenuProps = {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function ResponsiveMenu({
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
}: ResponsiveMenuProps) {
  const isMobile = useIsMobile()
  const mode: Mode = isMobile ? "mobile" : "desktop"

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const ctx = React.useMemo<ResponsiveMenuContextValue>(
    () => ({ mode, setOpen }),
    [mode, setOpen],
  )

  return (
    <ResponsiveMenuContext.Provider value={ctx}>
      {mode === "desktop" ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          {children}
        </DropdownMenu>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          {children}
        </Sheet>
      )}
    </ResponsiveMenuContext.Provider>
  )
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

type ResponsiveMenuTriggerProps = React.ComponentProps<typeof DropdownMenuTrigger>

function ResponsiveMenuTrigger(props: ResponsiveMenuTriggerProps) {
  const { mode } = useResponsiveMenuContext("ResponsiveMenuTrigger")
  return mode === "desktop" ? (
    <DropdownMenuTrigger {...props} />
  ) : (
    <SheetTrigger {...(props as React.ComponentProps<typeof SheetTrigger>)} />
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

type ResponsiveMenuContentProps = React.ComponentProps<
  typeof DropdownMenuContent
> & {
  /** Title shown in the sheet header on mobile. Required for a11y. */
  title: string
  /** Optional description shown under the title on mobile. */
  description?: string
  /** Hide the visible title on mobile (still announced to screen readers). */
  hideTitle?: boolean
  /** Class applied to the inner item-list wrapper inside the sheet. */
  mobileContentClassName?: string
}

function ResponsiveMenuContent({
  title,
  description,
  hideTitle,
  className,
  mobileContentClassName,
  children,
  ...props
}: ResponsiveMenuContentProps) {
  const { mode } = useResponsiveMenuContext("ResponsiveMenuContent")

  if (mode === "desktop") {
    return (
      <DropdownMenuContent className={className} {...props}>
        {children}
      </DropdownMenuContent>
    )
  }

  return (
    <SheetContent
      side="bottom"
      showCloseButton
      className="rounded-t-2xl pb-safe"
    >
      <SheetHeader className={cn("pb-2", hideTitle && "sr-only")}>
        <SheetTitle>{title}</SheetTitle>
        {description ? (
          <SheetDescription>{description}</SheetDescription>
        ) : null}
      </SheetHeader>
      <div
        className={cn(
          "flex flex-col gap-2 px-2 pb-4",
          mobileContentClassName,
        )}
      >
        {children}
      </div>
    </SheetContent>
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

type MobileItemProps = React.ComponentProps<"button"> & {
  variant?: "default" | "destructive"
  /**
   * Base UI's `render` prop — used in DropdownMenuItem to swap the underlying
   * element (e.g. render as `<Link>`). Mirror it on mobile so call sites can
   * pass the same prop and get a navigable link instead of a button.
   */
  render?: React.ReactElement
  closeOnSelect?: boolean
}

type ResponsiveMenuItemProps = React.ComponentProps<typeof DropdownMenuItem> & {
  /** Whether selecting the item should close the sheet on mobile. Default: true. */
  closeOnSelect?: boolean
}

function ResponsiveMenuItem({
  className,
  closeOnSelect = true,
  onClick,
  ...props
}: ResponsiveMenuItemProps) {
  const { mode, setOpen } = useResponsiveMenuContext("ResponsiveMenuItem")

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      onClick?.(event as never)
      if (closeOnSelect && !event.defaultPrevented && mode === "mobile") {
        setOpen(false)
      }
    },
    [closeOnSelect, mode, onClick, setOpen],
  )

  if (mode === "desktop") {
    return (
      <DropdownMenuItem
        className={className}
        onClick={handleClick}
        {...props}
      />
    )
  }

  // Mobile: render as a styled button (or via `render` slot for links).
  const {
    variant = "default",
    render,
    disabled,
    children,
    ...rest
  } = props as MobileItemProps

  const mobileClassName = cn(
    MOBILE_ITEM_BASE,
    MOBILE_ITEM_DESTRUCTIVE,
    className,
  )

  if (render) {
    const renderProps = render.props as { className?: string }
    return React.cloneElement(
      render,
      {
        "data-slot": "responsive-menu-item",
        "data-variant": variant,
        "aria-disabled": disabled || undefined,
        className: cn(mobileClassName, renderProps.className),
        onClick: handleClick,
      } as Record<string, unknown>,
      children,
    )
  }

  return (
    <button
      type="button"
      data-slot="responsive-menu-item"
      data-variant={variant}
      disabled={disabled}
      className={mobileClassName}
      onClick={handleClick}
      {...(rest as React.ComponentProps<"button">)}
    >
      {children}
    </button>
  )
}

// ─── Checkbox Item ────────────────────────────────────────────────────────────

type ResponsiveMenuCheckboxItemProps = Omit<
  React.ComponentProps<typeof DropdownMenuCheckboxItem>,
  "onCheckedChange"
> & {
  onCheckedChange?: (checked: boolean) => void
  closeOnSelect?: boolean
}

function ResponsiveMenuCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  closeOnSelect = false,
  disabled,
  ...props
}: ResponsiveMenuCheckboxItemProps) {
  const { mode, setOpen } = useResponsiveMenuContext(
    "ResponsiveMenuCheckboxItem",
  )

  if (mode === "desktop") {
    return (
      <DropdownMenuCheckboxItem
        className={className}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange?.(next)}
        disabled={disabled}
        {...props}
      >
        {children}
      </DropdownMenuCheckboxItem>
    )
  }

  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={Boolean(checked)}
      data-slot="responsive-menu-checkbox-item"
      disabled={disabled}
      className={cn(MOBILE_ITEM_BASE, "pr-10", className)}
      onClick={() => {
        onCheckedChange?.(!checked)
        if (closeOnSelect) setOpen(false)
      }}
    >
      {children}
      {checked ? (
        <span
          className="absolute right-3 flex items-center justify-center pointer-events-none"
          data-slot="responsive-menu-checkbox-item-indicator"
        >
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
        </span>
      ) : null}
    </button>
  )
}

// ─── Radio Group / Radio Item ─────────────────────────────────────────────────

type ResponsiveRadioGroupContextValue = {
  value: string | undefined
  onValueChange?: (value: string) => void
} | null

const ResponsiveRadioGroupContext =
  React.createContext<ResponsiveRadioGroupContextValue>(null)

type ResponsiveMenuRadioGroupProps = Omit<
  React.ComponentProps<typeof DropdownMenuRadioGroup>,
  "value" | "onValueChange"
> & {
  value?: string
  onValueChange?: (value: string) => void
}

function ResponsiveMenuRadioGroup({
  value,
  onValueChange,
  children,
  ...props
}: ResponsiveMenuRadioGroupProps) {
  const { mode } = useResponsiveMenuContext("ResponsiveMenuRadioGroup")

  if (mode === "desktop") {
    return (
      <DropdownMenuRadioGroup
        value={value}
        onValueChange={(next) => onValueChange?.(next as string)}
        {...props}
      >
        {children}
      </DropdownMenuRadioGroup>
    )
  }

  return (
    <ResponsiveRadioGroupContext.Provider
      value={{ value, onValueChange }}
    >
      <div role="radiogroup" data-slot="responsive-menu-radio-group">
        {children}
      </div>
    </ResponsiveRadioGroupContext.Provider>
  )
}

type ResponsiveMenuRadioItemProps = React.ComponentProps<
  typeof DropdownMenuRadioItem
> & {
  value: string
  closeOnSelect?: boolean
}

function ResponsiveMenuRadioItem({
  className,
  value,
  children,
  closeOnSelect = false,
  disabled,
  ...props
}: ResponsiveMenuRadioItemProps) {
  const { mode, setOpen } = useResponsiveMenuContext("ResponsiveMenuRadioItem")
  const group = React.useContext(ResponsiveRadioGroupContext)

  if (mode === "desktop") {
    return (
      <DropdownMenuRadioItem
        className={className}
        value={value}
        disabled={disabled}
        {...props}
      >
        {children}
      </DropdownMenuRadioItem>
    )
  }

  const checked = group?.value === value

  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      data-slot="responsive-menu-radio-item"
      disabled={disabled}
      className={cn(MOBILE_ITEM_BASE, "pr-10", className)}
      onClick={() => {
        group?.onValueChange?.(value)
        if (closeOnSelect) setOpen(false)
      }}
    >
      {children}
      {checked ? (
        <span
          className="absolute right-3 flex items-center justify-center pointer-events-none"
          data-slot="responsive-menu-radio-item-indicator"
        >
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
        </span>
      ) : null}
    </button>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────

type ResponsiveMenuLabelProps = React.ComponentProps<typeof DropdownMenuLabel>

function ResponsiveMenuLabel({ className, ...props }: ResponsiveMenuLabelProps) {
  const { mode } = useResponsiveMenuContext("ResponsiveMenuLabel")

  if (mode === "desktop") {
    return <DropdownMenuLabel className={className} {...props} />
  }

  return (
    <div
      data-slot="responsive-menu-label"
      className={cn(
        "px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider",
        className,
      )}
      {...(props as React.ComponentProps<"div">)}
    />
  )
}

// ─── Group ────────────────────────────────────────────────────────────────────

type ResponsiveMenuGroupProps = React.ComponentProps<typeof DropdownMenuGroup>

function ResponsiveMenuGroup({ children, ...props }: ResponsiveMenuGroupProps) {
  const { mode } = useResponsiveMenuContext("ResponsiveMenuGroup")

  if (mode === "desktop") {
    return <DropdownMenuGroup {...props}>{children}</DropdownMenuGroup>
  }

  return (
    <div data-slot="responsive-menu-group" role="group">
      {children}
    </div>
  )
}

// ─── Separator ────────────────────────────────────────────────────────────────

type ResponsiveMenuSeparatorProps = React.ComponentProps<
  typeof DropdownMenuSeparator
>

function ResponsiveMenuSeparator({
  className,
  ...props
}: ResponsiveMenuSeparatorProps) {
  const { mode } = useResponsiveMenuContext("ResponsiveMenuSeparator")

  if (mode === "desktop") {
    return <DropdownMenuSeparator className={className} {...props} />
  }

  return (
    <div
      data-slot="responsive-menu-separator"
      role="separator"
      className={cn("bg-border my-1 h-px", className)}
    />
  )
}

export {
  ResponsiveMenu,
  ResponsiveMenuTrigger,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuCheckboxItem,
  ResponsiveMenuRadioGroup,
  ResponsiveMenuRadioItem,
  ResponsiveMenuLabel,
  ResponsiveMenuGroup,
  ResponsiveMenuSeparator,
}
