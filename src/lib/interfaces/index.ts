/**
 * Core Interfaces for Tarva Launch.
 *
 * Six contracts that form the AI-integration seam:
 * 1. CameraController -- spatial navigation
 * 2. SystemStateProvider -- telemetry data
 * 3. ReceiptStore -- audit log
 * 4. StationTemplateRegistry -- station catalog
 * 5. AIRouter -- AI provider routing
 * 6. CommandPalette -- command input
 *
 * Phase 1 implementations are exported alongside interfaces.
 * Phase 3+ replaces implementations without changing consumer code.
 *
 * Reference: AD-7 (AI Integration Architecture)
 */

// Shared domain types
export type {
  Actor,
  ActivityStatus,
  ActivityType,
  AppIdentifier,
  CameraPosition,
  EventType,
  HealthState,
  ISOTimestamp,
  ReceiptSource,
  SemanticLevel,
  Severity,
  SpatialLocation,
  Unsubscribe,
} from './types'

export { ALL_APP_IDS, APP_DISPLAY_NAMES, APP_SHORT_CODES, HEALTH_COLORS } from './types'

// CameraController
export type {
  CameraController,
  CameraDirective,
  CameraSnapshot,
  CameraTarget,
  FlyToOptions,
} from './camera-controller'

export { ManualCameraController } from './camera-controller'

// SystemStateProvider
export type {
  AppState,
  DependencyStatus,
  GlobalMetrics,
  PollingConfig,
  SystemSnapshot,
  SystemStateProvider,
} from './system-state-provider'

export { DEFAULT_POLLING_CONFIG, PollingSystemStateProvider } from './system-state-provider'

// ReceiptStore
export type {
  AIReceiptMetadata,
  LaunchReceipt,
  ReceiptFilters,
  ReceiptInput,
  ReceiptStore,
} from './receipt-store'

export { InMemoryReceiptStore } from './receipt-store'

// StationTemplateRegistry
export type {
  StationAction,
  StationLayout,
  StationTemplate,
  StationTemplateRegistry,
  TriggerCondition,
} from './station-template-registry'

export { StaticStationTemplateRegistry } from './station-template-registry'

// AIRouter
export type {
  AIFeature,
  AIProvider,
  AIRequest,
  AIResponse,
  AIRouter,
  AISessionCost,
  ProviderStatus,
  RoutingRule,
} from './ai-router'

export { AI_ROUTING_TABLE, StubAIRouter } from './ai-router'

// CommandPalette
export type {
  CommandArgs,
  CommandCategory,
  CommandHandler,
  CommandResult,
  CommandPalette,
  PaletteCommand,
  PaletteSuggestion,
  SynonymEntry,
} from './command-palette'

export {
  createDefaultNavigationCommands,
  StructuredCommandPalette,
  SYNONYM_RING,
} from './command-palette'
