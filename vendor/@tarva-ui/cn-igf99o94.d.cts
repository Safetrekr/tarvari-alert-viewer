import { ClassValue } from 'clsx';

/**
 * Utility for merging class names with Tailwind CSS conflict resolution.
 *
 * Combines clsx for conditional classes with tailwind-merge for
 * proper handling of Tailwind utility conflicts.
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 *
 * // Conditional classes
 * cn('base', isActive && 'active', { 'hover:bg-blue': isHoverable })
 *
 * // With component props
 * function Button({ className, ...props }) {
 *   return (
 *     <button className={cn('btn-base', className)} {...props} />
 *   );
 * }
 * ```
 */
declare function cn(...inputs: ClassValue[]): string;

export { cn as c };
