// ============================================================
// 09 - Advanced Types in TypeScript
//
// This file covers the deep end of TypeScript's type system:
//   A. Utility Types     — built-in type transformers
//   B. Conditional Types — type-level if/else with infer
//   C. Mapped Types      — iterate over keys, transform shapes
//   D. Template Literal  — compose string types at compile time
//   E. Variance          — how subtyping flows through generics
//   F. Branded Types     — nominal typing in a structural system
//   G. Variadic Tuples   — spread and slice tuple types (TS 4.0+)
// ============================================================

// ============================================================
// PART A — Utility Types (deep dive)
//
// TypeScript ships a standard library of generic "utility types"
// that transform existing types into new shapes.  They are all
// implemented with the same mapped-type and conditional-type
// primitives shown later in this file — studying them here
// first builds the vocabulary needed to understand the internals.
// ============================================================

interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: "admin" | "user" | "guest";
    createdAt: Date;
}

// Partial<T> — wraps every property in `?` (makes it optional).
// Classic use-case: PATCH / update payloads that only carry changed fields.
// Equivalent to: { [K in keyof T]?: T[K] }
type UpdateUserDTO = Partial<User>;

// Required<T> — strips every `?` modifier, making all fields mandatory.
// Composing Required<Partial<...>> is a no-op on the value level but
// explicitly documents "we started optional and need all fields now."
type FullUser = Required<Partial<User>>;

// Readonly<T> — adds `readonly` to every property.
// The compiler will reject any assignment after construction.
// Useful for config objects, Redux state, and frozen records.
type FrozenUser = Readonly<User>;

// Pick<T, K> — creates a new type containing only the listed keys.
// PublicUser is safe to serialize to an API response (no password).
// Credentials holds exactly the fields needed for a login form.
type PublicUser = Pick<User, "id" | "name" | "email" | "role">;
type Credentials = Pick<User, "email" | "password">;

// Omit<T, K> — the inverse of Pick: include everything EXCEPT K.
// Often cleaner than Pick when the exclusion list is shorter than
// the inclusion list.  Both types below prevent leaking sensitive data.
type UserWithoutPassword = Omit<User, "password">;
type UserWithoutSensitive = Omit<User, "password" | "createdAt">;

// Record<K, V> — constructs a type whose keys are K and values are V.
// Here K comes from the "role" union literal — TypeScript forces the
// object literal to cover every role, making exhaustiveness a compile error.
type RolePermissions = Record<User["role"], string[]>;
const permissions: RolePermissions = {
    admin: ["read", "write", "delete"],
    user: ["read", "write"],
    guest: ["read"],
};

// Exclude<T, U> / Extract<T, U> — filter union members.
//   Exclude removes members assignable to U.
//   Extract keeps  members assignable to U.
// Both operate at the type-union level, not on object properties.
type Roles = User["role"];
type NonGuestRole = Exclude<Roles, "guest">;    // "admin" | "user"
type AdminOnly = Extract<Roles, "admin">;        // "admin"

// NonNullable<T> — removes null and undefined from a union.
// Equivalent to Exclude<T, null | undefined>.
type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>;      // User

// ReturnType<T> — extracts the return type of a function type.
// Awaited<T> unwraps nested Promises (e.g., Promise<Promise<User>> → User).
// Combining them lets you derive the resolved value type without
// duplicating the interface name at the call site.
async function fetchUser(id: number): Promise<User> {
    return {} as User;
}
type FetchUserResult = Awaited<ReturnType<typeof fetchUser>>; // User

// Parameters<T> — extracts the parameter list as a tuple type.
// Useful for building higher-order wrappers (logging, memoization)
// that need to forward arguments with full type safety.
function createUser(name: string, email: string, role: Roles): User {
    return {} as User;
}
type CreateUserParams = Parameters<typeof createUser>; // [string, string, Roles]

// ConstructorParameters<T> — same idea but for class constructors.
// Lets you capture constructor signatures without duplicating them.
class EventEmitter {
    constructor(private maxListeners: number, private debug: boolean) {}
}
type EmitterArgs = ConstructorParameters<typeof EventEmitter>; // [number, boolean]

// ============================================================
// PART B — Conditional Types
//
// Syntax: T extends U ? A : B
//
// This is a type-level ternary operator.  Read it as:
//   "If type T is assignable to type U, resolve to A; otherwise B."
//
// Conditional types are evaluated lazily when T is concrete (known),
// and remain deferred when T is still a generic parameter.
// They become very powerful when combined with `infer` (see below).
// ============================================================

// Simple boolean flag — resolves immediately when T is concrete.
type IsString<T> = T extends string ? true : false;
type A = IsString<"hello">; // true
type B = IsString<42>;      // false

// -------------------------------------------------------
// Distributive conditional types — the surprising behavior
//
// When T is a naked generic type parameter (no wrapping brackets),
// TypeScript automatically DISTRIBUTES the conditional over each
// member of a union passed as T.
//
//   ToArray<string | number>
//   => (string extends unknown ? string[] : never)
//    | (number extends unknown ? number[] : never)
//   => string[] | number[]
//
// This is almost always the desired behavior, but it can catch you
// off guard when you expect a single result for the whole union.
// -------------------------------------------------------
type ToArray<T> = T extends unknown ? T[] : never;
type StrOrNumArray = ToArray<string | number>; // string[] | number[]

// -------------------------------------------------------
// Preventing distribution — wrap T in a tuple [T].
//
// When T is wrapped in brackets, it is no longer a "naked" parameter.
// TypeScript treats [string | number] as a single unit and checks:
//   [string | number] extends [unknown] ? (string | number)[] : never
//   => (string | number)[]   (a single array of the union)
//
// Use this when you need to reason about the entire union at once
// rather than splitting it into per-member branches.
// -------------------------------------------------------
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type StrOrNumBoth = ToArrayNonDist<string | number>; // (string | number)[]

// -------------------------------------------------------
// `infer` keyword — declare a type variable inside extends
//
// `infer R` tells TypeScript: "If the pattern matches, capture
// whatever type fills this slot into the variable R and make R
// available in the true branch."
//
// This is how you "reach inside" a generic wrapper to extract
// its inner type — no external knowledge of the generic's structure
// is needed.
// -------------------------------------------------------

// UnpackPromise: if T is a Promise<R>, return R; otherwise return T as-is.
type UnpackPromise<T> = T extends Promise<infer R> ? R : T;

// UnpackArray: if T is an array of Item, return Item.
type UnpackArray<T> = T extends (infer Item)[] ? Item : never;

// UnpackReturn: if T is a function returning R, return R.
// The ...args: unknown[] pattern matches any argument list.
type UnpackReturn<T> = T extends (...args: unknown[]) => infer R ? R : never;

type P = UnpackPromise<Promise<User>>;        // User
type I = UnpackArray<User[]>;                 // User
type R = UnpackReturn<typeof createUser>;     // User

// -------------------------------------------------------
// DeepPartial — recursive conditional + mapped type
//
// Built-in Partial<T> only goes one level deep.  DeepPartial
// recurses: for any object T, it maps every key K to
// DeepPartial<T[K]>, meaning nested objects are also made optional
// all the way down the tree.
//
// The base case `T` (the else branch) handles primitives and any
// non-object types — they are returned unchanged.
//
// TypeScript 4.1+ supports recursive type aliases, which makes
// this pattern possible without hitting infinite loops at definition
// time (evaluation is lazy and only resolves when a concrete type
// is substituted).
// -------------------------------------------------------
type DeepPartial<T> = T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

interface Config {
    server: { host: string; port: number };
    db: { url: string; poolSize: number };
}

const partialConfig: DeepPartial<Config> = {
    server: { port: 4000 }, // host omitted — allowed because DeepPartial makes it optional
};

// ============================================================
// PART C — Mapped Types
//
// Syntax: { [K in keyof T]: ... }
//
// Mapped types iterate over the keys of T and let you transform
// each value type independently.  You can also add or remove
// modifiers (readonly, ?) using + / - prefixes.
//
// The `as` clause (TS 4.1+) lets you REMAP (rename) keys while
// transforming — this enables powerful type transformations such
// as filtering out keys entirely (map to never) or renaming them
// with template literals.
// ============================================================

// Async<T> — wraps every method's return type in Promise<R>.
// Non-function properties are left unchanged (the else branch T[K]).
// The spread `...args: A` preserves the original parameter list exactly.
type Async<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R
        ? (...args: A) => Promise<R>
        : T[K];
};

// Flags<T> — build a boolean-flag object from a string union.
// Each member of the union becomes a key; all values are boolean.
// The constraint `T extends string` ensures only string literals are allowed.
type Flags<T extends string> = { [K in T]: boolean };
type FeatureFlags = Flags<"darkMode" | "betaFeature" | "newUI">;
const flags: FeatureFlags = { darkMode: true, betaFeature: false, newUI: true };

// KeysOfType<T, V> — extract only the keys of T whose value type extends V.
//
// How it works (two steps):
//   Step 1  { [K in keyof T]: T[K] extends V ? K : never }
//           Produces an object where matching keys hold their own name (K)
//           and non-matching keys hold `never`.
//           e.g., for User and V=string: { name: "name", email: "email",
//                                          password: "password", id: never, ... }
//   Step 2  [keyof T] at the end indexes into that object with ALL keys,
//           producing a union of all the values.  `never` is automatically
//           dropped from unions, leaving only the matching key names.
type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

type StringKeys = KeysOfType<User, string>; // "name" | "email" | "password"

// ============================================================
// PART D — Template Literal Types
//
// TypeScript can COMPOSE string types at compile time using the
// same backtick syntax as JavaScript template literals.
//
// The key insight: when a template literal contains a union, the
// result is the Cartesian product of all union members — TypeScript
// generates every possible combination as a new string-literal union.
//
//   type AB = `${"a" | "b"}${"1" | "2"}` => "a1" | "a2" | "b1" | "b2"
//
// This means TypeScript can validate string PATTERNS at compile time:
// incorrectly formatted route strings, CSS values, event names, etc.
// are caught before the code ever runs.
// ============================================================

// DOMHandler — prepend "on" and capitalize the event name.
// Capitalize<T> is a built-in intrinsic string utility type.
// The result covers every combination: "onClick" | "onKeydown" | "onMousemove"
type EventName = "click" | "keydown" | "mousemove";
type DOMHandler = `on${Capitalize<EventName>}`; // "onClick" | "onKeydown" | "onMousemove"

// CSSValue — validates that a CSS value is a number followed by a valid unit.
// Assigning "100xyz" would be a compile error, not a runtime surprise.
type CSSUnit = "px" | "em" | "rem" | "%";
type CSSValue = `${number}${CSSUnit}`;
const width: CSSValue = "100px";
const margin: CSSValue = "1.5rem";

// Endpoint — encodes the HTTP method and path prefix as a single string type.
// "PUT /api/orders" is valid; "PATCH /api/orders" or "GET api/orders" are errors.
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Route = `/api/${string}`;
type Endpoint = `${Method} ${Route}`;
const endpoint: Endpoint = "GET /api/users";

// Paths<T> — recursively generates all valid dot-notation key paths for T.
//
// How it works:
//   - For each key K of T, if T[K] is itself a Record (an object), recurse:
//     produce both the key alone ("server") and the key with every nested
//     sub-path ("server.host", "server.port").
//   - For leaf properties (non-object values) just produce the key ("name").
//   - The `K extends string` guard narrows K from string | number | symbol
//     to just string so it can be used inside the template literal.
//
// This is a practical example of combining recursive types with template
// literals to produce a type-safe "path string" for use in utilities like
// lodash.get or form libraries.
type Paths<T, K extends keyof T = keyof T> =
    K extends string
        ? T[K] extends Record<string, unknown>
            ? `${K}.${Paths<T[K]>}` | K
            : K
        : never;

interface NestedConfig {
    server: { host: string; port: number };
    database: { url: string };
    name: string;
}
type ConfigPaths = Paths<NestedConfig>; // "server" | "server.host" | "server.port" | ...

// ============================================================
// PART E — Variance & Covariance
//
// Variance describes how a generic type G<T> relates to G<U>
// when T and U are in a subtype relationship (T extends U).
//
// Understanding variance is essential for reasoning about
// function parameters, arrays, and generic containers.
// ============================================================

// COVARIANCE — a Producer<Dog> is assignable to Producer<Animal>
// because if you can produce a Dog, you can certainly produce an Animal.
// TypeScript function return types are covariant.
// (Subtype in  → Subtype out: the "positive" position.)
type Producer<T> = () => T;
// Producer<Dog> assignable to Producer<Animal> (if Dog extends Animal)

// CONTRAVARIANCE — a Consumer<Animal> is assignable to Consumer<Dog>
// because if you can handle any Animal, you can certainly handle a Dog.
// TypeScript function parameter types are contravariant.
// (Subtype in  → Supertype accepted: the "negative" position.)
type Consumer<T> = (val: T) => void;
// Consumer<Animal> assignable to Consumer<Dog>

// INVARIANCE — exact match required (mutable containers).
// An Array<Dog> is NOT safely assignable to Array<Animal> for writes,
// because someone holding Array<Animal> could push a Cat, corrupting
// the Array<Dog>.  TypeScript's strict mode enforces this for arrays
// and other mutable containers.
// Array<Dog> is NOT assignable to Array<Animal> in strict mode for writes

// ============================================================
// PART F — Type Guards & Branded Types
//
// THE PROBLEM — TypeScript uses STRUCTURAL typing: two types are
// compatible if they have the same shape, regardless of their names.
// This means `type UserId = number` and `type OrderId = number` are
// completely interchangeable — passing an OrderId where a UserId is
// expected is not a compile error, even though it is a logic bug.
//
// THE SOLUTION — "branded" (or "nominal") types.  Intersect the
// primitive with an object type that carries a unique phantom property
// (the "brand").  The brand is never present at runtime (no JS is
// emitted for it), but it makes the types structurally distinct at
// compile time so the compiler will reject accidental cross-assignment.
// ============================================================

// UserId and OrderId are both numbers at runtime, but structurally
// distinct types at compile time because their __brand tags differ.
type UserId = number & { readonly __brand: "UserId" };
type OrderId = number & { readonly __brand: "OrderId" };

// The `as` casts here are the only place where the brand is "attached".
// Wrapping them in factory functions makes the cast a single, audited
// boundary — callers never cast directly.
function makeUserId(id: number): UserId { return id as UserId; }
function makeOrderId(id: number): OrderId { return id as OrderId; }

// getUser only accepts UserId — passing a plain number or an OrderId
// is a compile error, catching category-confusion bugs at zero runtime cost.
function getUser(id: UserId): string { return `User #${id}`; }

const uid = makeUserId(1);
const oid = makeOrderId(1);
getUser(uid);
// getUser(oid); // Error: OrderId is not assignable to UserId — prevents bugs!

// Opaque / validated types via the same intersection pattern.
// Email is just a string at runtime, but the type system treats it as
// distinct from `string`.  The only way to create an Email is through
// parseEmail, which validates the format first — so any function
// accepting Email can trust it has already been validated.
type Email = string & { readonly _type: "Email" };
function parseEmail(raw: string): Email {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        throw new Error(`Invalid email: ${raw}`);
    }
    return raw as Email;
}

// ============================================================
// PART G — Variadic Tuple Types (TS 4.0+)
//
// TypeScript 4.0 introduced support for spread elements in tuple
// types, allowing tuples to be concatenated, sliced, and decomposed
// at the type level — mirroring what JavaScript's spread operator
// does at the value level.
//
// These are sometimes called "higher-kinded" or "variadic" tuples
// because generic parameters can represent entire tuple prefixes or
// suffixes, not just single elements.
// ============================================================

// Concat<T, U> — merge two tuple types into one.
// [...T, ...U] at the type level mirrors [...a, ...b] at runtime.
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];
type R1 = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]

// Tail<T> — drop the first element and return the rest of the tuple.
// `T extends [unknown, ...infer Rest]` matches any non-empty tuple;
// `infer Rest` captures everything after the first element.
type Tail<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : never;
type T1 = Tail<[string, number, boolean]>; // [number, boolean]

// Head<T> — extract only the first element of the tuple.
// `infer H` captures the first element; the rest (...unknown[]) is discarded.
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
type H1 = Head<[string, number]>; // string

// concatArrays — a typed runtime function whose return type is the
// exact merged tuple, not a loose array.  The variadic spread in the
// return type `[...T, ...U]` guarantees the element positions are
// tracked precisely, enabling typed destructuring at the call site.
function concatArrays<T extends unknown[], U extends unknown[]>(
    a: T,
    b: U,
): [...T, ...U] {
    return [...a, ...b];
}

export {};
console.log("Advanced Types demo complete");
