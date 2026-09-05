// Test-only adapter: run real server modules/NextResponse without bundling Next.
// server-only remains enforced by Next in production; no server modules enter client bundles.
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = new URL("../../../", import.meta.url);
const src = new URL("src/", root).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    let candidate;
    if (specifier.startsWith("@/")) candidate = new URL(specifier.slice(2), src);
    else if (specifier.startsWith(".") && context.parentURL?.startsWith(src)) {
      candidate = new URL(specifier, context.parentURL);
    }
    if (candidate) {
      for (const suffix of ["", ".ts", ".tsx", "/index.ts"]) {
        const path = fileURLToPath(candidate) + suffix;
        if (existsSync(path) && /\.(ts|tsx)$/.test(path)) {
          return { url: pathToFileURL(path).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(src) && /\.tsx?$/.test(url)) {
      return {
        format: "module", shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX, verbatimModuleSyntax: false },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});
