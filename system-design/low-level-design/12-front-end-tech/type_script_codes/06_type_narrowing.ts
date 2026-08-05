// ============================================================
// 06 - Type Narrowing in TypeScript
// ============================================================
//
// "Type narrowing" means taking a WIDE union type (e.g. string | number | boolean)
// and PROVING to the TypeScript compiler — through conditional checks — that inside
// a specific branch the value can only be ONE of those members.
//
// TypeScript uses "Control Flow Analysis" (CFA): it tracks every conditional, early
// return, and throw, updating its knowledge of a variable's type at each program
// point.  You never cast; you just give TypeScript enough evidence to figure it out.
//
// The sections below cover the main narrowing techniques in order of complexity.
// ============================================================


// ============================================================
// --- typeof Narrowing ---
// ============================================================
//
// WHY NARROWING IS NEEDED:
//   TypeScript starts with the union type `string | number | boolean` for `input`.
//   Without a check, calling `.toUpperCase()` would be an error because `number`
//   and `boolean` don't have that method.
//
//   Each `typeof` check PROVES to TypeScript which branch you're in:
//     - After `typeof input === "string"`, TypeScript KNOWS input is a string.
//     - After `typeof input === "number"`, TypeScript KNOWS input is a number.
//     - In the final `else`, the only remaining type is `boolean`, so TypeScript
//       narrows `input` to `boolean` automatically — no check needed.
//
// WHEN TO USE typeof:
//   typeof works for the seven JavaScript primitives:
//   "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "function"
//   It does NOT distinguish class instances (typeof returns "object" for all of them).
//   For classes, use `instanceof` instead (see below).
function processInput(input: string | number | boolean): string {
    if (typeof input === "string") {
        return input.toUpperCase();            // narrowed: string
    } else if (typeof input === "number") {
        return input.toFixed(2);               // narrowed: number
    } else {
        return input ? "true" : "false";       // narrowed: boolean
    }
}


// ============================================================
// --- Truthiness Narrowing ---
// ============================================================
//
// JavaScript has a short list of FALSY values:
//   false, 0, -0, 0n, "" (empty string), null, undefined, NaN
//
// All other values are truthy, including empty arrays [] and empty objects {}.
//
// IMPLICATION FOR NARROWING:
//   When the union is `string | null | undefined`, wrapping the body in `if (val)`
//   filters out both `null` and `undefined` in one shot because both are falsy.
//   TypeScript recognises this and narrows `val` to `string` inside the `if` block.
//
// PITFALL — empty string is also falsy:
//   If `val` could be "" and you want to distinguish "" from null/undefined, do NOT
//   use a bare truthiness check.  Instead use `val != null` (loose inequality),
//   which only excludes null and undefined and keeps "".
function printLength(val: string | null | undefined): void {
    if (val) {
        console.log(val.length); // null and undefined are falsy — narrowed to string
    } else {
        console.log("no value");
    }
}


// ============================================================
// --- Equality Narrowing ---
// ============================================================
//
// When two values of different union types are compared with strict equality (===),
// TypeScript intersects their possible types to find what they MUST share.
//
// Here: `a` can be string | number, and `b` can be string | boolean.
// The ONLY type common to both unions is `string`.
// So if `a === b` is true, TypeScript narrows BOTH `a` and `b` to `string`.
function compare(a: string | number, b: string | boolean): void {
    if (a === b) {
        // Both must be string (the only overlapping type)
        console.log(a.toUpperCase());
    }
}


// ============================================================
// --- in Operator Narrowing ---
// ============================================================
//
// The `in` operator checks whether an object has a named property.
// TypeScript uses this to narrow unions of object shapes — a technique
// called "duck typing": if it has a `meow` method, it must be a Cat.
//
// WHY `in` INSTEAD OF typeof:
//   Both Cat and Dog would return "object" from typeof — that doesn't help.
//   `"meow" in animal` asks "does this object have a `meow` property?" which
//   is enough for TypeScript to narrow the type to Cat inside that branch,
//   and to Dog in the else branch (since Dog is the only remaining possibility).
//
// REQUIREMENT: The property must exist on exactly ONE side of the union
//   (or must have incompatible shapes) so TypeScript can distinguish them.
interface Cat { meow(): void }
interface Dog { bark(): void }

function makeNoise(animal: Cat | Dog): void {
    if ("meow" in animal) {
        animal.meow(); // narrowed: Cat
    } else {
        animal.bark(); // narrowed: Dog
    }
}


// ============================================================
// --- instanceof Narrowing ---
// ============================================================
//
// TYPEOF VS INSTANCEOF:
//   `typeof` works only for primitives (string, number, boolean, …).
//   `instanceof` works for CLASS INSTANCES — it checks the prototype chain.
//   `val instanceof Foo` is true when `Foo.prototype` appears anywhere in
//   the prototype chain of `val`.
//
// ORDER MATTERS when using instanceof with inheritance:
//   ApiError extends Error, so every ApiError is also an Error.
//   We check `instanceof ApiError` FIRST (more specific) so that the
//   statusCode field is available.  If we checked `instanceof Error` first,
//   ApiErrors would match the broader branch and we'd lose statusCode.
//
// THE `unknown` TYPE:
//   `unknown` forces you to narrow before use — it is the safe alternative
//   to `any`.  Using instanceof is a common way to narrow `unknown` errors
//   that come out of try/catch blocks.
class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

function handleError(err: unknown): string {
    if (err instanceof ApiError) {
        return `API Error ${err.statusCode}: ${err.message}`;
    }
    if (err instanceof Error) {
        return `Error: ${err.message}`;
    }
    return `Unknown error: ${String(err)}`;
}


// ============================================================
// --- Discriminated Unions ---
// ============================================================
//
// A discriminated union is a union of object types where EACH member has a
// shared field (the "discriminant") whose TYPE is a UNIQUE LITERAL.
//
// Here the `kind` field is the discriminant:
//   Circle  => kind: "circle"   (literal type, not just string)
//   Square  => kind: "square"
//   Triangle=> kind: "triangle"
//
// HOW IT WORKS:
//   When TypeScript sees `shape.kind === "circle"` in a switch/if, it narrows
//   `shape` to `Circle` because "circle" is a literal that only exists on Circle.
//   The literal type field acts as a discriminator — TypeScript can exhaust all
//   cases and verify at compile time that every union member is handled.
//
// BENEFIT OVER `in` NARROWING:
//   You don't need to know which unique property belongs to which type.
//   A single `kind` field is enough to distinguish every variant.
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Triangle = { kind: "triangle"; base: number; height: number };
type Shape = Circle | Square | Triangle;

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "square":
            return shape.side ** 2;
        case "triangle":
            return 0.5 * shape.base * shape.height;
    }
}

// ============================================================
// Exhaustiveness check with never
// ============================================================
//
// `never` is the BOTTOM TYPE — it represents a value that can never exist.
// TypeScript assigns the type `never` to a variable when every union member
// has already been handled and there is nothing left.
//
// EXHAUSTIVE CHECK PATTERN:
//   In the `default` branch of a discriminated-union switch, we pass `shape`
//   to `assertNever`.  `assertNever` only accepts `never`.
//   If you add a new union member (e.g. `type Pentagon = { kind: "pentagon"; … }`)
//   and forget to add a case for it, TypeScript will error here because `shape`
//   in the default branch would be `Pentagon` (not `never`).
//
// This turns a runtime bug ("Unexpected value" at runtime) into a compile-time
// error ("Argument of type 'Pentagon' is not assignable to parameter of type
// 'never'"), catching the omission before the code ever runs.
function assertNever(x: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

function describeShape(shape: Shape): string {
    switch (shape.kind) {
        case "circle": return `Circle with radius ${shape.radius}`;
        case "square": return `Square with side ${shape.side}`;
        case "triangle": return `Triangle ${shape.base}x${shape.height}`;
        default: return assertNever(shape); // TS errors if a case is missing
    }
}


// ============================================================
// --- Type Predicates (User-Defined Guards) ---
// ============================================================
//
// Sometimes narrowing logic is too complex for a simple typeof / instanceof
// check to capture.  TypeScript lets you write a FUNCTION that performs the
// check and annotates its return type as `paramName is Type`.
//
// THE `animal is Fish` RETURN TYPE:
//   This is a "type predicate".  It is a user-defined type guard — it tells
//   TypeScript: "if this function returns true, narrow the argument to Fish
//   in the calling scope."
//
// WITHOUT the predicate, `isFish` would return `boolean`, and TypeScript would
// NOT narrow `animal` inside the `if (isFish(animal))` block.  With the
// predicate annotation, TypeScript trusts the function's verdict and narrows.
//
// RESPONSIBILITY:
//   TypeScript does NOT verify that your predicate is correct — the type safety
//   here is only as good as the runtime check you write.  A wrong check silently
//   misleads the type system, so keep predicates simple and well-tested.
interface Fish { swim(): void }
interface Bird { fly(): void }

function isFish(animal: Fish | Bird): animal is Fish {
    return (animal as Fish).swim !== undefined;
}

function move(animal: Fish | Bird): void {
    if (isFish(animal)) {
        animal.swim(); // Fish
    } else {
        animal.fly(); // Bird
    }
}


// ============================================================
// --- Assertion Functions ---
// ============================================================
//
// `asserts val is T` is the IMPERATIVE sibling of type predicates.
// Instead of returning a boolean, an assertion function either:
//   (a) throws an error if the condition is NOT met, or
//   (b) returns void (implicitly narrowing the type for all subsequent code).
//
// After `assertIsString(val)` in the calling code, TypeScript narrows `val`
// to `string` for the rest of that scope — no `if` block needed.
//
// `assertDefined` is a generic guard that removes `null | undefined` from T.
// After `assertDefined(val)`, `val` is narrowed from `T | null | undefined` to `T`.
function assertIsString(val: unknown): asserts val is string {
    if (typeof val !== "string") {
        throw new TypeError(`Expected string, got ${typeof val}`);
    }
}

function assertDefined<T>(val: T | null | undefined): asserts val is T {
    if (val == null) throw new Error("Value is null or undefined");
}


// ============================================================
// --- Optional Chaining + Nullish Coalescing ---
// ============================================================
//
// These two operators handle nullable paths without verbose if-chains.
//
// OPTIONAL CHAINING `?.`:
//   Short-circuits to `undefined` the moment any link in the chain is
//   null or undefined, rather than throwing "Cannot read property of null".
//   TypeScript narrows each step — it knows `address` is only accessed when
//   `user` is defined, and `city` only when `address` is defined.
//
// NULLISH COALESCING `??`:
//   Returns the right-hand side only when the left-hand side is null or
//   undefined (NOT when it's 0, false, or "").  This is more precise than
//   `||` which would also replace falsy strings like "".
interface Profile {
    user?: {
        address?: {
            city?: string;
        };
    };
}

function getCity(profile: Profile): string {
    return profile.user?.address?.city ?? "Unknown City";
}


// ============================================================
// --- Union Reduction Patterns ---
// ============================================================
//
// A "Result" type (common in functional programming, also called Either) is a
// discriminated union with `success` as the discriminant (a boolean literal).
//
//   { success: true;  data: T }     — the happy path
//   { success: false; error: string } — the error path
//
// This forces callers to explicitly handle both outcomes.  It is an alternative
// to throwing exceptions: errors become values, making them impossible to ignore.
//
// Inside `handleResult`, the `if (result.success)` check narrows `result`:
//   - In the true branch:  result is `{ success: true;  data: T }`  → `data` is available
//   - In the false branch: result is `{ success: false; error: string }` → `error` is available
// TypeScript would complain if you tried to access `result.data` in the false branch.
type Result<T> =
    | { success: true; data: T }
    | { success: false; error: string };

function parseNumber(input: string): Result<number> {
    const n = Number(input);
    if (isNaN(n)) return { success: false, error: `"${input}" is not a number` };
    return { success: true, data: n };
}

function handleResult<T>(result: Result<T>): void {
    if (result.success) {
        console.log("Data:", result.data); // T
    } else {
        console.error("Error:", result.error); // string
    }
}

handleResult(parseNumber("42"));
handleResult(parseNumber("abc"));


// ============================================================
// --- Unknown vs Any Narrowing ---
// ============================================================
//
// `any`    — opts OUT of type checking entirely.  Any operation is allowed.
// `unknown` — the type-safe alternative.  You MUST narrow before use.
//
// TypeScript refuses to let you call methods or access properties on `unknown`
// without first proving what it is.  This enforces defensive coding.
//
// Narrowing strategies for `unknown`:
//   1. typeof check          — for primitives (string, number, …)
//   2. Array.isArray(val)    — for arrays (typeof would just say "object")
//   3. val !== null && typeof val === "object"
//                            — for plain objects (excluding null, which is
//                              also "object" in typeof — a historic JS quirk)
function processUnknown(val: unknown): void {
    // Must narrow unknown before using
    if (typeof val === "string") {
        console.log(val.length); // ok
    } else if (Array.isArray(val)) {
        console.log(val.length); // ok
    } else if (val !== null && typeof val === "object") {
        console.log(Object.keys(val));
    }
}


// ============================================================
// --- Control Flow Analysis ---
// ============================================================
//
// TypeScript's CFA engine tracks the type of a variable at every POINT in the
// code — not just once per function.  Early returns and throws "cut off" types
// for the lines that follow.
//
// STEP-BY-STEP narrowing below:
//   Entry:      x is `string | number | null`
//   After null check + return: x is narrowed to `string | number`
//     (null has been eliminated because we returned in that branch)
//   After typeof "string" check + return: x is narrowed to `number`
//     (string has been eliminated because we returned in that branch)
//   Final line:  x is `number` — .toString() is valid
//
// This "progressive elimination" pattern avoids deeply nested if/else trees
// and keeps each code section focused on a single type.
function example(x: string | number | null): string {
    if (x === null) {
        return "null";
    }
    // x: string | number here
    if (typeof x === "string") {
        return x;
    }
    // x: number here
    return x.toString();
}

export {};
console.log("Type Narrowing demo complete");
