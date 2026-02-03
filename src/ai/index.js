/**
 * AI Module - Main Entry Point
 * 
 * Features:
 * 1. Smart Element Finding
 * 2. Selector Auto-Healing
 * 3. Page Understanding
 * 4. Natural Language Commands
 * 5. Error Detection + Hindi Reporting
 * 6. Advanced Result Validation (100% accuracy check)
 */

const {
  AICore,
  aiCore,
  smartFind,
  smartClick,
  smartType,
  understandPage,
  executeCommand,
  wrapHandler,
  configure,
  selfHeal,
  detectIssues,
  buildIssueMessage,
  learnFromExecution,
  getTrainingStats,
  getExecutionStats,
  errorCollector,
  hindiSuggester,
  patternLearner,
  ERROR_CATEGORIES
} = require('./core');

// Individual modules
const ElementFinder = require('./element-finder');
const SelectorHealer = require('./selector-healer');
const PageAnalyzer = require('./page-analyzer');
const ActionParser = require('./action-parser');

// Error Detection modules
const ErrorCollectorModule = require('./error-collector');
const HindiSuggesterModule = require('./hindi-suggester');
const PatternLearnerModule = require('./pattern-learner');

// Advanced Result Validation
const ResultValidatorModule = require('./result-validator');

module.exports = {
  // Main AI Core
  AICore,
  aiCore,
  
  // Quick access functions
  smartFind,
  smartClick,
  smartType,
  understandPage,
  executeCommand,
  wrapHandler,
  configure,
  
  // Error Detection + Hindi Reporting
  selfHeal,
  detectIssues,
  buildIssueMessage,
  learnFromExecution,
  getTrainingStats,
  getExecutionStats,
  
  // Advanced Result Validation
  validateResult: (toolName, result, params, context) => aiCore.validateResult(toolName, result, params, context),
  getValidationStats: () => aiCore.getValidationStats(),
  resultValidator: ResultValidatorModule.resultValidator,
  
  // Component instances
  errorCollector,
  hindiSuggester,
  patternLearner,
  
  // Constants
  ERROR_CATEGORIES,
  VALIDATION_RULES: ResultValidatorModule.VALIDATION_RULES,
  
  // Individual modules
  ElementFinder,
  SelectorHealer,
  PageAnalyzer,
  ActionParser,
  
  // Module classes
  ErrorCollector: ErrorCollectorModule.ErrorCollector,
  HindiSuggester: HindiSuggesterModule.HindiSuggester,
  PatternLearner: PatternLearnerModule.PatternLearner,
  ResultValidator: ResultValidatorModule.ResultValidator,
  
  // Version
  version: '2.1.0',
  
  // Features
  features: {
    smartFind: true,
    autoHealing: true,
    pageAnalysis: true,
    naturalLanguage: true,
    errorDetection: true,
    hindiMessages: true,
    patternStorage: true,
    advancedValidation: true  // NEW: 100% result accuracy check
  }
};
