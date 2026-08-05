// ============================================================
// 07 - Decorators in TypeScript
//
// WHAT ARE DECORATORS?
// Decorators are special functions that wrap a class, method,
// property, accessor, or parameter to add or modify behavior
// without changing the underlying source code.
//
// They are a meta-programming feature currently at Stage 3 in
// the TC39 ECMAScript proposal process. TypeScript has supported
// an older "experimental" form for many years (enabled via
// "experimentalDecorators": true in tsconfig.json), and a new
// standard-aligned form landed in TypeScript 5.0.
//
// The pattern they implement is called the "Decorator pattern":
//   originalFn  -->  decoratorWrapper(originalFn)  -->  caller
//
// Decorators are applied with the @ syntax placed immediately
// above the target they annotate.
//
// Requires: "experimentalDecorators": true in tsconfig.json
//   (for the legacy decorator API used in this file)
// ============================================================

// ============================================================
// PART A — Class Decorators
//
// A class decorator is a function that receives exactly one
// argument: the class constructor itself (not an instance).
// It runs once when the class is defined, not when instances
// are created.
//
// A class decorator can:
//   1. Inspect or log the constructor (side-effects only).
//   2. Mutate the constructor or its prototype (e.g., Object.seal).
//   3. Return a new constructor that replaces the original class.
//
// Signature (legacy mode):
//   (constructor: Function) => void | Function
// ============================================================

// Sealed: prevents new properties from being added to the class
// or its prototype after the class is defined.
// Object.seal(constructor) seals the class object itself
// (static side); Object.seal(constructor.prototype) seals the
// shape that all instances share.
function Sealed(constructor: Function): void {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
}

// Injectable: a minimal "registration" decorator that just logs
// the class name — the kind of thing a DI container (like Angular
// or InversifyJS) would do to track which classes can be injected.
function Injectable(constructor: Function): void {
    console.log(`Registering: ${constructor.name}`);
}

// Applying multiple class decorators:
//   @Injectable   <-- applied SECOND (outermost, runs last on class)
//   @Sealed       <-- applied FIRST  (innermost, runs first on class)
//
// EXECUTION ORDER RULE: When multiple decorators are stacked on
// the same target, TypeScript evaluates them bottom-up (innermost
// first). Here @Sealed runs before @Injectable.
// For class decorators specifically, ALL member decorators
// (methods, properties) run before the class decorator.
@Injectable
@Sealed
class UserService {
    getUser(id: number): string {
        return `User #${id}`;
    }
}

// ---------------------------------------------------------------
// DECORATOR FACTORIES
//
// A decorator factory is a function that RETURNS a decorator.
// This is the pattern you use whenever you need to pass
// configuration into a decorator.
//
// Without factory:  @Sealed          — no configuration possible
// With factory:     @LogClass("[Service]")  — accepts arguments
//
// The factory is called first (at class-definition time), it
// receives your arguments, and returns the actual decorator
// function that then receives the constructor/method/etc.
// ---------------------------------------------------------------
function LogClass(prefix: string) {
    // This inner function IS the class decorator.
    // It closes over `prefix` from the factory call above.
    return function (constructor: Function): void {
        console.log(`${prefix} ${constructor.name} registered`);
    };
}

@LogClass("[Service]")
class OrderService {}

// ============================================================
// PART B — Method Decorators (target, key, descriptor)
//
// A method decorator receives THREE arguments:
//   1. target     — for instance methods: the class prototype
//                   for static methods: the constructor itself
//   2. key        — the method name as a string
//   3. descriptor — the PropertyDescriptor for the method,
//                   which holds the actual function in
//                   descriptor.value
//
// The core technique is to:
//   a) Save the original function:  const original = descriptor.value
//   b) Replace descriptor.value with a NEW wrapper function
//      that calls original.apply(this, args) inside it.
//   c) Return the (mutated) descriptor so TypeScript installs
//      the wrapper in place of the original method.
//
// Common real-world uses: logging, timing, authentication checks,
// memoization, retry logic, throttling/debouncing.
// ============================================================

// Log: wraps the method to print arguments before the call and
// the return value after, making call tracing transparent.
function Log(
    _target: object,
    key: string,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    // Capture the original method before overwriting it.
    const original = descriptor.value as (...args: unknown[]) => unknown;

    // Replace descriptor.value with a wrapper. Use a regular
    // function (not an arrow) so `this` refers to the instance
    // that called the method, not the decorator's closure scope.
    descriptor.value = function (this: unknown, ...args: unknown[]) {
        console.log(`→ ${key}(${JSON.stringify(args)})`);
        // Delegate to the original, preserving the caller's `this`.
        const result = original.apply(this, args);
        console.log(`← ${key} =`, result);
        return result;
    };
    return descriptor;
}

// Memoize: caches results keyed by the serialized argument list.
// On subsequent calls with the same args, returns the cached
// result instantly without executing the original function again.
// The cache Map lives in the decorator closure — it is shared
// across ALL instances of the class (prototype-level cache).
function Memoize(
    _target: object,
    key: string,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    // One cache per decorated method, created when the class is defined.
    const cache = new Map<string, unknown>();
    const original = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
        // Serialize args to a string to use as the cache key.
        const cacheKey = JSON.stringify(args);
        if (cache.has(cacheKey)) {
            console.log(`Cache hit: ${key}`);
            return cache.get(cacheKey);
        }
        const result = original.apply(this, args);
        cache.set(cacheKey, result);
        return result;
    };
    return descriptor;
}

class Calculator {
    // Single decorator on add — just logs calls.
    @Log
    add(a: number, b: number): number {
        return a + b;
    }

    // Two decorators stacked on fibonacci.
    // Bottom-up execution order:
    //   @Log runs first     (innermost)
    //   @Memoize runs second (outermost)
    // So the effective call chain is:
    //   caller -> Memoize wrapper -> Log wrapper -> original fibonacci
    @Memoize
    @Log
    fibonacci(n: number): number {
        if (n <= 1) return n;
        return this.fibonacci(n - 1) + this.fibonacci(n - 2);
    }
}

const calc = new Calculator();
calc.add(2, 3);
calc.fibonacci(10);

// ============================================================
// PART C — Property Decorator
//
// A property decorator is called with TWO arguments:
//   1. target      — the class prototype (for instance properties)
//   2. propertyKey — the property name as a string
//
// IMPORTANT LIMITATION: unlike method decorators, a property
// decorator does NOT receive a PropertyDescriptor. TypeScript
// does not give you the initial value or a descriptor to mutate.
//
// The two main uses for property decorators are:
//   1. Attach metadata (via Reflect.metadata) for frameworks like
//      Angular DI or class-validator to read at runtime.
//   2. Intercept reads/writes by manually calling
//      Object.defineProperty on the target prototype to install
//      a custom getter/setter — which is what MinLength does here.
// ============================================================

// MinLength: a decorator factory that enforces a minimum string
// length on any string property it annotates.
// It works by replacing the plain property with a getter/setter
// pair on the prototype, so every assignment goes through the
// setter's validation logic.
function MinLength(min: number) {
    return function (target: object, propertyKey: string): void {
        // `value` is stored in the closure — one slot per prototype,
        // so be aware this is shared if the same class is reused
        // without instance-level storage (for illustration only).
        let value: string;

        // Install a getter/setter on the class prototype.
        // Every instance inherits this definition, so assignments
        // like `this.username = "Al"` will trigger the setter.
        Object.defineProperty(target, propertyKey, {
            get(): string { return value; },
            set(newVal: string): void {
                if (typeof newVal === "string" && newVal.length < min) {
                    throw new Error(`${propertyKey} must be >= ${min} chars`);
                }
                value = newVal;
            },
            enumerable: true,
            configurable: true,  // must be true so the property can be
                                 // redefined again if stacking decorators
        });
    };
}

class UserProfile {
    // @MinLength(3) installs a setter that rejects strings shorter
    // than 3 characters before the constructor can store the value.
    @MinLength(3)
    username!: string;  // ! — TypeScript definite assignment assertion

    constructor(username: string) {
        // This assignment goes through the MinLength setter.
        this.username = username;
    }
}

const profile = new UserProfile("Alice");
console.log(profile.username);

// ============================================================
// PART D — Real-world Method Decorator Patterns
//
// These factories demonstrate common production patterns where
// decorator factories shine: each factory captures configuration
// (a time limit, a retry count) in its closure and returns a
// freshly configured decorator.
// ============================================================

// Throttle: limits how frequently the decorated method can fire.
// No matter how often the caller invokes it, the original
// function only runs if at least `limitMs` milliseconds have
// elapsed since the last execution. Calls that arrive too soon
// are silently dropped (returns undefined).
// Useful for scroll/resize handlers and search-as-you-type inputs.
function Throttle(limitMs: number) {
    return function (
        _target: object,
        _key: string,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        // lastCall persists in the closure across calls — it is
        // not reset when a new instance is created.
        let lastCall = 0;
        const original = descriptor.value as (...args: unknown[]) => unknown;
        descriptor.value = function (this: unknown, ...args: unknown[]) {
            const now = Date.now();
            if (now - lastCall >= limitMs) {
                lastCall = now;
                return original.apply(this, args);
            }
            // Implicit return undefined: call was throttled away.
        };
        return descriptor;
    };
}

// Retry: wraps an async method to automatically re-attempt it up
// to `times` times if it throws. After exhausting all attempts
// it re-throws the last error so the caller is still informed.
// Useful for network calls that may fail due to transient errors.
function Retry(times: number) {
    return function (
        _target: object,
        _key: string,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;

        // The wrapper must be async because it awaits the original
        // and uses a try/catch loop across multiple attempts.
        descriptor.value = async function (this: unknown, ...args: unknown[]) {
            let lastErr: unknown;
            for (let i = 0; i < times; i++) {
                try {
                    return await original.apply(this, args);
                } catch (e) {
                    lastErr = e;
                    console.log(`Retry ${i + 1}/${times}`);
                }
            }
            // All attempts failed — propagate the last error.
            throw lastErr;
        };
        return descriptor;
    };
}

// ReadOnly: a simple non-factory method decorator that sets
// descriptor.writable = false so the method cannot be overwritten
// by external code (e.g., instance.myMethod = something else).
// Note: this is about overwriting the property, not about what
// the method does internally.
function ReadOnly(
    _target: object,
    _key: string,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    descriptor.writable = false;
    return descriptor;
}

class ApiClient {
    // @Throttle(1000): search can fire at most once per second.
    @Throttle(1000)
    search(query: string): void {
        console.log(`Searching: ${query}`);
    }

    // @Retry(3): if fetchData throws, it will be retried up to
    // 3 total attempts before the error propagates to the caller.
    @Retry(3)
    async fetchData(url: string): Promise<unknown> {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
}

const client = new ApiClient();
client.search("TypeScript");

// ============================================================
// PART E — Parameter Decorator
//
// A parameter decorator is called with THREE arguments:
//   1. target      — class prototype (or constructor for static)
//   2. methodName  — name of the method the parameter belongs to
//   3. paramIndex  — zero-based position of the parameter
//
// CRITICAL LIMITATION: parameter decorators cannot intercept or
// transform the parameter's value at call time. They only run
// once at class-definition time, not on every call.
//
// Their PRIMARY purpose is to attach metadata onto the target
// object (or via Reflect.metadata) so that a companion METHOD
// decorator or framework runtime can read it and act on it.
//
// Real-world uses:
//   - Angular's @Inject() marks which token to inject.
//   - NestJS uses @Body(), @Param(), @Query() to bind request data.
//   - class-validator-style validation (as shown below).
//
// The pattern here manually stores the required param indices on
// the prototype so a runtime validator could later check them.
// ============================================================

// Metadata key used to store the list of required parameter indices.
const REQUIRED_META_KEY = "__requiredParams__";

// Required: marks a parameter as required by recording its index
// on the prototype property `<methodName>___requiredParams__`.
// A runtime wrapper (not shown here) would read these indices
// and throw if any of the corresponding arguments are nullish.
function Required(
    target: object,
    methodName: string | symbol,
    paramIndex: number,
): void {
    // Read any previously registered required indices for this method,
    // or start with an empty array if this is the first @Required.
    const existing: number[] =
        (target as Record<string, number[]>)[`${String(methodName)}_${REQUIRED_META_KEY}`] ?? [];
    existing.push(paramIndex);
    // Write the updated list back onto the prototype.
    (target as Record<string, number[]>)[`${String(methodName)}_${REQUIRED_META_KEY}`] = existing;
    // Note: this decorator returns void — parameter decorators
    // cannot return a meaningful value; TypeScript ignores it.
}

class UserController {
    createUser(
        @Required name: string,   // paramIndex 0 — recorded as required
        @Required email: string,  // paramIndex 1 — recorded as required
        role?: string,            // not decorated — treated as optional
    ): string {
        return `${name} / ${email} / ${role ?? "user"}`;
    }
}

// ============================================================
// PART F — Accessor Decorator
//
// An accessor decorator targets a getter or setter (get/set
// accessor pair). It receives the same three arguments as a
// method decorator: target, key, descriptor.
//
// Here Configurable controls whether the accessor can be
// redefined after the class is created. Setting
// descriptor.configurable = false locks it permanently.
//
// This is a decorator FACTORY because it accepts a boolean
// argument — the returned inner function is the real decorator.
// ============================================================

// Configurable: sets the configurable flag on a getter/setter
// accessor descriptor. Pass false to prevent the accessor from
// being redefined or deleted after class creation.
function Configurable(writable: boolean) {
    return function (
        _target: object,
        _key: string,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        descriptor.configurable = writable;
        return descriptor;
    };
}

export {};
console.log("Decorators demo complete");
