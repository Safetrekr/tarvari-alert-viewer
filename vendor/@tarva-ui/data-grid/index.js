import { StatusBadge, Badge, DropdownMenu, DropdownMenuTrigger, Button, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from '../chunk-6TGR22WT.js';
import '../chunk-37DUMHLB.js';
import { cn, formatDate, formatCurrency, formatPercent, formatNumber } from '../chunk-SP3FQ3FK.js';
import { useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Check, X, MoreHorizontal } from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);
var DENSITY_ROW_HEIGHT = {
  compact: 40,
  comfortable: 48,
  spacious: 56
};
var DENSITY_HEADER_HEIGHT = {
  compact: 40,
  comfortable: 48,
  spacious: 56
};
var tarvaGridTheme = themeQuartz.withParams({
  // Use CSS custom properties for theming
  accentColor: "var(--primary)",
  backgroundColor: "var(--card)",
  foregroundColor: "var(--card-foreground)",
  borderColor: "var(--border)",
  headerBackgroundColor: "var(--muted)",
  headerTextColor: "var(--muted-foreground)",
  oddRowBackgroundColor: "var(--card)",
  rowHoverColor: "var(--accent)",
  selectedRowBackgroundColor: "var(--accent)",
  // Typography
  fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
  headerFontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
  headerFontSize: 13,
  headerFontWeight: 500,
  // Borders
  wrapperBorder: true,
  wrapperBorderRadius: 8,
  headerRowBorder: false
});
var defaultColDef = {
  filter: true,
  sortable: true,
  resizable: true,
  suppressHeaderContextMenu: true,
  suppressHeaderMenuButton: true,
  cellStyle: { display: "flex", alignItems: "center" }
};
function DataGrid({
  className,
  defaultColDef: customColDef,
  density = "comfortable",
  selectionMode = "none",
  showSelectionCheckbox = true,
  quickFilterText,
  enableExport: _enableExport = false,
  exportFileName = "export",
  onRowClick,
  onSelectionChange,
  gridContext,
  loading = false,
  emptyMessage = "No data to display",
  onGridReady,
  domLayout = "autoHeight",
  ...props
}) {
  const gridRef = useRef(null);
  const gridApiRef = useRef(null);
  const mergedColDef = useMemo(
    () => ({
      ...defaultColDef,
      ...customColDef
    }),
    [customColDef]
  );
  const rowSelection = useMemo(() => {
    if (selectionMode === "none") return void 0;
    return {
      mode: selectionMode === "single" ? "singleRow" : "multiRow",
      checkboxes: showSelectionCheckbox
    };
  }, [selectionMode, showSelectionCheckbox]);
  const handleGridReady = useCallback(
    (event) => {
      gridApiRef.current = event.api;
      onGridReady?.(event);
    },
    [onGridReady]
  );
  const handleRowClicked = useCallback(
    (event) => {
      const target = event.event?.target;
      if (target?.closest('button, a, input, [role="menuitem"]')) {
        return;
      }
      if (onRowClick && event.data) {
        onRowClick(event.data, event);
      }
    },
    [onRowClick]
  );
  const handleSelectionChanged = useCallback(
    (event) => {
      if (onSelectionChange) {
        const selectedRows = event.api.getSelectedRows();
        onSelectionChange(selectedRows);
      }
    },
    [onSelectionChange]
  );
  const exportToCsv = useCallback(() => {
    gridApiRef.current?.exportDataAsCsv({
      fileName: `${exportFileName}.csv`
    });
  }, [exportFileName]);
  const context = useMemo(
    () => ({
      ...gridContext,
      exportToCsv
    }),
    [gridContext, exportToCsv]
  );
  const isNormalLayout = domLayout === "normal";
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "data-grid",
      className: cn(
        "w-full",
        !isNormalLayout && "pb-4",
        isNormalLayout && "h-full",
        className
      ),
      children: /* @__PURE__ */ jsx(
        AgGridReact,
        {
          ref: gridRef,
          theme: tarvaGridTheme,
          defaultColDef: mergedColDef,
          rowHeight: DENSITY_ROW_HEIGHT[density],
          headerHeight: DENSITY_HEADER_HEIGHT[density],
          rowSelection,
          domLayout,
          animateRows: true,
          suppressCellFocus: true,
          suppressHorizontalScroll: false,
          suppressDragLeaveHidesColumns: true,
          suppressMovableColumns: false,
          quickFilterText,
          loading,
          overlayNoRowsTemplate: `<span class="text-muted-foreground">${emptyMessage}</span>`,
          context,
          onGridReady: handleGridReady,
          onRowClicked: handleRowClicked,
          onSelectionChanged: handleSelectionChanged,
          ...props
        }
      )
    }
  );
}
function StatusCell({
  value,
  categoryMap,
  labelMap,
  variant = "dot"
}) {
  if (value == null) return null;
  const category = categoryMap?.[value];
  const label = labelMap?.[value];
  return /* @__PURE__ */ jsx(
    StatusBadge,
    {
      status: value,
      category,
      label,
      variant
    }
  );
}
function BadgeCell({
  value,
  variantMap,
  labelMap,
  capitalize = true
}) {
  if (value == null) return null;
  const variant = variantMap?.[value] ?? "outline";
  const label = labelMap?.[value] ?? (capitalize ? value.charAt(0).toUpperCase() + value.slice(1) : value);
  return /* @__PURE__ */ jsx(Badge, { variant, children: label });
}
function DateCell({
  value,
  formatOptions,
  fallback = ""
}) {
  if (value == null) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: fallback });
  const formatted = formatDate(value, formatOptions);
  return /* @__PURE__ */ jsx("span", { className: "tabular-nums", children: formatted });
}
function CurrencyCell({
  value,
  formatOptions,
  colorNegative = false,
  fallback = ""
}) {
  if (value == null) {
    return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: fallback });
  }
  const formatted = formatCurrency(value, formatOptions);
  const isNegative = value < 0;
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "tabular-nums",
        colorNegative && isNegative && "text-[var(--status-danger)]"
      ),
      children: formatted
    }
  );
}
function PercentCell({
  value,
  formatOptions,
  showBar = false,
  colorBar = false,
  isPercentage = false,
  fallback = ""
}) {
  if (value == null) {
    return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: fallback });
  }
  const decimalValue = isPercentage ? value / 100 : value;
  const percentValue = isPercentage ? value : value * 100;
  const formatted = formatPercent(decimalValue, formatOptions);
  if (!showBar) {
    return /* @__PURE__ */ jsx("span", { className: "tabular-nums", children: formatted });
  }
  const barColor = colorBar ? percentValue >= 70 ? "bg-[var(--status-success)]" : percentValue >= 40 ? "bg-[var(--status-warning)]" : "bg-[var(--status-danger)]" : "bg-primary";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx("div", { className: "relative h-2 w-16 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: cn("absolute inset-y-0 left-0 rounded-full", barColor),
        style: { width: `${Math.min(100, Math.max(0, percentValue))}%` }
      }
    ) }),
    /* @__PURE__ */ jsx("span", { className: "tabular-nums text-xs", children: formatted })
  ] });
}
function BooleanCell({
  value,
  trueIcon,
  falseIcon,
  trueText,
  falseText,
  colored = false,
  fallback = null
}) {
  if (value == null) {
    return /* @__PURE__ */ jsx(Fragment, { children: fallback });
  }
  if (trueText || falseText) {
    return /* @__PURE__ */ jsx(
      "span",
      {
        className: cn(
          colored && value && "text-[var(--status-success)]",
          colored && !value && "text-[var(--status-danger)]"
        ),
        children: value ? trueText ?? "Yes" : falseText ?? "No"
      }
    );
  }
  const TrueContent = trueIcon ?? /* @__PURE__ */ jsx(
    Check,
    {
      className: cn("h-4 w-4", colored && "text-[var(--status-success)]")
    }
  );
  const FalseContent = falseIcon ?? /* @__PURE__ */ jsx(X, { className: cn("h-4 w-4", colored && "text-[var(--status-danger)]") });
  return /* @__PURE__ */ jsx(Fragment, { children: value ? TrueContent : FalseContent });
}
function ActionsCell({
  data,
  actions,
  triggerLabel = "Actions"
}) {
  if (!data) return null;
  const visibleActions = actions.filter((action) => {
    if (action.hidden === true) return false;
    if (typeof action.hidden === "function") return !action.hidden(data);
    return true;
  });
  if (visibleActions.length === 0) return null;
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: [
      /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: triggerLabel })
    ] }) }),
    /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: visibleActions.map((action, index) => {
      const isDisabled = typeof action.disabled === "function" ? action.disabled(data) : action.disabled;
      return /* @__PURE__ */ jsxs("div", { children: [
        action.separator && index > 0 && /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
        /* @__PURE__ */ jsxs(
          DropdownMenuItem,
          {
            onClick: () => action.onClick(data),
            disabled: isDisabled,
            className: action.destructive ? "text-destructive" : void 0,
            children: [
              action.icon && /* @__PURE__ */ jsx("span", { className: "mr-2 h-4 w-4", children: action.icon }),
              action.label
            ]
          }
        )
      ] }, action.label);
    }) })
  ] });
}

// src/components/data-grid/formatters.ts
function currencyValueFormatter(params) {
  if (params.value == null) return "";
  return formatCurrency(params.value);
}
function createCurrencyFormatter(options) {
  return (params) => {
    if (params.value == null) return "";
    return formatCurrency(params.value, options);
  };
}
function dateValueFormatter(params) {
  if (!params.value) return "";
  return formatDate(params.value);
}
function createDateFormatter(options) {
  return (params) => {
    if (!params.value) return "";
    return formatDate(params.value, options);
  };
}
function percentValueFormatter(params) {
  if (params.value == null) return "";
  return formatPercent(params.value);
}
function createPercentFormatter(options) {
  return (params) => {
    if (params.value == null) return "";
    return formatPercent(params.value, options);
  };
}
function numberValueFormatter(params) {
  if (params.value == null) return "";
  return formatNumber(params.value);
}
function createNumberFormatter(options) {
  return (params) => {
    if (params.value == null) return "";
    return formatNumber(params.value, options);
  };
}
function booleanValueFormatter(params) {
  if (params.value == null) return "";
  return params.value ? "Yes" : "No";
}
function createBooleanFormatter(trueLabel = "Yes", falseLabel = "No") {
  return (params) => {
    if (params.value == null) return "";
    return params.value ? trueLabel : falseLabel;
  };
}

export { ActionsCell, BadgeCell, BooleanCell, CurrencyCell, DataGrid, DateCell, PercentCell, StatusCell, booleanValueFormatter, createBooleanFormatter, createCurrencyFormatter, createDateFormatter, createNumberFormatter, createPercentFormatter, currencyValueFormatter, dateValueFormatter, numberValueFormatter, percentValueFormatter, tarvaGridTheme };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map