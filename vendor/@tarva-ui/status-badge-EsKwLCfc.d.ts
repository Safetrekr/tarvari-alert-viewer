import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import * as react from 'react';
import { HTMLAttributes, ComponentPropsWithoutRef, ReactNode } from 'react';

declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "secondary" | "outline" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): react_jsx_runtime.JSX.Element;

/**
 * Core semantic categories for status colors.
 * Maps to CSS variables: --status-success, --status-warning, etc.
 */
type StatusCategory = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'muted';
/**
 * Animation presets for status badges.
 */
type StatusAnimation = 'none' | 'pulse' | 'pop' | 'shake';
/**
 * Visual variants for the badge.
 */
type StatusVariant = 'dot' | 'badge' | 'outline' | 'subtle';
/**
 * Size variants.
 */
type StatusSize = 'sm' | 'default' | 'lg';
/**
 * Status badge props interface.
 */
interface StatusBadgeProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, VariantProps<typeof statusBadgeVariants> {
    /**
     * Status key - can be a known status or any custom string.
     * Known statuses are auto-mapped to category and label.
     */
    status: string;
    /**
     * Override the display label.
     * If not provided, uses registry lookup or formatted status string.
     */
    label?: string;
    /**
     * Override the category (color scheme).
     * If not provided, uses registry lookup or defaults to 'neutral'.
     */
    category?: StatusCategory;
    /**
     * Visual variant.
     * @default 'dot'
     */
    variant?: StatusVariant;
    /**
     * Size variant.
     * @default 'default'
     */
    size?: StatusSize;
    /**
     * Animation preset.
     * @default 'none'
     */
    animation?: StatusAnimation;
    /**
     * Whether to show the status dot (only applies to 'dot' variant).
     * @default true
     */
    showDot?: boolean;
    /**
     * Custom icon to show instead of dot.
     */
    icon?: ReactNode;
    /**
     * Whether animation should be disabled.
     * @default false
     */
    disableAnimation?: boolean;
}

declare const statusBadgeVariants: (props?: ({
    variant?: "outline" | "badge" | "dot" | "subtle" | null | undefined;
    category?: "success" | "warning" | "danger" | "info" | "neutral" | "muted" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const statusDotVariants: (props?: ({
    category?: "success" | "warning" | "danger" | "info" | "neutral" | "muted" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
/**
 * StatusBadge component for displaying status indicators.
 *
 * @example
 * ```tsx
 * // Basic usage with automatic lookup
 * <StatusBadge status="active" />
 *
 * // With custom label
 * <StatusBadge status="processing" label="In Progress" />
 *
 * // Badge variant with animation
 * <StatusBadge
 *   status="indexing"
 *   variant="badge"
 *   animation="pulse"
 * />
 *
 * // Custom category override
 * <StatusBadge
 *   status="custom-status"
 *   category="success"
 *   label="Custom Label"
 * />
 * ```
 */
declare const StatusBadge: react.ForwardRefExoticComponent<StatusBadgeProps & react.RefAttributes<HTMLDivElement>>;

export { type BadgeProps as B, type StatusCategory as S, type StatusVariant as a, type StatusAnimation as b, Badge as c, StatusBadge as d, type StatusBadgeProps as e, type StatusSize as f, badgeVariants as g, statusDotVariants as h, statusBadgeVariants as s };
