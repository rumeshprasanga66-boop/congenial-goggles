// Module resolution for Node's built-in test runner.
//
// Node strips TypeScript types natively but does not apply tsconfig `paths` or
// extensionless import resolution, so this hook:
//   - maps the "@/*" alias to src
//   - adds the missing extension to relative imports
//   - stubs the `server-only` marker that Next.js resolves at build time
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const srcRoot = path.join(projectRoot, "src");
const stubRoot = path.join(projectRoot, "tests", "stubs");

const STUBS = new Set(["server-only", "client-only"]);
const EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".js", ".mjs", ".json", "/index.ts", "/index.tsx"];

function firstExisting(base) {
  for (const extension of EXTENSIONS) {
    const candidate = `${base}${extension}`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function resolve(specifier, context, nextResolve) {
  if (STUBS.has(specifier)) {
    return nextResolve(pathToFileURL(path.join(stubRoot, "server-only.ts")).href, context);
  }

  let base = null;
  if (specifier.startsWith("@/")) {
    base = path.join(srcRoot, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parent = context.parentURL ? fileURLToPath(context.parentURL) : projectRoot;
    base = path.resolve(path.dirname(parent), specifier);
  }

  if (base) {
    const resolved = firstExisting(base);
    if (resolved) return nextResolve(pathToFileURL(resolved).href, context);
  }

  // Bare specifiers such as "next/server" resolve through package exports, which
  // ESM's default resolver handles inconsistently outside a bundler. Fall back to
  // CommonJS resolution, which honours those exports, then hand the file path on.
  if (!base && !specifier.startsWith("node:")) {
    try {
      return nextResolve(pathToFileURL(require.resolve(specifier)).href, context);
    } catch {
      // Not a resolvable package path; let the default resolver decide.
    }
  }

  return nextResolve(specifier, context);
}
