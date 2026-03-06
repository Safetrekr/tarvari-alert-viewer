export { c as cn } from './cn-igf99o94.cjs';
export { ThemeProvider, ThemeProviderProps, useTarvaTheme } from './providers/index.cjs';
export { ANIMATION_PRESETS, AnimationPreset, DISTANCE, DURATION, Distance, Duration, EASING, Easing, MOTION, OPACITY, SCALE, Scale, getReducedMotionSSR, useEntranceAnimation, useReducedMotion } from './motion/index.cjs';
export { COLORS, ColorScheme, RADIUS, SPACING, TYPOGRAPHY, ThemeMode } from './tokens/index.cjs';
import * as react from 'react';
import { HTMLAttributes, ComponentProps, ComponentPropsWithoutRef, ReactNode } from 'react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { S as StatusCategory, b as StatusAnimation } from './status-badge-EsKwLCfc.cjs';
export { c as Badge, B as BadgeProps, d as StatusBadge, e as StatusBadgeProps, f as StatusSize, a as StatusVariant, g as badgeVariants, s as statusBadgeVariants, h as statusDotVariants } from './status-badge-EsKwLCfc.cjs';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
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
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import { Separator as Separator$1, Panel, Group } from 'react-resizable-panels';
import { DayPicker } from 'react-day-picker';
export { useTheme } from 'next-themes';
import 'clsx';

declare const alertVariants: (props?: ({
    variant?: "default" | "destructive" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const Alert: react.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & VariantProps<(props?: ({
    variant?: "default" | "destructive" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string> & react.RefAttributes<HTMLDivElement>>;
declare const AlertTitle: react.ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement> & react.RefAttributes<HTMLParagraphElement>>;
declare const AlertDescription: react.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement> & react.RefAttributes<HTMLParagraphElement>>;

declare const Avatar: react.ForwardRefExoticComponent<Omit<AvatarPrimitive.AvatarProps & react.RefAttributes<HTMLSpanElement>, "ref"> & react.RefAttributes<HTMLSpanElement>>;
declare const AvatarImage: react.ForwardRefExoticComponent<Omit<AvatarPrimitive.AvatarImageProps & react.RefAttributes<HTMLImageElement>, "ref"> & react.RefAttributes<HTMLImageElement>>;
declare const AvatarFallback: react.ForwardRefExoticComponent<Omit<AvatarPrimitive.AvatarFallbackProps & react.RefAttributes<HTMLSpanElement>, "ref"> & react.RefAttributes<HTMLSpanElement>>;

declare const buttonVariants: (props?: ({
    variant?: "link" | "default" | "destructive" | "secondary" | "outline" | "ghost" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare function Button({ className, variant, size, asChild, ...props }: ButtonProps): react_jsx_runtime.JSX.Element;

declare function Card({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function CardHeader({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function CardTitle({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function CardDescription({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function CardAction({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function CardContent({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function CardFooter({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;

declare const Checkbox: react.ForwardRefExoticComponent<Omit<CheckboxPrimitive.CheckboxProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;

declare function Dialog({ ...props }: ComponentProps<typeof DialogPrimitive.Root>): react_jsx_runtime.JSX.Element;
declare function DialogTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>): react_jsx_runtime.JSX.Element;
declare function DialogPortal({ ...props }: ComponentProps<typeof DialogPrimitive.Portal>): react_jsx_runtime.JSX.Element;
declare function DialogClose({ ...props }: ComponentProps<typeof DialogPrimitive.Close>): react_jsx_runtime.JSX.Element;
declare function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>): react_jsx_runtime.JSX.Element;
interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
    showCloseButton?: boolean;
}
declare function DialogContent({ className, children, showCloseButton, ...props }: DialogContentProps): react_jsx_runtime.JSX.Element;
declare function DialogHeader({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function DialogFooter({ className, ...props }: ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>): react_jsx_runtime.JSX.Element;
declare function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>): react_jsx_runtime.JSX.Element;

declare const DropdownMenu: react.FC<DropdownMenuPrimitive.DropdownMenuProps>;
declare const DropdownMenuTrigger: react.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuTriggerProps & react.RefAttributes<HTMLButtonElement>>;
declare const DropdownMenuGroup: react.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuGroupProps & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuPortal: react.FC<DropdownMenuPrimitive.DropdownMenuPortalProps>;
declare const DropdownMenuSub: react.FC<DropdownMenuPrimitive.DropdownMenuSubProps>;
declare const DropdownMenuRadioGroup: react.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuRadioGroupProps & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubTrigger: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubTriggerProps & react.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubContent: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuContent: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuItem: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuCheckboxItem: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuCheckboxItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuRadioItem: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuRadioItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuLabel: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuLabelProps & react.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSeparator: react.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSeparatorProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuShortcut: {
    ({ className, ...props }: HTMLAttributes<HTMLSpanElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};

declare const inputVariants: (props?: ({
    variant?: "default" | "error" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface InputProps extends ComponentProps<'input'>, VariantProps<typeof inputVariants> {
    error?: boolean;
}
declare const Input: react.ForwardRefExoticComponent<Omit<InputProps, "ref"> & react.RefAttributes<HTMLInputElement>>;

declare const labelVariants: (props?: class_variance_authority_types.ClassProp | undefined) => string;
declare const Label: react.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & react.RefAttributes<HTMLLabelElement>, "ref"> & VariantProps<(props?: class_variance_authority_types.ClassProp | undefined) => string> & react.RefAttributes<HTMLLabelElement>>;

declare const progressVariants: (props?: ({
    size?: "sm" | "lg" | "md" | null | undefined;
    variant?: "default" | "success" | "warning" | "danger" | "info" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const indicatorVariants: (props?: ({
    variant?: "default" | "success" | "warning" | "danger" | "info" | null | undefined;
    indeterminate?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ProgressProps extends ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, VariantProps<typeof progressVariants> {
    /** Progress value from 0 to 100 */
    value?: number;
    /** Color variant */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    /** Show indeterminate animation (ignores value) */
    indeterminate?: boolean;
    /** Show percentage label */
    showLabel?: boolean;
    /** Custom label (overrides percentage) */
    label?: string;
    /** Optional indicator class for custom colors */
    indicatorClassName?: string;
}
declare const Progress: react.ForwardRefExoticComponent<ProgressProps & react.RefAttributes<HTMLDivElement>>;

declare const ScrollArea: react.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const ScrollBar: react.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaScrollbarProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

declare const Select: react.FC<SelectPrimitive.SelectProps>;
declare const SelectGroup: react.ForwardRefExoticComponent<SelectPrimitive.SelectGroupProps & react.RefAttributes<HTMLDivElement>>;
declare const SelectValue: react.ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & react.RefAttributes<HTMLSpanElement>>;
declare const SelectTrigger: react.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectTriggerProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;
declare const SelectScrollUpButton: react.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollUpButtonProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const SelectScrollDownButton: react.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollDownButtonProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const SelectContent: react.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const SelectLabel: react.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectLabelProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const SelectItem: react.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const SelectSeparator: react.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectSeparatorProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

declare const Separator: react.ForwardRefExoticComponent<Omit<SeparatorPrimitive.SeparatorProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

type SkeletonProps = HTMLAttributes<HTMLDivElement>;
declare function Skeleton({ className, ...props }: SkeletonProps): react_jsx_runtime.JSX.Element;

declare const Switch: react.ForwardRefExoticComponent<Omit<SwitchPrimitives.SwitchProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;

declare function Table({ className, ...props }: ComponentProps<'table'>): react_jsx_runtime.JSX.Element;
declare function TableHeader({ className, ...props }: ComponentProps<'thead'>): react_jsx_runtime.JSX.Element;
declare function TableBody({ className, ...props }: ComponentProps<'tbody'>): react_jsx_runtime.JSX.Element;
declare function TableFooter({ className, ...props }: ComponentProps<'tfoot'>): react_jsx_runtime.JSX.Element;
declare function TableRow({ className, ...props }: ComponentProps<'tr'>): react_jsx_runtime.JSX.Element;
declare function TableHead({ className, ...props }: ComponentProps<'th'>): react_jsx_runtime.JSX.Element;
declare function TableCell({ className, ...props }: ComponentProps<'td'>): react_jsx_runtime.JSX.Element;
declare function TableCaption({ className, ...props }: ComponentProps<'caption'>): react_jsx_runtime.JSX.Element;

declare const Tabs: react.ForwardRefExoticComponent<TabsPrimitive.TabsProps & react.RefAttributes<HTMLDivElement>>;
declare const TabsList: react.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsListProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const TabsTrigger: react.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsTriggerProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;
declare const TabsContent: react.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

declare const Textarea: react.ForwardRefExoticComponent<Omit<react.DetailedHTMLProps<react.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>, "ref"> & react.RefAttributes<HTMLTextAreaElement>>;

declare const TooltipProvider: react.FC<TooltipPrimitive.TooltipProviderProps>;
declare const Tooltip: react.FC<TooltipPrimitive.TooltipProps>;
declare const TooltipTrigger: react.ForwardRefExoticComponent<TooltipPrimitive.TooltipTriggerProps & react.RefAttributes<HTMLButtonElement>>;
declare const TooltipContent: react.ForwardRefExoticComponent<Omit<TooltipPrimitive.TooltipContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

/**
 * Configuration for a registered status.
 */
interface StatusConfig {
    /** Semantic category for color mapping */
    category: StatusCategory;
    /** Display label (human-readable) */
    label: string;
    /** Optional default animation for this status */
    animation?: StatusAnimation;
}
/**
 * Look up a status in the registry.
 * Returns undefined if not found.
 */
declare function getStatusConfig(status: string): StatusConfig | undefined;
/**
 * Register a new status or override an existing one.
 *
 * @example
 * ```ts
 * registerStatus('put-away pending', {
 *   category: 'warning',
 *   label: 'Put-Away Pending'
 * });
 * ```
 */
declare function registerStatus(key: string, config: StatusConfig): void;
/**
 * Register multiple statuses at once.
 *
 * @example
 * ```ts
 * registerStatuses({
 *   'await eta': { category: 'success', label: 'Await ETA' },
 *   'eta pending': { category: 'warning', label: 'ETA Pending' },
 * });
 * ```
 */
declare function registerStatuses(statuses: Record<string, StatusConfig>): void;
/**
 * Check if a status is registered.
 */
declare function isStatusRegistered(status: string): boolean;
/**
 * Get all registered statuses (for debugging/documentation).
 */
declare function getAllStatuses(): Map<string, StatusConfig>;
/**
 * Clear custom registrations (useful for testing).
 * Resets to core statuses only.
 */
declare function resetRegistry(): void;

interface UseStatusAnimationOptions {
    animation: StatusAnimation;
    disableAnimation?: boolean;
}
interface UseStatusAnimationReturn {
    /** Classes to apply to the badge container */
    containerClasses: string;
    /** Classes to apply to the dot element */
    dotClasses: string;
    /** Whether animation is currently active */
    isAnimated: boolean;
}
/**
 * Hook to get animation classes for StatusBadge.
 * Respects user's reduced motion preference.
 */
declare function useStatusAnimation({ animation, disableAnimation, }: UseStatusAnimationOptions): UseStatusAnimationReturn;

type SparklineVariant = 'positive' | 'negative' | 'neutral' | 'auto';
interface SparklineProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'children'> {
    /** Data points to visualize */
    data: number[];
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
    /** Stroke width in pixels */
    strokeWidth?: number;
    /** Visual variant based on trend */
    variant?: SparklineVariant;
    /** Whether to show fill gradient under line */
    showFill?: boolean;
    /** Whether to animate on mount */
    animated?: boolean;
    /** Accessible label for screen readers */
    'aria-label'?: string;
}
/**
 * Sparkline component for displaying mini line charts.
 *
 * @example
 * ```tsx
 * // Auto-detect trend from data
 * <Sparkline data={[10, 15, 12, 18, 22]} />
 *
 * // Force positive color
 * <Sparkline data={[10, 15, 12, 18, 22]} variant="positive" />
 *
 * // With fill gradient
 * <Sparkline data={[10, 15, 12, 18, 22]} showFill />
 * ```
 */
declare const Sparkline: react.ForwardRefExoticComponent<SparklineProps & react.RefAttributes<SVGSVGElement>>;

type KpiValueFormat = 'number' | 'currency' | 'percentage';
type KpiSize = 'sm' | 'md' | 'lg';
interface KpiCardProps extends Omit<ComponentPropsWithoutRef<'article'>, 'children'>, VariantProps<typeof kpiCardVariants> {
    /** Label describing the KPI */
    label: string;
    /** Current value (displayed prominently) */
    value: string | number;
    /** Previous value for comparison (calculates change automatically) */
    previousValue?: number;
    /** Change percentage (explicit, overrides calculation from previousValue) */
    change?: number;
    /** Format for displaying the value */
    valueFormat?: KpiValueFormat;
    /** Locale for number formatting */
    locale?: string;
    /** Whether higher values are better (affects color coding) */
    higherIsBetter?: boolean;
    /** Icon to display */
    icon?: ReactNode;
    /** Historical data for sparkline */
    sparklineData?: number[];
    /** Size variant */
    size?: KpiSize;
    /** Visual emphasis with glow effect */
    glow?: boolean;
    /** Loading state */
    loading?: boolean;
}
declare const kpiCardVariants: (props?: ({
    size?: "sm" | "lg" | "md" | null | undefined;
    glow?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
/**
 * KpiCard component for displaying key performance indicators.
 *
 * @example
 * ```tsx
 * // Basic KPI
 * <KpiCard label="Revenue" value={125000} valueFormat="currency" />
 *
 * // With change indicator
 * <KpiCard
 *   label="Active Users"
 *   value={1234}
 *   previousValue={1100}
 * />
 *
 * // With sparkline
 * <KpiCard
 *   label="Page Views"
 *   value={45678}
 *   sparklineData={[10, 15, 12, 18, 22, 25, 28]}
 * />
 *
 * // Lower is better (e.g., error rate)
 * <KpiCard
 *   label="Error Rate"
 *   value={2.5}
 *   valueFormat="percentage"
 *   previousValue={3.2}
 *   higherIsBetter={false}
 * />
 * ```
 */
declare const KpiCard: react.ForwardRefExoticComponent<KpiCardProps & react.RefAttributes<HTMLElement>>;

type CapacityStatus = 'low' | 'medium' | 'high' | 'critical';
interface CapacityThresholds {
    /** Threshold for low (success) - percentage below this is green */
    low: number;
    /** Threshold for medium (warning) - percentage below this is yellow */
    medium: number;
    /** Threshold for high - percentage below this is orange */
    high: number;
}
interface CapacityBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, VariantProps<typeof capacityBarVariants> {
    /** Current value */
    value: number;
    /** Maximum value */
    max: number;
    /** Label for the capacity bar */
    label?: string;
    /** Whether to show the numeric value */
    showValue?: boolean;
    /** Value format template: '{value}', '{max}', '{percent}' */
    valueFormat?: string;
    /** Number of visual segments */
    segments?: number;
    /** Size variant: 'xs' (1px), 'sm' (2px), 'md' (4px), 'lg' (8px) */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Custom color thresholds (percentages) */
    thresholds?: CapacityThresholds;
    /** Visual emphasis with glow effect (default: true) */
    glow?: boolean;
    /** Whether to animate on mount and value changes */
    animated?: boolean;
    /** Accessible description */
    'aria-label'?: string;
}
declare const capacityBarVariants: (props?: ({
    size?: "sm" | "lg" | "md" | "xs" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
/**
 * CapacityBar component for displaying capacity/progress with color-coded segments.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CapacityBar value={75} max={100} />
 *
 * // With label and value display
 * <CapacityBar
 *   value={45}
 *   max={100}
 *   label="Storage Used"
 *   showValue
 * />
 *
 * // Custom segments and thresholds
 * <CapacityBar
 *   value={85}
 *   max={100}
 *   segments={10}
 *   thresholds={{ low: 30, medium: 50, high: 70 }}
 * />
 * ```
 */
declare const CapacityBar: react.ForwardRefExoticComponent<CapacityBarProps & react.RefAttributes<HTMLDivElement>>;

/**
 * Accordion component for expandable content sections.
 *
 * @example
 * ```tsx
 * // Single mode (only one open at a time)
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Section 1</AccordionTrigger>
 *     <AccordionContent>Content for section 1</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>Section 2</AccordionTrigger>
 *     <AccordionContent>Content for section 2</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * // Multiple mode (many can be open)
 * <Accordion type="multiple">
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Section 1</AccordionTrigger>
 *     <AccordionContent>Content for section 1</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
declare const Accordion: react.ForwardRefExoticComponent<(AccordionPrimitive.AccordionSingleProps | AccordionPrimitive.AccordionMultipleProps) & react.RefAttributes<HTMLDivElement>>;
declare const AccordionItem: react.ForwardRefExoticComponent<Omit<AccordionPrimitive.AccordionItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const AccordionTrigger: react.ForwardRefExoticComponent<Omit<AccordionPrimitive.AccordionTriggerProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;
declare const AccordionContent: react.ForwardRefExoticComponent<Omit<AccordionPrimitive.AccordionContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

/**
 * AlertDialog component for important confirmations that require user attention.
 *
 * @example
 * ```tsx
 * <AlertDialog>
 *   <AlertDialogTrigger asChild>
 *     <Button variant="destructive">Delete</Button>
 *   </AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
 *       <AlertDialogDescription>
 *         This action cannot be undone.
 *       </AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction>Continue</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 */
declare const AlertDialog: react.FC<AlertDialogPrimitive.AlertDialogProps>;
declare const AlertDialogTrigger: react.ForwardRefExoticComponent<AlertDialogPrimitive.AlertDialogTriggerProps & react.RefAttributes<HTMLButtonElement>>;
declare const AlertDialogPortal: react.FC<AlertDialogPrimitive.AlertDialogPortalProps>;
declare const AlertDialogOverlay: react.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogOverlayProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const AlertDialogContent: react.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const AlertDialogHeader: {
    ({ className, ...props }: HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const AlertDialogFooter: {
    ({ className, ...props }: HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const AlertDialogTitle: react.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogTitleProps & react.RefAttributes<HTMLHeadingElement>, "ref"> & react.RefAttributes<HTMLHeadingElement>>;
declare const AlertDialogDescription: react.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogDescriptionProps & react.RefAttributes<HTMLParagraphElement>, "ref"> & react.RefAttributes<HTMLParagraphElement>>;
declare const AlertDialogAction: react.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogActionProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;
declare const AlertDialogCancel: react.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogCancelProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;

interface BreadcrumbProps extends ComponentPropsWithoutRef<'nav'> {
    /** Custom separator element */
    separator?: ReactNode;
}
/**
 * Breadcrumb navigation component.
 *
 * @example
 * ```tsx
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/products">Products</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbPage>Current Page</BreadcrumbPage>
 *     </BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 * ```
 */
declare const Breadcrumb: react.ForwardRefExoticComponent<BreadcrumbProps & react.RefAttributes<HTMLElement>>;
declare const BreadcrumbList: react.ForwardRefExoticComponent<Omit<react.DetailedHTMLProps<react.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>, "ref"> & react.RefAttributes<HTMLOListElement>>;
declare const BreadcrumbItem: react.ForwardRefExoticComponent<Omit<react.DetailedHTMLProps<react.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & react.RefAttributes<HTMLLIElement>>;
interface BreadcrumbLinkProps extends ComponentPropsWithoutRef<'a'> {
    /** Render as child component (for use with Link components) */
    asChild?: boolean;
}
declare const BreadcrumbLink: react.ForwardRefExoticComponent<BreadcrumbLinkProps & react.RefAttributes<HTMLAnchorElement>>;
declare const BreadcrumbPage: react.ForwardRefExoticComponent<Omit<react.DetailedHTMLProps<react.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & react.RefAttributes<HTMLSpanElement>>;
declare const BreadcrumbSeparator: {
    ({ children, className, ...props }: ComponentProps<"li">): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const BreadcrumbEllipsis: {
    ({ className, ...props }: ComponentProps<"span">): react_jsx_runtime.JSX.Element;
    displayName: string;
};

/**
 * Collapsible component for expandable/collapsible content.
 *
 * @example
 * ```tsx
 * <Collapsible>
 *   <CollapsibleTrigger>Toggle</CollapsibleTrigger>
 *   <CollapsibleContent>
 *     Expandable content here
 *   </CollapsibleContent>
 * </Collapsible>
 * ```
 */
declare const Collapsible: react.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleProps & react.RefAttributes<HTMLDivElement>>;
declare const CollapsibleTrigger: react.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleTriggerProps & react.RefAttributes<HTMLButtonElement>>;
declare const CollapsibleContent: react.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleContentProps & react.RefAttributes<HTMLDivElement>>;

type DrawerState = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
declare const drawerContentVariants: (props?: ({
    side?: "right" | "left" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface DrawerContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, VariantProps<typeof drawerContentVariants> {
    /** Width of the drawer */
    width?: string | number;
    /** State for glow effect */
    state?: DrawerState;
    /** Show close button */
    showClose?: boolean;
}
/**
 * Drawer component for side panel overlays.
 *
 * @example
 * ```tsx
 * <Drawer>
 *   <DrawerTrigger asChild>
 *     <Button>Open Drawer</Button>
 *   </DrawerTrigger>
 *   <DrawerContent width={400}>
 *     <DrawerHeader>
 *       <DrawerTitle>Edit Profile</DrawerTitle>
 *       <DrawerDescription>Make changes to your profile.</DrawerDescription>
 *     </DrawerHeader>
 *     <DrawerBody>
 *       <DrawerField label="Name" value="John Doe" />
 *       <DrawerField label="Email" value="john@example.com" />
 *     </DrawerBody>
 *     <DrawerFooter>
 *       <Button>Save changes</Button>
 *     </DrawerFooter>
 *   </DrawerContent>
 * </Drawer>
 *
 * // With status glow
 * <DrawerContent state="success">...</DrawerContent>
 * ```
 */
declare const Drawer: react.FC<DialogPrimitive.DialogProps>;
declare const DrawerTrigger: react.ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & react.RefAttributes<HTMLButtonElement>>;
declare const DrawerClose: react.ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & react.RefAttributes<HTMLButtonElement>>;
declare const DrawerPortal: react.FC<DialogPrimitive.DialogPortalProps>;
declare const DrawerOverlay: react.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogOverlayProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const DrawerContent: react.ForwardRefExoticComponent<DrawerContentProps & react.RefAttributes<HTMLDivElement>>;
interface DrawerHeaderProps extends HTMLAttributes<HTMLDivElement> {
    /** Show glow effect in header (uses parent drawer's state) */
    showGlow?: boolean;
}
declare const DrawerHeader: {
    ({ className, showGlow, children, ...props }: DrawerHeaderProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const DrawerBody: {
    ({ className, ...props }: HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
interface DrawerFooterProps extends HTMLAttributes<HTMLDivElement> {
    /** Make footer sticky at bottom during scroll */
    sticky?: boolean;
}
declare const DrawerFooter: {
    ({ className, sticky, ...props }: DrawerFooterProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const DrawerTitle: react.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & react.RefAttributes<HTMLHeadingElement>, "ref"> & react.RefAttributes<HTMLHeadingElement>>;
declare const DrawerDescription: react.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & react.RefAttributes<HTMLParagraphElement>, "ref"> & react.RefAttributes<HTMLParagraphElement>>;
interface DrawerStatusProps extends HTMLAttributes<HTMLDivElement> {
    /** Status type */
    status: DrawerState;
}
declare const DrawerStatus: {
    ({ className, status, children, ...props }: DrawerStatusProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const DrawerSectionTitle: {
    ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
interface DrawerFieldProps extends HTMLAttributes<HTMLDivElement> {
    /** Field label */
    label: string;
    /** Field value */
    value?: string | number | null;
}
declare const DrawerField: {
    ({ className, label, value, children, ...props }: DrawerFieldProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};

declare const emptyStateVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
    /** Icon to display (defaults to Inbox) */
    icon?: ReactNode;
    /** Title text */
    title: string;
    /** Description text */
    description?: string;
    /** Optional action slot (button, link, etc.) */
    action?: ReactNode;
    /** Additional className */
    className?: string;
}
/**
 * EmptyState component for displaying when no data is available.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your search or filters"
 * />
 *
 * // With action button
 * <EmptyState
 *   title="No projects yet"
 *   description="Create your first project to get started"
 *   action={<Button>Create Project</Button>}
 * />
 *
 * // Custom icon
 * <EmptyState
 *   icon={<FileQuestion className="h-6 w-6" />}
 *   title="No documents"
 * />
 * ```
 */
declare function EmptyState({ icon, title, description, action, size, className, }: EmptyStateProps): react_jsx_runtime.JSX.Element;

declare const errorStateVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
    fullPage?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ErrorStateProps extends VariantProps<typeof errorStateVariants> {
    /** Error title */
    title?: string;
    /** Error message or description */
    message?: string;
    /** Retry handler - shows retry button when provided */
    onRetry?: () => void;
    /** Custom retry button label */
    retryLabel?: string;
    /** Custom icon */
    icon?: ReactNode;
    /** Additional className */
    className?: string;
}
/**
 * ErrorState component for displaying error conditions.
 *
 * @example
 * ```tsx
 * // Basic error
 * <ErrorState />
 *
 * // With custom message
 * <ErrorState
 *   title="Connection failed"
 *   message="Unable to connect to the server. Check your internet connection."
 * />
 *
 * // With retry button
 * <ErrorState
 *   title="Failed to load data"
 *   message="Something went wrong while fetching the data."
 *   onRetry={() => refetch()}
 * />
 *
 * // Full-page error
 * <ErrorState fullPage title="404 - Page not found" />
 * ```
 */
declare function ErrorState({ title, message, onRetry, retryLabel, icon, size, fullPage, className, }: ErrorStateProps): react_jsx_runtime.JSX.Element;

interface FormFieldProps {
    /** Field label */
    label?: string;
    /** HTML for attribute - links label to input */
    htmlFor?: string;
    /** Error message to display */
    error?: string;
    /** Helper/description text (hidden when error shown) */
    description?: string;
    /** Whether the field is required (shows asterisk) */
    required?: boolean;
    /** The form input element(s) */
    children: ReactNode;
    /** Additional className */
    className?: string;
}
/**
 * FormField component for wrapping form inputs with label, error, and description.
 *
 * @example
 * ```tsx
 * // Basic field
 * <FormField label="Email" htmlFor="email">
 *   <Input id="email" type="email" />
 * </FormField>
 *
 * // Required field with description
 * <FormField
 *   label="Password"
 *   htmlFor="password"
 *   required
 *   description="Must be at least 8 characters"
 * >
 *   <Input id="password" type="password" />
 * </FormField>
 *
 * // With error
 * <FormField
 *   label="Username"
 *   htmlFor="username"
 *   error="Username is already taken"
 * >
 *   <Input id="username" />
 * </FormField>
 * ```
 */
declare function FormField({ label, htmlFor, error, description, required, children, className, }: FormFieldProps): react_jsx_runtime.JSX.Element;

type LoadingStateVariant = 'spinner' | 'dots' | 'skeleton';
type LoadingStateSize = 'sm' | 'default' | 'lg';
interface LoadingStateProps {
    /** Loading variant */
    variant?: LoadingStateVariant;
    /** Optional loading message */
    message?: string;
    /** Size of the loading indicator */
    size?: LoadingStateSize;
    /** Number of skeleton rows (for skeleton variant) */
    rows?: number;
    /** Additional className */
    className?: string;
}
/**
 * LoadingState component for displaying loading indicators.
 *
 * @example
 * ```tsx
 * // Spinner (default)
 * <LoadingState message="Loading..." />
 *
 * // Dots animation
 * <LoadingState variant="dots" />
 *
 * // Skeleton rows
 * <LoadingState variant="skeleton" rows={5} />
 *
 * // Large spinner
 * <LoadingState size="lg" message="Please wait..." />
 * ```
 */
declare function LoadingState({ variant, message, size, rows, className, }: LoadingStateProps): react_jsx_runtime.JSX.Element;
/**
 * PageLoading - convenience component for full-page loading states.
 *
 * @example
 * ```tsx
 * <PageLoading />
 * <PageLoading message="Loading dashboard..." />
 * ```
 */
declare function PageLoading({ message }: {
    message?: string;
}): react_jsx_runtime.JSX.Element;

/**
 * Pagination component for navigating through pages.
 *
 * @example
 * ```tsx
 * <Pagination>
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationPrevious href="#" />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="#">1</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="#" isActive>2</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="#">3</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationEllipsis />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationNext href="#" />
 *     </PaginationItem>
 *   </PaginationContent>
 * </Pagination>
 * ```
 */
declare const Pagination: {
    ({ className, ...props }: ComponentProps<"nav">): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const PaginationContent: react.ForwardRefExoticComponent<Omit<react.DetailedHTMLProps<react.HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & react.RefAttributes<HTMLUListElement>>;
declare const PaginationItem: react.ForwardRefExoticComponent<Omit<react.DetailedHTMLProps<react.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, "ref"> & react.RefAttributes<HTMLLIElement>>;
interface PaginationLinkProps extends ComponentProps<'a'>, Pick<ButtonProps, 'size'> {
    /** Whether this is the current page */
    isActive?: boolean;
}
declare const PaginationLink: {
    ({ className, isActive, size, ...props }: PaginationLinkProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const PaginationPrevious: {
    ({ className, size, ...props }: ComponentProps<typeof PaginationLink>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const PaginationNext: {
    ({ className, size, ...props }: ComponentProps<typeof PaginationLink>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const PaginationEllipsis: {
    ({ className, ...props }: ComponentProps<"span">): react_jsx_runtime.JSX.Element;
    displayName: string;
};

type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;
type RadioGroupItemProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;
/**
 * RadioGroup component for selecting one option from a set.
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="option-1">
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option-1" id="option-1" />
 *     <Label htmlFor="option-1">Option 1</Label>
 *   </div>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option-2" id="option-2" />
 *     <Label htmlFor="option-2">Option 2</Label>
 *   </div>
 * </RadioGroup>
 * ```
 */
declare const RadioGroup: react.ForwardRefExoticComponent<Omit<RadioGroupPrimitive.RadioGroupProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const RadioGroupItem: react.ForwardRefExoticComponent<Omit<RadioGroupPrimitive.RadioGroupItemProps & react.RefAttributes<HTMLButtonElement>, "ref"> & react.RefAttributes<HTMLButtonElement>>;

type SliderProps = ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;
/**
 * Slider component for selecting a value from a range.
 *
 * @example
 * ```tsx
 * <Slider defaultValue={[50]} max={100} step={1} />
 *
 * // Controlled
 * <Slider value={[value]} onValueChange={([v]) => setValue(v)} />
 *
 * // Range slider (multiple thumbs)
 * <Slider defaultValue={[25, 75]} />
 * ```
 */
declare const Slider: react.ForwardRefExoticComponent<Omit<SliderPrimitive.SliderProps & react.RefAttributes<HTMLSpanElement>, "ref"> & react.RefAttributes<HTMLSpanElement>>;

type Theme = 'light' | 'dark' | 'system';
interface ThemeToggleProps {
    /** Toggle variant */
    variant?: 'dropdown' | 'cycle' | 'sidebar';
    /** Show label text (for sidebar variant) */
    showLabel?: boolean;
    /** Additional className */
    className?: string;
}
/**
 * ThemeToggle component for switching between light, dark, and system themes.
 *
 * @example
 * ```tsx
 * // Dropdown (default)
 * <ThemeToggle />
 *
 * // Cycle through themes with single click
 * <ThemeToggle variant="cycle" />
 *
 * // Sidebar compact view
 * <ThemeToggle variant="sidebar" showLabel />
 * ```
 */
declare function ThemeToggle({ variant, showLabel, className, }: ThemeToggleProps): react_jsx_runtime.JSX.Element;

/**
 * Popover component for floating content positioned relative to a trigger.
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button variant="outline">Open popover</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <p>Place content for the popover here.</p>
 *   </PopoverContent>
 * </Popover>
 * ```
 */
declare const Popover: react.FC<PopoverPrimitive.PopoverProps>;
declare const PopoverTrigger: react.ForwardRefExoticComponent<PopoverPrimitive.PopoverTriggerProps & react.RefAttributes<HTMLButtonElement>>;
declare const PopoverAnchor: react.ForwardRefExoticComponent<PopoverPrimitive.PopoverAnchorProps & react.RefAttributes<HTMLDivElement>>;
declare const PopoverContent: react.ForwardRefExoticComponent<Omit<PopoverPrimitive.PopoverContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

declare const sheetContentVariants: (props?: ({
    side?: "top" | "right" | "bottom" | "left" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SheetContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, VariantProps<typeof sheetContentVariants> {
    /** Hide the close button */
    hideCloseButton?: boolean;
}
/**
 * Sheet component for side panels that slide in from any direction.
 *
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetTrigger asChild>
 *     <Button>Open Sheet</Button>
 *   </SheetTrigger>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Sheet Title</SheetTitle>
 *       <SheetDescription>Sheet description here.</SheetDescription>
 *     </SheetHeader>
 *     <div>Content goes here</div>
 *     <SheetFooter>
 *       <Button>Save</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 */
declare const Sheet: react.FC<DialogPrimitive.DialogProps>;
declare const SheetTrigger: react.ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & react.RefAttributes<HTMLButtonElement>>;
declare const SheetClose: react.ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & react.RefAttributes<HTMLButtonElement>>;
declare const SheetPortal: react.FC<DialogPrimitive.DialogPortalProps>;
declare const SheetOverlay: react.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogOverlayProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const SheetContent: react.ForwardRefExoticComponent<SheetContentProps & react.RefAttributes<HTMLDivElement>>;
declare const SheetHeader: {
    ({ className, ...props }: HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const SheetFooter: {
    ({ className, ...props }: HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const SheetTitle: react.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & react.RefAttributes<HTMLHeadingElement>, "ref"> & react.RefAttributes<HTMLHeadingElement>>;
declare const SheetDescription: react.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & react.RefAttributes<HTMLParagraphElement>, "ref"> & react.RefAttributes<HTMLParagraphElement>>;

interface FullScreenSheetProps extends HTMLAttributes<HTMLDivElement> {
    /** Whether the sheet is open */
    open: boolean;
    /** Called when the sheet should close */
    onClose: () => void;
    /** Title displayed in the header */
    title: string;
    /** Optional actions to show in the header (right side) */
    headerActions?: ReactNode;
    /** Sheet content */
    children: ReactNode;
}
/**
 * FullScreenSheet component for mobile-optimized full-screen overlays.
 * Slides up from the bottom and covers the entire viewport.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Button onClick={() => setOpen(true)}>Open</Button>
 *
 * <FullScreenSheet
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Edit Item"
 *   headerActions={<Button size="sm">Save</Button>}
 * >
 *   <div className="p-4">
 *     <p>Your content here...</p>
 *   </div>
 * </FullScreenSheet>
 * ```
 */
declare const FullScreenSheet: {
    ({ open, onClose, title, headerActions, children, className, ...props }: FullScreenSheetProps): react_jsx_runtime.JSX.Element | null;
    displayName: string;
};
interface FullScreenSheetContentProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
/**
 * Content wrapper for FullScreenSheet with default padding.
 */
declare const FullScreenSheetContent: {
    ({ className, children, ...props }: FullScreenSheetContentProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};

/**
 * Command component for searchable command palettes and menus.
 *
 * @example
 * ```tsx
 * <Command>
 *   <CommandInput placeholder="Search..." />
 *   <CommandList>
 *     <CommandEmpty>No results found.</CommandEmpty>
 *     <CommandGroup heading="Suggestions">
 *       <CommandItem>Calendar</CommandItem>
 *       <CommandItem>Search</CommandItem>
 *       <CommandItem>Settings</CommandItem>
 *     </CommandGroup>
 *   </CommandList>
 * </Command>
 * ```
 */
declare const Command: react.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Pick<Pick<react.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, keyof HTMLAttributes<HTMLDivElement> | "key"> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, keyof HTMLAttributes<HTMLDivElement> | "key" | "asChild"> & {
    label?: string;
    shouldFilter?: boolean;
    filter?: (value: string, search: string, keywords?: string[]) => number;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    loop?: boolean;
    disablePointerSelection?: boolean;
    vimBindings?: boolean;
} & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
interface CommandDialogProps extends ComponentPropsWithoutRef<typeof Dialog> {
    /** Title for accessibility (visually hidden) */
    title?: string;
}
/**
 * Command dialog variant that opens as a modal.
 *
 * @example
 * ```tsx
 * <CommandDialog open={open} onOpenChange={setOpen}>
 *   <CommandInput placeholder="Type a command or search..." />
 *   <CommandList>
 *     <CommandEmpty>No results found.</CommandEmpty>
 *     <CommandGroup heading="Actions">
 *       <CommandItem>New File</CommandItem>
 *       <CommandItem>Open Settings</CommandItem>
 *     </CommandGroup>
 *   </CommandList>
 * </CommandDialog>
 * ```
 */
declare const CommandDialog: ({ children, title, ...props }: CommandDialogProps) => react_jsx_runtime.JSX.Element;
declare const CommandInput: react.ForwardRefExoticComponent<Omit<Omit<Pick<Pick<react.DetailedHTMLProps<react.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "key" | keyof react.InputHTMLAttributes<HTMLInputElement>> & {
    ref?: React.Ref<HTMLInputElement>;
} & {
    asChild?: boolean;
}, "key" | "asChild" | keyof react.InputHTMLAttributes<HTMLInputElement>>, "value" | "onChange" | "type"> & {
    value?: string;
    onValueChange?: (search: string) => void;
} & react.RefAttributes<HTMLInputElement>, "ref"> & react.RefAttributes<HTMLInputElement>>;
declare const CommandList: react.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Pick<Pick<react.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, keyof HTMLAttributes<HTMLDivElement> | "key"> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, keyof HTMLAttributes<HTMLDivElement> | "key" | "asChild"> & {
    label?: string;
} & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const CommandEmpty: react.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Pick<Pick<react.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, keyof HTMLAttributes<HTMLDivElement> | "key"> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, keyof HTMLAttributes<HTMLDivElement> | "key" | "asChild"> & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const CommandGroup: react.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Omit<Pick<Pick<react.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, keyof HTMLAttributes<HTMLDivElement> | "key"> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, keyof HTMLAttributes<HTMLDivElement> | "key" | "asChild">, "value" | "heading"> & {
    heading?: React.ReactNode;
    value?: string;
    forceMount?: boolean;
} & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const CommandSeparator: react.ForwardRefExoticComponent<Omit<Pick<Pick<react.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, keyof HTMLAttributes<HTMLDivElement> | "key"> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, keyof HTMLAttributes<HTMLDivElement> | "key" | "asChild"> & {
    alwaysRender?: boolean;
} & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const CommandItem: react.ForwardRefExoticComponent<Omit<{
    children?: React.ReactNode;
} & Omit<Pick<Pick<react.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, keyof HTMLAttributes<HTMLDivElement> | "key"> & {
    ref?: React.Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, keyof HTMLAttributes<HTMLDivElement> | "key" | "asChild">, "value" | "onSelect" | "disabled"> & {
    disabled?: boolean;
    onSelect?: (value: string) => void;
    value?: string;
    keywords?: string[];
    forceMount?: boolean;
} & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const CommandShortcut: {
    ({ className, ...props }: HTMLAttributes<HTMLSpanElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};

interface WizardContextValue {
    currentStep: number;
    totalSteps: number;
}
declare const useWizard: () => WizardContextValue;
interface WizardProps extends HTMLAttributes<HTMLDivElement> {
    /** Current step (1-indexed) */
    currentStep: number;
    /** Total number of steps */
    totalSteps: number;
    /** Wizard content */
    children: ReactNode;
}
/**
 * Wizard component for multi-step workflows.
 *
 * @example
 * ```tsx
 * <Wizard currentStep={1} totalSteps={3}>
 *   <WizardHeader title="Create Project" onClose={() => {}} />
 *   <WizardContent>
 *     <p>Step 1 content</p>
 *   </WizardContent>
 *   <WizardFooter
 *     onBack={() => {}}
 *     onNext={() => {}}
 *     isBackDisabled={true}
 *   />
 * </Wizard>
 * ```
 */
declare const Wizard: react.ForwardRefExoticComponent<WizardProps & react.RefAttributes<HTMLDivElement>>;
interface WizardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    /** Optional title */
    title?: string;
    /** Called when close button is clicked */
    onClose?: () => void;
    /** Show step indicators */
    showStepIndicators?: boolean;
}
declare const WizardHeader: {
    ({ title, onClose, showStepIndicators, className, ...props }: WizardHeaderProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};
interface StepIndicatorProps extends HTMLAttributes<HTMLDivElement> {
    /** Step number */
    step: number;
    /** Whether this step is completed */
    isCompleted?: boolean;
    /** Whether this step is active */
    isActive?: boolean;
}
declare const StepIndicator: {
    ({ step, isCompleted, isActive, className, ...props }: StepIndicatorProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};
interface WizardContentProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
declare const WizardContent: {
    ({ className, children, ...props }: WizardContentProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};
interface WizardFooterProps extends HTMLAttributes<HTMLDivElement> {
    /** Called when back button is clicked */
    onBack?: () => void;
    /** Called when next button is clicked */
    onNext?: () => void;
    /** Called when cancel button is clicked */
    onCancel?: () => void;
    /** Disable back button */
    isBackDisabled?: boolean;
    /** Disable next button */
    isNextDisabled?: boolean;
    /** Show loading state on next button */
    isLoading?: boolean;
    /** Custom label for next button */
    nextLabel?: string;
    /** Custom label for back button */
    backLabel?: string;
    /** Custom label for cancel button */
    cancelLabel?: string;
    /** Show cancel button */
    showCancel?: boolean;
}
declare const WizardFooter: {
    ({ onBack, onNext, onCancel, isBackDisabled, isNextDisabled, isLoading, nextLabel, backLabel, cancelLabel, showCancel, className, ...props }: WizardFooterProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};

interface KanbanColumn<T> {
    id: string;
    title: string;
    color?: string;
    items: T[];
}
interface KanbanBoardProps<T extends {
    id: string;
}> extends Omit<HTMLAttributes<HTMLDivElement>, 'onDragEnd'> {
    /** Column definitions with items */
    columns: KanbanColumn<T>[];
    /** Called when an item is dropped */
    onDragEnd: (itemId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
    /** Render function for card content */
    renderCard: (item: T) => ReactNode;
    /** Optional class for column container */
    columnClassName?: string;
}
/**
 * KanbanBoard component for drag-and-drop column-based layouts.
 *
 * @example
 * ```tsx
 * interface Task {
 *   id: string;
 *   title: string;
 *   assignee: string;
 * }
 *
 * const columns: KanbanColumn<Task>[] = [
 *   { id: 'todo', title: 'To Do', color: 'bg-blue-500', items: [...] },
 *   { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-500', items: [...] },
 *   { id: 'done', title: 'Done', color: 'bg-green-500', items: [...] },
 * ];
 *
 * <KanbanBoard
 *   columns={columns}
 *   onDragEnd={(itemId, from, to, index) => { ... }}
 *   renderCard={(task) => (
 *     <KanbanCard>
 *       <KanbanCardHandle />
 *       <div>{task.title}</div>
 *     </KanbanCard>
 *   )}
 * />
 * ```
 */
declare function KanbanBoard<T extends {
    id: string;
}>({ columns, onDragEnd, renderCard, className, columnClassName, ...props }: KanbanBoardProps<T>): react_jsx_runtime.JSX.Element;
interface KanbanCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Whether the card is being dragged */
    isDragging?: boolean;
    children: ReactNode;
}
/**
 * KanbanCard component for individual items in the board.
 */
declare const KanbanCard: react.ForwardRefExoticComponent<KanbanCardProps & react.RefAttributes<HTMLDivElement>>;
type KanbanCardHandleProps = HTMLAttributes<HTMLDivElement>;
/**
 * KanbanCardHandle component for drag handle indicator.
 */
declare const KanbanCardHandle: react.ForwardRefExoticComponent<KanbanCardHandleProps & react.RefAttributes<HTMLDivElement>>;

declare const HoverCard: react.FC<HoverCardPrimitive.HoverCardProps>;
declare const HoverCardTrigger: react.ForwardRefExoticComponent<HoverCardPrimitive.HoverCardTriggerProps & react.RefAttributes<HTMLAnchorElement>>;
declare const HoverCardContent: react.ForwardRefExoticComponent<Omit<HoverCardPrimitive.HoverCardContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;

declare const toggleVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const Toggle: react.ForwardRefExoticComponent<Omit<TogglePrimitive.ToggleProps & react.RefAttributes<HTMLButtonElement>, "ref"> & VariantProps<(props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string> & react.RefAttributes<HTMLButtonElement>>;

declare const ToggleGroup: react.ForwardRefExoticComponent<((Omit<ToggleGroupPrimitive.ToggleGroupSingleProps & react.RefAttributes<HTMLDivElement>, "ref"> | Omit<ToggleGroupPrimitive.ToggleGroupMultipleProps & react.RefAttributes<HTMLDivElement>, "ref">) & VariantProps<(props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string>) & react.RefAttributes<HTMLDivElement>>;
declare const ToggleGroupItem: react.ForwardRefExoticComponent<Omit<ToggleGroupPrimitive.ToggleGroupItemProps & react.RefAttributes<HTMLButtonElement>, "ref"> & VariantProps<(props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string> & react.RefAttributes<HTMLButtonElement>>;

declare const ContextMenu: react.FC<ContextMenuPrimitive.ContextMenuProps>;
declare const ContextMenuTrigger: react.ForwardRefExoticComponent<ContextMenuPrimitive.ContextMenuTriggerProps & react.RefAttributes<HTMLSpanElement>>;
declare const ContextMenuGroup: react.ForwardRefExoticComponent<ContextMenuPrimitive.ContextMenuGroupProps & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuPortal: react.FC<ContextMenuPrimitive.ContextMenuPortalProps>;
declare const ContextMenuSub: react.FC<ContextMenuPrimitive.ContextMenuSubProps>;
declare const ContextMenuRadioGroup: react.ForwardRefExoticComponent<ContextMenuPrimitive.ContextMenuRadioGroupProps & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuSubTrigger: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuSubTriggerProps & react.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuSubContent: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuSubContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuContent: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuContentProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuItem: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuCheckboxItem: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuCheckboxItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuRadioItem: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuRadioItemProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuLabel: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuLabelProps & react.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuSeparator: react.ForwardRefExoticComponent<Omit<ContextMenuPrimitive.ContextMenuSeparatorProps & react.RefAttributes<HTMLDivElement>, "ref"> & react.RefAttributes<HTMLDivElement>>;
declare const ContextMenuShortcut: {
    ({ className, ...props }: react.HTMLAttributes<HTMLSpanElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];
type CarouselProps = {
    opts?: CarouselOptions;
    plugins?: CarouselPlugin;
    orientation?: 'horizontal' | 'vertical';
    setApi?: (api: CarouselApi) => void;
};
declare const Carousel: react.ForwardRefExoticComponent<react.HTMLAttributes<HTMLDivElement> & CarouselProps & react.RefAttributes<HTMLDivElement>>;
declare const CarouselContent: react.ForwardRefExoticComponent<react.HTMLAttributes<HTMLDivElement> & react.RefAttributes<HTMLDivElement>>;
declare const CarouselItem: react.ForwardRefExoticComponent<react.HTMLAttributes<HTMLDivElement> & react.RefAttributes<HTMLDivElement>>;
declare const CarouselPrevious: react.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & react.RefAttributes<HTMLButtonElement>>;
declare const CarouselNext: react.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & react.RefAttributes<HTMLButtonElement>>;

declare const ResizablePanelGroup: ({ className, ...props }: react.ComponentProps<typeof Group>) => react_jsx_runtime.JSX.Element;
declare const ResizablePanel: typeof Panel;
declare const ResizableHandle: ({ withHandle, className, ...props }: react.ComponentProps<typeof Separator$1> & {
    withHandle?: boolean;
}) => react_jsx_runtime.JSX.Element;

interface StickyActionBarProps {
    /** Left side content (status, info text) */
    leftContent?: react.ReactNode;
    /** Primary action button (required) */
    primaryAction: react.ReactNode;
    /** Secondary action (optional icon button) */
    secondaryAction?: react.ReactNode;
    /** Whether the bar is visible */
    visible?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare const StickyActionBar: react.ForwardRefExoticComponent<StickyActionBarProps & react.RefAttributes<HTMLDivElement>>;

type BarChartColor = 'green' | 'red' | 'blue' | 'orange' | 'neutral';
interface BarChartDataPoint {
    value: number;
    date?: Date;
    label?: string;
}
interface BarChartProps {
    /** Array of data points */
    data: BarChartDataPoint[];
    /** Color theme for the bars */
    color?: BarChartColor;
    /** Height of the chart in pixels */
    height?: number;
    /** Whether to show date/label at start and end */
    showLabels?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare const BarChart: react.ForwardRefExoticComponent<BarChartProps & react.RefAttributes<HTMLDivElement>>;

interface DateRangePickerProps {
    /** Start date in YYYY-MM-DD format */
    from?: string;
    /** End date in YYYY-MM-DD format */
    to?: string;
    /** Callback when start date changes */
    onFromChange: (value: string) => void;
    /** Callback when end date changes */
    onToChange: (value: string) => void;
    /** Placeholder for start date */
    fromPlaceholder?: string;
    /** Placeholder for end date */
    toPlaceholder?: string;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Whether the picker has an error */
    hasError?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare const DateRangePicker: react.ForwardRefExoticComponent<DateRangePickerProps & react.RefAttributes<HTMLDivElement>>;

type CalendarProps = react.ComponentProps<typeof DayPicker>;
declare function Calendar({ className, classNames, showOutsideDays, ...props }: CalendarProps): react_jsx_runtime.JSX.Element;
declare namespace Calendar {
    var displayName: string;
}

interface SteppedProgressBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Progress value 0-100 */
    progress: number;
    /** Number of segments (default 10) */
    segments?: number;
    /** Height in pixels (default 4) */
    height?: number;
    /** Color variant */
    variant?: 'default' | 'success' | 'warning' | 'danger';
}
/**
 * SteppedProgressBar - Segmented progress bar (Netflix/YouTube style)
 *
 * Shows progress as filled segments with primary color.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SteppedProgressBar progress={75} />
 *
 * // Custom segments and height
 * <SteppedProgressBar progress={60} segments={5} height={8} />
 *
 * // Color variants
 * <SteppedProgressBar progress={90} variant="danger" />
 * ```
 */
declare const SteppedProgressBar: react.ForwardRefExoticComponent<SteppedProgressBarProps & react.RefAttributes<HTMLDivElement>>;

type AgentType = 'persona-forge' | 'ux-designer' | 'system' | string;
declare const agentBadgeVariants: (props?: ({
    size?: "sm" | "md" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AgentBadgeProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>, VariantProps<typeof agentBadgeVariants> {
    /** Agent name to display */
    agent: AgentType;
    /** Whether the agent is currently active/running */
    isActive?: boolean;
    /** Custom display label (defaults to agent name) */
    label?: string;
}
/**
 * AgentBadge - Displays which AI agent is performing a task
 *
 * Used in processing screens to show which agent (persona-forge, ux-designer)
 * is currently working on a task.
 *
 * @example
 * ```tsx
 * <AgentBadge agent="persona-forge" />
 * <AgentBadge agent="ux-designer" isActive />
 * <AgentBadge agent="system" size="md" />
 * ```
 */
declare const AgentBadge: react.ForwardRefExoticComponent<AgentBadgeProps & react.RefAttributes<HTMLSpanElement>>;
/**
 * Get the color class for an agent (for use in other components)
 */
declare function getAgentColorClass(agent: AgentType): string;
/**
 * Get the background color for an agent
 */
declare function getAgentBgClass(agent: AgentType): string;
/**
 * Register a custom agent type with colors
 */
declare function registerAgentType(name: string, colors: {
    bg: string;
    border: string;
    text: string;
    dot: string;
}): void;

type StepClusterStatus = 'pending' | 'active' | 'completed' | 'error' | 'skipped';
interface StepClusterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onClick'> {
    /** Current status of this step */
    status: StepClusterStatus;
    /** Number of sub-tasks completed (0-4) */
    subTaskProgress: number;
    /** Optional label for the step */
    label?: string;
    /** Show step number below cluster */
    showNumber?: boolean;
    /** Step number to display */
    stepNumber?: number;
    /** Called when step is clicked */
    onClick?: () => void;
}
/**
 * StepCluster - 2x2 bin visualization for step progress
 *
 * Used in step progress grids to show individual step completion with
 * 4 sub-tasks that fill in clockwise order.
 *
 * @example
 * ```tsx
 * // Pending step
 * <StepCluster status="pending" subTaskProgress={0} />
 *
 * // Active step with 2 sub-tasks done
 * <StepCluster status="active" subTaskProgress={2} />
 *
 * // Completed step
 * <StepCluster status="completed" subTaskProgress={4} />
 *
 * // With step number
 * <StepCluster status="active" subTaskProgress={1} showNumber stepNumber={5} />
 * ```
 */
declare const StepCluster: react.ForwardRefExoticComponent<StepClusterProps & react.RefAttributes<HTMLDivElement>>;

type BinStatus = 'empty' | 'filling' | 'filled';
interface ProgressBinStripProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Total number of bins (default: 68) */
    totalBins?: number;
    /** Number of completed bins (0 to totalBins) */
    completedBins: number;
    /** Whether this strip is currently being filled */
    isActive: boolean;
    /** Whether all bins are complete */
    isComplete: boolean;
    /** Whether there was an error */
    hasError?: boolean;
    /** Whether this is linked to existing persona (shows blue instead of orange) */
    isLinked?: boolean;
    /** Number of visual rows (default: 4) */
    rows?: number;
    /** Number of bins per row (default: varies for full width) */
    binsPerRow?: number;
}
/**
 * ProgressBinStrip - Full-width 4-row grid with fill pattern
 *
 * Layout: 4 rows of bins that fill left-to-right
 * Each bin shows fill state with glow effects
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ProgressBinStrip
 *   completedBins={34}
 *   isActive={true}
 *   isComplete={false}
 * />
 *
 * // Linked variant (blue)
 * <ProgressBinStrip
 *   completedBins={68}
 *   isActive={false}
 *   isComplete={true}
 *   isLinked
 * />
 *
 * // Error state
 * <ProgressBinStrip
 *   completedBins={20}
 *   isActive={false}
 *   isComplete={false}
 *   hasError
 * />
 * ```
 */
declare const ProgressBinStrip: react.ForwardRefExoticComponent<ProgressBinStripProps & react.RefAttributes<HTMLDivElement>>;

type RowStatus = 'pending' | 'active' | 'completed' | 'error' | 'skipped' | 'linked';
interface StakeholderProgressRowProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Stakeholder role name */
    role: string;
    /** Index for color assignment */
    index: number;
    /** Current status of this stakeholder's generation */
    status: RowStatus;
    /** Number of completed bins (0-68) */
    completedBins: number;
    /** Total bins (default: 68) */
    totalBins?: number;
    /** Current step being processed (1-18), shown when active */
    currentStep?: number;
    /** Total steps (default: 18) */
    totalSteps?: number;
    /** Current step label */
    currentStepLabel?: string;
    /** Name of linked existing persona (for 'linked' status) */
    linkedPersonaName?: string;
    /** Callback for retry action */
    onRetry?: () => void;
    /** Callback for skip action */
    onSkip?: () => void;
    /** Custom icon component */
    icon?: React.ReactNode;
    /** Icon color (CSS color value) */
    iconColor?: string;
}
/**
 * StakeholderProgressRow - Single stakeholder with progress strip
 *
 * Layout: [Icon + Name (180px)] [Progress Strip (flex)] [Status Badge]
 *
 * @example
 * ```tsx
 * // Completed row
 * <StakeholderProgressRow
 *   role="Product Manager"
 *   index={0}
 *   status="completed"
 *   completedBins={68}
 * />
 *
 * // Active row with current step
 * <StakeholderProgressRow
 *   role="Engineering Lead"
 *   index={1}
 *   status="active"
 *   completedBins={42}
 *   currentStep={11}
 *   currentStepLabel="KPIs"
 * />
 *
 * // Error row with retry/skip
 * <StakeholderProgressRow
 *   role="Data Analyst"
 *   index={3}
 *   status="error"
 *   completedBins={20}
 *   onRetry={() => handleRetry()}
 *   onSkip={() => handleSkip()}
 * />
 * ```
 */
declare const StakeholderProgressRow: react.ForwardRefExoticComponent<StakeholderProgressRowProps & react.RefAttributes<HTMLDivElement>>;

type StepStatus = 'pending' | 'running' | 'waiting' | 'completed' | 'failed';
interface StepItem {
    /** Unique identifier for the step */
    id: string;
    /** Display label for the step */
    label: string;
    /** Current status of the step */
    status: StepStatus;
    /** Progress percentage (0-100) when running */
    progress?: number;
    /** Elapsed time in seconds */
    elapsedTime?: number;
}
interface StepListProps extends ComponentPropsWithoutRef<'nav'> {
    /** Array of steps to display */
    steps: StepItem[];
    /** Currently selected step for viewing output */
    selectedStepId?: string | null;
    /** Callback when step is clicked */
    onStepClick?: (stepId: string) => void;
    /** Title for the step list */
    title?: string;
    /** Whether to show the title */
    showTitle?: boolean;
}
/**
 * StepList - Vertical list of pipeline steps with status indicators
 *
 * Shows all steps in order with their current execution status.
 *
 * @example
 * ```tsx
 * const steps = [
 *   { id: 'seed', label: 'Project Seed', status: 'completed', elapsedTime: 5 },
 *   { id: 'stakeholders', label: 'Stakeholders', status: 'running', progress: 65 },
 *   { id: 'personas', label: 'Persona Drafts', status: 'pending' },
 * ];
 *
 * <StepList
 *   steps={steps}
 *   onStepClick={(id) => setSelectedStep(id)}
 *   selectedStepId={selectedStep}
 * />
 * ```
 */
declare const StepList: react.ForwardRefExoticComponent<StepListProps & react.RefAttributes<HTMLElement>>;
interface StepSummaryProps extends ComponentPropsWithoutRef<'div'> {
    /** Total number of steps */
    total: number;
    /** Number of completed steps */
    completed: number;
    /** Number of failed steps */
    failed: number;
}
/**
 * Summary of step progress for compact display
 */
declare const StepSummary: react.ForwardRefExoticComponent<StepSummaryProps & react.RefAttributes<HTMLDivElement>>;

interface StepState {
    status: StepClusterStatus;
    subTaskProgress: number;
}
interface StepConfig {
    /** Unique identifier for the step */
    id: string;
    /** Full label for the step */
    label: string;
    /** Short label for display */
    shortLabel: string;
    /** Category for grouping */
    category?: string;
    /** Order within the list (1-based) */
    order: number;
}
interface StepProgressGridProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Array of step configurations */
    steps: StepConfig[];
    /** Current step index (1-based), or 0 if not started */
    currentStep: number;
    /** Progress within current step (0-100) */
    stepProgress: number;
    /** Map of step states (for completed/error/skipped steps) */
    stepStates?: Record<string, StepState>;
    /** Show category headers above groups */
    showCategories?: boolean;
    /** Show step numbers below clusters */
    showNumbers?: boolean;
    /** Compact mode (no labels or headers) */
    compact?: boolean;
    /** Current step activity description */
    currentActivity?: string;
}
/**
 * StepProgressGrid - Multi-step progress visualization with categories
 *
 * Displays a grid of StepClusters grouped by category, with overall
 * progress tracking and current step highlighting.
 *
 * @example
 * ```tsx
 * const steps = [
 *   { id: 'persona', label: 'Persona', shortLabel: 'Persona', category: 'Core Identity', order: 1 },
 *   { id: 'journey', label: 'Journey', shortLabel: 'Journey', category: 'Core Identity', order: 2 },
 *   { id: 'ia', label: 'Information Architecture', shortLabel: 'IA', category: 'Foundation', order: 3 },
 *   // ...
 * ];
 *
 * <StepProgressGrid
 *   steps={steps}
 *   currentStep={3}
 *   stepProgress={50}
 * />
 * ```
 */
declare const StepProgressGrid: react.ForwardRefExoticComponent<StepProgressGridProps & react.RefAttributes<HTMLDivElement>>;

interface OverallProgressBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Number of completed steps */
    completedSteps: number;
    /** Total number of steps (default 18) */
    totalSteps?: number;
    /** Current step label */
    currentStepLabel?: string;
    /** Whether generation is active */
    isActive?: boolean;
    /** Whether to show step dots below the bar */
    showStepDots?: boolean;
}
/**
 * OverallProgressBar - Shows overall progress with step counter
 *
 * Displays a header with step counter, gradient progress bar,
 * and optional step indicator dots.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <OverallProgressBar
 *   completedSteps={6}
 *   totalSteps={18}
 *   isActive
 * />
 *
 * // With current step label
 * <OverallProgressBar
 *   completedSteps={12}
 *   totalSteps={18}
 *   currentStepLabel="KPIs"
 *   isActive
 * />
 *
 * // Complete state
 * <OverallProgressBar
 *   completedSteps={18}
 *   totalSteps={18}
 * />
 * ```
 */
declare const OverallProgressBar: react.ForwardRefExoticComponent<OverallProgressBarProps & react.RefAttributes<HTMLDivElement>>;
/**
 * CompactProgressIndicator - Minimal progress for header/nav
 *
 * Shows step count and a small progress bar, suitable for
 * navigation headers or compact layouts.
 *
 * @example
 * ```tsx
 * <CompactProgressIndicator
 *   completedSteps={6}
 *   totalSteps={18}
 *   isActive
 * />
 * ```
 */
interface CompactProgressIndicatorProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Number of completed steps */
    completedSteps: number;
    /** Total number of steps (default 18) */
    totalSteps?: number;
    /** Whether generation is active */
    isActive?: boolean;
}
declare const CompactProgressIndicator: react.ForwardRefExoticComponent<CompactProgressIndicatorProps & react.RefAttributes<HTMLDivElement>>;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AgentBadge, type AgentBadgeProps, type AgentType, Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, AlertTitle, Avatar, AvatarFallback, AvatarImage, BarChart, type BarChartColor, type BarChartDataPoint, type BarChartProps, type BinStatus, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, type BreadcrumbLinkProps, BreadcrumbList, BreadcrumbPage, type BreadcrumbProps, BreadcrumbSeparator, Button, type ButtonProps, Calendar, type CalendarProps, CapacityBar, type CapacityBarProps, type CapacityStatus, type CapacityThresholds, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Carousel, type CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, Checkbox, Collapsible, CollapsibleContent, CollapsibleTrigger, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, CompactProgressIndicator, type CompactProgressIndicatorProps, ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, DateRangePicker, type DateRangePickerProps, Dialog, DialogClose, DialogContent, type DialogContentProps, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, Drawer, DrawerBody, DrawerClose, DrawerContent, type DrawerContentProps, DrawerDescription, DrawerField, type DrawerFieldProps, DrawerFooter, type DrawerFooterProps, DrawerHeader, type DrawerHeaderProps, DrawerOverlay, DrawerPortal, DrawerSectionTitle, type DrawerState, DrawerStatus, type DrawerStatusProps, DrawerTitle, DrawerTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, EmptyState, type EmptyStateProps, ErrorState, type ErrorStateProps, FormField, type FormFieldProps, FullScreenSheet, FullScreenSheetContent, type FullScreenSheetContentProps, type FullScreenSheetProps, HoverCard, HoverCardContent, HoverCardTrigger, Input, type InputProps, KanbanBoard, type KanbanBoardProps, KanbanCard, KanbanCardHandle, type KanbanCardHandleProps, type KanbanCardProps, type KanbanColumn, KpiCard, type KpiCardProps, type KpiSize, type KpiValueFormat, Label, LoadingState, type LoadingStateProps, type LoadingStateSize, type LoadingStateVariant, OverallProgressBar, type OverallProgressBarProps, PageLoading, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, type PaginationLinkProps, PaginationNext, PaginationPrevious, Popover, PopoverAnchor, PopoverContent, PopoverTrigger, Progress, ProgressBinStrip, type ProgressBinStripProps, type ProgressProps, RadioGroup, RadioGroupItem, type RadioGroupItemProps, type RadioGroupProps, ResizableHandle, ResizablePanel, ResizablePanelGroup, type RowStatus, ScrollArea, ScrollBar, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator, Sheet, SheetClose, SheetContent, type SheetContentProps, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger, Skeleton, type SkeletonProps, Slider, type SliderProps, Sparkline, type SparklineProps, type SparklineVariant, StakeholderProgressRow, type StakeholderProgressRowProps, StatusAnimation, StatusCategory, type StatusConfig, StepCluster, type StepClusterProps, type StepClusterStatus, type StepConfig, StepIndicator, type StepIndicatorProps, type StepItem, StepList, type StepListProps, StepProgressGrid, type StepProgressGridProps, type StepState, type StepStatus, StepSummary, type StepSummaryProps, SteppedProgressBar, type SteppedProgressBarProps, StickyActionBar, type StickyActionBarProps, Switch, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, type Theme, ThemeToggle, type ThemeToggleProps, Toggle, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Wizard, WizardContent, type WizardContentProps, WizardFooter, type WizardFooterProps, WizardHeader, type WizardHeaderProps, type WizardProps, agentBadgeVariants, alertVariants, buttonVariants, capacityBarVariants, getAgentBgClass, getAgentColorClass, getAllStatuses, getStatusConfig, indicatorVariants, inputVariants, isStatusRegistered, kpiCardVariants, labelVariants, progressVariants, registerAgentType, registerStatus, registerStatuses, resetRegistry, toggleVariants, useStatusAnimation, useWizard };
