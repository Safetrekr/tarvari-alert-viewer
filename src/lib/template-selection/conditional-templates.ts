/**
 * Conditional station templates for Phase 3 dynamic selection.
 *
 * These templates have TriggerCondition arrays that activate them
 * when specific system state conditions are met. They supplement
 * the static AD-8 templates from WS-1.7.
 *
 * Naming convention: {districtId}--{name}--conditional
 * Example: "agent-builder--diagnostics--conditional"
 *
 * References: AD-8 (Station Content per District), AD-7 (disposable stations)
 */

import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Agent Builder Conditional Templates
// ============================================================================

export const AGENT_BUILDER_DIAGNOSTICS: StationTemplate = {
  id: 'agent-builder--diagnostics--conditional',
  districtId: 'agent-builder',
  name: 'diagnostics',
  displayName: 'Diagnostics',
  description:
    'Active alerts and recent errors for Agent Builder. Surfaces when alertCount > 0 or health is DEGRADED/DOWN.',
  category: 'app-specific',
  layout: {
    header: { title: 'Diagnostics', icon: 'AlertTriangle' },
    bodyType: 'list',
    actions: [
      {
        id: 'view-alerts',
        label: 'View All Alerts',
        variant: 'default',
        command: 'show alerts in ${districtId}',
        icon: 'Bell',
      },
      {
        id: 'dismiss-all',
        label: 'Dismiss All',
        variant: 'secondary',
        command: 'dismiss alerts in ${districtId}',
        icon: 'CheckCircle',
      },
    ],
  },
  triggers: [
    {
      field: 'apps.agent-builder.alertCount',
      operator: 'gt',
      value: 0,
      weight: 0.8,
    },
    {
      field: 'apps.agent-builder.health',
      operator: 'eq',
      value: 'DEGRADED',
      weight: 0.6,
    },
    {
      field: 'apps.agent-builder.health',
      operator: 'eq',
      value: 'DOWN',
      weight: 1.0,
    },
  ],
  priority: 70,
  disposable: false,
}

// ============================================================================
// Tarva Chat Conditional Templates
// ============================================================================

export const TARVA_CHAT_ACTIVE_CONVERSATIONS: StationTemplate = {
  id: 'tarva-chat--active-conversations--conditional',
  districtId: 'tarva-chat',
  name: 'active-conversations',
  displayName: 'Active Conversations',
  description:
    'Promoted view of active conversations. Surfaces when pulse indicates high conversation activity.',
  category: 'app-specific',
  layout: {
    header: { title: 'Active Conversations', icon: 'MessageCircle' },
    bodyType: 'table',
    actions: [
      {
        id: 'open-active',
        label: 'Open Active',
        variant: 'default',
        command: 'open tarva-chat',
        icon: 'ExternalLink',
      },
    ],
  },
  triggers: [
    {
      field: 'apps.tarva-chat.health',
      operator: 'eq',
      value: 'OPERATIONAL',
      weight: 0.3,
    },
    {
      field: 'apps.tarva-chat.alertCount',
      operator: 'eq',
      value: 0,
      weight: 0.2,
    },
  ],
  priority: 45,
  disposable: false,
}

// ============================================================================
// Project Room Conditional Templates
// ============================================================================

export const PROJECT_ROOM_ALERT_SUMMARY: StationTemplate = {
  id: 'project-room--alert-summary--conditional',
  districtId: 'project-room',
  name: 'alert-summary',
  displayName: 'Alert Summary',
  description:
    'Aggregated alert view for Project Room. Surfaces when alertCount > 2 or health is not OPERATIONAL.',
  category: 'app-specific',
  layout: {
    header: { title: 'Alert Summary', icon: 'ShieldAlert' },
    bodyType: 'list',
    actions: [
      {
        id: 'investigate',
        label: 'Investigate',
        variant: 'default',
        command: 'show alerts in ${districtId}',
        icon: 'Search',
      },
      {
        id: 'open-project',
        label: 'Open Project Room',
        variant: 'secondary',
        command: 'open project-room',
        icon: 'ExternalLink',
      },
    ],
  },
  triggers: [
    {
      field: 'apps.project-room.alertCount',
      operator: 'gt',
      value: 2,
      weight: 0.7,
    },
    {
      field: 'apps.project-room.health',
      operator: 'eq',
      value: 'DEGRADED',
      weight: 0.5,
    },
    {
      field: 'apps.project-room.health',
      operator: 'eq',
      value: 'DOWN',
      weight: 1.0,
    },
  ],
  priority: 65,
  disposable: false,
}

// ============================================================================
// Universal Conditional Templates
// ============================================================================

export const UNIVERSAL_SYSTEM_ALERT: StationTemplate = {
  id: 'universal--system-alert--conditional',
  districtId: '*',
  name: 'system-alert',
  displayName: 'System Alert',
  description:
    'Global system alert station. Surfaces in any district when the global alert count is high or system pulse is degraded.',
  category: 'universal',
  layout: {
    header: { title: 'System Alert', icon: 'AlertOctagon' },
    bodyType: 'metrics',
    actions: [
      {
        id: 'view-evidence',
        label: 'View Evidence Ledger',
        variant: 'default',
        command: 'go evidence-ledger',
        icon: 'FileText',
      },
    ],
  },
  triggers: [
    {
      field: 'globalMetrics.alertCount',
      operator: 'gt',
      value: 5,
      weight: 0.9,
    },
    {
      field: 'globalMetrics.systemPulse',
      operator: 'eq',
      value: 'DEGRADED',
      weight: 0.6,
    },
    {
      field: 'globalMetrics.systemPulse',
      operator: 'eq',
      value: 'DOWN',
      weight: 1.0,
    },
  ],
  priority: 85,
  disposable: false,
}

// ============================================================================
// All Conditional Templates
// ============================================================================

/** All Phase 3 conditional templates to register with the DynamicStationTemplateRegistry. */
export const CONDITIONAL_TEMPLATES: readonly StationTemplate[] = [
  AGENT_BUILDER_DIAGNOSTICS,
  TARVA_CHAT_ACTIVE_CONVERSATIONS,
  PROJECT_ROOM_ALERT_SUMMARY,
  UNIVERSAL_SYSTEM_ALERT,
] as const
