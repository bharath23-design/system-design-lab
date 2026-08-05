// ============================================================
// 04 - Classes in TypeScript
// ============================================================
//
// TypeScript classes are a structural layer on top of JavaScript's
// prototype-based class system (ES2015+). TypeScript adds:
//   - Access modifiers (public / private / protected)  — compile-time only
//   - readonly fields, abstract classes, interface contracts
//   - Constructor parameter shorthand (declare + assign in one step)
//   - Type-checked static members, getters/setters, and mixins
//
// IMPORTANT MENTAL MODEL:
//   TypeScript types and access modifiers are ERASED at compile time.
//   The emitted JavaScript has no notion of "private" or "protected".
//   If you need privacy that survives at runtime (e.g. in plain JS or
//   DevTools), use the ES2022 # syntax (shown in the BankAccount section).

// --- Basic Class ---
class Animal {
    // ── Access Modifiers (compile-time enforcement only) ──────────────
    //
    // public  (default) — accessible from anywhere.
    // private           — accessible ONLY inside this class body.
    //                     TypeScript will refuse to compile cross-class access,
    //                     but the emitted JS exposes it as a normal property.
    //                     Subclasses CANNOT access private members either.
    // protected         — accessible inside this class AND in subclasses,
    //                     but NOT from outside instances.
    // readonly          — can only be assigned once (in the constructor or at
    //                     declaration); prevents later mutation.
    //
    // Rule of thumb: prefer private for implementation details, protected for
    // things subclasses legitimately need, and public for the outward API.

    name: string;           // public (implicit) — readable and writable by anyone
    private age: number;    // private — only Animal's own methods can touch this
    protected species: string; // protected — Animal + its subclasses can read/write
    readonly id: string;    // readonly — set once in the constructor, never again

    constructor(name: string, age: number, species: string) {
        this.name = name;
        this.age = age;
        this.species = species;
        // Math.random gives each instance a unique ID; readonly prevents
        // accidental overwrite after construction.
        this.id = Math.random().toString(36).slice(2);
    }

    // Regular instance method — has access to all class members including
    // private and protected ones because it lives inside the class body.
    describe(): string {
        return `${this.name} is a ${this.species}, age ${this.age}`;
    }

    // ── Getter / Setter ───────────────────────────────────────────────
    // Getters and setters let you intercept property access/assignment.
    // Here we expose `age` (private) through a validated setter so callers
    // cannot set an invalid value, while still allowing controlled reads.
    // External callers use `animal.animalAge` like a normal property.
    get animalAge(): number {
        return this.age;
    }
    set animalAge(val: number) {
        if (val < 0) throw new Error("Age cannot be negative");
        this.age = val;
    }
}

const dog = new Animal("Rex", 3, "Dog");
console.log(dog.describe());
dog.animalAge = 4;  // invokes the setter — validated before assignment
// dog.age;  // Error: private — TypeScript blocks access at compile time
             // (but note: at runtime in plain JS the property is still there)

// --- Shorthand Constructor Parameters ---
// Instead of declaring a field, then accepting a constructor arg, then writing
// `this.x = x`, TypeScript lets you combine all three steps by adding an
// access modifier directly to the constructor parameter.
//
//   constructor(public x: number)
//   is exactly equivalent to:
//   x: number;
//   constructor(x: number) { this.x = x; }
//
// This is purely syntactic sugar — the emitted JS is identical either way.
// It is the most common TypeScript idiom for small value-object classes.
class Point {
    constructor(
        public x: number,                   // declares field x AND assigns it
        public y: number,                   // declares field y AND assigns it
        private label: string = "Point",    // declares private label with a default value
    ) {}
    // The constructor body is empty — all work is done by the parameter shorthand.

    toString(): string {
        return `${this.label}(${this.x}, ${this.y})`;
    }

    distanceTo(other: Point): number {
        // other.x and other.y are accessible here even though they are public —
        // they are also accessible because TypeScript structural typing allows
        // accessing any public member of a compatible type.
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }
}

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
console.log(p1.distanceTo(p2)); // 5

// --- Inheritance ---
// `extends` wires up the prototype chain so Dog inherits all of Animal's
// public and protected members. Private members are inherited by the prototype
// chain but are inaccessible in Dog's code — only Animal's own methods can use them.
class Dog extends Animal {
    breed: string;

    constructor(name: string, age: number, breed: string) {
        // `super(...)` MUST be called before accessing `this` in a derived class.
        // It runs Animal's constructor to initialise the inherited fields.
        super(name, age, "Canis lupus familiaris"); // must call super first
        this.breed = breed;
    }

    // `override` keyword (TS 4.3+) tells the compiler: "I intend to replace
    // a parent method." The compiler will error if no such method exists on
    // the parent, catching typos before they become silent bugs.
    override describe(): string {
        // `super.describe()` invokes Animal's original implementation,
        // letting us extend rather than completely replace the behaviour.
        return `${super.describe()} — Breed: ${this.breed}`;
    }

    bark(): string {
        // `this.name` is accessible here because it is `public` on Animal.
        // If it were `private`, Dog would not be able to read it — use
        // `protected` on Animal for members subclasses legitimately need.
        return `${this.name} says: Woof!`;
    }
}

const rex = new Dog("Rex", 3, "Labrador");
console.log(rex.describe());
console.log(rex.bark());

// --- Abstract Classes ---
// An abstract class sits between a regular class and an interface:
//
//   Interface      — pure contract, no implementation, cannot be instantiated,
//                    only defines what methods/properties must exist.
//
//   Abstract class — can contain BOTH abstract members (no implementation,
//                    subclasses MUST provide them) AND concrete members
//                    (full implementation shared by all subclasses).
//                    Cannot be instantiated directly — you must extend it.
//
//   Regular class  — fully implemented, can be instantiated directly.
//
// Use an abstract class when you have shared behaviour (concrete methods) but
// also want to force subclasses to fill in type-specific details (abstract methods).
abstract class Shape {
    // Abstract members: no body here — every concrete subclass MUST implement these.
    abstract area(): number;
    abstract perimeter(): number;

    // Concrete method shared by all subclasses — they inherit this for free
    // without needing to override it. This is the key difference from an interface:
    // interfaces cannot carry implementations (they are pure structural contracts).
    describe(): string {
        return `Area: ${this.area().toFixed(2)}, Perimeter: ${this.perimeter().toFixed(2)}`;
    }
}

// Circle and Rectangle both extend Shape.
// TypeScript (and JavaScript at runtime) will throw if you try `new Shape()`.
class Circle extends Shape {
    // Constructor shorthand: `private radius` declares + assigns in one line.
    constructor(private radius: number) {
        // Must call super() even if the parent has no arguments,
        // because abstract classes still need their prototype chain wired up.
        super();
    }
    area(): number { return Math.PI * this.radius ** 2; }
    perimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
    constructor(private width: number, private height: number) {
        super();
    }
    area(): number { return this.width * this.height; }
    perimeter(): number { return 2 * (this.width + this.height); }
}

// We can store Circle and Rectangle together under the Shape type because both
// satisfy Shape's contract. Polymorphism: `describe()` dispatches to each
// subclass's own area()/perimeter() at runtime.
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach(s => console.log(s.describe()));

// --- Static Members ---
// Static members belong to the CLASS ITSELF, not to any instance.
//
//   instance member: each `new MathUtils()` would get its own copy.
//   static member:   there is exactly ONE copy, shared, accessed via MathUtils.PI
//
// Typical uses: utility/helper functions that do not need instance state,
// constants tied to the class's domain, factory methods, singleton counters.
//
// You CANNOT use `this` in a static method to refer to an instance —
// inside a static method `this` refers to the class constructor itself.
class MathUtils {
    static readonly PI = 3.14159265;  // one constant, shared across the whole program

    static add(a: number, b: number): number { return a + b; }
    static square(n: number): number { return n * n; }

    // Static initialisation block (TypeScript 4.4+ / ES2022):
    // Runs once when the class is first loaded, before any instances are created.
    // Useful for complex static setup that cannot fit in a single field initialiser.
    static {
        console.log("MathUtils loaded");
    }
}

// No `new MathUtils()` needed — access via the class name directly.
console.log(MathUtils.PI);
console.log(MathUtils.square(5));

// --- Singleton Pattern ---
// The Singleton pattern ensures that only ONE instance of a class ever exists.
// It uses a combination of:
//   - `private constructor` — prevents `new Database()` from outside the class
//   - `private static instance` — the class holds a reference to its own single instance
//   - `static getInstance()` — the controlled entry point; creates on first call, reuses after
//
// This is a practical use of both `static` (the instance lives on the class)
// and `private constructor` (enforce single-entry creation).
class Database {
    private static instance: Database | null = null;  // class-level slot for the one instance
    private connectionString: string;

    // Private constructor: nobody outside this class can call `new Database(...)`.
    // This forces all callers through `getInstance()`.
    private constructor(connectionString: string) {
        this.connectionString = connectionString;
    }

    static getInstance(connStr?: string): Database {
        if (!Database.instance) {
            // First call: create and store the single instance.
            Database.instance = new Database(connStr ?? "default");
        }
        // Subsequent calls: return the already-created instance, ignoring connStr.
        return Database.instance;
    }

    query(sql: string): string {
        return `Querying [${this.connectionString}]: ${sql}`;
    }
}

const db1 = Database.getInstance("postgres://localhost/mydb");
const db2 = Database.getInstance();  // returns the same object — connStr is ignored
console.log(db1 === db2); // true — same instance

// --- Implementing Interfaces ---
// An interface is a PURE CONTRACT — it describes shape only, with no implementation.
// A class can implement multiple interfaces (unlike extends, which allows only one base class).
//
// Key distinctions:
//   interface — zero runtime overhead; fully erased at compile time.
//                Cannot contain implemented methods or initialised fields.
//   abstract class — emits actual JavaScript; can hold shared implementations.
//
// Use interfaces when you want to declare a capability contract that unrelated
// classes should satisfy (e.g. Flyable, Swimmable — ducks aren't the only
// things that can do both).
interface Flyable {
    maxAltitude: number;   // required property — implementing class must declare it
    fly(): string;         // required method — implementing class must provide a body
}

interface Swimmable {
    maxDepth: number;
    swim(): string;
}

// Duck inherits Animal (one base class allowed) AND satisfies both Flyable and
// Swimmable contracts. TypeScript verifies all interface members are present.
class Duck extends Animal implements Flyable, Swimmable {
    maxAltitude = 1000;  // satisfies Flyable.maxAltitude
    maxDepth = 2;        // satisfies Swimmable.maxDepth

    constructor(name: string) {
        super(name, 1, "Duck");
    }

    fly(): string { return `${this.name} is flying up to ${this.maxAltitude}m`; }
    swim(): string { return `${this.name} is swimming to ${this.maxDepth}m depth`; }
}

const duck = new Duck("Donald");
console.log(duck.fly());
console.log(duck.swim());

// --- Private Class Fields (ES2022 # syntax) ---
// TypeScript's `private` keyword is COMPILE-TIME ONLY.
// The emitted JavaScript exposes the property on the object as normal —
// it is accessible via bracket notation, Object.keys(), JSON.stringify(), etc.
//
// The # prefix (ES2022 hard private fields) is enforced at RUNTIME in the
// JavaScript engine itself:
//   - Accessing #balance from outside the class throws a SyntaxError at parse time.
//   - Subclasses cannot access it either — it is truly encapsulated.
//   - `in` checks (`#balance in obj`) let you test membership without exposure.
//
// When to use which:
//   `private`  — you only care about TypeScript-level safety (most common in TS codebases).
//   `#`        — you need genuine runtime privacy (libraries, security-sensitive state,
//                code that will be consumed as plain JS without type checking).
class BankAccount {
    #balance: number = 0; // truly private — not accessible even in subclasses or emitted JS

    deposit(amount: number): void {
        if (amount <= 0) throw new Error("Amount must be positive");
        this.#balance += amount;
    }

    // The getter exposes a read-only view of the private field.
    // Callers can read `account.balance` but cannot write to it directly.
    get balance(): number {
        return this.#balance;
    }
}

const account = new BankAccount();
account.deposit(100);
console.log(account.balance); // 100
// account.#balance;           // SyntaxError at parse time — enforced by the JS engine,
                               // not just the TypeScript compiler

// --- Mixins ---
// TypeScript (like JavaScript) only allows a class to `extend` ONE base class.
// Mixins are a pattern that simulates multiple inheritance via COMPOSITION:
//
//   A mixin is a function that:
//     1. Accepts a base class constructor as its argument.
//     2. Returns a NEW anonymous class that extends that base and adds new behaviour.
//
//   By chaining mixin calls, you compose capabilities onto a class without
//   needing a deep inheritance hierarchy or duplicating code.
//
// Why not just use multiple interfaces?
//   Interfaces declare the shape but carry no implementation.
//   Mixins inject ACTUAL methods and properties, so the behaviour comes for free.
//
// Trade-off: mixin types can be complex to infer in strict mode; casts may be needed.

// `Constructor<T>` is a generic type alias for "any class constructor that produces T".
// The `...args: any[]` signature makes it compatible with constructors that take
// any number of arguments — necessary because we do not know the base class's signature.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

// Timestamped mixin: takes any base class and returns a subclass that adds `createdAt`.
// The returned class is anonymous — its identity comes from how it is composed.
function Timestamped<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        createdAt = new Date();  // injected into every class that uses this mixin
    };
}

// Activatable mixin: independently adds isActive + activate/deactivate to any base class.
// Neither mixin knows about the other — they are fully independent and composable.
function Activatable<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        isActive = false;
        activate() { this.isActive = true; }
        deactivate() { this.isActive = false; }
    };
}

class BaseUser {
    constructor(public name: string) {}
}

// Compose by chaining: first wrap BaseUser with Timestamped, then wrap that result
// with Activatable. The final class has `name`, `createdAt`, and `isActive`/`activate`.
// This is the mixin pattern in action — no multiple inheritance, just successive wrapping.
const TimestampedUser = Timestamped(BaseUser);
const ActivatableTimestampedUser = Activatable(TimestampedUser);

const u = new ActivatableTimestampedUser("Alice");
u.activate();
// TypeScript's type inference for deeply composed mixins can lose track of the
// combined shape in strict mode, so a cast to BaseUser is used here to access `name`.
// At runtime, all properties (name, createdAt, isActive) are genuinely present on `u`.
console.log((u as BaseUser).name, u.isActive, u.createdAt);

export {};
console.log("Classes demo complete");
