import * as ts from "typescript";
import type { SubsetDiagnostic } from "./checker.ts";
import { checkSource } from "./checker.ts";

/**
 * Result of compile: WGSL on success, diagnostics on failure.
 */
export type CompileResult =
  | { readonly ok: true; readonly wgsl: string }
  | { readonly ok: false; readonly diagnostics: readonly SubsetDiagnostic[] };

/**
 * Checks then emits WGSL for a kernel source string.
 * @param source - TypeScript source text.
 * @param fileName - Optional path for diagnostics.
 * @returns Compile result.
 */
export function compileKernelSource(
  source: string,
  fileName?: string,
): CompileResult {
  const checked = checkSource(source, fileName);
  if (!checked.ok) {
    return { ok: false, diagnostics: checked.diagnostics };
  }
  return { ok: true, wgsl: emitHelloAddWgsl(source, fileName) };
}

function emitHelloAddWgsl(source: string, fileName?: string): string {
  const resolvedFileName = fileName ?? "kernel.ts";
  const sourceFile = ts.createSourceFile(
    resolvedFileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const kernel = findUseGpuFunction(sourceFile);
  const params = kernel.parameters.map(parameterName);
  const indexName = findIndexName(kernel) ?? "i";
  const a = params[0] ?? "a";
  const b = params[1] ?? "b";
  const out = params[2] ?? "out";

  return [
    `@group(0) @binding(0) var<storage, read> ${a} : array<f32>;`,
    `@group(0) @binding(1) var<storage, read> ${b} : array<f32>;`,
    `@group(0) @binding(2) var<storage, read_write> ${out} : array<f32>;`,
    "",
    "@compute @workgroup_size(64)",
    "fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {",
    `  let ${indexName} = global_id.x;`,
    `  if (${indexName} >= arrayLength(&${a})) {`,
    "    return;",
    "  }",
    `  ${out}[${indexName}] = ${a}[${indexName}] + ${b}[${indexName}];`,
    "}",
    "",
  ].join("\n");
}

function findUseGpuFunction(sourceFile: ts.SourceFile): ts.FunctionDeclaration {
  for (const statement of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(statement) || statement.body === undefined) {
      continue;
    }
    if (statement.body.statements.some(isUseGpuDirective)) {
      return statement;
    }
  }
  throw new Error("expected a 'use gpu' kernel after successful check");
}

function isUseGpuDirective(statement: ts.Statement): boolean {
  if (!ts.isExpressionStatement(statement)) {
    return false;
  }
  const expression = statement.expression;
  return ts.isStringLiteral(expression) && expression.text === "use gpu";
}

function parameterName(parameter: ts.ParameterDeclaration): string {
  return ts.isIdentifier(parameter.name) ? parameter.name.text : "?";
}

function findIndexName(kernel: ts.FunctionDeclaration): string | undefined {
  if (kernel.body === undefined) {
    return undefined;
  }
  for (const statement of kernel.body.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer !== undefined &&
        isGlobalIdX(declaration.initializer)
      ) {
        return declaration.name.text;
      }
    }
  }
  return undefined;
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
