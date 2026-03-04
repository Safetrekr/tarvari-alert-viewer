/**
 * Recovery station templates for exception triage.
 *
 * Each exception category maps to a recovery UI template:
 * - transient  -> Retry Panel
 * - permanent  -> Escalation Panel
 * - policy     -> Configuration Panel
 * - missing-info -> Information Request Panel
 *
 * These templates are registered with the DynamicStationTemplateRegistry
 * from WS-3.5. Their triggers are evaluated by the triage system, not
 * by the standard template selection pipeline -- the triage system
 * generates intervention stations directly.
 *
 * The templates define the layout structure; the InterventionStation
 * component provides the dynamic content.
 *
 * Naming convention: intervention--{category}--recovery
 *
 * References: AD-7, AD-8, WS-3.5 (StationTemplateRegistry)
 */

import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Retry Panel Template (Transient Failures)
// ============================================================================

export const INTERVENTION_RETRY: StationTemplate = {
  id: 'intervention--transient--recovery',
  districtId: '*',
  name: 'retry-recovery',
  displayName: 'Retry Recovery',
  description:
    'Recovery station for transient failures. Shows a retry countdown, the error summary in plain language, and a manual retry button.',
  category: 'app-specific',
  layout: {
    header: { title: 'Connection Issue', icon: 'RefreshCw' },
    bodyType: 'custom',
    actions: [
      {
        id: 'retry-now',
        label: 'Retry Now',
        variant: 'default',
        command: 'retry health-check ${districtId}',
        icon: 'RefreshCw',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        variant: 'secondary',
        command: 'dismiss intervention ${interventionId}',
        icon: 'XCircle',
      },
    ],
  },
  triggers: [],
  priority: 95,
  disposable: true,
}

// ============================================================================
// Escalation Panel Template (Permanent Failures)
// ============================================================================

export const INTERVENTION_ESCALATION: StationTemplate = {
  id: 'intervention--permanent--recovery',
  districtId: '*',
  name: 'escalation-recovery',
  displayName: 'Escalation Required',
  description:
    'Recovery station for permanent failures. Shows the error details, suggested investigation steps, and a link to open the affected app.',
  category: 'app-specific',
  layout: {
    header: { title: 'Action Required', icon: 'AlertTriangle' },
    bodyType: 'custom',
    actions: [
      {
        id: 'open-app',
        label: 'Open App',
        variant: 'default',
        command: 'open ${districtId}',
        icon: 'ExternalLink',
      },
      {
        id: 'view-evidence',
        label: 'View Evidence',
        variant: 'secondary',
        command: 'go evidence-ledger',
        icon: 'FileText',
      },
      {
        id: 'acknowledge',
        label: 'Acknowledge',
        variant: 'secondary',
        command: 'dismiss intervention ${interventionId}',
        icon: 'CheckCircle',
      },
    ],
  },
  triggers: [],
  priority: 98,
  disposable: true,
}

// ============================================================================
// Configuration Panel Template (Policy Failures)
// ============================================================================

export const INTERVENTION_CONFIGURATION: StationTemplate = {
  id: 'intervention--policy--recovery',
  districtId: '*',
  name: 'configuration-recovery',
  displayName: 'Configuration Needed',
  description:
    'Recovery station for policy/configuration failures. Shows the violated policy, the current value, and what needs to change.',
  category: 'app-specific',
  layout: {
    header: { title: 'Configuration Needed', icon: 'Settings' },
    bodyType: 'custom',
    actions: [
      {
        id: 'open-settings',
        label: 'Open App Settings',
        variant: 'default',
        command: 'open ${districtId}',
        icon: 'Settings',
      },
      {
        id: 'retry-after-config',
        label: 'Retry After Change',
        variant: 'secondary',
        command: 'retry health-check ${districtId}',
        icon: 'RefreshCw',
      },
    ],
  },
  triggers: [],
  priority: 96,
  disposable: true,
}

// ============================================================================
// Information Request Panel Template (Missing-Info Failures)
// ============================================================================

export const INTERVENTION_INFORMATION_REQUEST: StationTemplate = {
  id: 'intervention--missing-info--recovery',
  districtId: '*',
  name: 'information-request-recovery',
  displayName: 'More Information Needed',
  description:
    'Recovery station for unclassifiable failures. Asks the user to investigate and provides links to gather more context.',
  category: 'app-specific',
  layout: {
    header: { title: 'More Info Needed', icon: 'HelpCircle' },
    bodyType: 'custom',
    actions: [
      {
        id: 'investigate',
        label: 'Investigate',
        variant: 'default',
        command: 'open ${districtId}',
        icon: 'Search',
      },
      {
        id: 'retry-check',
        label: 'Retry Health Check',
        variant: 'secondary',
        command: 'retry health-check ${districtId}',
        icon: 'RefreshCw',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        variant: 'secondary',
        command: 'dismiss intervention ${interventionId}',
        icon: 'XCircle',
      },
    ],
  },
  triggers: [],
  priority: 90,
  disposable: true,
}

// ============================================================================
// All Recovery Templates
// ============================================================================

/** All recovery templates to register with the StationTemplateRegistry. */
export const RECOVERY_TEMPLATES: readonly StationTemplate[] = [
  INTERVENTION_RETRY,
  INTERVENTION_ESCALATION,
  INTERVENTION_CONFIGURATION,
  INTERVENTION_INFORMATION_REQUEST,
] as const

/** Map from exception category to template ID. */
export const CATEGORY_TO_TEMPLATE_ID: Record<string, string> = {
  transient: INTERVENTION_RETRY.id,
  permanent: INTERVENTION_ESCALATION.id,
  policy: INTERVENTION_CONFIGURATION.id,
  'missing-info': INTERVENTION_INFORMATION_REQUEST.id,
} as const
