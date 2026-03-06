import * as react_jsx_runtime from 'react/jsx-runtime';
import * as ag_grid_community from 'ag-grid-community';
import { ColDef, RowClickedEvent, GridReadyEvent, GridApi } from 'ag-grid-community';
export { ColDef, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { AgGridReactProps, CustomCellRendererProps } from 'ag-grid-react';
import { S as StatusCategory, a as StatusVariant, B as BadgeProps } from '../status-badge-EsKwLCfc.js';
import { F as FormatDateOptions, a as FormatNumberOptions } from '../format-C8R4sD-9.js';
import 'class-variance-authority/types';
import 'class-variance-authority';
import 'react';

type DataGridDensity = 'comfortable' | 'compact' | 'spacious';
type DataGridSelectionMode = 'none' | 'single' | 'multiple';
interface DataGridProps<TData = unknown> extends Omit<AgGridReactProps<TData>, 'theme' | 'defaultColDef'> {
    /** Additional CSS classes */
    className?: string;
    /** Custom default column definition (merged with defaults) */
    defaultColDef?: ColDef;
    /** Row density: comfortable (48px), compact (40px), spacious (56px) */
    density?: DataGridDensity;
    /** Selection mode */
    selectionMode?: DataGridSelectionMode;
    /** Show selection checkbox (only for single/multiple modes) */
    showSelectionCheckbox?: boolean;
    /** Quick filter text for searching */
    quickFilterText?: string;
    /** Enable CSV export */
    enableExport?: boolean;
    /** Export file name (without extension) */
    exportFileName?: string;
    /** Callback when a row is clicked */
    onRowClick?: (data: TData, event: RowClickedEvent<TData>) => void;
    /** Callback when rows are selected */
    onSelectionChange?: (selectedRows: TData[]) => void;
    /** Grid context passed to cell renderers */
    gridContext?: Record<string, unknown>;
    /** Loading state */
    loading?: boolean;
    /** Message to display when no rows */
    emptyMessage?: string;
    /** Callback when grid is ready (provides GridApi) */
    onGridReady?: (event: GridReadyEvent<TData>) => void;
}
/**
 * Grid API reference type
 */
type DataGridApi<TData = unknown> = GridApi<TData>;

/**
 * Tarva UI Grid theme using Quartz base.
 * Maps to CSS custom properties for light/dark mode support.
 */
declare const tarvaGridTheme: ag_grid_community.Theme<ag_grid_community.ThemeDefaultParams>;
/**
 * DataGrid component - @tarva/ui themed AG-Grid wrapper
 *
 * Features:
 * - Tarva UI theme integration (light/dark mode)
 * - Density variants (compact, comfortable, spacious)
 * - Selection modes (none, single, multiple)
 * - Quick filter support
 * - CSV export support
 * - Included cell renderers for common data types
 *
 * @example
 * ```tsx
 * import { DataGrid, StatusCell, CurrencyCell } from '@tarva/ui/data-grid';
 *
 * <DataGrid
 *   rowData={data}
 *   columnDefs={[
 *     { field: 'name', headerName: 'Name' },
 *     { field: 'status', cellRenderer: StatusCell },
 *     { field: 'amount', cellRenderer: CurrencyCell },
 *   ]}
 *   density="comfortable"
 *   selectionMode="multiple"
 *   onSelectionChange={(rows) => setSelected(rows)}
 * />
 * ```
 */
declare function DataGrid<TData = unknown>({ className, defaultColDef: customColDef, density, selectionMode, showSelectionCheckbox, quickFilterText, enableExport: _enableExport, exportFileName, onRowClick, onSelectionChange, gridContext, loading, emptyMessage, onGridReady, domLayout, ...props }: DataGridProps<TData>): react_jsx_runtime.JSX.Element;

interface StatusCellProps<TData = unknown> extends CustomCellRendererProps<TData, string> {
    /** Map raw values to status categories */
    categoryMap?: Record<string, StatusCategory>;
    /** Map raw values to custom labels */
    labelMap?: Record<string, string>;
    /** Display variant */
    variant?: StatusVariant;
}
/**
 * AG-Grid cell renderer for status columns.
 * Uses StatusBadge for consistent status display across all grids.
 *
 * @example
 * ```tsx
 * // Basic usage - value is used as status key
 * { field: 'status', cellRenderer: StatusCell }
 *
 * // With custom mapping
 * {
 *   field: 'status',
 *   cellRenderer: StatusCell,
 *   cellRendererParams: {
 *     categoryMap: { trial: 'warning', suspended: 'danger' },
 *     labelMap: { trial: 'Trial Period' },
 *   }
 * }
 * ```
 */
declare function StatusCell<TData = unknown>({ value, categoryMap, labelMap, variant, }: StatusCellProps<TData>): react_jsx_runtime.JSX.Element | null;

type BadgeVariant = BadgeProps['variant'];
interface BadgeCellProps<TData = unknown> extends CustomCellRendererProps<TData, string> {
    /** Map values to badge variants (default: 'outline' for all) */
    variantMap?: Record<string, BadgeVariant>;
    /** Map values to custom labels */
    labelMap?: Record<string, string>;
    /** Whether to capitalize the first letter (default: true) */
    capitalize?: boolean;
}
/**
 * AG-Grid cell renderer for badge columns.
 * Uses Badge for consistent badge display across all grids.
 *
 * @example
 * ```tsx
 * // Basic usage
 * { field: 'tier', cellRenderer: BadgeCell }
 *
 * // With variant mapping
 * {
 *   field: 'tier',
 *   cellRenderer: BadgeCell,
 *   cellRendererParams: {
 *     variantMap: { enterprise: 'secondary', free: 'outline' },
 *     labelMap: { enterprise: 'Enterprise' },
 *   }
 * }
 * ```
 */
declare function BadgeCell<TData = unknown>({ value, variantMap, labelMap, capitalize, }: BadgeCellProps<TData>): react_jsx_runtime.JSX.Element | null;

interface DateCellProps<TData = unknown> extends CustomCellRendererProps<TData, string | Date | number> {
    /** Date format options */
    formatOptions?: FormatDateOptions;
    /** Fallback text for null/invalid dates */
    fallback?: string;
}
/**
 * AG-Grid cell renderer for date columns.
 * Provides consistent date formatting across all grids.
 *
 * @example
 * ```tsx
 * // Basic usage - defaults to medium format
 * { field: 'createdAt', cellRenderer: DateCell }
 *
 * // With custom format
 * {
 *   field: 'createdAt',
 *   cellRenderer: DateCell,
 *   cellRendererParams: {
 *     formatOptions: { format: 'long', includeTime: true },
 *     fallback: 'Not set',
 *   }
 * }
 * ```
 */
declare function DateCell<TData = unknown>({ value, formatOptions, fallback, }: DateCellProps<TData>): react_jsx_runtime.JSX.Element;

interface CurrencyCellProps<TData = unknown> extends CustomCellRendererProps<TData, number> {
    /** Format options */
    formatOptions?: Omit<FormatNumberOptions, 'style'>;
    /** Show negative values in red */
    colorNegative?: boolean;
    /** Fallback text for null values */
    fallback?: string;
}
/**
 * AG-Grid cell renderer for currency columns.
 * Provides consistent currency formatting across all grids.
 *
 * @example
 * ```tsx
 * // Basic usage
 * { field: 'amount', cellRenderer: CurrencyCell }
 *
 * // With custom format and negative coloring
 * {
 *   field: 'balance',
 *   cellRenderer: CurrencyCell,
 *   cellRendererParams: {
 *     formatOptions: { currency: 'EUR', locale: 'de-DE' },
 *     colorNegative: true,
 *   }
 * }
 * ```
 */
declare function CurrencyCell<TData = unknown>({ value, formatOptions, colorNegative, fallback, }: CurrencyCellProps<TData>): react_jsx_runtime.JSX.Element;

interface PercentCellProps<TData = unknown> extends CustomCellRendererProps<TData, number> {
    /** Format options */
    formatOptions?: Omit<FormatNumberOptions, 'style'>;
    /** Show a visual bar behind the percentage */
    showBar?: boolean;
    /** Color the bar based on value (green for high, red for low) */
    colorBar?: boolean;
    /** Value is already in percentage form (0-100) vs decimal (0-1) */
    isPercentage?: boolean;
    /** Fallback text for null values */
    fallback?: string;
}
/**
 * AG-Grid cell renderer for percentage columns.
 * Optionally shows a visual bar representation.
 *
 * @example
 * ```tsx
 * // Basic usage (decimal value 0-1)
 * { field: 'rate', cellRenderer: PercentCell }
 *
 * // With visual bar (percentage value 0-100)
 * {
 *   field: 'progress',
 *   cellRenderer: PercentCell,
 *   cellRendererParams: {
 *     showBar: true,
 *     colorBar: true,
 *     isPercentage: true,
 *   }
 * }
 * ```
 */
declare function PercentCell<TData = unknown>({ value, formatOptions, showBar, colorBar, isPercentage, fallback, }: PercentCellProps<TData>): react_jsx_runtime.JSX.Element;

interface BooleanCellProps<TData = unknown> extends CustomCellRendererProps<TData, boolean> {
    /** Custom icon for true state */
    trueIcon?: React.ReactNode;
    /** Custom icon for false state */
    falseIcon?: React.ReactNode;
    /** Text for true state (if no icon) */
    trueText?: string;
    /** Text for false state (if no icon) */
    falseText?: string;
    /** Whether to color the icons (green/red) */
    colored?: boolean;
    /** Fallback for null/undefined */
    fallback?: React.ReactNode;
}
/**
 * AG-Grid cell renderer for boolean columns.
 * Shows check/X icons or custom content.
 *
 * @example
 * ```tsx
 * // Basic usage with colored icons
 * { field: 'isActive', cellRenderer: BooleanCell, cellRendererParams: { colored: true } }
 *
 * // With text instead of icons
 * {
 *   field: 'verified',
 *   cellRenderer: BooleanCell,
 *   cellRendererParams: {
 *     trueText: 'Yes',
 *     falseText: 'No',
 *   }
 * }
 * ```
 */
declare function BooleanCell<TData = unknown>({ value, trueIcon, falseIcon, trueText, falseText, colored, fallback, }: BooleanCellProps<TData>): react_jsx_runtime.JSX.Element;

interface ActionItem<TData = unknown> {
    /** Action label */
    label: string;
    /** Action icon */
    icon?: React.ReactNode;
    /** Click handler */
    onClick: (data: TData) => void;
    /** Whether to show a separator before this item */
    separator?: boolean;
    /** Whether the action is destructive */
    destructive?: boolean;
    /** Whether the action is disabled */
    disabled?: boolean | ((data: TData) => boolean);
    /** Whether to hide this action */
    hidden?: boolean | ((data: TData) => boolean);
}
interface ActionsCellProps<TData = unknown> extends CustomCellRendererProps<TData> {
    /** List of actions to show in the dropdown */
    actions: ActionItem<TData>[];
    /** Accessible label for the menu trigger */
    triggerLabel?: string;
}
/**
 * AG-Grid cell renderer for action columns.
 * Shows a dropdown menu with configurable actions.
 *
 * @example
 * ```tsx
 * {
 *   field: 'actions',
 *   headerName: '',
 *   width: 60,
 *   cellRenderer: ActionsCell,
 *   cellRendererParams: {
 *     actions: [
 *       { label: 'Edit', icon: <Pencil />, onClick: (row) => editRow(row) },
 *       { label: 'Delete', onClick: (row) => deleteRow(row), destructive: true, separator: true },
 *     ],
 *   }
 * }
 * ```
 */
declare function ActionsCell<TData = unknown>({ data, actions, triggerLabel, }: ActionsCellProps<TData>): react_jsx_runtime.JSX.Element | null;

/**
 * AG-Grid value formatters for @tarva/ui DataGrid.
 *
 * These can be used directly in column definitions:
 * @example
 * { field: 'amount', valueFormatter: currencyValueFormatter }
 */

interface ValueFormatterParams {
    value: unknown;
}
/**
 * Currency value formatter for AG-Grid.
 * @example { valueFormatter: currencyValueFormatter }
 */
declare function currencyValueFormatter(params: ValueFormatterParams): string;
/**
 * Create a currency formatter with custom options.
 * @example { valueFormatter: createCurrencyFormatter({ currency: 'EUR' }) }
 */
declare function createCurrencyFormatter(options?: Omit<FormatNumberOptions, 'style'>): (params: ValueFormatterParams) => string;
/**
 * Date value formatter for AG-Grid.
 * @example { valueFormatter: dateValueFormatter }
 */
declare function dateValueFormatter(params: ValueFormatterParams): string;
/**
 * Create a date formatter with custom options.
 * @example { valueFormatter: createDateFormatter({ format: 'long', includeTime: true }) }
 */
declare function createDateFormatter(options?: FormatDateOptions): (params: ValueFormatterParams) => string;
/**
 * Percentage value formatter for AG-Grid (expects decimal 0-1).
 * @example { valueFormatter: percentValueFormatter }
 */
declare function percentValueFormatter(params: ValueFormatterParams): string;
/**
 * Create a percent formatter with custom options.
 * @example { valueFormatter: createPercentFormatter({ maximumFractionDigits: 2 }) }
 */
declare function createPercentFormatter(options?: Omit<FormatNumberOptions, 'style'>): (params: ValueFormatterParams) => string;
/**
 * Number value formatter for AG-Grid.
 * @example { valueFormatter: numberValueFormatter }
 */
declare function numberValueFormatter(params: ValueFormatterParams): string;
/**
 * Create a number formatter with custom options.
 * @example { valueFormatter: createNumberFormatter({ maximumFractionDigits: 2 }) }
 */
declare function createNumberFormatter(options?: FormatNumberOptions): (params: ValueFormatterParams) => string;
/**
 * Boolean value formatter for AG-Grid.
 * @example { valueFormatter: booleanValueFormatter }
 */
declare function booleanValueFormatter(params: ValueFormatterParams): string;
/**
 * Create a boolean formatter with custom labels.
 * @example { valueFormatter: createBooleanFormatter('Active', 'Inactive') }
 */
declare function createBooleanFormatter(trueLabel?: string, falseLabel?: string): (params: ValueFormatterParams) => string;

export { type ActionItem, ActionsCell, type ActionsCellProps, BadgeCell, type BadgeCellProps, BooleanCell, type BooleanCellProps, CurrencyCell, type CurrencyCellProps, DataGrid, type DataGridApi, type DataGridDensity, type DataGridProps, type DataGridSelectionMode, DateCell, type DateCellProps, PercentCell, type PercentCellProps, StatusCell, type StatusCellProps, booleanValueFormatter, createBooleanFormatter, createCurrencyFormatter, createDateFormatter, createNumberFormatter, createPercentFormatter, currencyValueFormatter, dateValueFormatter, numberValueFormatter, percentValueFormatter, tarvaGridTheme };
