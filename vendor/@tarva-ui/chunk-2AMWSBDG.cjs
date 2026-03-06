'use strict';

var chunk2AQSA446_cjs = require('./chunk-2AQSA446.cjs');
var chunkIS6WJ2TO_cjs = require('./chunk-IS6WJ2TO.cjs');
var classVarianceAuthority = require('class-variance-authority');
var jsxRuntime = require('react/jsx-runtime');
var reactSlot = require('@radix-ui/react-slot');
var DropdownMenuPrimitive = require('@radix-ui/react-dropdown-menu');
var lucideReact = require('lucide-react');
var react = require('react');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var DropdownMenuPrimitive__namespace = /*#__PURE__*/_interopNamespace(DropdownMenuPrimitive);

var badgeVariants = classVarianceAuthority.cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "border-border bg-background text-foreground dark:bg-input/30 dark:border-input"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      "data-slot": "badge",
      className: chunkIS6WJ2TO_cjs.cn(badgeVariants({ variant }), className),
      ...props
    }
  );
}
var buttonVariants = classVarianceAuthority.cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? reactSlot.Slot : "button";
  return /* @__PURE__ */ jsxRuntime.jsx(
    Comp,
    {
      "data-slot": "button",
      "data-variant": variant,
      "data-size": size,
      className: chunkIS6WJ2TO_cjs.cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
var DropdownMenu = DropdownMenuPrimitive__namespace.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive__namespace.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive__namespace.Group;
var DropdownMenuPortal = DropdownMenuPrimitive__namespace.Portal;
var DropdownMenuSub = DropdownMenuPrimitive__namespace.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive__namespace.RadioGroup;
var DropdownMenuSubTrigger = react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsxs(
  DropdownMenuPrimitive__namespace.SubTrigger,
  {
    ref,
    "data-slot": "dropdown-menu-sub-trigger",
    className: chunkIS6WJ2TO_cjs.cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntime.jsx(lucideReact.ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive__namespace.SubTrigger.displayName;
var DropdownMenuSubContent = react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  DropdownMenuPrimitive__namespace.SubContent,
  {
    ref,
    "data-slot": "dropdown-menu-sub-content",
    className: chunkIS6WJ2TO_cjs.cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive__namespace.SubContent.displayName;
var DropdownMenuContent = react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(DropdownMenuPrimitive__namespace.Portal, { children: /* @__PURE__ */ jsxRuntime.jsx(
  DropdownMenuPrimitive__namespace.Content,
  {
    ref,
    sideOffset,
    "data-slot": "dropdown-menu-content",
    className: chunkIS6WJ2TO_cjs.cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive__namespace.Content.displayName;
var DropdownMenuItem = react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  DropdownMenuPrimitive__namespace.Item,
  {
    ref,
    "data-slot": "dropdown-menu-item",
    className: chunkIS6WJ2TO_cjs.cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive__namespace.Item.displayName;
var DropdownMenuCheckboxItem = react.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsxs(
  DropdownMenuPrimitive__namespace.CheckboxItem,
  {
    ref,
    "data-slot": "dropdown-menu-checkbox-item",
    className: chunkIS6WJ2TO_cjs.cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntime.jsx(DropdownMenuPrimitive__namespace.ItemIndicator, { children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive__namespace.CheckboxItem.displayName;
var DropdownMenuRadioItem = react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsxs(
  DropdownMenuPrimitive__namespace.RadioItem,
  {
    ref,
    "data-slot": "dropdown-menu-radio-item",
    className: chunkIS6WJ2TO_cjs.cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntime.jsx(DropdownMenuPrimitive__namespace.ItemIndicator, { children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive__namespace.RadioItem.displayName;
var DropdownMenuLabel = react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  DropdownMenuPrimitive__namespace.Label,
  {
    ref,
    "data-slot": "dropdown-menu-label",
    className: chunkIS6WJ2TO_cjs.cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive__namespace.Label.displayName;
var DropdownMenuSeparator = react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  DropdownMenuPrimitive__namespace.Separator,
  {
    ref,
    "data-slot": "dropdown-menu-separator",
    className: chunkIS6WJ2TO_cjs.cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive__namespace.Separator.displayName;
var DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      "data-slot": "dropdown-menu-shortcut",
      className: chunkIS6WJ2TO_cjs.cn("ml-auto text-xs tracking-widest opacity-60", className),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// src/components/ui/status-badge/registry.ts
var STATUS_REGISTRY = /* @__PURE__ */ new Map();
var CORE_STATUSES = {
  // ========== SUCCESS (Green) ==========
  active: { category: "success", label: "Active" },
  completed: { category: "success", label: "Completed" },
  approved: { category: "success", label: "Approved" },
  confirmed: { category: "success", label: "Confirmed" },
  ready: { category: "success", label: "Ready" },
  online: { category: "success", label: "Online" },
  healthy: { category: "success", label: "Healthy" },
  indexed: { category: "success", label: "Indexed" },
  verified: { category: "success", label: "Verified" },
  published: { category: "success", label: "Published" },
  delivered: { category: "success", label: "Delivered" },
  received: { category: "success", label: "Received" },
  paid: { category: "success", label: "Paid" },
  resolved: { category: "success", label: "Resolved" },
  synced: { category: "success", label: "Synced" },
  passed: { category: "success", label: "Passed" },
  success: { category: "success", label: "Success" },
  ok: { category: "success", label: "OK" },
  connected: { category: "success", label: "Connected" },
  clean: { category: "success", label: "Clean" },
  match: { category: "success", label: "Match" },
  // ========== WARNING (Amber) ==========
  pending: { category: "warning", label: "Pending" },
  "in_review": { category: "warning", label: "In Review" },
  "in review": { category: "warning", label: "In Review" },
  partial: { category: "warning", label: "Partial" },
  indexing: { category: "warning", label: "Indexing", animation: "pulse" },
  degraded: { category: "warning", label: "Degraded" },
  low: { category: "warning", label: "Low" },
  expiring: { category: "warning", label: "Expiring" },
  stale: { category: "warning", label: "Stale" },
  delayed: { category: "warning", label: "Delayed" },
  waiting: { category: "warning", label: "Waiting" },
  scheduled: { category: "warning", label: "Scheduled" },
  "on hold": { category: "warning", label: "On Hold" },
  "on_hold": { category: "warning", label: "On Hold" },
  due: { category: "warning", label: "Due" },
  retrying: { category: "warning", label: "Retrying" },
  "needs review": { category: "warning", label: "Needs Review" },
  minor: { category: "warning", label: "Minor" },
  "awaiting info": { category: "warning", label: "Awaiting Info" },
  idle: { category: "warning", label: "Idle" },
  manual: { category: "warning", label: "Manual" },
  draining: { category: "warning", label: "Draining" },
  busy: { category: "warning", label: "Busy" },
  // ========== DANGER (Red) ==========
  error: { category: "danger", label: "Error", animation: "shake" },
  failed: { category: "danger", label: "Failed", animation: "shake" },
  offline: { category: "danger", label: "Offline" },
  rejected: { category: "danger", label: "Rejected" },
  blocked: { category: "danger", label: "Blocked" },
  overdue: { category: "danger", label: "Overdue" },
  critical: { category: "danger", label: "Critical" },
  cancelled: { category: "danger", label: "Cancelled" },
  expired: { category: "danger", label: "Expired" },
  suspended: { category: "danger", label: "Suspended" },
  late: { category: "danger", label: "Late" },
  urgent: { category: "danger", label: "Urgent" },
  dead: { category: "danger", label: "Dead" },
  breached: { category: "danger", label: "Breached" },
  disconnected: { category: "danger", label: "Disconnected" },
  major: { category: "danger", label: "Major" },
  deprecated: { category: "danger", label: "Deprecated" },
  scrapped: { category: "danger", label: "Scrapped" },
  oos: { category: "danger", label: "Out of Stock" },
  // ========== INFO (Blue) ==========
  running: { category: "info", label: "Running", animation: "pulse" },
  processing: { category: "info", label: "Processing", animation: "pulse" },
  queued: { category: "info", label: "Queued" },
  loading: { category: "info", label: "Loading", animation: "pulse" },
  syncing: { category: "info", label: "Syncing", animation: "pulse" },
  "in_progress": { category: "info", label: "In Progress", animation: "pulse" },
  "in progress": { category: "info", label: "In Progress", animation: "pulse" },
  inbound: { category: "info", label: "Inbound" },
  outbound: { category: "info", label: "Outbound" },
  new: { category: "info", label: "New" },
  automated: { category: "info", label: "Automated" },
  ip: { category: "info", label: "In Progress", animation: "pulse" },
  // ========== NEUTRAL (Gray) ==========
  draft: { category: "neutral", label: "Draft" },
  archived: { category: "neutral", label: "Archived" },
  closed: { category: "neutral", label: "Closed" },
  unknown: { category: "neutral", label: "Unknown" },
  na: { category: "neutral", label: "N/A" },
  "n/a": { category: "neutral", label: "N/A" },
  none: { category: "neutral", label: "None" },
  hold: { category: "neutral", label: "Hold" },
  no: { category: "neutral", label: "No" },
  // ========== MUTED (Subtle Gray) ==========
  inactive: { category: "muted", label: "Inactive" },
  disabled: { category: "muted", label: "Disabled" },
  paused: { category: "muted", label: "Paused" },
  hidden: { category: "muted", label: "Hidden" },
  obsolete: { category: "muted", label: "Obsolete" },
  unparsed: { category: "muted", label: "Unparsed" },
  deferred: { category: "muted", label: "Deferred" },
  d: { category: "muted", label: "Deferred" }
};
Object.entries(CORE_STATUSES).forEach(([key, config]) => {
  STATUS_REGISTRY.set(key.toLowerCase(), config);
});
function getStatusConfig(status) {
  return STATUS_REGISTRY.get(status.trim().toLowerCase());
}
function registerStatus(key, config) {
  STATUS_REGISTRY.set(key.toLowerCase(), config);
}
function registerStatuses(statuses) {
  Object.entries(statuses).forEach(([key, config]) => {
    registerStatus(key, config);
  });
}
function isStatusRegistered(status) {
  return STATUS_REGISTRY.has(status.trim().toLowerCase());
}
function getAllStatuses() {
  return new Map(STATUS_REGISTRY);
}
function resetRegistry() {
  STATUS_REGISTRY.clear();
  Object.entries(CORE_STATUSES).forEach(([key, config]) => {
    STATUS_REGISTRY.set(key.toLowerCase(), config);
  });
}

// src/components/ui/status-badge/use-status-animation.ts
function useStatusAnimation({
  animation,
  disableAnimation = false
}) {
  const prefersReducedMotion = chunk2AQSA446_cjs.useReducedMotion();
  const isAnimated = animation !== "none" && !disableAnimation && !prefersReducedMotion;
  if (!isAnimated) {
    return {
      containerClasses: "",
      dotClasses: "",
      isAnimated: false
    };
  }
  switch (animation) {
    case "pulse":
      return {
        containerClasses: "",
        dotClasses: "animate-status-dot-pulse",
        isAnimated: true
      };
    case "pop":
      return {
        containerClasses: "animate-status-pop",
        dotClasses: "",
        isAnimated: true
      };
    case "shake":
      return {
        containerClasses: "animate-status-shake",
        dotClasses: "",
        isAnimated: true
      };
    default:
      return {
        containerClasses: "",
        dotClasses: "",
        isAnimated: false
      };
  }
}
function formatStatusLabel(status) {
  return status.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
var statusBadgeVariants = classVarianceAuthority.cva(
  "inline-flex items-center gap-1.5 font-medium transition-colors",
  {
    variants: {
      variant: {
        dot: "text-foreground",
        badge: "rounded-md border px-2 py-0.5",
        outline: "rounded-md border bg-transparent px-2 py-0.5",
        subtle: "rounded-md px-2 py-0.5"
      },
      category: {
        success: "",
        warning: "",
        danger: "",
        info: "",
        neutral: "",
        muted: ""
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base"
      }
    },
    compoundVariants: [
      // === DOT variant colors ===
      { variant: "dot", category: "neutral", className: "text-muted-foreground" },
      { variant: "dot", category: "muted", className: "text-muted-foreground" },
      // === BADGE variant colors (filled background) ===
      {
        variant: "badge",
        category: "success",
        className: "bg-[var(--status-success)] text-white border-transparent"
      },
      {
        variant: "badge",
        category: "warning",
        className: "bg-[var(--status-warning)] text-black border-transparent"
      },
      {
        variant: "badge",
        category: "danger",
        className: "bg-[var(--status-danger)] text-white border-transparent"
      },
      {
        variant: "badge",
        category: "info",
        className: "bg-[var(--status-info)] text-white border-transparent"
      },
      {
        variant: "badge",
        category: "neutral",
        className: "bg-[var(--status-neutral)] text-white border-transparent"
      },
      {
        variant: "badge",
        category: "muted",
        className: "bg-muted text-muted-foreground border-transparent"
      },
      // === OUTLINE variant colors ===
      {
        variant: "outline",
        category: "success",
        className: "border-[var(--status-success)] text-[var(--status-success)]"
      },
      {
        variant: "outline",
        category: "warning",
        className: "border-[var(--status-warning)] text-[var(--status-warning)]"
      },
      {
        variant: "outline",
        category: "danger",
        className: "border-[var(--status-danger)] text-[var(--status-danger)]"
      },
      {
        variant: "outline",
        category: "info",
        className: "border-[var(--status-info)] text-[var(--status-info)]"
      },
      {
        variant: "outline",
        category: "neutral",
        className: "border-[var(--status-neutral)] text-[var(--status-neutral)]"
      },
      {
        variant: "outline",
        category: "muted",
        className: "border-muted text-muted-foreground"
      },
      // === SUBTLE variant colors (muted background) ===
      {
        variant: "subtle",
        category: "success",
        className: "bg-[var(--status-success)]/15 text-[var(--status-success)]"
      },
      {
        variant: "subtle",
        category: "warning",
        className: "bg-[var(--status-warning)]/15 text-[var(--status-warning)]"
      },
      {
        variant: "subtle",
        category: "danger",
        className: "bg-[var(--status-danger)]/15 text-[var(--status-danger)]"
      },
      {
        variant: "subtle",
        category: "info",
        className: "bg-[var(--status-info)]/15 text-[var(--status-info)]"
      },
      {
        variant: "subtle",
        category: "neutral",
        className: "bg-[var(--status-neutral)]/15 text-[var(--status-neutral)]"
      },
      {
        variant: "subtle",
        category: "muted",
        className: "bg-muted/50 text-muted-foreground"
      }
    ],
    defaultVariants: {
      variant: "dot",
      category: "neutral",
      size: "default"
    }
  }
);
var statusDotVariants = classVarianceAuthority.cva("shrink-0 rounded-full", {
  variants: {
    category: {
      success: "bg-[var(--status-success)]",
      warning: "bg-[var(--status-warning)]",
      danger: "bg-[var(--status-danger)]",
      info: "bg-[var(--status-info)]",
      neutral: "bg-[var(--status-neutral)]",
      muted: "bg-[var(--status-muted)]"
    },
    size: {
      sm: "size-1.5",
      default: "size-2",
      lg: "size-2.5"
    }
  },
  defaultVariants: {
    category: "neutral",
    size: "default"
  }
});
var StatusBadge = react.forwardRef(
  ({
    status,
    label,
    category,
    variant = "dot",
    size = "default",
    animation = "none",
    showDot = true,
    icon,
    disableAnimation = false,
    className,
    ...props
  }, ref) => {
    const config = getStatusConfig(status);
    const resolvedCategory = category ?? config?.category ?? "neutral";
    const resolvedLabel = label ?? config?.label ?? formatStatusLabel(status);
    const resolvedAnimation = animation !== "none" ? animation : config?.animation ?? "none";
    const { containerClasses, dotClasses, isAnimated } = useStatusAnimation({
      animation: resolvedAnimation,
      disableAnimation
    });
    const shouldShowDot = variant === "dot" && showDot && !icon;
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref,
        "data-slot": "status-badge",
        "data-status": status,
        "data-category": resolvedCategory,
        "data-animated": isAnimated || void 0,
        className: chunkIS6WJ2TO_cjs.cn(
          statusBadgeVariants({ variant, category: resolvedCategory, size }),
          containerClasses,
          className
        ),
        ...props,
        children: [
          icon ? /* @__PURE__ */ jsxRuntime.jsx("span", { className: "shrink-0", children: icon }) : shouldShowDot ? /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              "data-slot": "status-dot",
              className: chunkIS6WJ2TO_cjs.cn(
                statusDotVariants({ category: resolvedCategory, size }),
                dotClasses
              )
            }
          ) : null,
          /* @__PURE__ */ jsxRuntime.jsx("span", { "data-slot": "status-label", children: resolvedLabel })
        ]
      }
    );
  }
);
StatusBadge.displayName = "StatusBadge";

exports.Badge = Badge;
exports.Button = Button;
exports.DropdownMenu = DropdownMenu;
exports.DropdownMenuCheckboxItem = DropdownMenuCheckboxItem;
exports.DropdownMenuContent = DropdownMenuContent;
exports.DropdownMenuGroup = DropdownMenuGroup;
exports.DropdownMenuItem = DropdownMenuItem;
exports.DropdownMenuLabel = DropdownMenuLabel;
exports.DropdownMenuPortal = DropdownMenuPortal;
exports.DropdownMenuRadioGroup = DropdownMenuRadioGroup;
exports.DropdownMenuRadioItem = DropdownMenuRadioItem;
exports.DropdownMenuSeparator = DropdownMenuSeparator;
exports.DropdownMenuShortcut = DropdownMenuShortcut;
exports.DropdownMenuSub = DropdownMenuSub;
exports.DropdownMenuSubContent = DropdownMenuSubContent;
exports.DropdownMenuSubTrigger = DropdownMenuSubTrigger;
exports.DropdownMenuTrigger = DropdownMenuTrigger;
exports.StatusBadge = StatusBadge;
exports.badgeVariants = badgeVariants;
exports.buttonVariants = buttonVariants;
exports.getAllStatuses = getAllStatuses;
exports.getStatusConfig = getStatusConfig;
exports.isStatusRegistered = isStatusRegistered;
exports.registerStatus = registerStatus;
exports.registerStatuses = registerStatuses;
exports.resetRegistry = resetRegistry;
exports.statusBadgeVariants = statusBadgeVariants;
exports.statusDotVariants = statusDotVariants;
exports.useStatusAnimation = useStatusAnimation;
//# sourceMappingURL=chunk-2AMWSBDG.cjs.map
//# sourceMappingURL=chunk-2AMWSBDG.cjs.map