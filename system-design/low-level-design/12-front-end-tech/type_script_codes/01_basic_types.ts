// ============================================================
// 01 - Basic Types in TypeScript
// ============================================================
// This file demonstrates every fundamental type category in TypeScript.
// Understanding these types is the foundation for writing safe, self-documenting
// code. Each section explains not just WHAT the type is, but WHY it exists and
// WHEN you should reach for it over alternatives.
// ============================================================

// --- Primitive Types ---
// These are the three JavaScript primitive value types plus TypeScript's
// own awareness of them. TypeScript infers these automatically from assignments,
// but explicit annotations make intent clear to both the compiler and readers.
// Use explicit types on function signatures; let inference handle local variables.
let isDone: boolean = true;       // only true or false — no truthy coercion
let age: number = 30;             // TypeScript uses a single number type for both integers and floats
let price: number = 9.99;         // same number type — no separate int/float distinction
let username: string = "Alice";   // immutable character sequence
let greeting: string = `Hello, ${username}!`; // template literals are still type string

// --- Special Types ---
// TypeScript introduces several types that have no JavaScript equivalent at runtime.
// They exist purely to communicate intent to the compiler and to other developers
// reading the code. Choosing the right special type can prevent entire categories
// of runtime bugs — particularly around external data, missing values, and
// impossible code paths.

// unknown vs any:
// "unknown" is the type-safe counterpart to "any". Both accept any value, but
// "unknown" forces you to check (narrow) the type before you can use the value —
// the compiler will refuse operations on an unknown value without a preceding
// type guard. "any" disables type-checking entirely: you can call methods, access
// properties, and pass it anywhere with zero compiler complaints, which silently
// defeats the entire purpose of TypeScript. Prefer "unknown" whenever you are
// dealing with external data (API responses, JSON.parse results, third-party
// callbacks) — save "any" only as an absolute last resort escape hatch.
let notSure: unknown = 42;          // safer than any — must narrow before use
let anything: any = "flexible";    // disables type checking

// void:
// "void" signals "this function exists for its side effects, not its return value."
// It is subtly different from undefined: a function typed as returning "void" is
// explicitly promising it produces nothing meaningful, whereas "undefined" is an
// actual value that can be stored, compared, and passed. Callers of a void function
// should never rely on or capture the return value. As a variable type, void is
// almost never useful (only undefined satisfies it), so you will encounter it
// almost exclusively as a function return type annotation.
let nothing: void = undefined;     // for functions that return nothing

// never:
// "never" represents the type of values that can never exist. A function that
// always throws an exception never produces a return value — not even undefined —
// so TypeScript types it as never. Similarly, a function containing an infinite
// loop never returns control to the caller. The compiler also uses never during
// exhaustiveness checking: if you narrow a union type through every possible branch,
// the remaining type in the "impossible" else clause is never, giving you a
// compile-time guarantee that you handled every case. Never cannot be assigned to
// any other type, making it a powerful tool for documenting unreachable code.
let neverReturns: never;           // for functions that always throw or loop forever

// null and undefined:
// In strict mode (strictNullChecks: true), null and undefined are their own
// distinct types and cannot be assigned to string, number, etc. without an
// explicit union. This prevents the entire class of "cannot read property of null"
// runtime errors by forcing you to handle the missing-value case explicitly.
let nullable: null = null;
let undef: undefined = undefined;

// --- Arrays ---
// Both syntaxes below are equivalent. The shorthand T[] is more concise and
// common in practice. The generic form Array<T> can be clearer when the element
// type is itself complex (e.g., Array<Map<string, number[]>>). Neither allows
// elements of a different type without explicit casting — TypeScript enforces
// homogeneous element types at every push, assignment, and access site.
let numbers: number[] = [1, 2, 3];
let words: Array<string> = ["hello", "world"];

// --- Tuples (fixed-length array where each position has a specific type) ---
// A tuple is how TypeScript models a heterogeneous, fixed-length sequence. Unlike
// a plain array where every slot has the same type, each position in a tuple
// carries its own distinct type. This makes tuples ideal for function return pairs
// such as [value, error] (similar to Go's idiomatic error handling), coordinate
// pairs like [x, y], or any situation where position carries semantic meaning and
// you want the compiler to enforce the order. Swapping positions is a compile error,
// not a silent bug discovered at runtime.
let person: [string, number] = ["Alice", 30];
let [name, personAge] = person;  // destructuring — TypeScript knows name is string, personAge is number
console.log(name, personAge);   // Alice 30

// Named tuple elements (TS 4.0+):
// Adding labels to tuple positions (x: number, y: number) does not change the
// compiled output or runtime behavior — it purely improves IDE tooltips and
// error messages, making the intent of each position self-documenting.
let point: [x: number, y: number] = [10, 20];

// --- Enums ---
// Enums give a named, discrete set of values. They prevent magic numbers and
// magic strings from scattering through the codebase, and they make invalid states
// unrepresentable: a parameter typed Direction cannot accidentally receive 99.
// TypeScript supports three flavours: numeric (default), string, and const.
// Choose based on whether the runtime value needs to be meaningful to external
// systems (e.g., stored in a database or sent over a network).

// Numeric enum — values are auto-assigned integers starting at 0.
// The generated JavaScript object supports reverse mapping, so Direction[0] === "Up".
// Use when the numeric value is internal and unimportant to callers.
enum Direction {
    Up,     // 0
    Down,   // 1
    Left,   // 2
    Right,  // 3
}
let move: Direction = Direction.Up;
console.log(move);          // 0
console.log(Direction[0]);  // "Up"  — reverse mapping works because TS emits a two-way object

// String enum — each member carries an explicit string value.
// Prefer string enums when the value may be serialized (API payloads, log files,
// database columns) because "ACTIVE" is far more debuggable than 0. String enums
// do NOT support reverse mapping, which is usually fine since the string value
// is already self-descriptive.
enum Status {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
    Pending = "PENDING",
}
let currentStatus: Status = Status.Active;
console.log(currentStatus); // "ACTIVE"

// Const enum — inlined at compile time, so no runtime object is created.
// When TypeScript compiles a const enum, every usage site is replaced with the
// raw numeric (or string) literal — the enum object itself never appears in the
// output JavaScript. This is faster (no property lookup) and produces smaller
// bundles, but it comes with a trade-off: const enums cannot be used in code that
// is not compiled together with their declaration (e.g., across separately compiled
// packages or in .d.ts files consumed by non-TypeScript projects). Use const enum
// for performance-critical hot paths or large enums in tightly coupled modules.
const enum Color {
    Red,
    Green,
    Blue,
}
let bg: Color = Color.Green; // compiled output: let bg = 1; — no Color object exists at runtime

// --- Literal Types ---
// A literal type narrows a primitive type to a single specific value. Combining
// multiple literals with union (|) creates a type that acts like a compile-time
// enum but without generating any runtime object at all. Use literal types for
// discriminated unions, configuration flags, and any parameter that only makes
// sense for a small, fixed set of values. The compiler will catch typos ("lft"
// instead of "left") that a plain string type would silently accept.
let direction: "left" | "right" | "up" | "down" = "left";
let statusCode: 200 | 400 | 404 | 500 = 200;

// --- Type Aliases ---
// A type alias assigns a reusable name to any type expression — primitives,
// unions, intersections, objects, function signatures, etc. Aliases are purely
// a compile-time construct: they leave no trace in the emitted JavaScript.
// Use them to avoid repeating complex type expressions and to give meaningful
// names to concepts in your domain (e.g., "ID" communicates intent better than
// "string | number" repeated everywhere).
type ID = string | number;
let userId: ID = "user-123"; // string satisfies the union
let productId: ID = 99;      // number also satisfies the union

// --- Union Types ---
// A union type (A | B) means "this value is one of these types, but we do not
// know which one at this point." TypeScript will only let you use operations that
// are valid for ALL members of the union until you narrow the type with a type
// guard (typeof, instanceof, discriminant property, etc.). Narrowing inside an
// if/else block lets TypeScript prove which branch applies and unlocks the full
// API of that specific type — this is called control flow analysis.
function printId(id: number | string): void {
    if (typeof id === "string") {
        console.log(id.toUpperCase()); // narrowed to string — .toUpperCase() is safe here
    } else {
        console.log(id.toFixed(2));    // narrowed to number — .toFixed() is safe here
    }
}

// --- Intersection Types ---
// An intersection type (A & B) means "this value must satisfy ALL of these types
// simultaneously." It is the opposite of union: instead of "one of", it means
// "all of". Intersections are the idiomatic way to compose object types —
// combining reusable mixins like Timestamped and Named into a richer type without
// duplicating property declarations. If the intersected types have conflicting
// properties (e.g., both define name but as different types), the resulting
// property type is never, which signals a design error.
type Timestamped = { createdAt: Date };
type Named = { name: string };
type TimestampedNamed = Timestamped & Named; // entity must have BOTH createdAt AND name

const entity: TimestampedNamed = { name: "Alice", createdAt: new Date() };

// --- Object Type ---
// Inline object type annotations describe the exact shape of an object literal.
// The "?" after a property name marks it as optional — the compiler treats it as
// "string | undefined" internally. Prefer interface or type alias for shapes that
// are reused in multiple places; reserve inline object types for one-off
// local variables where naming the type adds no clarity.
let user: { name: string; age: number; email?: string } = {
    name: "Bob",
    age: 25,
    // email is omitted — valid because it is optional
};

// --- Type Assertions ---
// A type assertion (value as T) tells the compiler "treat this value as type T,
// even though you cannot prove it." This is a promise you make to TypeScript —
// the compiler accepts it and moves on without runtime verification. Type
// assertions are UNSAFE: if the actual runtime value does not match T, you will
// get cryptic runtime errors rather than a compile-time failure. Use assertions
// only when you have knowledge the compiler lacks — for example, when reading from
// a DOM API that returns a broad type (Element) but you know the concrete subtype
// (HTMLInputElement) from context. Never use assertions to silence legitimate
// type errors; fix the underlying type mismatch instead. The "as T" syntax works
// everywhere; the angle-bracket form (<T>value) is equivalent but cannot be used
// inside JSX files because the parser treats it as a JSX tag.
let someValue: unknown = "hello world";
let strLength: number = (someValue as string).length; // safe here: we just assigned a string literal above
// or: (<string>someValue).length  — not usable in JSX

// --- Non-null Assertion ---
// The postfix "!" operator is a special type assertion that removes null and
// undefined from a type. Like "as T", it is a promise to the compiler that carries
// no runtime check. It is appropriate when you are certain a value cannot be null
// at that point — for example, when getElementById is called with an id that you
// know exists in the HTML. Overusing "!" defeats the protection that
// strictNullChecks provides; prefer optional chaining (?.) or an explicit null
// check when there is any doubt.
function getElement(id: string): HTMLElement {
    return document.getElementById(id)!; // tells TS: "trust me, not null" — crashes at runtime if id is missing
}

// --- typeof / keyof ---
// "typeof" in a type position (not in a value/runtime position) extracts the
// TypeScript type of any value or variable. This is useful for deriving types from
// existing objects without repeating their shape manually — the type stays in sync
// with the object automatically when you add or rename properties.
// "keyof" produces a union of the string (or number) literal types of all public
// property names of a given type. Combining keyof with typeof lets you write
// generic utilities — such as safe property accessors — that are constrained to
// the actual keys of an object, preventing typo-induced runtime undefined.
type UserType = typeof user;    // inferred as: { name: string; age: number; email?: string }
type UserKeys = keyof typeof user; // inferred as: "name" | "age" | "email"

// --- satisfies operator (TS 4.9+) ---
// "satisfies" validates that an expression matches a type while preserving the
// most specific (narrowest) inferred type of the value. It differs from a plain
// type annotation: a type annotation widens the type to the annotation (you lose
// specific literal types), whereas "satisfies" keeps the narrow type and merely
// checks compatibility. Here, port is inferred as the literal 3000 (not the broad
// number), and host as "localhost" (not string), while the compiler still verifies
// every key/value pair fits Record<string, string | number>. This makes "satisfies"
// ideal for typed configuration objects where you want both safety and precision.
const config = {
    port: 3000,
    host: "localhost",
} satisfies Record<string, string | number>;

export {};
console.log("Basic Types demo complete");
