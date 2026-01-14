/**
 * Advanced TypeScript Analyzer
 * Uses TypeScript Compiler API for full AST parsing, type checking, and semantic analysis
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// TYPES
// ============================================================

export interface AnalysisResult {
    filePath: string;
    functions: FunctionInfo[];
    classes: ClassInfo[];
    interfaces: InterfaceInfo[];
    types: TypeAliasInfo[];
    variables: VariableInfo[];
    imports: ImportInfo[];
    exports: ExportInfo[];
    diagnostics: DiagnosticInfo[];
    summary: {
        totalLines: number;
        totalSymbols: number;
        complexity: 'low' | 'medium' | 'high';
    };
}

export interface FunctionInfo {
    name: string;
    kind: 'function' | 'method' | 'arrow' | 'constructor';
    params: ParameterInfo[];
    returnType: string;
    async: boolean;
    exported: boolean;
    line: number;
    documentation?: string;
}

export interface ParameterInfo {
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
}

export interface ClassInfo {
    name: string;
    extends?: string;
    implements: string[];
    methods: FunctionInfo[];
    properties: VariableInfo[];
    exported: boolean;
    line: number;
    documentation?: string;
}

export interface InterfaceInfo {
    name: string;
    extends: string[];
    properties: VariableInfo[];
    methods: FunctionInfo[];
    exported: boolean;
    line: number;
}

export interface TypeAliasInfo {
    name: string;
    type: string;
    exported: boolean;
    line: number;
}

export interface VariableInfo {
    name: string;
    type: string;
    kind: 'const' | 'let' | 'var' | 'property';
    exported: boolean;
    line: number;
}

export interface ImportInfo {
    module: string;
    namedImports: string[];
    defaultImport?: string;
    namespaceImport?: string;
    line: number;
}

export interface ExportInfo {
    name: string;
    kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'default';
    line: number;
}

export interface DiagnosticInfo {
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    character: number;
    code: number;
}

export interface DefinitionResult {
    uri: string;
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    name: string;
    kind: string;
    preview: string;
}

export interface ReferenceResult extends DefinitionResult {
    isDefinition: boolean;
}

// ============================================================
// TYPESCRIPT ANALYZER CLASS
// ============================================================

export class TypeScriptAnalyzer {
    private program: ts.Program | null = null;
    private typeChecker: ts.TypeChecker | null = null;
    private projectRoot: string;
    private fileContents: Map<string, string> = new Map();

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
        this.initializeProgram();
    }

    /**
     * Initialize TypeScript program from tsconfig.json
     */
    private initializeProgram(): void {
        const configPath = ts.findConfigFile(this.projectRoot, ts.sys.fileExists, 'tsconfig.json');

        if (configPath) {
            const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
            const parseResult = ts.parseJsonConfigFileContent(
                configFile.config,
                ts.sys,
                path.dirname(configPath)
            );

            this.program = ts.createProgram(parseResult.fileNames, parseResult.options);
            this.typeChecker = this.program.getTypeChecker();
        }
    }

    /**
     * Analyze a TypeScript file
     */
    analyzeFile(filePath: string, code?: string): AnalysisResult {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
        const sourceCode = code || (fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf-8') : '');

        if (!sourceCode) {
            return this.emptyResult(filePath);
        }

        // Create source file for analysis
        const sourceFile = ts.createSourceFile(
            absolutePath,
            sourceCode,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS
        );

        const result: AnalysisResult = {
            filePath,
            functions: [],
            classes: [],
            interfaces: [],
            types: [],
            variables: [],
            imports: [],
            exports: [],
            diagnostics: [],
            summary: {
                totalLines: sourceCode.split('\n').length,
                totalSymbols: 0,
                complexity: 'low',
            },
        };

        // Visit all nodes
        this.visitNode(sourceFile, result, sourceFile);

        // Calculate complexity
        const symbolCount = result.functions.length + result.classes.length +
            result.interfaces.length + result.types.length;
        result.summary.totalSymbols = symbolCount;
        result.summary.complexity = symbolCount > 50 ? 'high' : symbolCount > 20 ? 'medium' : 'low';

        // Get diagnostics if we have a program
        if (this.program) {
            const programSourceFile = this.program.getSourceFile(absolutePath);
            if (programSourceFile) {
                const diagnostics = ts.getPreEmitDiagnostics(this.program, programSourceFile);
                result.diagnostics = diagnostics.map(d => this.convertDiagnostic(d, sourceFile));
            }
        }

        return result;
    }

    /**
     * Visit AST nodes recursively
     */
    private visitNode(node: ts.Node, result: AnalysisResult, sourceFile: ts.SourceFile): void {
        // Imports
        if (ts.isImportDeclaration(node)) {
            result.imports.push(this.parseImport(node, sourceFile));
        }

        // Functions
        if (ts.isFunctionDeclaration(node) && node.name) {
            result.functions.push(this.parseFunction(node, sourceFile));
        }

        // Arrow functions assigned to variables
        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                if (decl.initializer && ts.isArrowFunction(decl.initializer) && ts.isIdentifier(decl.name)) {
                    result.functions.push(this.parseArrowFunction(decl, decl.initializer, sourceFile, node));
                } else if (ts.isIdentifier(decl.name)) {
                    result.variables.push(this.parseVariable(decl, node, sourceFile));
                }
            }
        }

        // Classes
        if (ts.isClassDeclaration(node) && node.name) {
            result.classes.push(this.parseClass(node, sourceFile));
        }

        // Interfaces
        if (ts.isInterfaceDeclaration(node)) {
            result.interfaces.push(this.parseInterface(node, sourceFile));
        }

        // Type aliases
        if (ts.isTypeAliasDeclaration(node)) {
            result.types.push(this.parseTypeAlias(node, sourceFile));
        }

        // Export declarations
        if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
            const exports = this.parseExport(node, sourceFile);
            result.exports.push(...exports);
        }

        // Recurse
        ts.forEachChild(node, child => this.visitNode(child, result, sourceFile));
    }

    /**
     * Parse import declaration
     */
    private parseImport(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): ImportInfo {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        const importInfo: ImportInfo = {
            module: moduleSpecifier,
            namedImports: [],
            line: this.getLine(node, sourceFile),
        };

        if (node.importClause) {
            // Default import
            if (node.importClause.name) {
                importInfo.defaultImport = node.importClause.name.text;
            }

            // Named imports
            if (node.importClause.namedBindings) {
                if (ts.isNamedImports(node.importClause.namedBindings)) {
                    importInfo.namedImports = node.importClause.namedBindings.elements
                        .map(el => el.name.text);
                } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                    importInfo.namespaceImport = node.importClause.namedBindings.name.text;
                }
            }
        }

        return importInfo;
    }

    /**
     * Parse function declaration
     */
    private parseFunction(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): FunctionInfo {
        const name = node.name?.text || 'anonymous';
        const params = node.parameters.map(p => this.parseParameter(p));
        const returnType = node.type ? node.type.getText(sourceFile) : 'void';
        const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;

        return {
            name,
            kind: 'function',
            params,
            returnType,
            async: isAsync,
            exported: isExported,
            line: this.getLine(node, sourceFile),
            documentation: this.getJSDoc(node),
        };
    }

    /**
     * Parse arrow function
     */
    private parseArrowFunction(
        decl: ts.VariableDeclaration,
        arrow: ts.ArrowFunction,
        sourceFile: ts.SourceFile,
        statement: ts.VariableStatement
    ): FunctionInfo {
        const name = (decl.name as ts.Identifier).text;
        const params = arrow.parameters.map(p => this.parseParameter(p));
        const returnType = arrow.type ? arrow.type.getText(sourceFile) : 'inferred';
        const isAsync = arrow.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
        const isExported = statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;

        return {
            name,
            kind: 'arrow',
            params,
            returnType,
            async: isAsync,
            exported: isExported,
            line: this.getLine(decl, sourceFile),
        };
    }

    /**
     * Parse parameter
     */
    private parseParameter(param: ts.ParameterDeclaration): ParameterInfo {
        const name = ts.isIdentifier(param.name) ? param.name.text : param.name.getText();
        const type = param.type ? param.type.getText() : 'any';
        const optional = param.questionToken !== undefined || param.initializer !== undefined;
        const defaultValue = param.initializer ? param.initializer.getText() : undefined;

        return { name, type, optional, defaultValue };
    }

    /**
     * Parse class declaration
     */
    private parseClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): ClassInfo {
        const name = node.name?.text || 'anonymous';
        const extendsClause = node.heritageClauses?.find(h => h.token === ts.SyntaxKind.ExtendsKeyword);
        const implementsClause = node.heritageClauses?.find(h => h.token === ts.SyntaxKind.ImplementsKeyword);
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;

        const methods: FunctionInfo[] = [];
        const properties: VariableInfo[] = [];

        for (const member of node.members) {
            if (ts.isMethodDeclaration(member) && member.name) {
                methods.push(this.parseMethod(member, sourceFile));
            } else if (ts.isConstructorDeclaration(member)) {
                methods.push(this.parseConstructor(member, sourceFile));
            } else if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
                properties.push({
                    name: member.name.text,
                    type: member.type ? member.type.getText(sourceFile) : 'any',
                    kind: 'property',
                    exported: false,
                    line: this.getLine(member, sourceFile),
                });
            }
        }

        return {
            name,
            extends: extendsClause?.types[0]?.getText(sourceFile),
            implements: implementsClause?.types.map(t => t.getText(sourceFile)) || [],
            methods,
            properties,
            exported: isExported,
            line: this.getLine(node, sourceFile),
            documentation: this.getJSDoc(node),
        };
    }

    /**
     * Parse method declaration
     */
    private parseMethod(node: ts.MethodDeclaration, sourceFile: ts.SourceFile): FunctionInfo {
        const name = node.name.getText(sourceFile);
        const params = node.parameters.map(p => this.parseParameter(p));
        const returnType = node.type ? node.type.getText(sourceFile) : 'void';
        const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;

        return {
            name,
            kind: 'method',
            params,
            returnType,
            async: isAsync,
            exported: false,
            line: this.getLine(node, sourceFile),
            documentation: this.getJSDoc(node),
        };
    }

    /**
     * Parse constructor
     */
    private parseConstructor(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile): FunctionInfo {
        const params = node.parameters.map(p => this.parseParameter(p));

        return {
            name: 'constructor',
            kind: 'constructor',
            params,
            returnType: 'void',
            async: false,
            exported: false,
            line: this.getLine(node, sourceFile),
        };
    }

    /**
     * Parse interface declaration
     */
    private parseInterface(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): InterfaceInfo {
        const name = node.name.text;
        const extendsClause = node.heritageClauses?.find(h => h.token === ts.SyntaxKind.ExtendsKeyword);
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;

        const properties: VariableInfo[] = [];
        const methods: FunctionInfo[] = [];

        for (const member of node.members) {
            if (ts.isPropertySignature(member) && member.name) {
                properties.push({
                    name: member.name.getText(sourceFile),
                    type: member.type ? member.type.getText(sourceFile) : 'any',
                    kind: 'property',
                    exported: false,
                    line: this.getLine(member, sourceFile),
                });
            } else if (ts.isMethodSignature(member) && member.name) {
                methods.push({
                    name: member.name.getText(sourceFile),
                    kind: 'method',
                    params: member.parameters.map(p => this.parseParameter(p)),
                    returnType: member.type ? member.type.getText(sourceFile) : 'void',
                    async: false,
                    exported: false,
                    line: this.getLine(member, sourceFile),
                });
            }
        }

        return {
            name,
            extends: extendsClause?.types.map(t => t.getText(sourceFile)) || [],
            properties,
            methods,
            exported: isExported,
            line: this.getLine(node, sourceFile),
        };
    }

    /**
     * Parse type alias
     */
    private parseTypeAlias(node: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile): TypeAliasInfo {
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;

        return {
            name: node.name.text,
            type: node.type.getText(sourceFile),
            exported: isExported,
            line: this.getLine(node, sourceFile),
        };
    }

    /**
     * Parse variable declaration
     */
    private parseVariable(
        decl: ts.VariableDeclaration,
        statement: ts.VariableStatement,
        sourceFile: ts.SourceFile
    ): VariableInfo {
        const name = (decl.name as ts.Identifier).text;
        const type = decl.type ? decl.type.getText(sourceFile) : 'inferred';
        const isExported = statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
        const kind = statement.declarationList.flags & ts.NodeFlags.Const ? 'const' :
            statement.declarationList.flags & ts.NodeFlags.Let ? 'let' : 'var';

        return { name, type, kind: kind as any, exported: isExported, line: this.getLine(decl, sourceFile) };
    }

    /**
     * Parse export declaration
     */
    private parseExport(node: ts.ExportDeclaration | ts.ExportAssignment, sourceFile: ts.SourceFile): ExportInfo[] {
        const exports: ExportInfo[] = [];

        if (ts.isExportAssignment(node)) {
            exports.push({
                name: 'default',
                kind: 'default',
                line: this.getLine(node, sourceFile),
            });
        }

        return exports;
    }

    /**
     * Find definitions of a symbol across the project
     */
    findDefinitions(symbol: string): DefinitionResult[] {
        const results: DefinitionResult[] = [];

        if (!this.program) {
            this.initializeProgram();
        }

        if (!this.program) {
            return results;
        }

        // Search in all source files
        for (const sourceFile of this.program.getSourceFiles()) {
            if (sourceFile.fileName.includes('node_modules')) continue;

            this.findDefinitionsInFile(sourceFile, symbol, results);
        }

        return results;
    }

    /**
     * Find definitions in a single file
     */
    private findDefinitionsInFile(sourceFile: ts.SourceFile, symbol: string, results: DefinitionResult[]): void {
        const visit = (node: ts.Node) => {
            let name: string | undefined;
            let kind: string = '';

            if (ts.isFunctionDeclaration(node) && node.name?.text === symbol) {
                name = node.name.text;
                kind = 'function';
            } else if (ts.isClassDeclaration(node) && node.name?.text === symbol) {
                name = node.name.text;
                kind = 'class';
            } else if (ts.isInterfaceDeclaration(node) && node.name.text === symbol) {
                name = node.name.text;
                kind = 'interface';
            } else if (ts.isTypeAliasDeclaration(node) && node.name.text === symbol) {
                name = node.name.text;
                kind = 'type';
            } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === symbol) {
                name = node.name.text;
                kind = 'variable';
            } else if (ts.isMethodDeclaration(node) && node.name.getText() === symbol) {
                name = symbol;
                kind = 'method';
            }

            if (name) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                const lineText = sourceFile.text.split('\n')[line];

                results.push({
                    uri: `file://${sourceFile.fileName}`,
                    range: {
                        start: { line, character },
                        end: { line, character: character + name.length },
                    },
                    name,
                    kind,
                    preview: lineText.trim().substring(0, 100),
                });
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
    }

    /**
     * Find all references to a symbol
     */
    findReferences(symbol: string): ReferenceResult[] {
        const results: ReferenceResult[] = [];
        const definitions = new Set<string>();

        // First find all definitions
        const defs = this.findDefinitions(symbol);
        defs.forEach(d => definitions.add(`${d.uri}:${d.range.start.line}`));

        if (!this.program) {
            return results;
        }

        // Then find all usages
        for (const sourceFile of this.program.getSourceFiles()) {
            if (sourceFile.fileName.includes('node_modules')) continue;

            this.findReferencesInFile(sourceFile, symbol, results, definitions);
        }

        return results;
    }

    /**
     * Find references in a single file
     */
    private findReferencesInFile(
        sourceFile: ts.SourceFile,
        symbol: string,
        results: ReferenceResult[],
        definitions: Set<string>
    ): void {
        const visit = (node: ts.Node) => {
            if (ts.isIdentifier(node) && node.text === symbol) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                const lineText = sourceFile.text.split('\n')[line];
                const key = `file://${sourceFile.fileName}:${line}`;

                results.push({
                    uri: `file://${sourceFile.fileName}`,
                    range: {
                        start: { line, character },
                        end: { line, character: character + symbol.length },
                    },
                    name: symbol,
                    kind: 'reference',
                    preview: lineText.trim().substring(0, 100),
                    isDefinition: definitions.has(key),
                });
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
    }

    /**
     * Get line number of a node
     */
    private getLine(node: ts.Node, sourceFile: ts.SourceFile): number {
        return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    }

    /**
     * Get JSDoc comment
     */
    private getJSDoc(node: ts.Node): string | undefined {
        const jsDocTags = ts.getJSDocCommentsAndTags(node);
        if (jsDocTags.length > 0) {
            const doc = jsDocTags[0];
            if (ts.isJSDoc(doc) && doc.comment) {
                return typeof doc.comment === 'string' ? doc.comment : doc.comment.map(c => c.text).join('');
            }
        }
        return undefined;
    }

    /**
     * Convert TypeScript diagnostic
     */
    private convertDiagnostic(d: ts.Diagnostic, sourceFile: ts.SourceFile): DiagnosticInfo {
        const { line, character } = d.start !== undefined
            ? sourceFile.getLineAndCharacterOfPosition(d.start)
            : { line: 0, character: 0 };

        return {
            severity: d.category === ts.DiagnosticCategory.Error ? 'error' :
                d.category === ts.DiagnosticCategory.Warning ? 'warning' : 'info',
            message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
            line: line + 1,
            character,
            code: d.code,
        };
    }

    /**
     * Empty result for invalid files
     */
    private emptyResult(filePath: string): AnalysisResult {
        return {
            filePath,
            functions: [],
            classes: [],
            interfaces: [],
            types: [],
            variables: [],
            imports: [],
            exports: [],
            diagnostics: [{ severity: 'error', message: 'File not found or empty', line: 0, character: 0, code: 0 }],
            summary: { totalLines: 0, totalSymbols: 0, complexity: 'low' },
        };
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let analyzerInstance: TypeScriptAnalyzer | null = null;

export function getTypeScriptAnalyzer(projectRoot?: string): TypeScriptAnalyzer {
    if (!analyzerInstance) {
        analyzerInstance = new TypeScriptAnalyzer(projectRoot);
    }
    return analyzerInstance;
}

export function resetTypeScriptAnalyzer(): void {
    analyzerInstance = null;
}
