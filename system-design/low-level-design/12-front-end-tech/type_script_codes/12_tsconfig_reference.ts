// ============================================================
// 12 - TypeScript Configuration (tsconfig.json) Reference
// ============================================================

// This file explains key tsconfig.json options with examples.
// The actual config lives in tsconfig.json — this is a guide.

// ============================================================
// REFERENCE tsconfig.json
// ============================================================

// {
//   "compilerOptions": {
//
//     ---- Target & Module ----
//
//     "target": "ES2022",
//       What JavaScript version to EMIT (output). This controls which syntax
//       TypeScript will transpile your code into. ES5 = old browsers, ES2022 =
//       modern Node/browsers. Note: target and lib are independent — you can
//       target ES5 (for compatibility) while still having lib:ES2022 type
//       definitions so you can TYPE-CHECK modern built-ins without emitting
//       them. Example: target ES5 with lib ES2022 lets you write .flatMap()
//       with correct types, but your bundler/polyfill must provide the runtime.
//
//     "module": "NodeNext",
//       Module system for emitted code: CommonJS (require/exports),
//       ESNext (import/export), NodeNext (Node.js dual CJS+ESM), None.
//       Use NodeNext for Node 18+ apps, ESNext for bundler-driven projects.
//
//     "moduleResolution": "NodeNext",
//       Controls how TypeScript resolves import paths — NOT what JS gets emitted.
//       "node16" / "NodeNext": respects package.json "exports" and ".js"
//       extensions in imports (required for ESM in Node). "bundler": modern
//       choice for Vite/webpack/esbuild projects — allows extension-less imports
//       and respects "exports" without requiring explicit .js suffixes. Always
//       match this to your runtime/bundler to avoid "module not found" errors
//       at runtime that TypeScript never caught.
//
//     "lib": ["ES2022", "DOM"],
//       Which built-in TYPE DEFINITIONS TypeScript includes. This does NOT
//       affect what JS you emit — it only tells TypeScript what APIs exist in
//       the environment. "ES2022" gives you Promise, Map, Set, etc. "DOM"
//       gives you document, window, fetch, etc. If you omit "DOM" in a browser
//       project, TypeScript won't know about document.querySelector. Diverging
//       target vs lib is valid: target ES5 + lib ES2022 means "I'll polyfill
//       the modern APIs myself, but type-check as if they exist."
//
//     ---- Output ----
//     "outDir": "./dist",          Where compiled JS goes
//     "rootDir": "./src",          Root of source files
//     "declaration": true,         Emit .d.ts declaration files
//     "declarationMap": true,      Source maps for .d.ts
//     "sourceMap": true,           Emit .js.map files
//     "removeComments": true,      Strip comments from output
//     "noEmitOnError": true,       Don't emit if there are type errors
//
//     ---- Strictness (ALWAYS enable in new projects) ----
//
//     "strict": true,
//       Single flag that ENABLES ALL strict sub-checks listed below in one shot.
//       Always turn this on in new projects — it is far cheaper to enable it at
//       project start than to retrofit it later (each sub-check can surface
//       hundreds of latent bugs). "strict: true" is equivalent to enabling
//       strictNullChecks, noImplicitAny, strictFunctionTypes,
//       strictBindCallApply, strictPropertyInitialization,
//       noImplicitThis, useUnknownInCatchVariables, and alwaysStrict
//       simultaneously. If you need to go beyond strict, see the note on
//       "strictest" conventions below.
//
//     "strictNullChecks": true,
//       The single most impactful strict flag. Without it, null and undefined
//       are silently assignable to every type (string, number, object, etc.),
//       which means TypeScript will happily let you write code that crashes with
//       "Cannot read properties of null" at runtime. Tony Hoare, who invented
//       null references, called it his "billion dollar mistake." With
//       strictNullChecks: true, null and undefined become their own distinct
//       types — you must explicitly handle or narrow them before using a value.
//       This prevents an entire category of runtime crashes the compiler can
//       catch statically.
//
//     "strictFunctionTypes": true,   Stricter function param checking
//     "strictBindCallApply": true,   Strict .bind, .call, .apply
//     "strictPropertyInitialization": true,  Class props must be initialized
//
//     "noImplicitAny": true,
//       When TypeScript cannot infer a type from context, it normally falls
//       back to "any" silently — effectively turning off type checking for that
//       value. noImplicitAny: true makes that silent fallback an error. You
//       must annotate the type explicitly, ensuring nothing slips through as
//       untyped. Common trigger: function parameters with no annotation
//       (e.g. function foo(x) { } — x becomes implicitly any). This flag
//       forces every public surface to be intentionally typed.
//
//     "noImplicitThis": true,        Error on implicit this
//     "useUnknownInCatchVariables": true,  catch (e) typed as unknown, not any
//     "alwaysStrict": true,          Emit "use strict"
//
//     ---- Additional Checks ----
//     "noUnusedLocals": true,      Error on unused local vars
//     "noUnusedParameters": true,  Error on unused function params
//     "noImplicitReturns": true,   Error if not all code paths return
//     "noFallthroughCasesInSwitch": true,  No accidental switch fallthrough
//     "exactOptionalPropertyTypes": true,  Distinguish undefined vs missing
//     "noUncheckedIndexedAccess": true,    arr[i] returns T | undefined
//
//     ---- Modules ----
//     "baseUrl": ".",
//
//     "paths": { "@/*": ["src/*"], "@components/*": ["src/components/*"] },
//       Path aliases let you write import { Btn } from "@/components/Btn"
//       instead of import { Btn } from "../../../../components/Btn". This
//       eliminates brittle relative traversal and makes imports refactor-safe
//       when files move. IMPORTANT: tsconfig "paths" only affects TypeScript's
//       type resolution — it does NOT rewrite imports in emitted JS. Your
//       bundler (Vite, webpack, esbuild, etc.) or module resolver must be
//       configured with the same alias mappings independently. If you add
//       "@/*" here but forget to add it to vite.config.ts resolve.alias, the
//       types will check but the runtime will throw "module not found."
//
//     "resolveJsonModule": true,   Import .json files
//     "esModuleInterop": true,     CommonJS interop
//     "isolatedModules": true,     Each file is an independent module
//
//     ---- Decorators ----
//     "experimentalDecorators": true,  Legacy decorators (TS < 5.0)
//     "emitDecoratorMetadata": true,   Emit design:type metadata (for DI)
//
//     ---- Type Checking ----
//     "skipLibCheck": true,        Skip type checking of .d.ts files (speed)
//     "forceConsistentCasingInFileNames": true,
//
//     ---- JS Support ----
//     "allowJs": true,             Allow importing .js files
//     "checkJs": true,             Type-check .js files
//   },
//   "include": ["src/**/*"],
//   "exclude": ["node_modules", "dist", "**/*.test.ts"],
//   "extends": "@tsconfig/node20/tsconfig.json"
// }

// ============================================================
// NOTE: strict vs strictest
// ============================================================
// "strict: true" is the official TypeScript flag enabling the standard strict
// suite. The ecosystem also uses the informal term "strictest" to refer to
// enabling strict PLUS the additional checks that TypeScript does not bundle
// into "strict" by default: noUncheckedIndexedAccess, exactOptionalPropertyTypes,
// noImplicitReturns, noFallthroughCasesInSwitch, noUnusedLocals, and
// noUnusedParameters. Projects like @tsconfig/strictest and typescript-strict-plugin
// codify this extended set. Convention: use "strict: true" as the baseline in
// every project; selectively add the extras in greenfield or safety-critical
// codebases. Never turn strict OFF to work around errors — fix the types instead.

// ============================================================
// KEY TSCONFIG OPTIONS EXPLAINED WITH CODE EXAMPLES
// ============================================================

// --- strictNullChecks ---
// Without: string | null | undefined all assignable to string
// With:    must handle null/undefined explicitly
// The optional chaining (?.) and nullish coalescing (??) operators are the
// idiomatic way to handle nullable values once strictNullChecks is on.

function getLength(s: string | null): number {
    // return s.length;        // Error: s could be null
    return s?.length ?? 0;    // Correct
}

// --- noUncheckedIndexedAccess ---
// With this on, array[index] returns T | undefined (not just T), because
// TypeScript cannot statically guarantee the index is in bounds. This forces
// you to null-check before using the value, preventing silent undefined bugs.
const arr: number[] = [1, 2, 3];
const first: number | undefined = arr[0]; // not just number
if (first !== undefined) {
    console.log(first * 2); // safe
}

// --- exactOptionalPropertyTypes ---
// Without this flag, an optional property (nickname?: string) is treated as
// "string | undefined", so you can explicitly set it to undefined. With this
// flag, optional means the property is either absent OR a string — explicitly
// assigning undefined is a separate (disallowed) state. This catches cases
// where code sets a property to undefined thinking it "removes" it, which
// behaves differently from actually omitting the key (e.g. in JSON.stringify
// or Object.keys checks).
interface Profile {
    nickname?: string; // means "string" or property absent — NOT "string | undefined"
}
const p1: Profile = {};                 // ok — absent
const p2: Profile = { nickname: "Al" }; // ok — has string
// const p3: Profile = { nickname: undefined }; // Error with exactOptionalPropertyTypes

// --- isolatedModules ---
// Requires every file to be a module (have at least one import/export).
// This flag exists because tools like esbuild, SWC, and Babel transpile
// TypeScript files ONE AT A TIME without a full type-checker pass — they
// cannot handle features that require cross-file type information (const enum,
// namespace merging). isolatedModules: true makes TypeScript error if you
// use such features, ensuring your code is safe for single-file transpilers.
// Required when using esbuild, SWC, or Babel for compilation.

export {}; // Makes this file a module (satisfies isolatedModules)

// ============================================================
// COMMON TSCONFIG PRESETS
// ============================================================

/*
// Node.js app (npm install -D @tsconfig/node20)
// The @tsconfig/* packages are community-maintained base configs you extend,
// so you only override what differs for your project. They pin sensible
// target/module/moduleResolution defaults for the named runtime.
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  }
}

// React app (Create React App / Vite)
// Note moduleResolution: "bundler" — this is the right choice for Vite/webpack
// projects. It allows extension-less imports and respects package.json exports
// without requiring explicit .js extensions (which ESM Node would need).
// noEmit: true means TypeScript is only used for type checking — Vite handles
// the actual compilation/bundling separately (usually via esbuild).
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  }
}

// Monorepo root (Turborepo / Nx)
// composite: true enables TypeScript Project References — it forces declaration
// and declarationMap to be on, and requires outDir to be set. This lets tsc
// --build understand the dependency graph between packages and only rebuild
// what changed, rather than type-checking the entire monorepo every time.
{
  "compilerOptions": {
    "strict": true,
    "composite": true,     // enables project references
    "declaration": true,
    "declarationMap": true
  }
}

// Library (publishing to npm)
// When publishing, you need declaration: true so consumers get types without
// needing your source. declarationMap lets IDE "go to definition" jump to
// your .ts source rather than the generated .d.ts. target ES2019 is a
// common sweet spot — modern enough to avoid large polyfills, old enough
// to work in most environments without requiring the consumer to transpile
// your package.
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "target": "ES2019",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
*/

// ============================================================
// PROJECT REFERENCES (monorepo support)
// ============================================================

/*
// Project References allow tsc to understand inter-package dependencies and
// build them in the correct order. Each referenced package must have
// "composite: true" in its tsconfig, which enables incremental compilation
// (TypeScript caches .tsbuildinfo files). Running "tsc --build" at the root
// walks the reference graph, skips packages whose inputs haven't changed, and
// rebuilds only what is stale — dramatically faster than a full tsc in large
// monorepos.

// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}

// packages/api/tsconfig.json
// The "references" array tells TypeScript that this package depends on
// "shared". TypeScript will resolve types for shared imports from shared's
// compiled .d.ts output (dist/), not by re-type-checking shared's source.
{
  "references": [{ "path": "../shared" }],
  "compilerOptions": { ... }
}

// Build: tsc --build  (respects dependency order)
// Watch: tsc --build --watch
*/

console.log("TSConfig Reference complete");
