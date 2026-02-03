/**
 * AI Module - Main Entry Point
 * 
 * Features:
 * 1. Smart Element Finding
 * 2. Selector Auto-Healing
 * 3. Page Understanding
 * 4. Natural Language Commands
 * 5. SIMPLE SELF-HEALING: Hindi message + Auto Training
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

// Self-Healing modules
const ErrorCollectorModule = require('./error-collector');
const HindiSuggesterModule = require('./hindi-suggester');
const PatternLearnerModule = require('./pattern-learner');

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
  
  // Simple Self-Healing + Auto Training
  selfHeal,
  detectIssues,
  buildIssueMessage,
  learnFromExecution,
  getTrainingStats,
  getExecutionStats,
  
  // Component instances
  errorCollector,
  hindiSuggester,
  patternLearner,
  
  // Constants
  ERROR_CATEGORIES,
  
  // Individual modules
  ElementFinder,
  SelectorHealer,
  PageAnalyzer,
  ActionParser,
  
  // Module classes
  ErrorCollector: ErrorCollectorModule.ErrorCollector,
  HindiSuggester: HindiSuggesterModule.HindiSuggester,
  PatternLearner: PatternLearnerModule.PatternLearner,
  
  // Version
  version: '2.0.0',
  
  // Features
  features: {
    smartFind: true,
    autoHealing: true,
    pageAnalysis: true,
    naturalLanguage: true,
    selfHealing: true,
    hindiMessages: true,
    autoTraining: true
  }
};
