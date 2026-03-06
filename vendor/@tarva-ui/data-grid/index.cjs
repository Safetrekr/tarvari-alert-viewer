'use strict';

var chunk2AMWSBDG_cjs = require('../chunk-2AMWSBDG.cjs');
require('../chunk-2AQSA446.cjs');
var chunkIS6WJ2TO_cjs = require('../chunk-IS6WJ2TO.cjs');
var react = require('react');
var agGridReact = require('ag-grid-react');
var agGridCommunity = require('ag-grid-community');
var jsxRuntime = require('react/jsx-runtime');
var lucideReact = require('lucide-react');

agGridCommunity.ModuleRegistry.registerModules([agGridCommunity.AllCommunityModule]);
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
var tarvaGridTheme = agGridCommunity.themeQuartz.withParams({
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
  const gridRef = react.useRef(null);
  const gridApiRef = react.useRef(null);
  const mergedColDef = react.useMemo(
    () => ({
      ...defaultColDef,
      ...customColDef
    }),
    [customColDef]
  );
  const rowSelection = react.useMemo(() => {
    if (selectionMode === "none") return void 0;
    return {
      mode: selectionMode === "single" ? "singleRow" : "multiRow",
      checkboxes: showSelectionCheckbox
    };
  }, [selectionMode, showSelectionCheckbox]);
  const handleGridReady = react.useCallback(
    (event) => {
      gridApiRef.current = event.api;
      onGridReady?.(event);
    },
    [onGridReady]
  );
  const handleRowClicked = react.useCallback(
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
  const handleSelectionChanged = react.useCallback(
    (event) => {
      if (onSelectionChange) {
        const selectedRows = event.api.getSelectedRows();
        onSelectionChange(selectedRows);
      }
    },
    [onSelectionChange]
  );
  const exportToCsv = react.useCallback(() => {
    gridApiRef.current?.exportDataAsCsv({
      fileName: `${exportFileName}.csv`
    });
  }, [exportFileName]);
  const context = react.useMemo(
    () => ({
      ...gridContext,
      exportToCsv
    }),
    [gridContext, exportToCsv]
  );
  const isNormalLayout = domLayout === "normal";
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      "data-slot": "data-grid",
      className: chunkIS6WJ2TO_cjs.cn(
        "w-full",
        !isNormalLayout && "pb-4",
        isNormalLayout && "h-full",
        className
      ),
      children: /* @__PURE__ */ jsxRuntime.jsx(
        agGridReact.AgGridReact,
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    chunk2AMWSBDG_cjs.StatusBadge,
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
  return /* @__PURE__ */ jsxRuntime.jsx(chunk2AMWSBDG_cjs.Badge, { variant, children: label });
}
function DateCell({
  value,
  formatOptions,
  fallback = ""
}) {
  if (value == null) return /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground", children: fallback });
  const formatted = chunkIS6WJ2TO_cjs.formatDate(value, formatOptions);
  return /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tabular-nums", children: formatted });
}
function CurrencyCell({
  value,
  formatOptions,
  colorNegative = false,
  fallback = ""
}) {
  if (value == null) {
    return /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground", children: fallback });
  }
  const formatted = chunkIS6WJ2TO_cjs.formatCurrency(value, formatOptions);
  const isNegative = value < 0;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      className: chunkIS6WJ2TO_cjs.cn(
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
    return /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground", children: fallback });
  }
  const decimalValue = isPercentage ? value / 100 : value;
  const percentValue = isPercentage ? value : value * 100;
  const formatted = chunkIS6WJ2TO_cjs.formatPercent(decimalValue, formatOptions);
  if (!showBar) {
    return /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tabular-nums", children: formatted });
  }
  const barColor = colorBar ? percentValue >= 70 ? "bg-[var(--status-success)]" : percentValue >= 40 ? "bg-[var(--status-warning)]" : "bg-[var(--status-danger)]" : "bg-primary";
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "relative h-2 w-16 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className: chunkIS6WJ2TO_cjs.cn("absolute inset-y-0 left-0 rounded-full", barColor),
        style: { width: `${Math.min(100, Math.max(0, percentValue))}%` }
      }
    ) }),
    /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tabular-nums text-xs", children: formatted })
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
    return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: fallback });
  }
  if (trueText || falseText) {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "span",
      {
        className: chunkIS6WJ2TO_cjs.cn(
          colored && value && "text-[var(--status-success)]",
          colored && !value && "text-[var(--status-danger)]"
        ),
        children: value ? trueText ?? "Yes" : falseText ?? "No"
      }
    );
  }
  const TrueContent = trueIcon ?? /* @__PURE__ */ jsxRuntime.jsx(
    lucideReact.Check,
    {
      className: chunkIS6WJ2TO_cjs.cn("h-4 w-4", colored && "text-[var(--status-success)]")
    }
  );
  const FalseContent = falseIcon ?? /* @__PURE__ */ jsxRuntime.jsx(lucideReact.X, { className: chunkIS6WJ2TO_cjs.cn("h-4 w-4", colored && "text-[var(--status-danger)]") });
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: value ? TrueContent : FalseContent });
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
  return /* @__PURE__ */ jsxRuntime.jsxs(chunk2AMWSBDG_cjs.DropdownMenu, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(chunk2AMWSBDG_cjs.DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntime.jsxs(chunk2AMWSBDG_cjs.Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: [
      /* @__PURE__ */ jsxRuntime.jsx(lucideReact.MoreHorizontal, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: triggerLabel })
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx(chunk2AMWSBDG_cjs.DropdownMenuContent, { align: "end", children: visibleActions.map((action, index) => {
      const isDisabled = typeof action.disabled === "function" ? action.disabled(data) : action.disabled;
      return /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        action.separator && index > 0 && /* @__PURE__ */ jsxRuntime.jsx(chunk2AMWSBDG_cjs.DropdownMenuSeparator, {}),
        /* @__PURE__ */ jsxRuntime.jsxs(
          chunk2AMWSBDG_cjs.DropdownMenuItem,
          {
            onClick: () => action.onClick(data),
            disabled: isDisabled,
            className: action.destructive ? "text-destructive" : void 0,
            children: [
              action.icon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "mr-2 h-4 w-4", children: action.icon }),
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
  return chunkIS6WJ2TO_cjs.formatCurrency(params.value);
}
function createCurrencyFormatter(options) {
  return (params) => {
    if (params.value == null) return "";
    return chunkIS6WJ2TO_cjs.formatCurrency(params.value, options);
  };
}
function dateValueFormatter(params) {
  if (!params.value) return "";
  return chunkIS6WJ2TO_cjs.formatDate(params.value);
}
function createDateFormatter(options) {
  return (params) => {
    if (!params.value) return "";
    return chunkIS6WJ2TO_cjs.formatDate(params.value, options);
  };
}
function percentValueFormatter(params) {
  if (params.value == null) return "";
  return chunkIS6WJ2TO_cjs.formatPercent(params.value);
}
function createPercentFormatter(options) {
  return (params) => {
    if (params.value == null) return "";
    return chunkIS6WJ2TO_cjs.formatPercent(params.value, options);
  };
}
function numberValueFormatter(params) {
  if (params.value == null) return "";
  return chunkIS6WJ2TO_cjs.formatNumber(params.value);
}
function createNumberFormatter(options) {
  return (params) => {
    if (params.value == null) return "";
    return chunkIS6WJ2TO_cjs.formatNumber(params.value, options);
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

exports.ActionsCell = ActionsCell;
exports.BadgeCell = BadgeCell;
exports.BooleanCell = BooleanCell;
exports.CurrencyCell = CurrencyCell;
exports.DataGrid = DataGrid;
exports.DateCell = DateCell;
exports.PercentCell = PercentCell;
exports.StatusCell = StatusCell;
exports.booleanValueFormatter = booleanValueFormatter;
exports.createBooleanFormatter = createBooleanFormatter;
exports.createCurrencyFormatter = createCurrencyFormatter;
exports.createDateFormatter = createDateFormatter;
exports.createNumberFormatter = createNumberFormatter;
exports.createPercentFormatter = createPercentFormatter;
exports.currencyValueFormatter = currencyValueFormatter;
exports.dateValueFormatter = dateValueFormatter;
exports.numberValueFormatter = numberValueFormatter;
exports.percentValueFormatter = percentValueFormatter;
exports.tarvaGridTheme = tarvaGridTheme;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map