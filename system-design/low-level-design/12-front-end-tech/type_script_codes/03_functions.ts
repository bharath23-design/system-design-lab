// ============================================================
// 03 - Functions in TypeScript
// ============================================================
// TypeScript layers a static type system on top of JavaScript functions.
// Every parameter and return value can (and should) be annotated so the
// compiler can catch mismatches at build time rather than at runtime.
// This file walks through the most important function patterns in order
// of increasing complexity.
// ============================================================

// --- Basic Typed Functions ---
// Explicitly annotating parameter types and the return type is the
// minimum required to get meaningful type-checking.  If you omit the
// return type, TypeScript will infer it — but being explicit makes the
// contract obvious to readers and prevents accidental widening.
function add(a: number, b: number): number {
    return a + b;
}

// Arrow functions follow the same rule.  The return type annotation
// comes after the parameter list and before the fat-arrow body.
const multiply = (a: number, b: number): number => a * b;

// --- Optional & Default Parameters ---
// TypeScript distinguishes two ways to make a parameter non-mandatory:
//
//   default parameter  (greeting: string = "Hello")
//     - The caller may omit the argument OR pass `undefined`.
//     - Inside the function the value is ALWAYS a string — TypeScript
//       replaces `undefined` with the default, so the type is `string`,
//       not `string | undefined`.
//
//   optional parameter (title?: string)
//     - The trailing `?` means the caller may omit the argument.
//     - Inside the function the type is `string | undefined`, so you
//       MUST guard against `undefined` before using it (see the ternary
//       below).
//
// Rule of thumb: prefer default parameters when you have a sensible
// fallback; use optional parameters when the absence of the value
// carries meaning (e.g., "no title was provided").
//
// ORDERING RULE: optional/default parameters must come AFTER required
// ones, otherwise callers would have no way to skip them positionally.
function greet(name: string, greeting: string = "Hello", title?: string): string {
    const t = title ? `${title} ` : "";  // guard: title could be undefined
    return `${greeting}, ${t}${name}!`;
}
console.log(greet("Alice"));              // Hello, Alice!
console.log(greet("Bob", "Hi", "Dr."));  // Hi, Dr. Bob!

// --- Rest Parameters ---
// A rest parameter collects every remaining argument into a typed array.
// There can only be ONE rest parameter, and it must be the LAST parameter.
// The spread operator at the call site and the rest syntax here are
// two sides of the same coin: spread expands, rest collects.
function sum(...nums: number[]): number {
    return nums.reduce((acc, n) => acc + n, 0);
}
console.log(sum(1, 2, 3, 4)); // 10

// You can mix fixed parameters with a rest parameter.
// TypeScript enforces that all collected values match the rest type (string[]).
// Typed rest with spread
function logMessages(level: "info" | "error", ...messages: string[]): void {
    messages.forEach(msg => console.log(`[${level}] ${msg}`));
}

// --- Function Types ---
// You can name a function's shape using a type alias.
// This is useful when multiple functions share the same signature,
// or when you want to pass functions as arguments (callbacks/strategies).
type MathOp = (a: number, b: number) => number;
const divide: MathOp = (a, b) => a / b;
// TypeScript checks that `divide`'s parameter types and return type
// match `MathOp` exactly — parameter names don't have to match.

// Using interface for function type
// An interface with a "call signature" is equivalent to a type alias
// for a function.  Interfaces are preferred when you might want to
// extend the type later (e.g., add properties alongside the callable).
interface Transformer {
    (value: string): string;
}
const toUpper: Transformer = (s) => s.toUpperCase();

// --- Overloads ---
// Function overloading lets you advertise MULTIPLE distinct call shapes
// for the same function.  TypeScript uses these signatures purely for
// type-checking at the call site — they do NOT exist at runtime.
//
// How it works:
//   1. You write N "overload signatures" (no body).
//   2. Immediately after, you write ONE "implementation signature" (with body).
//      The implementation signature must be broad enough to handle every
//      overload — it is usually a union of the overload parameter types.
//   3. At RUNTIME only the implementation is compiled to JavaScript.
//      The overload signatures are erased completely.
//   4. At COMPILE TIME TypeScript checks each call against the overload
//      list (top to bottom) and picks the first matching signature.
//      Callers NEVER see the broad implementation signature — they only
//      see the overloads.
//
// Provide multiple signatures before the implementation signature
function formatInput(input: string): string;
function formatInput(input: number): string;
function formatInput(input: string[]): string[];
// Implementation signature — wider union type, hidden from callers.
// TypeScript will NOT let you call formatInput(true) even though
// `string | number | string[]` could theoretically be widened further.
function formatInput(input: string | number | string[]): string | string[] {
    if (Array.isArray(input)) return input.map(s => s.trim());
    if (typeof input === "number") return input.toFixed(2);
    return input.trim();
}

const r1 = formatInput("  hello  ");   // string  — matched overload 1
const r2 = formatInput(3.14159);       // string  — matched overload 2
const r3 = formatInput(["a ", " b"]); // string[] — matched overload 3

// --- Generic Functions ---
// Generics let you write functions that work with ANY type while still
// preserving type information end-to-end.  The type parameter <T> acts
// as a placeholder that TypeScript fills in at each call site, either
// from an explicit annotation (<string>) or via inference.
function identity<T>(value: T): T {
    return value;
    // If T is string, return type is string.
    // If T is number, return type is number.
    // The actual type travels through the function unchanged.
}
const strId = identity<string>("hello"); // explicit: T = string
const numId = identity(42);              // inferred: T = number

// Generics also work with array types.  T[] reads as "array of T".
// The return type T | undefined signals that the array might be empty.
function firstElement<T>(arr: T[]): T | undefined {
    return arr[0];
}

// Generic with constraint
// `K extends keyof T` is a GENERIC CONSTRAINT.
//
// What it does:
//   - `keyof T` produces a union of all property name literals of T
//     (e.g., for { name: string; age: number } it is "name" | "age").
//   - `K extends keyof T` restricts K so it must be one of those keys.
//     This is a constraint on what types are ACCEPTED, not on what type
//     is RETURNED — the return type T[K] (indexed access) resolves to
//     the actual property type at each call site.
//
// Benefit: TypeScript catches invalid key names at compile time, and
// the return type is automatically inferred as the exact property type
// (e.g., string for "name", number for "age") rather than a wide union.
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}
const user = { name: "Alice", age: 30 };
const userName = getProperty(user, "name"); // return type is string
// getProperty(user, "foo");                // Error: "foo" not in keyof user

// --- Higher-Order Functions ---
// A higher-order function either accepts functions as arguments, returns
// a function, or both.  `pipe` here accepts an arbitrary number of
// single-argument functions and composes them left-to-right into a
// single function that threads a value through each stage.
//
// The type parameter <T> binds the input and output type of every
// stage to the same type, ensuring the pipeline stays consistent.
function pipe<T>(...fns: Array<(val: T) => T>): (val: T) => T {
    return (val) => fns.reduce((acc, fn) => fn(acc), val);
}

const process = pipe<string>(
    (s) => s.trim(),
    (s) => s.toLowerCase(),
    (s) => s.replace(/\s+/g, "-"),
);
console.log(process("  Hello World  ")); // "hello-world"

// --- Currying ---
// Currying transforms a function that takes multiple arguments into a
// CHAIN of single-argument functions.  Each call in the chain partially
// applies one argument and returns a new function waiting for the next.
//
// Why is this useful?
//   - Partial application: you can "bake in" one argument early and
//     reuse the resulting specialized function many times without
//     repeating the fixed argument.
//   - Function composition: single-argument functions compose more
//     cleanly with tools like `pipe` above.
//   - Deferred execution: you can capture context (e.g., a DB connection
//     or a multiplier) at one point in time and apply it to data later.
//
// Here `curry` takes a binary function (a: A, b: B) => C and returns
// (a: A) => (b: B) => C.  The type parameters A, B, C are inferred from
// the function you pass in, so the curried version stays fully typed.
function curry<A, B, C>(fn: (a: A, b: B) => C): (a: A) => (b: B) => C {
    return (a) => (b) => fn(a, b);
}
const curriedAdd = curry((a: number, b: number) => a + b);
// `add5` is a specialized function: it already has 5 "baked in" as `a`.
// We can reuse add5 many times without passing 5 each time.
const add5 = curriedAdd(5);
console.log(add5(3)); // 8

// --- void vs never ---
// These two return types describe opposite ends of the "returns" spectrum.
//
// `void` means the function completes normally but produces no useful
// return value.  JavaScript implicitly returns `undefined` when there
// is no return statement; `void` is TypeScript's way of saying "don't
// try to use the return value".
function logMessage(msg: string): void {
    console.log(msg);
    // implicitly returns undefined
}

// `never` means the function NEVER returns control to its caller — not
// even as `undefined`.  There are exactly two ways this can happen:
//   1. The function always throws an exception (execution terminates).
//   2. The function contains an infinite loop (execution never ends).
//
// `never` is useful for exhaustive checks: if you have a switch over a
// union and assign the default case to `never`, TypeScript will error if
// you ever add a new union member without handling it.
function throwError(msg: string): never {
    throw new Error(msg);
    // never returns — never type
}

// An unconditional infinite loop also qualifies as `never` because
// control never leaves the function body via a normal return path.
function infiniteLoop(): never {
    while (true) { /* ... */ }
}

// --- Async Functions ---
// An async function always returns a Promise, so TypeScript wraps the
// declared return type in Promise<...> automatically.  Writing the
// explicit Promise<...> annotation tells readers (and the compiler)
// exactly what the resolved value will look like.
async function fetchData(url: string): Promise<{ data: unknown; status: number }> {
    const response = await fetch(url);
    const data = await response.json();
    return { data, status: response.status };
}

// Typed async with generics
// Combining async + generics lets the caller decide the resolved shape.
// The type assertion `as Promise<T>` bridges the untyped `res.json()`
// (which returns `any`) to the caller-supplied type T.
// CAUTION: this is a trust boundary — if the server returns a different
// shape, TypeScript won't catch it; you'd want a runtime validation
// library (e.g., Zod) for production code.
async function get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
}

// --- Function Guards (Type Predicates) ---
// A type predicate is a special return type annotation of the form
// `value is SomeType`.  It tells TypeScript: "if this function returns
// true, then inside the `if` block the argument has been narrowed to
// SomeType."  Without the predicate, TypeScript would only know the
// condition returned a boolean — it would NOT automatically narrow the
// type for you.
//
// Type predicates are a compile-time contract: you are promising the
// compiler that your runtime check is correct.  TypeScript trusts you,
// so make sure the implementation matches the predicate exactly.
function isString(value: unknown): value is string {
    return typeof value === "string";
}

// After `isString(value)` returns true, TypeScript narrows `value`
// from `unknown` to `string`, making `.toUpperCase()` safe to call.
function processValue(value: unknown): void {
    if (isString(value)) {
        console.log(value.toUpperCase()); // narrowed to string
    }
}

// --- Assertion Functions ---
// `asserts val is T` is a variant of type predicates used in ASSERTION
// functions — functions that throw on failure instead of returning false.
//
// Unlike a type-predicate guard (which narrows only inside an `if`
// block), an assertion narrows the type for ALL code that follows the
// call site, because if the assertion did not throw, the value must be
// non-null/non-undefined.
//
// The `T | null | undefined` parameter and the `T` predicate together
// strip null and undefined from the type in the caller's scope after
// the assertion succeeds.
function assertDefined<T>(val: T | null | undefined, msg: string): asserts val is T {
    if (val == null) throw new Error(msg);
}

let maybeString: string | null = "hello";
assertDefined(maybeString, "Expected a string");
// After assertDefined, TypeScript knows maybeString is `string` (not null).
// Calling .length is safe — no optional-chaining or non-null assertion needed.
console.log(maybeString.length); // safe after assertion

export {};
console.log("Functions demo complete");
