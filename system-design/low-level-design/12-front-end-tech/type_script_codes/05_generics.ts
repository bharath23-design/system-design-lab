// ============================================================
// 05 - Generics in TypeScript
// ============================================================
//
// WHY GENERICS?
// Without generics you either duplicate code for every type (bad) or
// accept `any` and lose type-safety entirely (worse).
// Generics let you write code ONCE that works correctly with MANY types.
// The angle-bracket parameter <T> is literally a "type parameter" — just
// like a function parameter (n: number) but at the type level.
// The caller decides what T is; the function just describes the
// relationship between inputs and outputs in terms of T.
//
//   wrap(42)      → TypeScript infers T = number → return type { value: number }
//   wrap("hello") → TypeScript infers T = string → return type { value: string }
//
// Zero runtime cost — generics are erased during compilation.
// ============================================================


// --- Generic Function ---
// <T> declares a type parameter. TypeScript infers T from the argument —
// you almost never need to write wrap<number>(42) explicitly.
function wrap<T>(value: T): { value: T } {
    return { value };
}
const wrapped = wrap(42);        // { value: number }
const wrappedStr = wrap("hi");   // { value: string }


// --- Generic with Multiple Type Params ---
// You can declare as many type parameters as you need, separated by commas.
// Here A and B are inferred from the two arguments independently —
// pair("name", 42) gives [string, number], preserving both types exactly.
function pair<A, B>(first: A, second: B): [A, B] {
    return [first, second];
}
const p = pair("name", 42); // [string, number]


// --- Generic Constraints ---
// "T extends { length: number }" is a CONSTRAINT, not an equality check.
// It says: "T must have AT LEAST a `length` property of type number."
// T does NOT have to be that exact shape — it can be a string, an array,
// a custom class with a length getter, or anything else that satisfies it.
// Think of it as a minimum requirement ("T must be a subtype of this").
// This is why getLength(42) fails — number has no .length at all.
function getLength<T extends { length: number }>(val: T): number {
    return val.length;
}
console.log(getLength("hello"));   // 5
console.log(getLength([1, 2, 3])); // 3
// getLength(42);  // Error: number has no .length


// Constraint with keyof
// "K extends keyof T" means K must be one of the property names of T.
// "T[K]" is an indexed access type — the type of property K on T.
// Together they let you write a type-safe property extractor:
// TypeScript knows the return type is exactly T[K][], not just any[].
// pluck(users, "name") → string[]   (T=User, K="name", T[K]=string)
// pluck(users, "age")  → number[]   (T=User, K="age",  T[K]=number)
// pluck(users, "xyz")  → compile error — "xyz" is not keyof User
function pluck<T, K extends keyof T>(objects: T[], key: K): T[K][] {
    return objects.map(obj => obj[key]);
}

const users = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
];
const names = pluck(users, "name"); // string[]
const ages = pluck(users, "age");   // number[]


// --- Generic Interface ---
// Interfaces can be parameterised too. Repository<T, ID> is a contract
// that works for any entity type T identified by any ID type.
// Concretely: Repository<User, number> or Repository<Post, string>.
// This pattern is common in data-access layers — define the shape once,
// implement it for each entity. The compiler enforces the contract.
interface Repository<T, ID> {
    findById(id: ID): T | undefined;
    findAll(): T[];
    save(entity: T): T;
    delete(id: ID): boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

// InMemoryUserRepo "locks in" T=User and ID=number.
// TypeScript now knows findById returns User|undefined (not just any),
// save accepts only a User (not an arbitrary object), etc.
class InMemoryUserRepo implements Repository<User, number> {
    private store = new Map<number, User>();

    findById(id: number): User | undefined {
        return this.store.get(id);
    }
    findAll(): User[] {
        return Array.from(this.store.values());
    }
    save(user: User): User {
        this.store.set(user.id, user);
        return user;
    }
    delete(id: number): boolean {
        return this.store.delete(id);
    }
}

const repo = new InMemoryUserRepo();
repo.save({ id: 1, name: "Alice", email: "alice@example.com" });
console.log(repo.findById(1));


// --- Generic Class ---
// The class itself is parameterised. Each instantiation (new Stack<number>(),
// new Stack<string>()) creates a distinct "version" of the class at the
// type level — but a single compiled implementation at the JS level.
// The type parameter T flows through every method:
//   push(item: T)       — only accepts the chosen type
//   pop(): T|undefined  — returns the chosen type, not any
// This is exactly how the built-in Array<T> works in TypeScript's lib.
class Stack<T> {
    private items: T[] = [];

    push(item: T): void {
        this.items.push(item);
    }
    pop(): T | undefined {
        return this.items.pop();
    }
    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }
    get size(): number {
        return this.items.length;
    }
    isEmpty(): boolean {
        return this.items.length === 0;
    }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
console.log(numStack.pop()); // 2


// --- Generic Utility Types (built-in) ---
// TypeScript ships with a library of generic "utility types" — type-level
// functions that transform an existing type T into a new type.
// These are defined using the same mapped-type and conditional-type
// machinery shown later in this file; they are not special compiler magic.

// Partial<T> — all props optional
// Useful for update payloads: you only send the fields you want to change.
type PartialUser = Partial<User>;
const draft: PartialUser = { name: "Bob" };

// Required<T> — all props required
// The opposite of Partial — strips every '?' modifier.
type RequiredUser = Required<PartialUser>;

// Readonly<T> — all props readonly
// Good for configuration objects or frozen state: prevents accidental mutation.
type FrozenUser = Readonly<User>;

// Record<K, V> — object type with keys K and values V
// Cleaner than writing { [key: string]: string[] } inline everywhere.
type RoleMap = Record<string, string[]>;
const roles: RoleMap = { admin: ["read", "write"], viewer: ["read"] };

// Pick<T, K> — subset of props
// Useful when an API endpoint or UI component only needs some fields of T.
type UserPreview = Pick<User, "id" | "name">;

// Omit<T, K> — all props except K
// Useful for "create" payloads where the server assigns the id itself.
type UserWithoutId = Omit<User, "id">;

// Exclude<T, U> — from union, remove U
// Works on union types (not object types). Removes members assignable to U.
type NumOrStr = string | number | boolean;
type OnlyStr = Exclude<NumOrStr, number | boolean>; // string

// Extract<T, U> — keep only U from union
// The complement of Exclude — keeps only members assignable to U.
type OnlyNum = Extract<NumOrStr, number | bigint>; // number

// NonNullable<T>
// Strips null and undefined — handy after an existence check when you
// want the type to reflect that the value is guaranteed to be present.
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>; // string

// ReturnType<F>
// Extracts the return type of a function type.
// Extremely useful when you don't control the function's source and can't
// import its return type directly — just derive it from the function itself.
function getUser() { return { id: 1, name: "Alice" }; }
type GetUserReturn = ReturnType<typeof getUser>; // { id: number; name: string }

// Parameters<F>
// Extracts the parameter types of a function as a tuple.
// Useful for wrapping or decorating functions while preserving their signature.
type AddParams = Parameters<typeof Math.max>; // number[]

// InstanceType<C>
// Extracts the instance type produced by a constructor.
// Useful when you have a class reference (not an instance) and need the type.
type StackInstance = InstanceType<typeof Stack>; // Stack<unknown>


// --- Conditional Types ---
// "T extends Condition ? TrueType : FalseType" is a TYPE-LEVEL IF STATEMENT.
// It does not run at runtime — it resolves during type-checking.
// TypeScript evaluates the condition and picks one branch or the other.
// When T is a union, TypeScript distributes the condition over each member:
//   IsArray<string[] | number> → IsArray<string[]> | IsArray<number>
//                              → "array" | "not array"
type IsArray<T> = T extends unknown[] ? "array" : "not array";
type A = IsArray<string[]>; // "array"
type B = IsArray<string>;   // "not array"


// infer — extract a type from a structural position
// "infer Item" tells TypeScript: "if this pattern matches, capture whatever
// type fills the Item slot and give me that captured type."
// It is like destructuring, but for types:
//   const [head, ...tail] = arr   ← runtime destructuring
//   T extends (infer Item)[] ? Item : T  ← type-level destructuring
//
// If T is string[], then (infer Item)[] matches with Item = string,
// so UnpackArray<string[]> resolves to string.
// If T does not match the pattern, the false branch returns T unchanged.
type UnpackArray<T> = T extends (infer Item)[] ? Item : T;
type Unpacked = UnpackArray<string[]>; // string
type NotUnpacked = UnpackArray<number>; // number

// Same idea applied to promises — infer the resolved value type.
// This is essentially how Awaited<T> is implemented in TypeScript's lib.
type UnpackPromise<T> = T extends Promise<infer R> ? R : T;
type PromiseResult = UnpackPromise<Promise<User>>; // User


// --- Mapped Types ---
// "{ [K in keyof T]: ... }" iterates over every property name in T
// and produces a new type where each property is transformed.
// Think of it as Array.map() but operating on the properties of a type
// instead of the elements of an array.
//
// The key K is available on the right-hand side as well, so you can
// access T[K] (the original value type for that key).

// Nullable<T> — every property can also be null
// e.g. NullableUser = { id: number|null; name: string|null; email: string|null }
type Nullable<T> = { [K in keyof T]: T[K] | null };
type NullableUser = Nullable<User>;

// Mutable<T> — strip the readonly modifier from every property
// The "-readonly" syntax is a modifier subtraction — it removes readonly
// from properties that have it, leaving others unchanged.
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Optional<T> — make every property optional (equivalent to Partial<T>)
// The "?" after K in keyof T adds the optional modifier to each property.
type Optional<T> = { [K in keyof T]?: T[K] };

// Remapping keys with "as" — rename each key during the mapping.
// "as `get${Capitalize<string & K>}`" transforms each key K into a getter
// name: "id" → "getId", "name" → "getName", "email" → "getEmail".
// "string & K" narrows K from `string|number|symbol` down to just string
// because Capitalize only works on string literals.
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string; getEmail: () => string }


// --- Template Literal Types ---
// String template syntax works at the type level too.
// TypeScript distributes over every member of a union automatically,
// so `on${Capitalize<EventName>}` expands to all three combinations.
type EventName = "click" | "focus" | "blur";
type HandlerName = `on${Capitalize<EventName>}`; // "onClick" | "onFocus" | "onBlur"

// Cross-product of two unions — every CRUD verb combined with every resource.
// This is far more maintainable than listing all 12 combinations manually.
type CRUD = "create" | "read" | "update" | "delete";
type Resource = "user" | "post" | "comment";
type Permission = `${CRUD}:${Resource}`; // "create:user" | "read:user" | ...


// --- Generic Default Types (TS 2.3+) ---
// "T = string" gives a default value for the type parameter — just like a
// default value for a function parameter.
// When is this useful?
//   In API wrappers or reusable containers where the most common case
//   is a specific type (e.g., string), but callers occasionally need
//   to override it for their use-case.
//   Rule of thumb: if 80%+ of usages would pass the same type, add a default.
//
// Box with no type argument → T defaults to string → Box<string>
// Box<number>               → T is explicitly number
interface Box<T = string> {
    value: T;
}
const strBox: Box = { value: "hello" };     // T defaults to string
const numBox: Box<number> = { value: 42 };


// --- Variance (advanced note, no extra code needed) ---
// Variance describes how generic types relate when their type arguments relate.
//
// COVARIANT (most types): if Cat extends Animal, then Box<Cat> is assignable
// to Box<Animal>. The "extends" direction is preserved.
//
// CONTRAVARIANT (function parameters): if Cat extends Animal, then a function
// that accepts Animal is assignable to a function that accepts Cat — the
// direction is REVERSED. Why? A function that can handle any Animal can
// certainly handle a Cat, but a function that only handles Cats cannot
// safely be called with an arbitrary Animal.
//   (animal: Animal) => void  is assignable to  (cat: Cat) => void
//   (cat: Cat) => void        is NOT assignable to  (animal: Animal) => void
//
// TypeScript's strict function-type checking (--strictFunctionTypes) enforces
// this. Return types are covariant; parameter types are contravariant.
// Understanding variance prevents subtle bugs when passing callbacks or
// composing higher-order functions.

export {};
console.log("Generics demo complete");
