// ============================================================
// 02 - Interfaces in TypeScript
// ============================================================
//
// INTERFACE vs TYPE ALIAS — the fundamental choice:
//
//   interface Foo { ... }       <-- preferred for object shapes and class contracts
//   type Bar = { ... }          <-- preferred for unions, primitives, tuples, computed types
//
// Rule of thumb:
//   - Use `interface` when you are describing the shape of an object or what a
//     class must implement. Interfaces support `extends` and declaration merging,
//     which makes them more composable and extensible.
//   - Use `type` when you need a union (string | number), a primitive alias
//     (type ID = string), a tuple ([string, number]), or a mapped/conditional type.
//     Type aliases cannot be re-opened (no declaration merging), which is actually
//     a safety feature in application code — accidental duplication is a compile error.
//
// Both produce identical JavaScript at runtime — the distinction is purely
// a TypeScript-level design choice.
// ============================================================

// --- Basic Interface ---
//
// An interface declares a structural contract: any value assigned to type `User`
// must have exactly these properties (plus any optional ones).
// TypeScript uses structural (duck) typing, so an object that "looks like" a User
// is a User — even if it was never explicitly declared as one.
interface User {
    id: number;
    name: string;
    email: string;

    // OPTIONAL PROPERTY (?):
    // Appending `?` means the property may be absent entirely (undefined).
    // Use optional properties when a field is genuinely not always present —
    // e.g., a user may not have provided their age.
    //
    // Trade-off:
    //   PRO  — callers do not have to supply the field; less boilerplate.
    //   CON  — every consumer must null-check before using the value, which
    //           pushes safety checks outward. Prefer required fields and a
    //           separate "creation DTO" (Partial<User>) when the omission is
    //           only relevant at construction time.
    age?: number;

    // READONLY (compile-time only):
    // `readonly` tells the TypeScript compiler to reject assignments after the
    // initial object literal. It is NOT enforced at runtime — plain JavaScript
    // has no equivalent concept. If you need genuine runtime immutability, use
    // Object.freeze() or a library like Immer.
    //
    // Use readonly for fields that should be set once and never changed, such as
    // database-assigned timestamps, entity IDs, or configuration values.
    readonly createdAt: Date; // cannot be reassigned after creation
}

const user: User = {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    createdAt: new Date(),
};
// user.createdAt = new Date(); // Error: readonly — TypeScript catches this at compile time
//                              // but at runtime the object is still mutable plain JS

// --- Function Property in Interface ---
//
// Interfaces can describe objects that carry methods.
// Two syntaxes exist and are nearly equivalent:
//
//   greet(name: string): string         -- method shorthand (supports overloading)
//   greetArrow: (name: string) => string -- property with function type (no overloading)
//
// The method shorthand is slightly more permissive with `this` typing.
// For most practical purposes the choice is stylistic — pick one and be consistent.
interface Greeter {
    greet(name: string): string;
    greetArrow: (name: string) => string; // equivalent arrow syntax
}

const greeter: Greeter = {
    greet(name) {
        return `Hello, ${name}!`;
    },
    greetArrow: (name) => `Hi, ${name}!`,
};

// --- Index Signatures (dynamic keys) ---
//
// An index signature lets you describe objects whose keys are not known at
// design time — for example, HTTP headers, environment variables, or a
// dictionary-style lookup table.
//
// DANGER — loss of autocomplete and type safety on specific keys:
// When you define [key: string]: string, TypeScript allows ANY string key,
// which means it cannot warn you about typos like "Authorisation" vs "Authorization".
// Named properties (e.g., "Content-Type") give no autocomplete either.
//
// Prefer a named interface for well-known keys and use index signatures only
// when the key set is genuinely open-ended (e.g., parsed query-string params).
interface StringMap {
    [key: string]: string;
}
const headers: StringMap = {
    "Content-Type": "application/json",
    Authorization: "Bearer token",
};

// Numeric index signatures model array-like objects.
// A specific named property (length) can coexist with the index signature,
// but its type must be assignable to the index signature's value type (string here).
interface NumberedList {
    [index: number]: string;
    length: number; // specific property can coexist
}

// --- Extending Interfaces ---
//
// WHY `extends` IS PREFERRED OVER INTERSECTION (`&`) FOR INTERFACES:
//
// You can combine interfaces in two ways:
//
//   interface Dog extends Animal { ... }          // interface inheritance
//   type Dog = Animal & { breed: string }         // intersection type
//
// Both produce the same structural shape, but `extends` is better because:
//   1. ERROR MESSAGES: When a class fails to implement the contract,
//      TypeScript points to the specific missing member by name.
//      With `&`, errors often surface as an unreadable merged type diff.
//   2. CONFLICT DETECTION: If two interfaces being extended define the same
//      property with incompatible types, `extends` raises an error immediately.
//      Intersection types silently resolve the conflict to `never`, hiding the bug.
//   3. READABILITY: `extends` communicates intent ("Dog IS-A Animal") whereas
//      `&` communicates composition ("merge these structures").
//
// Use `&` for type aliases when you need to intersect types that are not
// interfaces (e.g., a type union with an object shape).
interface Animal {
    name: string;
    sound(): string;
}

interface Dog extends Animal {
    breed: string;
    fetch(): void;
}

// An interface can extend multiple interfaces, inheriting all their members.
// TypeScript will error if any inherited property types conflict.
interface ServiceDog extends Dog, User {
    serviceType: string;
}

const myDog: Dog = {
    name: "Rex",
    breed: "Labrador",
    sound() { return "Woof"; },
    fetch() { console.log("Fetching!"); },
};

// --- Interface vs Type Alias (recap with examples) ---
//
// Interfaces can be re-declared in the same scope — TypeScript MERGES them.
// (See Declaration Merging section below.)
// Type aliases cannot be re-declared; a second `type Window = ...` is a compile error.
//
// Summary table:
//   Feature                | interface | type alias
//   -----------------------|-----------|------------
//   Object/class shape     | YES       | YES
//   Union types            | NO        | YES
//   Tuple types            | NO        | YES
//   Declaration merging    | YES       | NO
//   extends keyword        | YES       | NO (use &)
//   implements in class    | YES       | YES (if object shape)
//   Computed/mapped types  | NO        | YES

// --- Declaration Merging ---
//
// TypeScript-specific feature: if you declare an interface with the same name
// twice in the same scope (or across multiple files), TypeScript MERGES the
// declarations into one combined interface.
//
// This is intentional and useful for augmenting third-party types — for example,
// adding a custom property to the browser's `Window` or Express's `Request`.
//
// SURPRISE FACTOR: When consuming a library, your interface with the same name
// can silently add properties to the library's type. This is called "module
// augmentation" and must be done inside a `declare module '...' {}` block to
// be explicit. Accidental merging within your own code can mask missing field
// errors, so keep interface names unique in application code.
interface Window {
    title: string;
}
interface Window {
    myCustomProp: number;
}
// Window now has both title AND myCustomProp — TypeScript merged both declarations.

// --- Implementing Interfaces in Classes ---
//
// `implements` forces a class to satisfy an interface's contract.
// The compiler errors immediately if any method or property is missing,
// giving you a clear, member-by-member error list.
//
// A class can implement multiple interfaces, achieving a form of multiple
// inheritance for types (not implementation) — the class must provide
// ALL members declared across ALL interfaces.
interface Serializable {
    serialize(): string;
    deserialize(data: string): void;
}

interface Identifiable {
    id: string;
}

class UserRecord implements Serializable, Identifiable {
    id: string;
    private name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    serialize(): string {
        return JSON.stringify({ id: this.id, name: this.name });
    }

    deserialize(data: string): void {
        const parsed = JSON.parse(data);
        this.id = parsed.id;
        this.name = parsed.name;
    }
}

// --- Callable Interface ---
//
// An interface with a call signature `(args): returnType` describes a function.
// You can also add properties to the interface, modelling a function that carries
// extra state (common in older JavaScript APIs such as jQuery or express middleware).
interface StringFormatter {
    (value: string): string;
    prefix: string;
}

// --- Hybrid Interface (function + object) ---
//
// A hybrid interface combines a call signature with named properties and methods.
// This models JavaScript patterns where a function is also used as a namespace
// (e.g., moment(), moment.now(), moment.locale(...)  in the moment.js library).
//
// In modern code, a class or a plain object is usually clearer — but hybrid
// interfaces are invaluable when typing existing JavaScript libraries.
interface Counter {
    (start: number): string;
    interval: number;
    reset(): void;
}

function getCounter(): Counter {
    // Cast to Counter first so we can add properties to the function object.
    const counter = ((start: number) => `Starting at ${start}`) as Counter;
    counter.interval = 123;
    counter.reset = () => console.log("Reset");
    return counter;
}

// --- Readonly Interface ---
//
// Marking every property `readonly` communicates that this object should not
// change after construction — ideal for configuration, constants, or value objects.
//
// REMINDER: This is a compile-time guarantee only.
// At runtime the object is a regular mutable JavaScript object.
// To enforce immutability at runtime call Object.freeze(config) after creation.
interface Config {
    readonly apiUrl: string;
    readonly timeout: number;
}
const config: Config = { apiUrl: "https://api.example.com", timeout: 5000 };
// config.apiUrl = "..."; // Error: TypeScript blocks this assignment at compile time

// --- ReadonlyArray equivalent via interface ---
//
// Combining `readonly` with an index signature prevents individual elements
// from being replaced via indexing (arr[0] = "x" is an error).
// Note: methods like push/pop are still allowed unless you use ReadonlyArray<string>
// built-in or mark the whole interface as having no mutating methods.
interface ReadonlyStringArray {
    readonly [index: number]: string;
}

// --- Utility Types: Partial, Required, Pick, Omit, Record ---
//
// TypeScript ships with built-in mapped types (utility types) that derive new
// types from an existing interface without re-writing the properties manually.
// They solve the problem of needing slightly different shapes of the same data
// in different contexts (creation form vs. API response vs. display card).
interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    category: string;
}

// PARTIAL<T> — PROBLEM SOLVED: "I want to update only SOME fields, not all."
// Makes every property of T optional. Perfect for PATCH endpoints or update DTOs
// where the caller provides only the fields they want to change.
type PartialProduct = Partial<Product>;          // all fields optional

// REQUIRED<T> — PROBLEM SOLVED: "I received a Partial but now need every field present."
// The inverse of Partial — removes `?` from every property, making them all required.
// Useful when you've merged defaults and want TypeScript to confirm completeness.
type RequiredProduct = Required<PartialProduct>; // all fields required

// PICK<T, Keys> — PROBLEM SOLVED: "I only need a FEW fields from a large interface."
// Creates a new type containing only the listed property names.
// Use for projection types — e.g., a list view that shows only id, name, price
// while keeping the full Product interface for the detail view.
type ProductPreview = Pick<Product, "id" | "name" | "price">;

// OMIT<T, Keys> — PROBLEM SOLVED: "I need ALL fields EXCEPT a few."
// The complement of Pick — creates a type with the listed keys removed.
// Common use: a "create" DTO that omits server-assigned fields like `id`.
// Prefer Omit over duplicating the interface without those fields.
type ProductWithoutId = Omit<Product, "id">;

// RECORD<Keys, Value> — PROBLEM SOLVED: "I need a map/dictionary with typed keys AND values."
// Creates an object type where every key in Keys maps to the same Value type.
// Safer than an index signature because Keys can be a string literal union,
// so TypeScript ensures every key in the union is present.
// Example: Record<"success" | "error" | "pending", string> enforces all three keys.

const preview: ProductPreview = { id: 1, name: "Laptop", price: 999 };

export {};
console.log("Interfaces demo complete");
