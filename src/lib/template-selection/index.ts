// Template Selection System -- Public API

// Types
export type {
  TriggerEvaluationResult,
  ScoredTemplate,
  SelectionResult,
  SelectionConfig,
  PinnedOverride,
  TemplateBrowserState,
} from './types'

export { DEFAULT_SELECTION_CONFIG } from './types'

// Trigger Evaluator
export {
  resolvePath,
  applyOperator,
  evaluateCondition,
  evaluateAllConditions,
} from './trigger-evaluator'

// Template Scorer
export { scoreTemplate, scoreAllTemplates } from './template-scorer'

// Template Selector
export { selectTemplates } from './template-selector'

// Dynamic Registry
export { DynamicStationTemplateRegistry } from './dynamic-registry'

// Conditional Templates
export { CONDITIONAL_TEMPLATES } from './conditional-templates'

// Receipt Generation
export { recordSelectionReceipt, recordPinReceipt } from './selection-receipt'
