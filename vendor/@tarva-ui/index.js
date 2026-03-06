export { COLORS, RADIUS, SPACING, TYPOGRAPHY } from './chunk-4ODDEQQT.js';
export { ThemeProvider, useTarvaTheme, useNextTheme as useTheme } from './chunk-YZVLDZ7G.js';
import { buttonVariants, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './chunk-6TGR22WT.js';
export { Badge, Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, StatusBadge, badgeVariants, buttonVariants, getAllStatuses, getStatusConfig, isStatusRegistered, registerStatus, registerStatuses, resetRegistry, statusBadgeVariants, statusDotVariants, useStatusAnimation } from './chunk-6TGR22WT.js';
export { ANIMATION_PRESETS, DISTANCE, DURATION, EASING, MOTION, OPACITY, SCALE, getReducedMotionSSR, useEntranceAnimation, useReducedMotion } from './chunk-37DUMHLB.js';
import { cn, calculateChange, formatNumber, formatPercent, formatCurrency } from './chunk-SP3FQ3FK.js';
export { cn } from './chunk-SP3FQ3FK.js';
import { cva } from 'class-variance-authority';
import * as React5 from 'react';
import { forwardRef, useRef, useState, useEffect, useMemo, createContext, memo, useContext } from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, ChevronDown, ChevronUp, Minus, TrendingDown, TrendingUp, X, Circle, Search, GripVertical, ChevronRightIcon, CheckIcon, CircleIcon, ArrowLeft, ArrowRight, CalendarIcon, Link2, AlertCircle, Ban, Loader2, ChevronLeft, ChevronRight, XCircle, CheckCircle2, Clock, MoreHorizontal, Inbox, RefreshCw, Sun, Moon, Monitor } from 'lucide-react';
import * as DialogPrimitive2 from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Slot } from '@radix-ui/react-slot';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command as Command$1 } from 'cmdk';
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import useEmblaCarousel from 'embla-carousel-react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { format, parse, isValid } from 'date-fns';
import { DayPicker } from 'react-day-picker';

var alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Alert = forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    role: "alert",
    "data-slot": "alert",
    className: cn(alertVariants({ variant }), className),
    ...props
  }
));
Alert.displayName = "Alert";
var AlertTitle = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "h5",
    {
      ref,
      "data-slot": "alert-title",
      className: cn("mb-1 leading-none font-medium tracking-tight", className),
      ...props
    }
  )
);
AlertTitle.displayName = "AlertTitle";
var AlertDescription = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    "data-slot": "alert-description",
    className: cn("text-sm [&_p]:leading-relaxed", className),
    ...props
  }
));
AlertDescription.displayName = "AlertDescription";
var Avatar = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Root,
  {
    ref,
    "data-slot": "avatar",
    className: cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    ),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
var AvatarImage = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Image,
  {
    ref,
    "data-slot": "avatar-image",
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
var AvatarFallback = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Fallback,
  {
    ref,
    "data-slot": "avatar-fallback",
    className: cn(
      "bg-muted flex h-full w-full items-center justify-center rounded-full",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function CardAction({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-action",
      className: cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      ),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-footer",
      className: cn("flex items-center px-6 [.border-t]:pt-6", className),
      ...props
    }
  );
}
var Checkbox = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    "data-slot": "checkbox",
    className: cn(
      "peer border-muted-foreground/50 dark:border-white/80 focus-visible:ring-ring data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground grid h-4 w-4 shrink-0 place-content-center rounded-sm border shadow focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(
      CheckboxPrimitive.Indicator,
      {
        className: cn("grid place-content-center text-current"),
        children: /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
function Dialog({ ...props }) {
  return /* @__PURE__ */ jsx(DialogPrimitive2.Root, { "data-slot": "dialog", ...props });
}
function DialogTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive2.Trigger, { "data-slot": "dialog-trigger", ...props });
}
function DialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive2.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogClose({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive2.Close, { "data-slot": "dialog-close", ...props });
}
function DialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive2.Overlay,
    {
      "data-slot": "dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      ),
      ...props
    }
  );
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DialogPortal, { "data-slot": "dialog-portal", children: [
    /* @__PURE__ */ jsx(DialogOverlay, {}),
    /* @__PURE__ */ jsxs(
      DialogPrimitive2.Content,
      {
        "data-slot": "dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
          className
        ),
        ...props,
        children: [
          children,
          showCloseButton && /* @__PURE__ */ jsxs(
            DialogPrimitive2.Close,
            {
              "data-slot": "dialog-close",
              className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              children: [
                /* @__PURE__ */ jsx(X, {}),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function DialogFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function DialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive2.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function DialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive2.Description,
    {
      "data-slot": "dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
var inputVariants = cva(
  "flex h-9 w-full rounded-md border bg-background px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-primary focus-visible:border-primary",
        error: "border-destructive text-destructive focus-visible:ring-destructive focus-visible:border-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Input = forwardRef(
  ({ className, type, variant, error, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        "data-slot": "input",
        className: cn(
          inputVariants({ variant: error ? "error" : variant }),
          className
        ),
        ref,
        "aria-invalid": error ? "true" : void 0,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
var labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
var Label = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  LabelPrimitive.Root,
  {
    ref,
    "data-slot": "label",
    className: cn(labelVariants(), className),
    ...props
  }
));
Label.displayName = LabelPrimitive.Root.displayName;
var progressVariants = cva(
  "relative w-full overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3"
      },
      variant: {
        default: "bg-primary/20",
        success: "bg-green-500/20",
        warning: "bg-yellow-500/20",
        danger: "bg-red-500/20",
        info: "bg-blue-500/20"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);
var indicatorVariants = cva(
  "h-full w-full flex-1 transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500",
        info: "bg-blue-500"
      },
      indeterminate: {
        true: "animate-progress-indeterminate",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      indeterminate: false
    }
  }
);
var Progress = forwardRef(({
  className,
  value,
  size,
  variant = "default",
  indeterminate = false,
  showLabel = false,
  label,
  indicatorClassName,
  ...props
}, ref) => {
  const displayValue = indeterminate ? void 0 : value;
  const labelText = label ?? (value !== void 0 ? `${Math.round(value)}%` : "");
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-2", showLabel && "w-full"), children: [
    /* @__PURE__ */ jsx(
      ProgressPrimitive.Root,
      {
        ref,
        "data-slot": "progress",
        className: cn(progressVariants({ size, variant }), className),
        value: displayValue,
        ...props,
        children: /* @__PURE__ */ jsx(
          ProgressPrimitive.Indicator,
          {
            className: cn(
              indicatorVariants({ variant, indeterminate }),
              indicatorClassName
            ),
            style: !indeterminate ? { transform: `translateX(-${100 - (value || 0)}%)` } : void 0
          }
        )
      }
    ),
    showLabel && /* @__PURE__ */ jsx("span", { className: "text-sm tabular-nums text-muted-foreground min-w-[3ch] text-right", children: labelText })
  ] });
});
Progress.displayName = ProgressPrimitive.Root.displayName;
var ScrollArea = forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  ScrollAreaPrimitive.Root,
  {
    ref,
    "data-slot": "scroll-area",
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ jsx(ScrollBar, {}),
      /* @__PURE__ */ jsx(ScrollAreaPrimitive.Corner, {})
    ]
  }
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
var ScrollBar = forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsx(
  ScrollAreaPrimitive.ScrollAreaScrollbar,
  {
    ref,
    orientation,
    "data-slot": "scroll-bar",
    className: cn(
      "flex touch-none transition-colors select-none",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ScrollAreaPrimitive.ScrollAreaThumb, { className: "bg-border relative flex-1 rounded-full" })
  }
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Trigger,
  {
    ref,
    "data-slot": "select-trigger",
    className: cn(
      "border-input ring-offset-background data-[placeholder]:text-muted-foreground focus:ring-ring bg-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    "data-slot": "select-scroll-up-button",
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    "data-slot": "select-scroll-down-button",
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
  SelectPrimitive.Content,
  {
    ref,
    "data-slot": "select-content",
    className: cn(
      "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] origin-[--radix-select-content-transform-origin] overflow-x-hidden overflow-y-auto rounded-md shadow-md",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Label,
  {
    ref,
    "data-slot": "select-label",
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Item,
  {
    ref,
    "data-slot": "select-item",
    className: cn(
      "focus:bg-secondary focus:text-secondary-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Separator,
  {
    ref,
    "data-slot": "select-separator",
    className: cn("bg-muted -mx-1 my-1 h-px", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
var Separator2 = forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(
  SeparatorPrimitive.Root,
  {
    ref,
    "data-slot": "separator",
    decorative,
    orientation,
    className: cn(
      "bg-border shrink-0",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    ),
    ...props
  }
));
Separator2.displayName = SeparatorPrimitive.Root.displayName;
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "skeleton",
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}
var Switch = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    "data-slot": "switch",
    className: cn(
      "peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=unchecked]:bg-input data-[state=unchecked]:border-white/60 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "data-[state=checked]:bg-white data-[state=unchecked]:bg-white/80 pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsx("div", { "data-slot": "table-container", className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsx(
    "table",
    {
      "data-slot": "table",
      className: cn("w-full caption-bottom text-sm", className),
      ...props
    }
  ) });
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b [&_tr]:bg-white/5", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tfoot",
    {
      "data-slot": "table-footer",
      className: cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      ),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "text-muted-foreground h-10 px-3 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCaption({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "caption",
    {
      "data-slot": "table-caption",
      className: cn("text-muted-foreground mt-4 text-sm", className),
      ...props
    }
  );
}
var Tabs = TabsPrimitive.Root;
var TabsList = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.List,
  {
    ref,
    "data-slot": "tabs-list",
    className: cn(
      "bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
var TabsTrigger = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Trigger,
  {
    ref,
    "data-slot": "tabs-trigger",
    className: cn(
      "ring-offset-background focus-visible:ring-ring data-[state=active]:bg-primary data-[state=active]:text-primary-foreground inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
var TabsContent = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Content,
  {
    ref,
    "data-slot": "tabs-content",
    className: cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
var Textarea = forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        "data-slot": "textarea",
        className: cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(TooltipPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    "data-slot": "tooltip-content",
    className: cn(
      "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-[--radix-tooltip-content-transform-origin] overflow-hidden rounded-md px-3 py-1.5 text-xs",
      className
    ),
    ...props
  }
) }));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
function calculateTrend(data) {
  if (data.length < 2) return "neutral";
  const first = data[0];
  const last = data[data.length - 1];
  if (last > first) return "positive";
  if (last < first) return "negative";
  return "neutral";
}
function generatePoints(data, width, height, padding = 2) {
  if (data.length === 0) return "";
  if (data.length === 1) {
    const y = height / 2;
    return `${padding},${y} ${width - padding},${y}`;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  return data.map((value, index) => {
    const x = padding + index / (data.length - 1) * innerWidth;
    const y = padding + innerHeight - (value - min) / range * innerHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}
var VARIANT_COLORS = {
  positive: "var(--trend-positive)",
  negative: "var(--trend-negative)",
  neutral: "var(--trend-neutral)",
  auto: "var(--trend-neutral)"
  // Fallback, will be overridden
};
var Sparkline = forwardRef(
  ({
    data,
    width = 64,
    height = 24,
    strokeWidth = 1.5,
    variant = "auto",
    showFill = false,
    animated = true,
    "aria-label": ariaLabel,
    className,
    style,
    ...props
  }, ref) => {
    const pathRef = useRef(null);
    const [pathLength, setPathLength] = useState(0);
    const resolvedVariant = variant === "auto" ? calculateTrend(data) : variant;
    const strokeColor = VARIANT_COLORS[resolvedVariant];
    const points = generatePoints(data, width, height);
    useEffect(() => {
      if (animated && pathRef.current) {
        const length = pathRef.current.getTotalLength?.() ?? 0;
        setPathLength(length);
      }
    }, [animated, points]);
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = animated && !prefersReducedMotion && pathLength > 0;
    const gradientId = `sparkline-gradient-${Math.random().toString(36).slice(2, 9)}`;
    const label = ariaLabel || `Trend chart showing ${data.length} data points`;
    return /* @__PURE__ */ jsxs(
      "svg",
      {
        ref,
        "data-slot": "sparkline",
        "data-variant": resolvedVariant,
        role: "img",
        "aria-label": label,
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
        className: cn("shrink-0", className),
        style,
        ...props,
        children: [
          /* @__PURE__ */ jsx("title", { children: label }),
          showFill && /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: gradientId, x1: "0", x2: "0", y1: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: strokeColor, stopOpacity: "0.3" }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: strokeColor, stopOpacity: "0" })
          ] }) }),
          showFill && data.length > 1 && /* @__PURE__ */ jsx(
            "polygon",
            {
              points: `${2},${height - 2} ${points} ${width - 2},${height - 2}`,
              fill: `url(#${gradientId})`,
              className: cn(
                shouldAnimate && "animate-fade-in",
                shouldAnimate && "opacity-0"
              ),
              style: shouldAnimate ? {
                animation: `tarva-fade-in var(--duration-slow) var(--ease-out) forwards`,
                animationDelay: "var(--duration-normal)"
              } : void 0
            }
          ),
          /* @__PURE__ */ jsx(
            "polyline",
            {
              ref: pathRef,
              points,
              fill: "none",
              stroke: strokeColor,
              strokeWidth,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              style: shouldAnimate ? {
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength,
                animation: `tarva-sparkline-draw var(--duration-slow) var(--ease-out) forwards`
              } : void 0
            }
          )
        ]
      }
    );
  }
);
Sparkline.displayName = "Sparkline";
var kpiCardVariants = cva(
  "bg-card text-card-foreground relative flex flex-col rounded-xl border shadow-sm transition-shadow hover:shadow-md",
  {
    variants: {
      size: {
        sm: "gap-2 p-3",
        md: "gap-3 p-4",
        lg: "gap-4 p-5"
      },
      glow: {
        true: "",
        false: ""
      }
    },
    compoundVariants: [
      {
        glow: true,
        className: "shadow-[0_0_20px_var(--primary)/0.15]"
      }
    ],
    defaultVariants: {
      size: "md",
      glow: false
    }
  }
);
function formatValue(value, format2, locale) {
  if (typeof value === "string") return value;
  switch (format2) {
    case "currency":
      return formatCurrency(value, { locale });
    case "percentage":
      return formatPercent(value / 100, { locale });
    // Assume value is 0-100
    default:
      return formatNumber(value, { locale });
  }
}
function getTrendDirection(change) {
  if (change == null || change === 0) return "neutral";
  return change > 0 ? "up" : "down";
}
function getTrendColor(direction, higherIsBetter) {
  if (direction === "neutral") return "neutral";
  if (higherIsBetter) {
    return direction === "up" ? "positive" : "negative";
  } else {
    return direction === "up" ? "negative" : "positive";
  }
}
var TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus
};
var TREND_COLORS = {
  positive: "text-[var(--trend-positive)]",
  negative: "text-[var(--trend-negative)]",
  neutral: "text-[var(--trend-neutral)]"
};
var KpiCard = forwardRef(
  ({
    label,
    value,
    previousValue,
    change: explicitChange,
    valueFormat = "number",
    locale = "en-NZ",
    higherIsBetter = true,
    icon,
    sparklineData,
    size = "md",
    glow = false,
    loading = false,
    className,
    ...props
  }, ref) => {
    const change = useMemo(() => {
      if (explicitChange != null) return explicitChange;
      if (previousValue != null && typeof value === "number") {
        return calculateChange(value, previousValue);
      }
      return null;
    }, [explicitChange, previousValue, value]);
    const formattedValue = useMemo(
      () => formatValue(value, valueFormat, locale),
      [value, valueFormat, locale]
    );
    const trendDirection = getTrendDirection(change);
    const trendColor = getTrendColor(trendDirection, higherIsBetter);
    const TrendIcon = TREND_ICONS[trendDirection];
    const sizeClasses = {
      sm: {
        label: "text-xs",
        value: "text-lg font-semibold",
        icon: "h-4 w-4",
        trend: "text-xs",
        sparkline: { width: 48, height: 16 }
      },
      md: {
        label: "text-sm",
        value: "text-2xl font-bold",
        icon: "h-5 w-5",
        trend: "text-sm",
        sparkline: { width: 64, height: 24 }
      },
      lg: {
        label: "text-base",
        value: "text-3xl font-bold",
        icon: "h-6 w-6",
        trend: "text-base",
        sparkline: { width: 80, height: 32 }
      }
    }[size];
    if (loading) {
      return /* @__PURE__ */ jsxs(
        "article",
        {
          ref,
          className: cn(kpiCardVariants({ size, glow }), className),
          ...props,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-24" }),
              icon && /* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-5 rounded" })
            ] }),
            /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-32" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-16" }),
              sparklineData && /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-16" })
            ] })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsxs(
      "article",
      {
        ref,
        "data-slot": "kpi-card",
        className: cn(kpiCardVariants({ size, glow }), className),
        ...props,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: cn("text-muted-foreground font-medium", sizeClasses.label), children: label }),
            icon && /* @__PURE__ */ jsx("span", { className: cn("text-muted-foreground", sizeClasses.icon), children: icon })
          ] }),
          /* @__PURE__ */ jsx("div", { className: cn("text-foreground tabular-nums", sizeClasses.value), children: formattedValue }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            change != null && /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "flex items-center gap-1 font-medium",
                  sizeClasses.trend,
                  TREND_COLORS[trendColor]
                ),
                children: [
                  /* @__PURE__ */ jsx(TrendIcon, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    change > 0 ? "+" : "",
                    change.toFixed(1),
                    "%"
                  ] })
                ]
              }
            ),
            sparklineData && sparklineData.length > 1 && /* @__PURE__ */ jsx(
              Sparkline,
              {
                data: sparklineData,
                width: sizeClasses.sparkline.width,
                height: sizeClasses.sparkline.height,
                variant: change != null ? trendColor === "neutral" ? "neutral" : trendColor === "positive" ? "positive" : "negative" : "auto"
              }
            )
          ] })
        ]
      }
    );
  }
);
KpiCard.displayName = "KpiCard";
var capacityBarVariants = cva("flex flex-col gap-1.5", {
  variants: {
    size: {
      xs: "",
      sm: "",
      md: "",
      lg: ""
    }
  },
  defaultVariants: {
    size: "md"
  }
});
var sizeHeightMap = {
  xs: "h-px",
  // 1px
  sm: "h-0.5",
  // 2px
  md: "h-1",
  // 4px
  lg: "h-2"
  // 8px
};
var DEFAULT_THRESHOLDS = {
  low: 40,
  medium: 60,
  high: 80
};
function getCapacityStatus(percent, thresholds) {
  if (percent <= thresholds.low) return "low";
  if (percent <= thresholds.medium) return "medium";
  if (percent <= thresholds.high) return "high";
  return "critical";
}
function getSegmentStyles(segmentIndex, filledSegments, totalSegments, glow) {
  if (segmentIndex >= filledSegments) {
    return { bg: "bg-muted", glow: "" };
  }
  const segmentPercent = (segmentIndex + 1) / totalSegments * 100;
  if (segmentPercent <= 40) {
    return {
      bg: "bg-[var(--capacity-low)]",
      glow: glow ? "shadow-[0_0_10px_var(--capacity-low)]" : ""
    };
  }
  if (segmentPercent <= 60) {
    return {
      bg: "bg-[var(--capacity-medium)]",
      glow: glow ? "shadow-[0_0_10px_var(--capacity-medium)]" : ""
    };
  }
  if (segmentPercent <= 80) {
    return {
      bg: "bg-[var(--capacity-high)]",
      glow: glow ? "shadow-[0_0_10px_var(--capacity-high)]" : ""
    };
  }
  return {
    bg: "bg-[var(--capacity-critical)]",
    glow: glow ? "shadow-[0_0_12px_var(--capacity-critical)]" : ""
  };
}
function formatValue2(value, max, percent, format2) {
  return format2.replace("{value}", String(value)).replace("{max}", String(max)).replace("{percent}", String(Math.round(percent)));
}
var CapacityBar = forwardRef(
  ({
    value,
    max,
    label,
    showValue = true,
    valueFormat = "{percent}%",
    segments = 5,
    size = "md",
    thresholds = DEFAULT_THRESHOLDS,
    glow = true,
    animated = true,
    "aria-label": ariaLabel,
    className,
    ...props
  }, ref) => {
    const percent = useMemo(() => {
      if (max === 0) return 0;
      return Math.min(100, Math.max(0, value / max * 100));
    }, [value, max]);
    const filledSegments = useMemo(() => {
      return Math.round(percent / 100 * segments);
    }, [percent, segments]);
    const status = useMemo(
      () => getCapacityStatus(percent, thresholds),
      [percent, thresholds]
    );
    const displayValue = useMemo(
      () => formatValue2(value, max, percent, valueFormat),
      [value, max, percent, valueFormat]
    );
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = animated && !prefersReducedMotion;
    const segmentHeight = sizeHeightMap[size] || sizeHeightMap.md;
    const segmentGap = size === "xs" || size === "sm" ? "gap-px" : "gap-0.5";
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        "data-slot": "capacity-bar",
        "data-status": status,
        className: cn(capacityBarVariants({ size }), className),
        ...props,
        children: [
          (label || showValue) && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            label && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-medium", children: label }),
            showValue && /* @__PURE__ */ jsx("span", { className: "text-foreground tabular-nums", children: displayValue })
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              role: "meter",
              "aria-valuenow": value,
              "aria-valuemin": 0,
              "aria-valuemax": max,
              "aria-label": ariaLabel || label || `${Math.round(percent)}% capacity`,
              className: cn("flex w-full", segmentGap),
              children: Array.from({ length: segments }, (_, index) => {
                const isFilled = index < filledSegments;
                const styles = getSegmentStyles(index, filledSegments, segments, glow);
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    "data-slot": "capacity-segment",
                    "data-filled": isFilled || void 0,
                    className: cn(
                      "flex-1 rounded-sm transition-all",
                      segmentHeight,
                      styles.bg,
                      styles.glow,
                      // Animation
                      shouldAnimate && "origin-left",
                      shouldAnimate && isFilled && "animate-[tarva-segment-fill_var(--duration-normal)_var(--ease-out)_forwards]",
                      shouldAnimate && {
                        animationDelay: `${index * 50}ms`
                      }
                    ),
                    style: shouldAnimate && isFilled ? { animationDelay: `${index * 50}ms` } : void 0
                  },
                  index
                );
              })
            }
          )
        ]
      }
    );
  }
);
CapacityBar.displayName = "CapacityBar";
var Accordion = AccordionPrimitive.Root;
var AccordionItem = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Item,
  {
    ref,
    "data-slot": "accordion-item",
    className: cn("border-b", className),
    ...props
  }
));
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs(
  AccordionPrimitive.Trigger,
  {
    ref,
    "data-slot": "accordion-trigger",
    className: cn(
      "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Content,
  {
    ref,
    "data-slot": "accordion-content",
    className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...props,
    children: /* @__PURE__ */ jsx("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogTrigger = AlertDialogPrimitive.Trigger;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Overlay,
  {
    ref,
    "data-slot": "alert-dialog-overlay",
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
var AlertDialogContent = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Content,
    {
      ref,
      "data-slot": "alert-dialog-content",
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
var AlertDialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "alert-dialog-header",
    className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
    ...props
  }
);
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "alert-dialog-footer",
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Title,
  {
    ref,
    "data-slot": "alert-dialog-title",
    className: cn("text-lg font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Description,
  {
    ref,
    "data-slot": "alert-dialog-description",
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Action,
  {
    ref,
    "data-slot": "alert-dialog-action",
    className: cn(buttonVariants(), className),
    ...props
  }
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
var AlertDialogCancel = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    "data-slot": "alert-dialog-cancel",
    className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
var Breadcrumb = forwardRef(
  ({ ...props }, ref) => /* @__PURE__ */ jsx("nav", { ref, "aria-label": "breadcrumb", "data-slot": "breadcrumb", ...props })
);
Breadcrumb.displayName = "Breadcrumb";
var BreadcrumbList = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "ol",
    {
      ref,
      "data-slot": "breadcrumb-list",
      className: cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className
      ),
      ...props
    }
  )
);
BreadcrumbList.displayName = "BreadcrumbList";
var BreadcrumbItem = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "li",
    {
      ref,
      "data-slot": "breadcrumb-item",
      className: cn("inline-flex items-center gap-1.5", className),
      ...props
    }
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";
var BreadcrumbLink = forwardRef(
  ({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        ref,
        "data-slot": "breadcrumb-link",
        className: cn("transition-colors hover:text-foreground", className),
        ...props
      }
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";
var BreadcrumbPage = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "span",
    {
      ref,
      role: "link",
      "aria-disabled": "true",
      "aria-current": "page",
      "data-slot": "breadcrumb-page",
      className: cn("font-normal text-foreground", className),
      ...props
    }
  )
);
BreadcrumbPage.displayName = "BreadcrumbPage";
var BreadcrumbSeparator = ({
  children,
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "li",
  {
    role: "presentation",
    "aria-hidden": "true",
    "data-slot": "breadcrumb-separator",
    className: cn("[&>svg]:h-3.5 [&>svg]:w-3.5", className),
    ...props,
    children: children ?? /* @__PURE__ */ jsx(ChevronRight, {})
  }
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
var BreadcrumbEllipsis = ({ className, ...props }) => /* @__PURE__ */ jsxs(
  "span",
  {
    role: "presentation",
    "aria-hidden": "true",
    "data-slot": "breadcrumb-ellipsis",
    className: cn("flex h-9 w-9 items-center justify-center", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "More" })
    ]
  }
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";
var Collapsible = CollapsiblePrimitive.Root;
var CollapsibleTrigger2 = CollapsiblePrimitive.CollapsibleTrigger;
var CollapsibleContent2 = CollapsiblePrimitive.CollapsibleContent;
var GLOW_RGB_MAP = {
  success: "34, 197, 94",
  warning: "234, 179, 8",
  danger: "239, 68, 68",
  info: "59, 130, 246",
  neutral: "156, 163, 175"
};
var drawerContentVariants = cva(
  "fixed inset-y-0 z-50 flex h-full flex-col border bg-background shadow-lg transition-transform duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        right: "right-0 rounded-tl-[24px] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        left: "left-0 rounded-tr-[24px] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
var Drawer = DialogPrimitive2.Root;
var DrawerTrigger = DialogPrimitive2.Trigger;
var DrawerClose = DialogPrimitive2.Close;
var DrawerPortal = DialogPrimitive2.Portal;
var DrawerOverlay = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive2.Overlay,
  {
    ref,
    "data-slot": "drawer-overlay",
    className: cn(
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DrawerOverlay.displayName = DialogPrimitive2.Overlay.displayName;
var DrawerContent = forwardRef(({ className, children, width = 400, side, state = "neutral", showClose = true, style, ...props }, ref) => {
  const glowRgb = GLOW_RGB_MAP[state];
  const glowStyle = {
    width: typeof width === "number" ? `${width}px` : width,
    "--drawer-glow-rgb": glowRgb,
    ...state !== "neutral" && {
      boxShadow: `0 0 30px -5px rgba(${glowRgb}, 0.3)`
    },
    ...style
  };
  return /* @__PURE__ */ jsxs(DrawerPortal, { children: [
    /* @__PURE__ */ jsx(DrawerOverlay, {}),
    /* @__PURE__ */ jsxs(
      DialogPrimitive2.Content,
      {
        ref,
        "data-slot": "drawer-content",
        "data-state-type": state,
        className: cn(drawerContentVariants({ side }), className),
        style: glowStyle,
        ...props,
        children: [
          children,
          showClose && /* @__PURE__ */ jsxs(
            DialogPrimitive2.Close,
            {
              "data-slot": "drawer-close",
              className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
              children: [
                /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
});
DrawerContent.displayName = DialogPrimitive2.Content.displayName;
var DrawerHeader = ({
  className,
  showGlow = false,
  children,
  ...props
}) => /* @__PURE__ */ jsxs(
  "div",
  {
    "data-slot": "drawer-header",
    className: cn("relative flex flex-col space-y-1.5 border-b px-6 py-4", className),
    ...props,
    children: [
      showGlow && /* @__PURE__ */ jsx(
        "div",
        {
          className: "pointer-events-none absolute inset-0 opacity-50",
          style: {
            background: `radial-gradient(circle at 0% 0%, rgba(var(--drawer-glow-rgb), 0.35) 0%, transparent 70%)`
          }
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "relative", children })
    ]
  }
);
DrawerHeader.displayName = "DrawerHeader";
var DrawerBody = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "drawer-body",
    className: cn(
      "flex-1 overflow-y-auto px-6 py-4",
      "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15",
      className
    ),
    ...props
  }
);
DrawerBody.displayName = "DrawerBody";
var DrawerFooter = ({
  className,
  sticky = false,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "drawer-footer",
    className: cn(
      "flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end",
      sticky && "sticky bottom-0 z-[1] bg-card",
      className
    ),
    ...props
  }
);
DrawerFooter.displayName = "DrawerFooter";
var DrawerTitle = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive2.Title,
  {
    ref,
    "data-slot": "drawer-title",
    className: cn("text-[1.75rem] font-semibold leading-tight tracking-tight", className),
    ...props
  }
));
DrawerTitle.displayName = DialogPrimitive2.Title.displayName;
var DrawerDescription = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive2.Description,
  {
    ref,
    "data-slot": "drawer-description",
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DrawerDescription.displayName = DialogPrimitive2.Description.displayName;
var statusColors = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-gray-500"
};
var DrawerStatus = ({
  className,
  status,
  children,
  ...props
}) => /* @__PURE__ */ jsxs(
  "div",
  {
    "data-slot": "drawer-status",
    className: cn("flex items-center gap-2 text-sm", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: cn("h-2 w-2 rounded-full", statusColors[status]) }),
      children
    ]
  }
);
DrawerStatus.displayName = "DrawerStatus";
var DrawerSectionTitle = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "h4",
  {
    "data-slot": "drawer-section-title",
    className: cn("mb-2 text-sm font-medium text-muted-foreground", className),
    ...props
  }
);
DrawerSectionTitle.displayName = "DrawerSectionTitle";
var DrawerField = ({
  className,
  label,
  value,
  children,
  ...props
}) => /* @__PURE__ */ jsxs(
  "div",
  {
    "data-slot": "drawer-field",
    className: cn("py-2", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx("dt", { className: "text-sm text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("dd", { className: "mt-1 text-sm font-medium", children: children ?? value ?? "-" })
    ]
  }
);
DrawerField.displayName = "DrawerField";
var emptyStateVariants = cva(
  "flex flex-col items-center justify-center px-4 text-center",
  {
    variants: {
      size: {
        sm: "py-6",
        default: "py-12",
        lg: "py-16"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
);
var iconSizeClasses = {
  sm: "h-8 w-8",
  default: "h-12 w-12",
  lg: "h-16 w-16"
};
var iconInnerSizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8"
};
function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
  className
}) {
  const sizeKey = size ?? "default";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "empty-state",
      className: cn(emptyStateVariants({ size }), className),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "mb-4 flex items-center justify-center rounded-full bg-muted text-muted-foreground",
              iconSizeClasses[sizeKey]
            ),
            children: icon ?? /* @__PURE__ */ jsx(Inbox, { className: iconInnerSizeClasses[sizeKey] })
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: title }),
        description && /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-sm text-sm text-muted-foreground", children: description }),
        action && /* @__PURE__ */ jsx("div", { className: "mt-4", children: action })
      ]
    }
  );
}
var errorStateVariants = cva(
  "flex flex-col items-center justify-center px-4 text-center",
  {
    variants: {
      size: {
        sm: "py-6",
        default: "py-12",
        lg: "py-16"
      },
      fullPage: {
        true: "min-h-[400px]",
        false: ""
      }
    },
    defaultVariants: {
      size: "default",
      fullPage: false
    }
  }
);
var iconSizeClasses2 = {
  sm: "h-8 w-8",
  default: "h-12 w-12",
  lg: "h-16 w-16"
};
var iconInnerSizeClasses2 = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8"
};
function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryLabel = "Try again",
  icon,
  size = "default",
  fullPage = false,
  className
}) {
  const sizeKey = size ?? "default";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "error-state",
      className: cn(errorStateVariants({ size, fullPage }), className),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "mb-4 flex items-center justify-center rounded-full bg-destructive/10 text-destructive",
              iconSizeClasses2[sizeKey]
            ),
            children: icon ?? /* @__PURE__ */ jsx(AlertCircle, { className: iconInnerSizeClasses2[sizeKey] })
          }
        ),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: title }),
        message && /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-sm text-sm text-muted-foreground", children: message }),
        onRetry && /* @__PURE__ */ jsxs(Button, { onClick: onRetry, variant: "outline", className: "mt-4 gap-2", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
          retryLabel
        ] })
      ]
    }
  );
}
function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
  className
}) {
  return /* @__PURE__ */ jsxs("div", { "data-slot": "form-field", className: cn("space-y-2", className), children: [
    label && /* @__PURE__ */ jsxs(
      Label,
      {
        htmlFor,
        className: cn(error && "text-destructive"),
        children: [
          label,
          required && /* @__PURE__ */ jsx("span", { className: "ml-1 text-destructive", children: "*" })
        ]
      }
    ),
    children,
    description && !error && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: description }),
    error && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 text-sm text-destructive", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-3.5 w-3.5 shrink-0" }),
      error
    ] })
  ] });
}
var spinnerSizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8"
};
var dotSizeClasses = {
  sm: "h-1.5 w-1.5",
  default: "h-2 w-2",
  lg: "h-2.5 w-2.5"
};
function LoadingState({
  variant = "spinner",
  message,
  size = "default",
  rows = 3,
  className
}) {
  if (variant === "skeleton") {
    return /* @__PURE__ */ jsx("div", { "data-slot": "loading-state", className: cn("space-y-3", className), children: Array.from({ length: rows }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-full" }, i)) });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "loading-state",
      className: cn(
        "flex flex-col items-center justify-center gap-3 py-8",
        className
      ),
      children: [
        variant === "spinner" && /* @__PURE__ */ jsx(
          Loader2,
          {
            className: cn("animate-spin text-primary", spinnerSizeClasses[size])
          }
        ),
        variant === "dots" && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx(
          "span",
          {
            className: cn(
              "animate-pulse rounded-full bg-primary",
              dotSizeClasses[size]
            ),
            style: { animationDelay: `${i * 150}ms` }
          },
          i
        )) }),
        message && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: message })
      ]
    }
  );
}
function PageLoading({ message = "Loading..." }) {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-[400px] items-center justify-center", children: /* @__PURE__ */ jsx(LoadingState, { variant: "spinner", message, size: "lg" }) });
}
var Pagination = ({ className, ...props }) => /* @__PURE__ */ jsx(
  "nav",
  {
    role: "navigation",
    "aria-label": "pagination",
    "data-slot": "pagination",
    className: cn("mx-auto flex w-full justify-center", className),
    ...props
  }
);
Pagination.displayName = "Pagination";
var PaginationContent = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "ul",
    {
      ref,
      "data-slot": "pagination-content",
      className: cn("flex flex-row items-center gap-1", className),
      ...props
    }
  )
);
PaginationContent.displayName = "PaginationContent";
var PaginationItem = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "li",
    {
      ref,
      "data-slot": "pagination-item",
      className: cn("", className),
      ...props
    }
  )
);
PaginationItem.displayName = "PaginationItem";
var PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}) => /* @__PURE__ */ jsx(
  "a",
  {
    "aria-current": isActive ? "page" : void 0,
    "data-slot": "pagination-link",
    className: cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size
      }),
      className
    ),
    ...props
  }
);
PaginationLink.displayName = "PaginationLink";
var PaginationPrevious = ({
  className,
  size,
  ...props
}) => /* @__PURE__ */ jsxs(
  PaginationLink,
  {
    "aria-label": "Go to previous page",
    size: size ?? "default",
    className: cn("gap-1 pl-2.5", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { children: "Previous" })
    ]
  }
);
PaginationPrevious.displayName = "PaginationPrevious";
var PaginationNext = ({
  className,
  size,
  ...props
}) => /* @__PURE__ */ jsxs(
  PaginationLink,
  {
    "aria-label": "Go to next page",
    size: size ?? "default",
    className: cn("gap-1 pr-2.5", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { children: "Next" }),
      /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
    ]
  }
);
PaginationNext.displayName = "PaginationNext";
var PaginationEllipsis = ({ className, ...props }) => /* @__PURE__ */ jsxs(
  "span",
  {
    "aria-hidden": true,
    "data-slot": "pagination-ellipsis",
    className: cn("flex h-9 w-9 items-center justify-center", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "More pages" })
    ]
  }
);
PaginationEllipsis.displayName = "PaginationEllipsis";
var RadioGroup = forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    RadioGroupPrimitive.Root,
    {
      ref,
      "data-slot": "radio-group",
      className: cn("grid gap-2", className),
      ...props
    }
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
var RadioGroupItem = forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    RadioGroupPrimitive.Item,
    {
      ref,
      "data-slot": "radio-group-item",
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx(Circle, { className: "h-2.5 w-2.5 fill-primary text-primary" }) })
    }
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
var Slider = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxs(
    SliderPrimitive.Root,
    {
      ref,
      "data-slot": "slider",
      className: cn(
        "relative flex w-full touch-none select-none items-center",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(SliderPrimitive.Track, { className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20", children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: "absolute h-full bg-primary" }) }),
        /* @__PURE__ */ jsx(SliderPrimitive.Thumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })
      ]
    }
  )
);
Slider.displayName = SliderPrimitive.Root.displayName;
function ThemeToggle({
  variant = "dropdown",
  showLabel = false,
  className
}) {
  const [theme, setTheme] = useState("system");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored) {
      setTheme(stored);
    }
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    localStorage.setItem("theme", theme);
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }, [theme, mounted]);
  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);
  const cycleTheme = () => {
    const order = ["light", "dark", "system"];
    const currentIndex = order.indexOf(theme);
    const nextIndex = (currentIndex + 1) % order.length;
    const nextTheme = order[nextIndex] ?? "system";
    setTheme(nextTheme);
  };
  const getIcon = () => {
    if (theme === "dark") return /* @__PURE__ */ jsx(Moon, { className: "h-4 w-4" });
    if (theme === "light") return /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4" });
    return /* @__PURE__ */ jsx(Monitor, { className: "h-4 w-4" });
  };
  const getLabel = () => {
    if (theme === "dark") return "Dark";
    if (theme === "light") return "Light";
    return "System";
  };
  if (!mounted) {
    return /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "icon", className, disabled: true, children: [
      /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Toggle theme" })
    ] });
  }
  if (variant === "cycle") {
    return /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: "icon",
        onClick: cycleTheme,
        className,
        "data-slot": "theme-toggle",
        children: [
          getIcon(),
          /* @__PURE__ */ jsxs("span", { className: "sr-only", children: [
            "Toggle theme (",
            getLabel(),
            ")"
          ] })
        ]
      }
    );
  }
  if (variant === "sidebar") {
    return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
      /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: showLabel ? "default" : "icon",
          className: cn(showLabel && "justify-start gap-2", className),
          "data-slot": "theme-toggle",
          children: [
            getIcon(),
            showLabel && /* @__PURE__ */ jsx("span", { children: getLabel() }),
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Toggle theme" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-32", children: [
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("light"), children: [
          /* @__PURE__ */ jsx(Sun, { className: "mr-2 h-4 w-4" }),
          "Light"
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("dark"), children: [
          /* @__PURE__ */ jsx(Moon, { className: "mr-2 h-4 w-4" }),
          "Dark"
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("system"), children: [
          /* @__PURE__ */ jsx(Monitor, { className: "mr-2 h-4 w-4" }),
          "System"
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: "icon",
        className,
        "data-slot": "theme-toggle",
        children: [
          /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" }),
          /* @__PURE__ */ jsx(Moon, { className: "absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Toggle theme" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("light"), children: [
        /* @__PURE__ */ jsx(Sun, { className: "mr-2 h-4 w-4" }),
        "Light"
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("dark"), children: [
        /* @__PURE__ */ jsx(Moon, { className: "mr-2 h-4 w-4" }),
        "Dark"
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setTheme("system"), children: [
        /* @__PURE__ */ jsx(Monitor, { className: "mr-2 h-4 w-4" }),
        "System"
      ] })
    ] })
  ] });
}
var Popover = PopoverPrimitive.Root;
var PopoverTrigger = PopoverPrimitive.Trigger;
var PopoverAnchor = PopoverPrimitive.Anchor;
var PopoverContent = forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  PopoverPrimitive.Content,
  {
    ref,
    "data-slot": "popover-content",
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
var sheetContentVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
var Sheet = DialogPrimitive2.Root;
var SheetTrigger = DialogPrimitive2.Trigger;
var SheetClose = DialogPrimitive2.Close;
var SheetPortal = DialogPrimitive2.Portal;
var SheetOverlay = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive2.Overlay,
  {
    ref,
    "data-slot": "sheet-overlay",
    className: cn(
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
SheetOverlay.displayName = DialogPrimitive2.Overlay.displayName;
var SheetContent = forwardRef(({ side = "right", className, children, hideCloseButton = false, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive2.Content,
    {
      ref,
      "data-slot": "sheet-content",
      className: cn(sheetContentVariants({ side }), className),
      ...props,
      children: [
        children,
        !hideCloseButton && /* @__PURE__ */ jsxs(
          DialogPrimitive2.Close,
          {
            "data-slot": "sheet-close",
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
            children: [
              /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
            ]
          }
        )
      ]
    }
  )
] }));
SheetContent.displayName = DialogPrimitive2.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "sheet-header",
    className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "sheet-footer",
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
SheetFooter.displayName = "SheetFooter";
var SheetTitle = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive2.Title,
  {
    ref,
    "data-slot": "sheet-title",
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = DialogPrimitive2.Title.displayName;
var SheetDescription = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive2.Description,
  {
    ref,
    "data-slot": "sheet-description",
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = DialogPrimitive2.Description.displayName;
var FullScreenSheet = ({
  open,
  onClose,
  title,
  headerActions,
  children,
  className,
  ...props
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        "data-slot": "fullscreen-sheet-backdrop",
        className: "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in-0",
        onClick: onClose,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        "data-slot": "fullscreen-sheet",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "fullscreen-sheet-title",
        className: cn(
          "fixed inset-0 z-50 flex flex-col bg-background",
          "animate-in slide-in-from-bottom duration-300",
          className
        ),
        ...props,
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              "data-slot": "fullscreen-sheet-header",
              className: "flex items-center justify-between border-b px-4 py-3",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: onClose,
                      className: "rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "aria-label": "Close",
                      children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "h2",
                    {
                      id: "fullscreen-sheet-title",
                      className: "text-lg font-semibold",
                      children: title
                    }
                  )
                ] }),
                headerActions && /* @__PURE__ */ jsx("div", { "data-slot": "fullscreen-sheet-actions", children: headerActions })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              "data-slot": "fullscreen-sheet-content",
              className: "flex-1 overflow-y-auto",
              children
            }
          )
        ]
      }
    )
  ] });
};
FullScreenSheet.displayName = "FullScreenSheet";
var FullScreenSheetContent = ({
  className,
  children,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "fullscreen-sheet-inner-content",
    className: cn("p-4", className),
    ...props,
    children
  }
);
FullScreenSheetContent.displayName = "FullScreenSheetContent";
var Command = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1,
  {
    ref,
    "data-slot": "command",
    className: cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    ),
    ...props
  }
));
Command.displayName = Command$1.displayName;
var CommandDialog = ({
  children,
  title = "Command palette",
  ...props
}) => {
  return /* @__PURE__ */ jsx(Dialog, { ...props, children: /* @__PURE__ */ jsxs(DialogContent, { className: "overflow-hidden p-0 shadow-lg", children: [
    /* @__PURE__ */ jsx(DialogTitle, { className: "sr-only", children: title }),
    /* @__PURE__ */ jsx(
      Command,
      {
        className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
        children
      }
    )
  ] }) });
};
var CommandInput = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs("div", { className: "flex items-center border-b px-3", "cmdk-input-wrapper": "", children: [
  /* @__PURE__ */ jsx(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }),
  /* @__PURE__ */ jsx(
    Command$1.Input,
    {
      ref,
      "data-slot": "command-input",
      className: cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  )
] }));
CommandInput.displayName = Command$1.Input.displayName;
var CommandList = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.List,
  {
    ref,
    "data-slot": "command-list",
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = Command$1.List.displayName;
var CommandEmpty = forwardRef((props, ref) => /* @__PURE__ */ jsx(
  Command$1.Empty,
  {
    ref,
    "data-slot": "command-empty",
    className: "py-6 text-center text-sm",
    ...props
  }
));
CommandEmpty.displayName = Command$1.Empty.displayName;
var CommandGroup = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Group,
  {
    ref,
    "data-slot": "command-group",
    className: cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = Command$1.Group.displayName;
var CommandSeparator = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Separator,
  {
    ref,
    "data-slot": "command-separator",
    className: cn("-mx-1 h-px bg-border", className),
    ...props
  }
));
CommandSeparator.displayName = Command$1.Separator.displayName;
var CommandItem = forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Command$1.Item,
  {
    ref,
    "data-slot": "command-item",
    className: cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    ),
    ...props
  }
));
CommandItem.displayName = Command$1.Item.displayName;
var CommandShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx(
    "span",
    {
      "data-slot": "command-shortcut",
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      ),
      ...props
    }
  );
};
CommandShortcut.displayName = "CommandShortcut";
var WizardContext = createContext(null);
var useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("Wizard components must be used within a Wizard");
  }
  return context;
};
var Wizard = forwardRef(
  ({ currentStep, totalSteps, className, children, ...props }, ref) => /* @__PURE__ */ jsx(WizardContext.Provider, { value: { currentStep, totalSteps }, children: /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-slot": "wizard",
      className: cn("flex h-full flex-col", className),
      ...props,
      children
    }
  ) })
);
Wizard.displayName = "Wizard";
var WizardHeader = ({
  title,
  onClose,
  showStepIndicators = true,
  className,
  ...props
}) => {
  const { currentStep, totalSteps } = useWizard();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "wizard-header",
      className: cn("flex items-center justify-between border-b px-6 py-4", className),
      ...props,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          title && /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: title }),
          showStepIndicators && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "Step ",
            currentStep,
            " of ",
            totalSteps
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          showStepIndicators && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: Array.from({ length: totalSteps }, (_, i) => {
            const step = i + 1;
            const isCompleted = step < currentStep;
            const isActive = step === currentStep;
            return /* @__PURE__ */ jsx(
              StepIndicator,
              {
                step,
                isCompleted,
                isActive
              },
              step
            );
          }) }),
          onClose && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "aria-label": "Close wizard",
              children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
            }
          )
        ] })
      ]
    }
  );
};
WizardHeader.displayName = "WizardHeader";
var StepIndicator = ({
  step,
  isCompleted = false,
  isActive = false,
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "step-indicator",
    className: cn(
      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
      isCompleted && "bg-primary text-primary-foreground",
      isActive && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
      !isCompleted && !isActive && "bg-muted text-muted-foreground",
      className
    ),
    ...props,
    children: isCompleted ? /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) : step
  }
);
StepIndicator.displayName = "StepIndicator";
var WizardContent = ({
  className,
  children,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    "data-slot": "wizard-content",
    className: cn("flex-1 overflow-y-auto px-6 py-6", className),
    ...props,
    children
  }
);
WizardContent.displayName = "WizardContent";
var WizardFooter = ({
  onBack,
  onNext,
  onCancel,
  isBackDisabled = false,
  isNextDisabled = false,
  isLoading = false,
  nextLabel = "Next",
  backLabel = "Back",
  cancelLabel = "Cancel",
  showCancel = false,
  className,
  ...props
}) => {
  const { currentStep, totalSteps } = useWizard();
  const isLastStep = currentStep === totalSteps;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "wizard-footer",
      className: cn(
        "flex items-center justify-between border-t px-6 py-4",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx("div", { children: showCancel && onCancel && /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: onCancel, children: cancelLabel }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          onBack && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: onBack,
              disabled: isBackDisabled || isLoading,
              children: [
                /* @__PURE__ */ jsx(ChevronLeft, { className: "mr-1 h-4 w-4" }),
                backLabel
              ]
            }
          ),
          onNext && /* @__PURE__ */ jsx(
            Button,
            {
              onClick: onNext,
              disabled: isNextDisabled || isLoading,
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                "Loading..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                isLastStep ? "Finish" : nextLabel,
                !isLastStep && /* @__PURE__ */ jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
              ] })
            }
          )
        ] })
      ]
    }
  );
};
WizardFooter.displayName = "WizardFooter";
var KanbanContext = createContext(null);
function KanbanBoard({
  columns,
  onDragEnd,
  renderCard,
  className,
  columnClassName,
  ...props
}) {
  const [mounted, setMounted] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  useEffect(() => {
    setMounted(true);
  }, []);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const handleDragStart = (event) => {
    const { active } = event;
    const activeId = active.id;
    for (const column of columns) {
      const item = column.items.find((i) => i.id === activeId);
      if (item) {
        setActiveItem(item);
        break;
      }
    }
  };
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    let fromColumnId = null;
    for (const column of columns) {
      if (column.items.some((i) => i.id === activeId)) {
        fromColumnId = column.id;
        break;
      }
    }
    if (!fromColumnId) return;
    let toColumnId;
    let newIndex;
    const targetColumn = columns.find((c) => c.id === overId);
    if (targetColumn) {
      toColumnId = targetColumn.id;
      newIndex = targetColumn.items.length;
    } else {
      for (const column of columns) {
        const itemIndex = column.items.findIndex((i) => i.id === overId);
        if (itemIndex !== -1) {
          toColumnId = column.id;
          newIndex = itemIndex;
          break;
        }
      }
    }
    if (toColumnId !== void 0 && newIndex !== void 0) {
      onDragEnd(activeId, fromColumnId, toColumnId, newIndex);
    }
  };
  if (!mounted) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        "data-slot": "kanban-board",
        className: cn("flex gap-4 overflow-x-auto p-4", className),
        ...props,
        children: columns.map((column) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "flex w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/30",
              columnClassName
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-b p-3", children: [
                column.color && /* @__PURE__ */ jsx("div", { className: cn("h-3 w-3 rounded-full", column.color) }),
                /* @__PURE__ */ jsx("h3", { className: "font-medium", children: column.title }),
                /* @__PURE__ */ jsx("span", { className: "ml-auto text-sm text-muted-foreground", children: column.items.length })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2 p-2", children: column.items.map((item) => /* @__PURE__ */ jsx("div", { children: renderCard(item) }, item.id)) })
            ]
          },
          column.id
        ))
      }
    );
  }
  return /* @__PURE__ */ jsx(KanbanContext.Provider, { value: { activeItem, renderCard }, children: /* @__PURE__ */ jsxs(
    DndContext,
    {
      sensors,
      collisionDetection: closestCorners,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            "data-slot": "kanban-board",
            className: cn("flex gap-4 overflow-x-auto p-4", className),
            ...props,
            children: columns.map((column) => /* @__PURE__ */ jsx(
              KanbanColumnComponent,
              {
                column,
                renderCard,
                className: columnClassName
              },
              column.id
            ))
          }
        ),
        /* @__PURE__ */ jsx(DragOverlay, { children: activeItem ? /* @__PURE__ */ jsx("div", { className: "opacity-80", children: renderCard(activeItem) }) : null })
      ]
    }
  ) });
}
function KanbanColumnComponent({
  column,
  renderCard,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "kanban-column",
      className: cn(
        "flex w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/30",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-b p-3", children: [
          column.color && /* @__PURE__ */ jsx("div", { className: cn("h-3 w-3 rounded-full", column.color) }),
          /* @__PURE__ */ jsx("h3", { className: "font-medium", children: column.title }),
          /* @__PURE__ */ jsx("span", { className: "ml-auto text-sm text-muted-foreground", children: column.items.length })
        ] }),
        /* @__PURE__ */ jsx(
          SortableContext,
          {
            items: column.items.map((i) => i.id),
            strategy: verticalListSortingStrategy,
            id: column.id,
            children: /* @__PURE__ */ jsx("div", { className: "flex min-h-[100px] flex-col gap-2 p-2", children: column.items.map((item) => /* @__PURE__ */ jsx(SortableItem, { id: item.id, children: renderCard(item) }, item.id)) })
          }
        )
      ]
    }
  );
}
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return /* @__PURE__ */ jsx("div", { ref: setNodeRef, style, ...attributes, ...listeners, children });
}
var KanbanCard = forwardRef(
  ({ className, isDragging, children, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-slot": "kanban-card",
      className: cn(
        "rounded-md border bg-card p-3 shadow-sm transition-shadow",
        "hover:shadow-md",
        isDragging && "ring-2 ring-primary shadow-lg",
        className
      ),
      ...props,
      children
    }
  )
);
KanbanCard.displayName = "KanbanCard";
var KanbanCardHandle = forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      "data-slot": "kanban-card-handle",
      className: cn(
        "cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(GripVertical, { className: "h-4 w-4" })
    }
  )
);
KanbanCardHandle.displayName = "KanbanCardHandle";
var HoverCard = HoverCardPrimitive.Root;
var HoverCardTrigger = HoverCardPrimitive.Trigger;
var HoverCardContent = React5.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(
  HoverCardPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
var toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2",
        lg: "h-10 px-3"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Toggle = React5.forwardRef(({ className, variant, size, ...props }, ref) => /* @__PURE__ */ jsx(
  TogglePrimitive.Root,
  {
    ref,
    className: cn(toggleVariants({ variant, size, className })),
    ...props
  }
));
Toggle.displayName = TogglePrimitive.Root.displayName;
var ToggleGroupContext = React5.createContext({
  size: "default",
  variant: "default"
});
var ToggleGroup = React5.forwardRef(({ className, variant, size, children, ...props }, ref) => /* @__PURE__ */ jsx(
  ToggleGroupPrimitive.Root,
  {
    ref,
    className: cn("flex items-center justify-center gap-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ToggleGroupContext.Provider, { value: { variant, size }, children })
  }
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;
var ToggleGroupItem = React5.forwardRef(({ className, children, variant, size, ...props }, ref) => {
  const context = React5.useContext(ToggleGroupContext);
  return /* @__PURE__ */ jsx(
    ToggleGroupPrimitive.Item,
    {
      ref,
      className: cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size
        }),
        className
      ),
      ...props,
      children
    }
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
var ContextMenu = ContextMenuPrimitive.Root;
var ContextMenuTrigger = ContextMenuPrimitive.Trigger;
var ContextMenuGroup = ContextMenuPrimitive.Group;
var ContextMenuPortal = ContextMenuPrimitive.Portal;
var ContextMenuSub = ContextMenuPrimitive.Sub;
var ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
var ContextMenuSubTrigger = React5.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  ContextMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRightIcon, { className: "ml-auto h-4 w-4" })
    ]
  }
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;
var ContextMenuSubContent = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ContextMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;
var ContextMenuContent = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ContextMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  ContextMenuPrimitive.Content,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;
var ContextMenuItem = React5.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  ContextMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
var ContextMenuCheckboxItem = React5.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  ContextMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;
var ContextMenuRadioItem = React5.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  ContextMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CircleIcon, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;
var ContextMenuLabel = React5.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  ContextMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;
var ContextMenuSeparator = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ContextMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-border", className),
    ...props
  }
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;
var ContextMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      ),
      ...props
    }
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";
var CarouselContext = React5.createContext(null);
function useCarousel() {
  const context = React5.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}
var Carousel = React5.forwardRef(
  ({
    orientation = "horizontal",
    opts,
    setApi,
    plugins,
    className,
    children,
    ...props
  }, ref) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y"
      },
      plugins
    );
    const [canScrollPrev, setCanScrollPrev] = React5.useState(false);
    const [canScrollNext, setCanScrollNext] = React5.useState(false);
    const onSelect = React5.useCallback((api2) => {
      if (!api2) {
        return;
      }
      setCanScrollPrev(api2.canScrollPrev());
      setCanScrollNext(api2.canScrollNext());
    }, []);
    const scrollPrev = React5.useCallback(() => {
      api?.scrollPrev();
    }, [api]);
    const scrollNext = React5.useCallback(() => {
      api?.scrollNext();
    }, [api]);
    const handleKeyDown = React5.useCallback(
      (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );
    React5.useEffect(() => {
      if (!api || !setApi) {
        return;
      }
      setApi(api);
    }, [api, setApi]);
    React5.useEffect(() => {
      if (!api) {
        return;
      }
      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);
      return () => {
        api?.off("select", onSelect);
      };
    }, [api, onSelect]);
    return /* @__PURE__ */ jsx(
      CarouselContext.Provider,
      {
        value: {
          carouselRef,
          api,
          opts,
          orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext
        },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            ref,
            onKeyDownCapture: handleKeyDown,
            className: cn("relative", className),
            role: "region",
            "aria-roledescription": "carousel",
            ...props,
            children
          }
        )
      }
    );
  }
);
Carousel.displayName = "Carousel";
var CarouselContent = React5.forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();
  return /* @__PURE__ */ jsx("div", { ref: carouselRef, className: "overflow-hidden", children: /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn(
        "flex",
        orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
        className
      ),
      ...props
    }
  ) });
});
CarouselContent.displayName = "CarouselContent";
var CarouselItem = React5.forwardRef(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      role: "group",
      "aria-roledescription": "slide",
      className: cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      ),
      ...props
    }
  );
});
CarouselItem.displayName = "CarouselItem";
var CarouselPrevious = React5.forwardRef(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  return /* @__PURE__ */ jsxs(
    Button,
    {
      ref,
      variant,
      size,
      className: cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal" ? "-left-12 top-1/2 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      ),
      disabled: !canScrollPrev,
      onClick: scrollPrev,
      ...props,
      children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Previous slide" })
      ]
    }
  );
});
CarouselPrevious.displayName = "CarouselPrevious";
var CarouselNext = React5.forwardRef(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  return /* @__PURE__ */ jsxs(
    Button,
    {
      ref,
      variant,
      size,
      className: cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal" ? "-right-12 top-1/2 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      ),
      disabled: !canScrollNext,
      onClick: scrollNext,
      ...props,
      children: [
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Next slide" })
      ]
    }
  );
});
CarouselNext.displayName = "CarouselNext";
var ResizablePanelGroup = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  Group,
  {
    className: cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    ),
    ...props
  }
);
var ResizablePanel = Panel;
var ResizableHandle = ({
  withHandle,
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  Separator,
  {
    className: cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    ),
    ...props,
    children: withHandle && /* @__PURE__ */ jsx("div", { className: "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border", children: /* @__PURE__ */ jsx(GripVertical, { className: "h-2.5 w-2.5" }) })
  }
);
var StickyActionBar = React5.forwardRef(
  ({
    leftContent,
    primaryAction,
    secondaryAction,
    visible = true,
    className
  }, ref) => {
    if (!visible) {
      return null;
    }
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "flex items-center gap-3 px-4 py-3",
          "bg-background/80 backdrop-blur-lg border-t border-border",
          "transition-transform duration-200",
          className
        ),
        style: {
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))"
        },
        children: [
          leftContent && /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0 truncate text-sm text-muted-foreground", children: leftContent }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            secondaryAction,
            primaryAction
          ] })
        ]
      }
    );
  }
);
StickyActionBar.displayName = "StickyActionBar";
var COLOR_CONFIG = {
  green: { fill: "#22c55e", glow: "#22c55e" },
  red: { fill: "#ef4444", glow: "#ef4444" },
  blue: { fill: "#3b82f6", glow: "#3b82f6" },
  orange: { fill: "#f97316", glow: "#f97316" },
  neutral: { fill: "#94a3b8", glow: "#94a3b8" }
};
var BarChart = React5.forwardRef(
  ({
    data,
    color = "blue",
    height = 80,
    showLabels = false,
    className
  }, ref) => {
    const colors = COLOR_CONFIG[color];
    const maxValue = React5.useMemo(
      () => Math.max(...data.map((d) => d.value), 1),
      [data]
    );
    const gradientId = React5.useId();
    const filterId = React5.useId();
    const formatLabel = (point) => {
      if (point.label) return point.label;
      if (point.date) {
        return point.date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        });
      }
      return "";
    };
    if (data.length === 0) {
      return /* @__PURE__ */ jsx(
        "div",
        {
          ref,
          className: cn("flex items-center justify-center text-muted-foreground text-sm", className),
          style: { height },
          children: "No data"
        }
      );
    }
    return /* @__PURE__ */ jsxs("div", { ref, className: cn("w-full", className), children: [
      /* @__PURE__ */ jsxs(
        "svg",
        {
          width: "100%",
          height,
          viewBox: `0 0 ${data.length * 12} ${height}`,
          preserveAspectRatio: "none",
          className: "overflow-visible",
          children: [
            /* @__PURE__ */ jsxs("defs", { children: [
              /* @__PURE__ */ jsxs("linearGradient", { id: gradientId, x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: colors.fill, stopOpacity: "1" }),
                /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: colors.fill, stopOpacity: "0.3" })
              ] }),
              /* @__PURE__ */ jsxs("filter", { id: filterId, x: "-50%", y: "-50%", width: "200%", height: "200%", children: [
                /* @__PURE__ */ jsx("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "2", result: "blur" }),
                /* @__PURE__ */ jsx(
                  "feColorMatrix",
                  {
                    in: "blur",
                    type: "matrix",
                    values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0"
                  }
                ),
                /* @__PURE__ */ jsxs("feMerge", { children: [
                  /* @__PURE__ */ jsx("feMergeNode", {}),
                  /* @__PURE__ */ jsx("feMergeNode", { in: "SourceGraphic" })
                ] })
              ] })
            ] }),
            data.map((point, index) => {
              const barHeight = point.value / maxValue * (height - 4);
              const x = index * 12;
              const y = height - barHeight;
              const barWidth = 10;
              return /* @__PURE__ */ jsx(
                "rect",
                {
                  x,
                  y,
                  width: barWidth,
                  height: barHeight,
                  rx: 2,
                  fill: `url(#${gradientId})`,
                  filter: `url(#${filterId})`,
                  className: "transition-all duration-200 hover:opacity-80"
                },
                index
              );
            })
          ]
        }
      ),
      showLabels && data.length > 1 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx("span", { children: formatLabel(data[0]) }),
        /* @__PURE__ */ jsx("span", { children: formatLabel(data[data.length - 1]) })
      ] })
    ] });
  }
);
BarChart.displayName = "BarChart";
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn("p-3", className),
      classNames: {
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames
      },
      components: {
        Chevron: ({ orientation }) => {
          const Icon2 = orientation === "left" ? ChevronLeft : ChevronRight;
          return /* @__PURE__ */ jsx(Icon2, { className: "h-4 w-4" });
        }
      },
      ...props
    }
  );
}
Calendar.displayName = "Calendar";
var DateRangePicker = React5.forwardRef(
  ({
    from,
    to,
    onFromChange,
    onToChange,
    fromPlaceholder = "Start date",
    toPlaceholder = "End date",
    disabled = false,
    hasError = false,
    className
  }, ref) => {
    const [mounted, setMounted] = React5.useState(false);
    React5.useEffect(() => {
      setMounted(true);
    }, []);
    const parseDate = (dateString) => {
      if (!dateString) return void 0;
      const parsed = parse(dateString, "yyyy-MM-dd", /* @__PURE__ */ new Date());
      return isValid(parsed) ? parsed : void 0;
    };
    const formatDateString = (date) => {
      if (!date) return "";
      return format(date, "yyyy-MM-dd");
    };
    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    const dateRange = fromDate || toDate ? { from: fromDate, to: toDate } : void 0;
    const handleSelect = (range) => {
      onFromChange(formatDateString(range?.from));
      onToChange(formatDateString(range?.to));
    };
    const displayText = React5.useMemo(() => {
      if (!fromDate && !toDate) {
        return `${fromPlaceholder} - ${toPlaceholder}`;
      }
      const fromText = fromDate ? format(fromDate, "MMM d, yyyy") : fromPlaceholder;
      const toText = toDate ? format(toDate, "MMM d, yyyy") : toPlaceholder;
      return `${fromText} - ${toText}`;
    }, [fromDate, toDate, fromPlaceholder, toPlaceholder]);
    if (!mounted) {
      return /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          className: cn(
            "w-full justify-start text-left font-normal",
            !from && !to && "text-muted-foreground",
            hasError && "border-destructive",
            className
          ),
          disabled,
          children: [
            /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { children: `${fromPlaceholder} - ${toPlaceholder}` })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsx("div", { ref, className: cn("grid gap-2", className), children: /* @__PURE__ */ jsxs(Popover, { children: [
      /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          className: cn(
            "w-full justify-start text-left font-normal",
            !from && !to && "text-muted-foreground",
            hasError && "border-destructive"
          ),
          disabled,
          children: [
            /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { children: displayText })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(
        PopoverContent,
        {
          className: "w-auto p-0 [--cell-size:2.5rem]",
          align: "start",
          children: /* @__PURE__ */ jsx(
            Calendar,
            {
              mode: "range",
              defaultMonth: fromDate,
              selected: dateRange,
              onSelect: handleSelect,
              numberOfMonths: 2,
              fixedWeeks: true
            }
          )
        }
      )
    ] }) });
  }
);
DateRangePicker.displayName = "DateRangePicker";
var SteppedProgressBar = forwardRef(
  ({
    progress,
    segments = 10,
    height = 4,
    variant = "default",
    className,
    ...props
  }, ref) => {
    const filledSegments = Math.round(progress / 100 * segments);
    const getVariantClasses = (filled) => {
      if (!filled) return "bg-primary/15";
      switch (variant) {
        case "success":
          return "bg-[var(--status-success)]";
        case "warning":
          return "bg-[var(--status-warning)]";
        case "danger":
          return "bg-[var(--status-danger)]";
        default:
          return "bg-primary";
      }
    };
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        role: "progressbar",
        "aria-valuenow": progress,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-label": `${Math.round(progress)}% complete`,
        className: cn("flex gap-0.5", className),
        ...props,
        children: Array.from({ length: segments }).map((_, index) => {
          const filled = index < filledSegments;
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "flex-1 rounded-sm transition-colors duration-150",
                getVariantClasses(filled)
              ),
              style: { height: `${height}px` }
            },
            index
          );
        })
      }
    );
  }
);
SteppedProgressBar.displayName = "SteppedProgressBar";
var AGENT_COLORS = {
  "persona-forge": {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500"
  },
  "ux-designer": {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500"
  },
  system: {
    bg: "bg-muted",
    border: "border-muted-foreground/20",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground"
  }
};
var DEFAULT_COLORS = {
  bg: "bg-blue-500/10",
  border: "border-blue-500/30",
  text: "text-blue-600 dark:text-blue-400",
  dot: "bg-blue-500"
};
var agentBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-mono",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs"
      }
    },
    defaultVariants: {
      size: "sm"
    }
  }
);
var AgentBadge = forwardRef(
  ({ agent, isActive = false, size, label, className, ...props }, ref) => {
    const colors = AGENT_COLORS[agent] || DEFAULT_COLORS;
    const displayName = label || agent;
    return /* @__PURE__ */ jsxs(
      "span",
      {
        ref,
        className: cn(
          agentBadgeVariants({ size }),
          colors.bg,
          colors.border,
          colors.text,
          className
        ),
        ...props,
        children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "rounded-full",
                colors.dot,
                size === "sm" && "h-1.5 w-1.5",
                size === "md" && "h-2 w-2",
                !size && "h-1.5 w-1.5",
                // default
                isActive && "animate-pulse"
              )
            }
          ),
          /* @__PURE__ */ jsx("span", { children: displayName })
        ]
      }
    );
  }
);
AgentBadge.displayName = "AgentBadge";
function getAgentColorClass(agent) {
  return (AGENT_COLORS[agent] || DEFAULT_COLORS).text;
}
function getAgentBgClass(agent) {
  return (AGENT_COLORS[agent] || DEFAULT_COLORS).bg;
}
function registerAgentType(name, colors) {
  AGENT_COLORS[name] = colors;
}
var BIN_POSITIONS = ["A", "B", "D", "C"];
function isBinFilled(position, subTaskProgress) {
  const index = BIN_POSITIONS.indexOf(position);
  if (index === -1) return false;
  return subTaskProgress > index;
}
function isCurrentBin(position, subTaskProgress) {
  const index = BIN_POSITIONS.indexOf(position);
  if (index === -1) return false;
  return subTaskProgress === index;
}
var StepCluster = forwardRef(
  ({
    status,
    subTaskProgress,
    label,
    showNumber = false,
    stepNumber,
    onClick,
    className,
    ...props
  }, ref) => {
    const [showCompletePop, setShowCompletePop] = useState(false);
    const [showErrorShake, setShowErrorShake] = useState(false);
    useEffect(() => {
      if (status === "completed") {
        setShowCompletePop(true);
        const timer = setTimeout(() => setShowCompletePop(false), 300);
        return () => clearTimeout(timer);
      }
      return void 0;
    }, [status]);
    useEffect(() => {
      if (status === "error") {
        setShowErrorShake(true);
        const timer = setTimeout(() => setShowErrorShake(false), 300);
        return () => clearTimeout(timer);
      }
      return void 0;
    }, [status]);
    const isActive = status === "active";
    const isCompleted = status === "completed";
    const isError = status === "error";
    const isSkipped = status === "skipped";
    const isPending = status === "pending";
    const handleKeyDown = (e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    };
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn("relative inline-flex flex-col items-center", className),
        onClick,
        onKeyDown: handleKeyDown,
        role: onClick ? "button" : void 0,
        tabIndex: onClick ? 0 : void 0,
        "aria-label": `Step ${stepNumber || ""}: ${label || "Step"} - ${status}`,
        ...props,
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "grid grid-cols-2 gap-[1px] rounded-[3px] p-[1px]",
                // Active state - glow animation
                isActive && "animate-step-cluster-glow",
                // Completed pop animation
                showCompletePop && "animate-step-cluster-pop",
                // Error shake animation
                showErrorShake && "animate-status-shake",
                // Error state styling
                isError && "ring-1 ring-destructive",
                // Skipped state styling
                isSkipped && "border border-dashed border-muted opacity-50"
              ),
              children: [
                /* @__PURE__ */ jsx(
                  Bin,
                  {
                    filled: isBinFilled("A", subTaskProgress),
                    filling: isActive && isCurrentBin("A", subTaskProgress),
                    status
                  }
                ),
                /* @__PURE__ */ jsx(
                  Bin,
                  {
                    filled: isBinFilled("B", subTaskProgress),
                    filling: isActive && isCurrentBin("B", subTaskProgress),
                    status
                  }
                ),
                /* @__PURE__ */ jsx(
                  Bin,
                  {
                    filled: isBinFilled("C", subTaskProgress),
                    filling: isActive && isCurrentBin("C", subTaskProgress),
                    status
                  }
                ),
                /* @__PURE__ */ jsx(
                  Bin,
                  {
                    filled: isBinFilled("D", subTaskProgress),
                    filling: isActive && isCurrentBin("D", subTaskProgress),
                    status
                  }
                )
              ]
            }
          ),
          showNumber && stepNumber !== void 0 && /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "mt-1 text-[9px] font-medium tabular-nums",
                isPending && "text-muted-foreground/50",
                isActive && "text-primary",
                isCompleted && "text-muted-foreground",
                isError && "text-destructive",
                isSkipped && "text-muted-foreground/50"
              ),
              children: stepNumber
            }
          )
        ]
      }
    );
  }
);
StepCluster.displayName = "StepCluster";
var Bin = memo(function Bin2({ filled, filling, status }) {
  const isError = status === "error";
  const isSkipped = status === "skipped";
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "h-1 w-1 rounded-[1px] transition-colors duration-150",
        // Empty state
        !filled && "bg-[var(--step-bin-empty)]",
        // Filled states
        filled && !filling && "bg-[var(--step-bin-filled)]",
        // Currently filling - brightest + animation
        filling && "bg-[var(--step-bin-active)] animate-pulse",
        // Error state - muted
        isError && filled && "bg-destructive/60",
        isError && !filled && "bg-destructive/20",
        // Skipped state - empty
        isSkipped && "bg-[var(--step-bin-empty)]"
      )
    }
  );
});
var DEFAULT_ROWS = 4;
var DEFAULT_BINS_PER_ROW = 50;
function createBinGrid(completedBins, totalBins, isActive, isComplete, rows, binsPerRow) {
  const progress = completedBins / totalBins;
  const filledColumns = Math.floor(progress * binsPerRow);
  const fillingColumn = isActive && !isComplete && filledColumns < binsPerRow ? filledColumns : -1;
  const grid = Array.from(
    { length: rows },
    () => Array.from({ length: binsPerRow }, (_, colIndex) => {
      if (colIndex < filledColumns) {
        return "filled";
      } else if (colIndex === fillingColumn) {
        return "filling";
      }
      return "empty";
    })
  );
  return grid;
}
function usePrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
var ProgressBinStrip = forwardRef(
  ({
    totalBins = 68,
    completedBins,
    isActive,
    isComplete,
    hasError = false,
    isLinked = false,
    rows = DEFAULT_ROWS,
    binsPerRow = DEFAULT_BINS_PER_ROW,
    className,
    ...props
  }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const binGrid = useMemo(
      () => createBinGrid(
        completedBins,
        totalBins,
        isActive,
        isComplete,
        rows,
        binsPerRow
      ),
      [completedBins, totalBins, isActive, isComplete, rows, binsPerRow]
    );
    const progressPercent = Math.round(completedBins / totalBins * 100);
    if (prefersReducedMotion) {
      return /* @__PURE__ */ jsx(
        "div",
        {
          ref,
          role: "progressbar",
          "aria-valuenow": progressPercent,
          "aria-valuemin": 0,
          "aria-valuemax": 100,
          "aria-label": `${progressPercent}% complete (${completedBins} of ${totalBins} items)`,
          className: cn(
            "h-6 flex-1 overflow-hidden rounded-sm bg-muted/30",
            className
          ),
          ...props,
          children: /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "h-full transition-[width] duration-300 ease-out",
                hasError ? "bg-destructive" : isLinked ? "bg-blue-500" : "bg-primary"
              ),
              style: { width: `${progressPercent}%` }
            }
          )
        }
      );
    }
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        role: "progressbar",
        "aria-valuenow": progressPercent,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-label": `${progressPercent}% complete (${completedBins} of ${totalBins} items)`,
        className: cn(
          "relative flex flex-col gap-[2px]",
          // Error state: muted appearance
          hasError && "opacity-60",
          className
        ),
        ...props,
        children: binGrid.map((row, rowIndex) => /* @__PURE__ */ jsx(
          "div",
          {
            className: "relative z-10 flex gap-[2px] overflow-hidden",
            children: row.map((status, colIndex) => /* @__PURE__ */ jsx(
              Bin3,
              {
                status,
                hasError,
                isLinked
              },
              `${rowIndex}-${colIndex}`
            ))
          },
          rowIndex
        ))
      }
    );
  }
);
ProgressBinStrip.displayName = "ProgressBinStrip";
var Bin3 = memo(function Bin4({ status, hasError, isLinked }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "size-1 shrink-0 rounded-[1px] transition-all duration-150",
        // Empty state
        status === "empty" && "bg-[var(--progress-bin-empty)]",
        // Normal generation (orange)
        status === "filled" && !hasError && !isLinked && "bg-primary shadow-[0_0_6px_rgba(253,91,11,0.6)]",
        status === "filling" && !hasError && !isLinked && "bg-primary/80 shadow-[0_0_8px_rgba(253,91,11,0.8)] animate-pulse",
        // Linked existing persona (blue)
        status === "filled" && !hasError && isLinked && "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]",
        status === "filling" && !hasError && isLinked && "bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse",
        // Error state
        hasError && status === "filled" && "bg-destructive/60 shadow-[0_0_6px_rgba(239,68,68,0.6)]",
        hasError && status === "filling" && "bg-destructive/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
      ),
      "aria-hidden": "true"
    }
  );
});
var STAKEHOLDER_COLORS = [
  "#22c55e",
  // green
  "#3b82f6",
  // blue
  "#8b5cf6",
  // violet
  "#f59e0b",
  // amber
  "#ec4899",
  // pink
  "#06b6d4",
  // cyan
  "#ef4444",
  // red
  "#84cc16"
  // lime
];
function getColorForIndex(index) {
  return STAKEHOLDER_COLORS[index % STAKEHOLDER_COLORS.length] ?? "#22c55e";
}
function getStatusLabel(status, completedBins, totalBins) {
  const percent = Math.round(completedBins / totalBins * 100);
  switch (status) {
    case "pending":
      return "Waiting to start";
    case "active":
      return `${percent}% complete, currently generating`;
    case "completed":
      return "Generation complete";
    case "linked":
      return "Linked to existing persona";
    case "error":
      return `Error at ${percent}% complete`;
    case "skipped":
      return "Skipped";
  }
}
var StakeholderProgressRow = forwardRef(
  ({
    role,
    index,
    status,
    completedBins,
    totalBins = 68,
    currentStep,
    totalSteps = 18,
    currentStepLabel,
    linkedPersonaName,
    onRetry,
    onSkip,
    icon,
    iconColor,
    className,
    ...props
  }, ref) => {
    const [showCompleteFlash, setShowCompleteFlash] = useState(false);
    useEffect(() => {
      if (status === "completed") {
        setShowCompleteFlash(true);
        const timer = setTimeout(() => setShowCompleteFlash(false), 400);
        return () => clearTimeout(timer);
      }
      return void 0;
    }, [status]);
    const isActive = status === "active";
    const isCompleted = status === "completed";
    const isPending = status === "pending";
    const isError = status === "error";
    const isSkipped = status === "skipped";
    const isLinked = status === "linked";
    const color = iconColor || getColorForIndex(index);
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn(
          "flex items-center gap-3 py-3 px-4 transition-all duration-200",
          // Active row styling
          isActive && "bg-primary/5",
          // Completion flash
          showCompleteFlash && "animate-row-flash",
          // Pending row is dimmed
          isPending && "opacity-50",
          // Error row border
          isError && "border-l-2 border-destructive",
          className
        ),
        role: "group",
        "aria-label": `${role}: ${getStatusLabel(status, completedBins, totalBins)}`,
        ...props,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-[180px] flex-shrink-0", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  isPending ? "bg-muted/30" : "bg-opacity-20",
                  isLinked && "bg-blue-500/10"
                ),
                style: {
                  backgroundColor: isPending || isLinked ? void 0 : `${color}20`
                },
                children: icon ? icon : isCompleted ? /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-primary" }) : isLinked ? /* @__PURE__ */ jsx(Link2, { className: "h-4 w-4 text-blue-500" }) : isError ? /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-destructive" }) : isSkipped ? /* @__PURE__ */ jsx(Ban, { className: "h-4 w-4 text-muted-foreground" }) : isActive ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 text-primary animate-spin" }) : /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "text-xs font-medium",
                    style: { color: isPending ? void 0 : color },
                    children: role.split(" ").map((w) => w[0]).join("").slice(0, 2)
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "text-sm font-medium truncate",
                  isPending && "text-muted-foreground",
                  isCompleted && "text-muted-foreground",
                  isLinked && "text-muted-foreground",
                  isError && "text-destructive"
                ),
                children: role
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx(
            ProgressBinStrip,
            {
              totalBins,
              completedBins,
              isActive,
              isComplete: isCompleted || isLinked,
              hasError: isError,
              isLinked
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "w-[140px] flex-shrink-0 text-right", children: [
            isActive && currentStep && /* @__PURE__ */ jsxs("span", { className: "text-xs text-primary font-medium", children: [
              "Step ",
              currentStep,
              "/",
              totalSteps,
              currentStepLabel && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal ml-1", children: currentStepLabel })
            ] }),
            isPending && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Waiting..." }),
            isCompleted && /* @__PURE__ */ jsxs("span", { className: "text-xs text-primary font-medium flex items-center justify-end gap-1", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
              "Complete"
            ] }),
            isLinked && /* @__PURE__ */ jsxs("span", { className: "text-xs text-blue-500 font-medium flex items-center justify-end gap-1", children: [
              /* @__PURE__ */ jsx(Link2, { className: "h-3 w-3" }),
              linkedPersonaName ? `Linked to ${linkedPersonaName}` : "Existing persona"
            ] }),
            isSkipped && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Skipped" }),
            isError && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
              onRetry && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onRetry,
                  className: "text-xs text-primary hover:underline",
                  children: "Retry"
                }
              ),
              onSkip && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onSkip,
                  className: "text-xs text-muted-foreground hover:underline",
                  children: "Skip"
                }
              )
            ] })
          ] })
        ]
      }
    );
  }
);
StakeholderProgressRow.displayName = "StakeholderProgressRow";
function formatElapsedTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
function getStatusIcon(status) {
  switch (status) {
    case "pending":
      return /* @__PURE__ */ jsx(Circle, { className: "h-4 w-4 text-muted-foreground" });
    case "running":
      return /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 text-primary animate-spin" });
    case "waiting":
      return /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4 text-amber-500" });
    case "completed":
      return /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" });
    case "failed":
      return /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 text-destructive" });
  }
}
var StepList = forwardRef(
  ({
    steps,
    selectedStepId,
    onStepClick,
    title = "Steps",
    showTitle = true,
    className,
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsxs(
      "nav",
      {
        ref,
        className: cn("space-y-1", className),
        "aria-label": "Pipeline steps",
        ...props,
        children: [
          showTitle && /* @__PURE__ */ jsx("h2", { className: "text-muted-foreground mb-3 px-2 text-xs font-semibold uppercase tracking-wider", children: title }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-1", role: "list", children: steps.map((step) => {
            const isSelected = selectedStepId === step.id;
            const isClickable = !!onStepClick;
            return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
              StepItem,
              {
                step,
                isSelected,
                onClick: isClickable ? () => onStepClick(step.id) : void 0
              }
            ) }, step.id);
          }) })
        ]
      }
    );
  }
);
StepList.displayName = "StepList";
function StepItem({ step, isSelected, onClick }) {
  const isRunning = step.status === "running";
  const isCompleted = step.status === "completed";
  const isFailed = step.status === "failed";
  const isWaiting = step.status === "waiting";
  const statusLabel = isRunning && step.progress !== void 0 ? `${step.progress}% complete` : isCompleted && step.elapsedTime !== void 0 ? formatElapsedTime(step.elapsedTime) : isWaiting ? "Input required" : isFailed ? "Error occurred" : void 0;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      disabled: !onClick,
      className: cn(
        "w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors",
        onClick && "hover:bg-muted/50 cursor-pointer",
        isSelected && "bg-muted",
        !onClick && "cursor-default"
      ),
      "aria-label": `${step.label}: ${step.status === "pending" ? "Not started" : step.status === "running" ? "Running" : step.status === "waiting" ? "Waiting for input" : step.status === "completed" ? "Completed" : "Failed"}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: "flex-shrink-0", children: getStatusIcon(step.status) }),
        /* @__PURE__ */ jsxs("span", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "block text-sm truncate",
                step.status === "pending" && "text-muted-foreground"
              ),
              children: step.label
            }
          ),
          statusLabel && /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "block text-xs",
                isRunning && "text-primary",
                isCompleted && "text-muted-foreground",
                isFailed && "text-destructive",
                isWaiting && "text-amber-500"
              ),
              children: statusLabel
            }
          )
        ] })
      ]
    }
  );
}
var StepSummary = forwardRef(
  ({ total, completed, failed, className, ...props }, ref) => {
    const pending = total - completed - failed;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn("flex items-center gap-3 text-sm", className),
        ...props,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-green-600 dark:text-green-400 font-medium", children: completed }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "done" })
          ] }),
          pending > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: pending }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "pending" })
          ] }),
          failed > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium text-red-600 dark:text-red-400", children: failed }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "failed" })
          ] })
        ]
      }
    );
  }
);
StepSummary.displayName = "StepSummary";
function usePrefersReducedMotion2() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
function getStepStatus(step, currentStep, stepStates) {
  const explicitState = stepStates?.[step.id];
  if (explicitState?.status) {
    return explicitState.status;
  }
  if (step.order < currentStep) {
    return "completed";
  } else if (step.order === currentStep) {
    return "active";
  } else {
    return "pending";
  }
}
function getSubTaskProgress(step, currentStep, stepProgress, stepStates) {
  const explicitState = stepStates?.[step.id];
  if (explicitState?.subTaskProgress !== void 0) {
    return explicitState.subTaskProgress;
  }
  if (step.order < currentStep) {
    return 4;
  } else if (step.order === currentStep) {
    return Math.floor(stepProgress / 100 * 4);
  } else {
    return 0;
  }
}
function calculateOverallProgress(currentStep, stepProgress, totalSteps) {
  if (currentStep <= 0) return 0;
  if (currentStep > totalSteps) return 100;
  const completedSteps = currentStep - 1;
  const currentStepContribution = stepProgress / 100;
  return Math.round((completedSteps + currentStepContribution) / totalSteps * 100);
}
function groupStepsByCategory(steps) {
  const groups = /* @__PURE__ */ new Map();
  for (const step of steps) {
    const category = step.category || "Steps";
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category).push(step);
  }
  return groups;
}
var StepProgressGrid = forwardRef(
  ({
    steps,
    currentStep,
    stepProgress,
    stepStates,
    showCategories = true,
    showNumbers = false,
    compact = false,
    currentActivity,
    className,
    ...props
  }, ref) => {
    const prefersReducedMotion = usePrefersReducedMotion2();
    const totalSteps = steps.length;
    const overallProgress = calculateOverallProgress(
      currentStep,
      stepProgress,
      totalSteps
    );
    const currentStepMeta = useMemo(() => {
      if (currentStep > 0 && currentStep <= totalSteps) {
        return steps.find((s) => s.order === currentStep) || null;
      }
      return null;
    }, [currentStep, steps, totalSteps]);
    const categoryGroups = useMemo(
      () => groupStepsByCategory(steps),
      [steps]
    );
    if (prefersReducedMotion && compact) {
      return /* @__PURE__ */ jsx(
        "div",
        {
          ref,
          role: "progressbar",
          "aria-valuenow": overallProgress,
          "aria-valuemin": 0,
          "aria-valuemax": 100,
          "aria-label": `Progress: ${overallProgress}% complete${currentStepMeta ? `, step ${currentStep} of ${totalSteps}: ${currentStepMeta.shortLabel}` : ""}`,
          className: cn("w-full", className),
          ...props,
          children: /* @__PURE__ */ jsx("div", { className: "h-2 w-full overflow-hidden rounded-sm bg-muted/30", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full bg-gradient-to-r from-orange-700 via-primary to-orange-400 transition-[width] duration-300",
              style: { width: `${overallProgress}%` }
            }
          ) })
        }
      );
    }
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        role: "progressbar",
        "aria-valuenow": overallProgress,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-label": `Progress: ${overallProgress}% complete${currentStepMeta ? `, step ${currentStep} of ${totalSteps}: ${currentStepMeta.shortLabel}` : ""}`,
        className: cn("flex flex-col gap-2", className),
        ...props,
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-end gap-3", children: Array.from(categoryGroups.entries()).map(([category, categorySteps]) => /* @__PURE__ */ jsx(
            CategoryGroup,
            {
              category,
              steps: categorySteps,
              currentStep,
              stepProgress,
              stepStates,
              showHeader: showCategories && !compact,
              showNumbers
            },
            category
          )) }),
          !compact && currentStepMeta && currentStep > 0 && currentStep <= totalSteps && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-primary font-medium", children: [
              "Step ",
              currentStep,
              " of ",
              totalSteps,
              ":"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-foreground", children: currentStepMeta.shortLabel }),
            currentActivity && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "-" }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: currentActivity })
            ] })
          ] }),
          !compact && currentStep > totalSteps && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-sm text-primary", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: "All steps complete" }) })
        ]
      }
    );
  }
);
StepProgressGrid.displayName = "StepProgressGrid";
var CategoryGroup = memo(function CategoryGroup2({
  category,
  steps,
  currentStep,
  stepProgress,
  stepStates,
  showHeader = true,
  showNumbers = false
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
    showHeader && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium uppercase tracking-wide text-muted-foreground", children: category }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: steps.map((step) => {
      const status = getStepStatus(step, currentStep, stepStates);
      const subTaskProgress = getSubTaskProgress(
        step,
        currentStep,
        stepProgress,
        stepStates
      );
      return /* @__PURE__ */ jsx(
        StepCluster,
        {
          status,
          subTaskProgress,
          label: step.shortLabel,
          showNumber: showNumbers,
          stepNumber: step.order
        },
        step.id
      );
    }) })
  ] });
});
var OverallProgressBar = forwardRef(
  ({
    completedSteps,
    totalSteps = 18,
    currentStepLabel,
    isActive = false,
    showStepDots = true,
    className,
    ...props
  }, ref) => {
    const progressPercent = Math.round(completedSteps / totalSteps * 100);
    const isComplete = completedSteps >= totalSteps;
    const currentStepNumber = Math.min(completedSteps + 1, totalSteps);
    return /* @__PURE__ */ jsxs("div", { ref, className: cn("space-y-2", className), ...props, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          isActive && !isComplete && /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
            /* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" }),
            /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-orange-500" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: isComplete ? "Complete" : `Step ${currentStepNumber} of ${totalSteps}` }),
          currentStepLabel && !isComplete && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "\xB7" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: currentStepLabel })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "font-medium tabular-nums", children: [
          progressPercent,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Progress,
        {
          value: progressPercent,
          className: cn(
            "h-2",
            isActive && !isComplete && "[&>[data-slot=indicator]]:bg-gradient-to-r [&>[data-slot=indicator]]:from-orange-500 [&>[data-slot=indicator]]:to-teal-500"
          )
        }
      ),
      showStepDots && /* @__PURE__ */ jsx("div", { className: "flex gap-0.5", children: Array.from({ length: totalSteps }).map((_, i) => /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "h-1 flex-1 rounded-full transition-colors",
            i < completedSteps ? "bg-teal-500" : i === completedSteps && isActive ? "bg-orange-500 animate-pulse" : "bg-muted"
          )
        },
        i
      )) })
    ] });
  }
);
OverallProgressBar.displayName = "OverallProgressBar";
var CompactProgressIndicator = forwardRef(({ completedSteps, totalSteps = 18, isActive = false, className, ...props }, ref) => {
  const progressPercent = Math.round(completedSteps / totalSteps * 100);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: cn("flex items-center gap-2", className),
      ...props,
      children: [
        isActive && /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" }),
          /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-orange-500" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-medium tabular-nums", children: [
            completedSteps,
            "/",
            totalSteps
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-1 w-16" })
        ] })
      ]
    }
  );
});
CompactProgressIndicator.displayName = "CompactProgressIndicator";

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AgentBadge, Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, AlertTitle, Avatar, AvatarFallback, AvatarImage, BarChart, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Calendar, CapacityBar, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, Checkbox, Collapsible, CollapsibleContent2 as CollapsibleContent, CollapsibleTrigger2 as CollapsibleTrigger, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, CompactProgressIndicator, ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, DateRangePicker, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerField, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerSectionTitle, DrawerStatus, DrawerTitle, DrawerTrigger, EmptyState, ErrorState, FormField, FullScreenSheet, FullScreenSheetContent, HoverCard, HoverCardContent, HoverCardTrigger, Input, KanbanBoard, KanbanCard, KanbanCardHandle, KpiCard, Label, LoadingState, OverallProgressBar, PageLoading, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, Popover, PopoverAnchor, PopoverContent, PopoverTrigger, Progress, ProgressBinStrip, RadioGroup, RadioGroupItem, ResizableHandle, ResizablePanel, ResizablePanelGroup, ScrollArea, ScrollBar, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator2 as Separator, Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger, Skeleton, Slider, Sparkline, StakeholderProgressRow, StepCluster, StepIndicator, StepList, StepProgressGrid, StepSummary, SteppedProgressBar, StickyActionBar, Switch, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, ThemeToggle, Toggle, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Wizard, WizardContent, WizardFooter, WizardHeader, agentBadgeVariants, alertVariants, capacityBarVariants, getAgentBgClass, getAgentColorClass, indicatorVariants, inputVariants, kpiCardVariants, labelVariants, progressVariants, registerAgentType, toggleVariants, useWizard };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map