import * as ts from "typescript";

/**
 * One subset diagnostic.
 */
export interface SubsetDiagnostic {
  readonly message: string;
  readonly fileName?: string;
}

/**
 * Result of subset check.
 */
export interface CheckResult {
  readonly ok: boolean;
  readonly diagnostics: readonly SubsetDiagnostic[];
}

const USE_GPU = "use gpu";
const STORAGE_F32 = "StorageF32";

/**
 * Checks that source is within the Shaderscript TypeScript subset.
 * @param source - TypeScript source text.
 * @param fileName - Optional path for diagnostics.
 * @returns Check result.
 */
export function checkSource(source: string, fileName?: string): CheckResult {
  const resolvedFileName = fileName ?? "kernel.ts";
  const sourceFile = ts.createSourceFile(
    resolvedFileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const diagnostics: SubsetDiagnostic[] = [];
  const kernels = findUseGpuFunctions(sourceFile);

  if (kernels.length === 0) {
    diagnostics.push({
      message: `no function with '${USE_GPU}' directive found`,
      fileName: resolvedFileName,
    });
    return { ok: false, diagnostics };
  }

  for (const kernel of kernels) {
    checkKernel(kernel, sourceFile, resolvedFileName, diagnostics);
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics,
  };
}

function findUseGpuFunctions(
  sourceFile: ts.SourceFile,
): readonly ts.FunctionDeclaration[] {
  const kernels: ts.FunctionDeclaration[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(statement) || statement.body === undefined) {
      continue;
    }
    if (hasUseGpuDirective(statement.body)) {
      kernels.push(statement);
    }
  }

  return kernels;
}

function hasUseGpuDirective(body: ts.Block): boolean {
  return body.statements.some(isUseGpuDirective);
}

function isUseGpuDirective(statement: ts.Statement): boolean {
  if (!ts.isExpressionStatement(statement)) {
    return false;
  }
  const expression = statement.expression;
  return ts.isStringLiteral(expression) && expression.text === USE_GPU;
}

function checkKernel(
  kernel: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  checkParams(kernel, sourceFile, fileName, diagnostics);
  if (kernel.body === undefined) {
    pushDiagnostic(diagnostics, fileName, sourceFile, kernel, "kernel must have a body");
    return;
  }
  checkBody(kernel.body, sourceFile, fileName, diagnostics);
}

function checkParams(
  kernel: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  if (kernel.parameters.length !== 3) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      kernel,
      "kernel must have exactly three StorageF32 parameters",
    );
    return;
  }

  for (const parameter of kernel.parameters) {
    if (!isStorageF32Type(parameter.type)) {
      pushDiagnostic(
        diagnostics,
        fileName,
        sourceFile,
        parameter,
        `parameter '${parameterName(parameter)}' must be typed as ${STORAGE_F32}`,
      );
    }
  }
}

function isStorageF32Type(typeNode: ts.TypeNode | undefined): boolean {
  if (typeNode === undefined || !ts.isTypeReferenceNode(typeNode)) {
    return false;
  }
  return ts.isIdentifier(typeNode.typeName) && typeNode.typeName.text === STORAGE_F32;
}

function parameterName(parameter: ts.ParameterDeclaration): string {
  return ts.isIdentifier(parameter.name) ? parameter.name.text : "?";
}

function checkBody(
  body: ts.Block,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  for (const statement of body.statements) {
    checkStatement(statement, sourceFile, fileName, diagnostics);
  }
}

function checkStatement(
  statement: ts.Statement,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  if (isUseGpuDirective(statement)) {
    return;
  }

  if (ts.isVariableStatement(statement)) {
    checkVariableStatement(statement, sourceFile, fileName, diagnostics);
    return;
  }

  if (ts.isIfStatement(statement)) {
    checkBoundsIf(statement, sourceFile, fileName, diagnostics);
    return;
  }

  if (ts.isExpressionStatement(statement)) {
    checkAssignmentStatement(statement, sourceFile, fileName, diagnostics);
    return;
  }

  if (ts.isReturnStatement(statement)) {
    if (statement.expression !== undefined) {
      pushDiagnostic(
        diagnostics,
        fileName,
        sourceFile,
        statement,
        "early return must not return a value",
      );
    }
    return;
  }

  pushDiagnostic(
    diagnostics,
    fileName,
    sourceFile,
    statement,
    `unsupported statement in '${USE_GPU}' kernel: ${ts.SyntaxKind[statement.kind]}`,
  );
}

function checkVariableStatement(
  statement: ts.VariableStatement,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  if ((statement.declarationList.flags & ts.NodeFlags.Const) === 0) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      statement,
      "only const bindings are allowed in kernels",
    );
    return;
  }

  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name)) {
      pushDiagnostic(
        diagnostics,
        fileName,
        sourceFile,
        declaration,
        "destructuring is not allowed in kernels",
      );
      continue;
    }
    if (declaration.initializer === undefined) {
      pushDiagnostic(
        diagnostics,
        fileName,
        sourceFile,
        declaration,
        "const binding must have an initializer",
      );
      continue;
    }
    if (!isGlobalIdX(declaration.initializer)) {
      pushDiagnostic(
        diagnostics,
        fileName,
        sourceFile,
        declaration.initializer,
        "only `globalId.x` initializers are allowed",
      );
    }
  }
}

function isGlobalIdX(expression: ts.Expression): boolean {
  if (!ts.isPropertyAccessExpression(expression)) {
    return false;
  }
  return (
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === "globalId" &&
    expression.name.text === "x"
  );
}

function checkBoundsIf(
  statement: ts.IfStatement,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  if (!isBoundsCondition(statement.expression)) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      statement.expression,
      "if condition must be `index >= buffer.length`",
    );
  }

  checkThenForEarlyReturn(statement.thenStatement, sourceFile, fileName, diagnostics);

  if (statement.elseStatement !== undefined) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      statement.elseStatement,
      "else branches are not allowed in kernels",
    );
  }
}

function isBoundsCondition(expression: ts.Expression): boolean {
  if (!ts.isBinaryExpression(expression) || expression.operatorToken.kind !== ts.SyntaxKind.GreaterThanEqualsToken) {
    return false;
  }
  if (!ts.isIdentifier(expression.left)) {
    return false;
  }
  if (!ts.isPropertyAccessExpression(expression.right)) {
    return false;
  }
  return (
    ts.isIdentifier(expression.right.expression) &&
    expression.right.name.text === "length"
  );
}

function checkThenForEarlyReturn(
  thenStatement: ts.Statement,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  if (ts.isBlock(thenStatement)) {
    for (const nested of thenStatement.statements) {
      checkStatement(nested, sourceFile, fileName, diagnostics);
    }
    return;
  }

  if (ts.isReturnStatement(thenStatement)) {
    checkStatement(thenStatement, sourceFile, fileName, diagnostics);
    return;
  }

  pushDiagnostic(
    diagnostics,
    fileName,
    sourceFile,
    thenStatement,
    "bounds if must early-return",
  );
}

function checkAssignmentStatement(
  statement: ts.ExpressionStatement,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  const expression = statement.expression;
  if (!ts.isBinaryExpression(expression) || expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      expression,
      "only indexed assignment statements are allowed",
    );
    return;
  }

  if (!isIndexedStorageAccess(expression.left)) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      expression.left,
      "assignment target must be an indexed StorageF32 access",
    );
  }

  checkAddExpression(expression.right, sourceFile, fileName, diagnostics);
}

function checkAddExpression(
  expression: ts.Expression,
  sourceFile: ts.SourceFile,
  fileName: string,
  diagnostics: SubsetDiagnostic[],
): void {
  if (!ts.isBinaryExpression(expression) || expression.operatorToken.kind !== ts.SyntaxKind.PlusToken) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      expression,
      "only `+` is allowed for element expressions",
    );
    return;
  }

  if (!isIndexedStorageAccess(expression.left)) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      expression.left,
      "add operands must be indexed StorageF32 reads",
    );
  }

  if (!isIndexedStorageAccess(expression.right)) {
    pushDiagnostic(
      diagnostics,
      fileName,
      sourceFile,
      expression.right,
      "add operands must be indexed StorageF32 reads",
    );
  }
}

function isIndexedStorageAccess(expression: ts.Expression): boolean {
  if (!ts.isElementAccessExpression(expression)) {
    return false;
  }
  return (
    ts.isIdentifier(expression.expression) &&
    ts.isIdentifier(expression.argumentExpression)
  );
}

function pushDiagnostic(
  diagnostics: SubsetDiagnostic[],
  fileName: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  message: string,
): void {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  diagnostics.push({
    message: `${message} (${line + 1}:${character + 1})`,
    fileName,
  });
}
