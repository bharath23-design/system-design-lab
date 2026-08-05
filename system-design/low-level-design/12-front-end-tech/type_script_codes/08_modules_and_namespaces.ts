// ============================================================
// 08 - Modules & Namespaces in TypeScript
// ============================================================
//
// Two separate systems exist for organizing TypeScript code:
//
//   1. ES Modules  — the JavaScript standard (import/export syntax).
//                    Works in the browser, Node.js, and every modern
//                    bundler (Vite, webpack, esbuild, Rollup).
//                    THIS IS WHAT YOU SHOULD USE IN ALL NEW CODE.
//
//   2. Namespaces  — a TypeScript-only invention that pre-dates ES
//                    modules. They compile to self-executing IIFEs
//                    and bundle everything into a single global
//                    object. Useful only when you cannot use a module
//                    system (e.g., old <script> tag projects).
//                    AVOID namespaces in any modern codebase.
//
// Rule of thumb: if your project has a bundler or runs in Node.js
// with "type": "module" in package.json, use ES modules exclusively.

// ============================================================
// PART A — ES Modules (recommended modern approach)
// ============================================================

// --- Named Exports ---
//
// Named exports form an EXPLICIT PUBLIC CONTRACT for a module.
// Every consumer must import them by their exact name (or alias
// them with `as`). This makes tooling like auto-import, "Find all
// references", and dead-code elimination (tree-shaking) work well,
// because the bundler knows statically what each export is called.
//
// Prefer named exports for most things: functions, constants,
// interfaces, types — anything where the name is meaningful.
export interface Product {
    id: number;
    name: string;
    price: number;
}

export type Currency = "USD" | "EUR" | "GBP";

export function formatPrice(price: number, currency: Currency = "USD"): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

export const TAX_RATE = 0.08;

// --- Default Export ---
//
// A module can have AT MOST ONE default export. The consumer can
// import it under ANY name they choose, which gives flexibility but
// hurts tooling:
//   - Auto-import cannot predict what name you will pick.
//   - Renaming a default export does not propagate to importers.
//   - Some linters (e.g. eslint-plugin-import) discourage them.
//
// Common convention: use a default export for the "main thing" a
// module provides — typically a class or a React component — and
// named exports for everything that supports it.
export default class ProductService {
    private products: Product[] = [];

    add(product: Product): void {
        this.products.push(product);
    }

    findById(id: number): Product | undefined {
        return this.products.find(p => p.id === id);
    }

    getAll(): Product[] {
        return [...this.products];
    }
}

// --- Re-exporting ---
//
// A module can re-export symbols from another module without ever
// importing them into local scope. This is the foundation of the
// "barrel file" pattern (see Part E below).
//
// Three common forms:
//
//   export { formatPrice as format } from "./another-module";
//     — selective re-export, optionally renamed.
//       Tree-shakers can statically see exactly which names survive.
//
//   export * from "./another-module";
//     — re-export EVERYTHING. Convenient but dangerous for
//       tree-shaking: the bundler cannot always tell which names are
//       actually used downstream, so it may keep more code than
//       needed. Avoid in large libraries.
//
//   export * as utils from "./utils";
//     — re-export everything under a single namespace object.
//       Consumers write `import { utils } from "..."` and then
//       `utils.someFunction()`. A useful middle ground.
//
// export { formatPrice as format } from "./another-module";
// export * from "./another-module";
// export * as utils from "./utils";

// ============================================================
// PART B — Import Patterns (reference only — not runnable standalone)
// ============================================================

/*
// Named import — the standard, tree-shakeable form.
// The bundler removes TAX_RATE from the final bundle if nothing uses it.
import { formatPrice, TAX_RATE, type Product } from "./08_modules_and_namespaces";

// Default import — the consumer picks the local name freely.
// "ProductService", "PS", "MyService" — all valid. That freedom is
// both the strength and the weakness of default exports.
import ProductService from "./08_modules_and_namespaces";

// Namespace import — pulls every export into a single object.
// Useful for exploring a module interactively, but bypasses tree-
// shaking because the bundler sees the entire module as "used".
import * as ProductModule from "./08_modules_and_namespaces";
const p = ProductModule.formatPrice(9.99);

// Type-only import — the `type` keyword tells TypeScript (and the
// bundler / transpiler) that this import is purely for type-checking.
// It is completely erased at compile time, so it never appears in
// the emitted JavaScript. This keeps bundles smaller and avoids
// circular-dependency problems that only exist at the type level.
import type { Product, Currency } from "./08_modules_and_namespaces";

// Dynamic import — returns a Promise that resolves to the module.
// The bundler splits the imported module into a separate chunk and
// the browser/Node.js loads it on demand. Use this for code you
// only need in specific situations (large charts, PDF export, etc.)
// to keep the initial page load fast.
async function loadHeavyModule() {
    const { heavyFunction } = await import("./heavy-module");
    heavyFunction();
}

// Import assertions (JSON) — lets you import a JSON file directly.
// The `assert { type: "json" }` hints to the runtime how to parse it.
// Stage 3 proposal as of 2024; supported natively in Node >=17 and
// most modern bundlers.
import data from "./data.json" assert { type: "json" };
*/

// ============================================================
// PART C — Namespaces (for organizing code without ES modules)
// ============================================================
//
// A TypeScript namespace compiles to an IIFE that attaches exported
// members to a plain object. The result is similar to a module but
// lives in global or local scope — there is no `import` statement.
//
// When to use namespaces (rare):
//   - Legacy projects that concatenate .ts files with `/// <reference>`
//     and serve a single bundle via <script>.
//   - Ambient declaration files (.d.ts) that describe a global
//     JavaScript library loaded via <script> (e.g. Google Maps).
//
// When NOT to use namespaces (almost always):
//   - Any project with a bundler (webpack, Vite, esbuild, Rollup).
//   - Any Node.js project.
//   - Any new code written after ~2018.
//
// In those environments, just use ES modules. TypeScript's own
// migration guide explicitly recommends against namespaces for
// module-based projects.

namespace Validation {
    // Members inside a namespace must be explicitly `export`ed to be
    // accessible outside. Without `export`, they are private to the
    // namespace block — analogous to unexported module members.
    export interface Validator {
        isValid(value: string): boolean;
        errorMessage: string;
    }

    export class EmailValidator implements Validator {
        errorMessage = "Not a valid email";
        isValid(value: string): boolean {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
    }

    export class PhoneValidator implements Validator {
        errorMessage = "Not a valid phone number";
        isValid(value: string): boolean {
            return /^\+?[\d\s\-()]{7,15}$/.test(value);
        }
    }

    export function validate(value: string, validator: Validator): boolean {
        if (!validator.isValid(value)) {
            console.error(validator.errorMessage);
            return false;
        }
        return true;
    }
}

// Access namespace members via dot-notation on the namespace name.
// TypeScript enforces the shape at compile time; at runtime this is
// just a property lookup on the compiled object.
const emailVal = new Validation.EmailValidator();
console.log(Validation.validate("user@example.com", emailVal)); // true

// --- Nested Namespaces ---
//
// Namespaces can nest arbitrarily. The compiled output is nested
// plain objects, so `App.Models.User` becomes a property chain.
// This mirrors the old "Java package" pattern.
//
// In an ES module world you would instead create separate files
// (models/user.ts, services/user.ts, utils/string.ts) and let the
// module system handle the separation. The result is identical
// expressiveness with better tree-shaking and tooling support.
namespace App {
    export namespace Models {
        export interface User {
            id: number;
            name: string;
        }
    }

    export namespace Services {
        // Inner namespaces can reference sibling namespaces by their
        // short name when inside the same outer namespace block.
        export function createUser(name: string): Models.User {
            return { id: Date.now(), name };
        }
    }

    export namespace Utils {
        export function slugify(text: string): string {
            return text.toLowerCase().replace(/\s+/g, "-");
        }
    }
}

const newUser = App.Services.createUser("Alice");
const slug = App.Utils.slugify("Hello World");
console.log(newUser, slug);

// --- Ambient Declarations (declare keyword) ---
//
// `declare` does NOT generate any JavaScript. It is a pure compile-
// time instruction that says: "TypeScript, trust me — this name
// exists at runtime, even though you cannot see where it was defined."
//
// Primary use-cases:
//
//   1. Third-party JavaScript libraries that ship no type definitions.
//      You write `declare function myLib(): void;` so TypeScript stops
//      complaining, then the real implementation is loaded at runtime
//      via <script> or require().
//
//   2. Global variables injected by a bundler at build time
//      (e.g. webpack's DefinePlugin sets __DEV__, __VERSION__, etc.).
//      You declare them so TypeScript knows their type.
//
//   3. Node.js globals like `require` or `process` in a file that
//      does not have @types/node installed.
//
// All declarations below will be completely absent from compiled JS.
// They exist only to satisfy the TypeScript type checker.

declare const __DEV__: boolean;        // global variable injected by bundler (e.g. webpack DefinePlugin)
declare function require(module: string): unknown; // CommonJS global — present in Node.js but not in browser

// Augmenting the NodeJS namespace (which comes from @types/node).
// We are ADDING new properties to an existing ambient namespace
// declaration — this is called declaration merging (see below).
// TypeScript merges all declarations for the same namespace name
// into one combined type, so `process.env.DATABASE_URL` becomes
// type-safe everywhere without modifying @types/node itself.
declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: "development" | "production" | "test";
        PORT?: string;
        DATABASE_URL: string;
    }
}

// --- Module Augmentation (example for an installed package) ---
//
// Module augmentation lets you ADD new type information to an
// existing npm package's types WITHOUT modifying its source files
// or forking the package.
//
// How it works:
//   - You write `declare module "package-name" { ... }` in your own
//     .d.ts file (or in a .ts file that is a module).
//   - TypeScript merges your additions with the package's original
//     types at compile time.
//   - At runtime, your code must actually add the property; TypeScript
//     just knows about it statically.
//
// Classic use-case: adding a `user` property to Express's Request
// object after a JWT authentication middleware populates it.
//
// IMPORTANT: Declaration merging works with INTERFACES and NAMESPACES,
// NOT with `type` aliases. You cannot merge two `type` aliases; you
// will get a "Duplicate identifier" error. That is one reason to
// prefer `interface` for shapes you expect to be extended.
//
// declare module "express" {
//     interface Request {
//         user?: { id: string; role: string };
//     }
// }

// --- Global Augmentation ---
//
// `declare global { ... }` is module augmentation applied to the
// global scope. Inside a file that IS a module (has any import or
// export), you must use this wrapper to add to global types.
// Without it TypeScript would treat the declarations as local only.
//
// Here we extend two built-in global interfaces:
//   - Window: to add a `window.analytics` object injected by a
//             third-party analytics script loaded via <script>.
//   - Array<T>: to add a convenience `.last()` method we will
//               polyfill below. Note that augmenting Array<T>
//               (a generic interface) works because TypeScript
//               performs declaration merging on interfaces, not on
//               `type` aliases.
declare global {
    interface Window {
        analytics: {
            track(event: string, data?: Record<string, unknown>): void;
        };
    }

    interface Array<T> {
        last(): T | undefined;
    }
}

// Implementing the augmented Array method.
// The `declare global` block above told TypeScript the method exists;
// this block actually adds it to Array.prototype so it works at
// runtime. Without this runtime patch, calling `.last()` would throw
// "TypeError: [].last is not a function" even though TypeScript
// compiled the call without error.
if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
}

console.log([1, 2, 3].last()); // 3

// ============================================================
// PART D — Path Aliases (configured in tsconfig.json)
// ============================================================
//
// By default, TypeScript resolves imports relative to the file:
//   import { Button } from "../../components/Button";
//
// Path aliases let you write short, absolute-looking paths instead:
//   import { Button } from "@components/Button";
//
// They are configured in tsconfig.json under `compilerOptions.paths`
// and `compilerOptions.baseUrl`. Your bundler or module runner also
// needs to be told about them (e.g. vite.config `resolve.alias`,
// or `module-alias` package for Node.js) because tsconfig paths
// are type-checking-only — they do not affect the runtime resolver.

/*
// tsconfig.json:
// {
//   "compilerOptions": {
//     "baseUrl": ".",
//     "paths": {
//       "@/*": ["src/*"],
//       "@components/*": ["src/components/*"],
//       "@utils/*": ["src/utils/*"]
//     }
//   }
// }

// With path aliases:
import { Button } from "@components/Button";
import { formatDate } from "@utils/date";
*/

// ============================================================
// PART E — Barrel Exports (index.ts pattern)
// ============================================================
//
// A "barrel file" is an index.ts that re-exports everything from
// a directory so consumers can import from the folder path instead
// of from individual files.
//
// BENEFIT: cleaner import paths for consumers.
//   Before barrel:  import { User } from "@/models/user";
//                   import { Product } from "@/models/product";
//   After barrel:   import { User, Product } from "@/models";
//
// COST: barrel files CAN hurt tree-shaking. When a consumer imports
// ONE symbol from a barrel, the bundler must parse ALL files the
// barrel re-exports to decide what to drop. Modern bundlers (esbuild,
// Rollup, Vite) handle this well with static analysis, but:
//   - `export * from "./..."` (star re-export) is harder to shake
//     than selective `export { X } from "./..."`.
//   - Very large barrels in libraries (e.g. `import { one } from
//     "@mui/icons-material"`) can still bloat bundles.
//
// RULE OF THUMB:
//   - Use barrel files freely inside an application (the bundler
//     handles it).
//   - In a published library, prefer named selective re-exports
//     over star re-exports so consumers pay only for what they use.

/*
// src/models/index.ts — re-export everything from the folder
export { User } from "./user";
export { Product } from "./product";
export { Order } from "./order";

// Consumer:
import { User, Product, Order } from "@/models";
*/

console.log("Modules & Namespaces demo complete");
