// ============================================================
// 10 - Async Patterns & Error Handling in TypeScript
// ============================================================
//
// This file covers the full async/error toolkit you need for
// production TypeScript frontends and Node.js backends:
//   A. Typed Promises              — Promise<T> and async/await
//   B. Result / Either Pattern     — explicit error returns, no throwing
//   C. Custom Error Class Hierarchy — typed errors, instanceof narrowing
//   D. Concurrent Async Patterns   — all / allSettled / race / any
//   E. Async Generators & Streams  — lazy pagination, back-pressure
//   F. AbortController & Cancellation — cancel in-flight requests
//   G. Retry with Exponential Backoff — resilient calls, thundering herd
//   H. Promise Queue (concurrency limiter) — rate-limit parallelism
// ============================================================

// ============================================================
// PART A — Typed Promises
// ============================================================
//
// Promise<T> is the core async primitive in TypeScript.
// T is the RESOLVED value type — TypeScript enforces what
// .then() receives and what `await` unwraps into a variable.
// If you write Promise<User>, TypeScript will reject any code
// that tries to treat the resolved value as a string, number,
// or anything other than User.
//
// async/await is syntactic sugar over Promises:
//   - `async function foo()` wraps the return value in
//     Promise.resolve() automatically, so the function's
//     declared return type must be Promise<something>.
//   - `await expr` unwraps the Promise — execution pauses
//     at that line until the Promise settles, then continues
//     with the resolved value (or throws the rejection reason).
//   Under the hood the compiler transforms async/await into
//   a state machine of .then() / .catch() chains.

interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

// async wraps the return in Promise<User> automatically.
// await inside unwraps each inner Promise before the next line.
// TypeScript knows `return res.json() as Promise<User>` satisfies
// Promise<User>, so callers that do `const u = await fetchUser(1)`
// get u typed as User — not as any or unknown.
async function fetchUser(id: number): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<User>;
}

// Generic fetch wrapper: T is supplied by the caller.
// Promise<ApiResponse<T>> means .then(r => r.data) gives back T,
// and TypeScript will enforce that at every call site.
async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return res.json() as Promise<ApiResponse<T>>;
}

// ============================================================
// PART B — Result / Either Pattern (typed error handling)
// ============================================================
//
// The problem with `throw`: callers cannot tell from the type
// signature that a function might fail. Nothing in the type of
// `fetchUser` signals that it can throw a NetworkError.
//
// The Result / Either pattern fixes this:
//   - Instead of throwing, return { ok: true, value } or
//     { ok: false, error }.
//   - The union type Result<T, E> forces the caller to check
//     `result.ok` before accessing `result.value` — TypeScript
//     will not compile code that skips the check.
//   - This is the pattern used by Rust's Result<T,E> and
//     Go's (value, err) tuple, brought into TypeScript.
//
// Discriminated union: TypeScript narrows the type inside
// each branch because `ok` is a literal type (true / false).

type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
// Result<T, E> is either Ok or Err — caller is forced to
// handle both cases because TypeScript won't let you access
// `.value` without first checking `result.ok === true`.
type Result<T, E = Error> = Ok<T> | Err<E>;

// Constructor helpers — keep call sites readable.
function ok<T>(value: T): Ok<T> { return { ok: true, value }; }
function err<E>(error: E): Err<E> { return { ok: false, error }; }

// safeApiGet never throws. All failure paths return err(...).
// The Promise<Result<T>> signature is a contract: "I always
// give you back a Result — check it before using the value."
async function safeApiGet<T>(url: string): Promise<Result<T>> {
    try {
        const res = await fetch(url);
        if (!res.ok) return err(new Error(`HTTP ${res.status}`));
        const data = await res.json() as T;
        return ok(data);
    } catch (e) {
        // Normalize whatever was thrown (could be a DOMException,
        // a string, or undefined) into a proper Error object.
        return err(e instanceof Error ? e : new Error(String(e)));
    }
}

async function exampleUsage(): Promise<void> {
    const result = await safeApiGet<User[]>("/api/users");
    // TypeScript narrows: inside the true branch result.value is User[].
    // Inside the false branch result.error is Error.
    // You cannot access result.value in the false branch — compile error.
    if (result.ok) {
        result.value.forEach(u => console.log(u.name)); // User[]
    } else {
        console.error(result.error.message); // Error
    }
}

// ============================================================
// PART C — Custom Error Classes
// ============================================================
//
// Extend Error to create typed errors — catch can narrow the
// type with instanceof. Without custom classes, every catch
// block receives `unknown` and you learn nothing about what
// went wrong at compile time.
//
// Hierarchy: AppError (base) -> NetworkError, ValidationError,
// NotFoundError. A catch block can match at any level:
//   - `instanceof NetworkError` — specific
//   - `instanceof AppError`     — any app-level error
//   - `instanceof Error`        — any JS error at all
//
// The `Object.setPrototypeOf` call on line below AppError's
// super() is a TypeScript + transpiled-ES5 workaround:
// when code is transpiled to ES5, `instanceof` can break for
// subclasses of built-ins like Error. This one-liner restores
// the correct prototype chain so `instanceof` works reliably
// even in transpiled output.

class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,       // machine-readable error code
        public readonly statusCode: number = 500, // HTTP status, useful for APIs
    ) {
        super(message);
        this.name = "AppError";
        // Required fix: TypeScript transpiling to ES5 breaks instanceof
        // for Error subclasses. setPrototypeOf restores the chain so that
        // `err instanceof AppError` returns true even after transpilation.
        Object.setPrototypeOf(this, new.target.prototype); // fix instanceof
    }
}

// NetworkError carries the failing URL so logging is richer.
// It hard-codes statusCode=503 (Service Unavailable) via super().
class NetworkError extends AppError {
    constructor(message: string, public readonly url: string) {
        super(message, "NETWORK_ERROR", 503);
        this.name = "NetworkError";
    }
}

// ValidationError carries the field name and the bad value —
// enough context to render a form error without extra lookups.
class ValidationError extends AppError {
    constructor(
        message: string,
        public readonly field: string,   // which input field failed
        public readonly value: unknown,  // what value was rejected
    ) {
        super(message, "VALIDATION_ERROR", 400);
        this.name = "ValidationError";
    }
}

// NotFoundError auto-formats the message from resource + id,
// keeping call sites clean: `throw new NotFoundError("User", 42)`.
class NotFoundError extends AppError {
    constructor(resource: string, id: string | number) {
        super(`${resource} #${id} not found`, "NOT_FOUND", 404);
        this.name = "NotFoundError";
    }
}

// handleError uses instanceof narrowing — TypeScript progressively
// narrows the type of `err` through each branch. The most specific
// subclass (ValidationError) is checked first; the most generic
// (unknown) is the final fallback. The return type `never` tells
// TypeScript this function always throws, so callers know control
// never continues past it.
function handleError(err: unknown): never {
    if (err instanceof ValidationError) {
        // TypeScript knows err is ValidationError here — .field is available.
        console.error(`Validation: ${err.field} — ${err.message}`);
    } else if (err instanceof NotFoundError) {
        // TypeScript knows err is NotFoundError — .statusCode is available.
        console.error(`Not Found (${err.statusCode}): ${err.message}`);
    } else if (err instanceof AppError) {
        // Catches any AppError subclass not matched above.
        console.error(`App Error [${err.code}]: ${err.message}`);
    } else if (err instanceof Error) {
        // A plain JS Error (e.g. SyntaxError from JSON.parse).
        console.error(`Error: ${err.message}`);
    } else {
        // Truly unknown — someone threw a string or number.
        console.error(`Unknown: ${String(err)}`);
    }
    throw err; // re-throw so the return type `never` is satisfied
}

// ============================================================
// PART D — Concurrent Async Patterns
// ============================================================
//
// JavaScript is single-threaded but the event loop is not.
// Multiple Promises can be in-flight simultaneously — the key
// is whether you await them one at a time (sequential) or
// launch them all and await the collection (concurrent).

// Promise.all — all succeed or all fail.
// Launches all fetches concurrently. If any one rejects, the
// entire Promise.all rejects immediately (fail-fast). Use when
// you need every result and partial success is useless.
async function fetchMultipleUsers(ids: number[]): Promise<User[]> {
    return Promise.all(ids.map(id => fetchUser(id)));
}

// Promise.allSettled — collect successes and failures.
// Unlike Promise.all, allSettled never rejects. It waits for
// every Promise to settle, then gives you an array of
// { status: "fulfilled", value } | { status: "rejected", reason }
// objects. Use when you want as many results as possible and
// can tolerate partial failures (e.g., showing available items
// while logging the ones that failed to load).
async function fetchUsersSafe(ids: number[]): Promise<{
    fulfilled: User[];
    rejected: string[];
}> {
    const results = await Promise.allSettled(ids.map(id => fetchUser(id)));
    const fulfilled: User[] = [];
    const rejected: string[] = [];

    results.forEach(result => {
        if (result.status === "fulfilled") {
            fulfilled.push(result.value);
        } else {
            rejected.push(result.reason instanceof Error
                ? result.reason.message
                : String(result.reason));
        }
    });

    return { fulfilled, rejected };
}

// Promise.race — first to resolve OR reject wins.
// Here we race a real fetch against a timeout Promise that
// always rejects after `ms` milliseconds. If the network is
// slow, the timeout wins and the function throws — giving the
// caller a predictable failure instead of hanging indefinitely.
async function fetchWithTimeout<T>(
    promise: Promise<T>,
    ms: number,
): Promise<T> {
    // `new Promise<never>` — this Promise can only reject, never resolve.
    // The `never` type tells TypeScript that `resolve` is unreachable,
    // so Promise.race's return type remains T (from the real promise).
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    );
    return Promise.race([promise, timeout]);
}

// Promise.any — first SUCCESS wins, ignores rejections.
// Unlike race, it only rejects if ALL promises reject (AggregateError).
// Ideal for fan-out: try multiple CDN/server URLs and use
// whichever responds first without caring about the slower ones.
async function fetchFromFastestServer(urls: string[]): Promise<unknown> {
    return Promise.any(urls.map(url => fetch(url).then(r => r.json())));
}

// ============================================================
// PART E — Async Generators & Streams
// ============================================================
//
// `async function*` (async generator) yields values lazily.
// The caller consumes them one at a time with `for await...of`.
// This is ideal for pagination: you only load page N+1 after
// the caller has finished processing page N — natural back-
// pressure that avoids loading the entire dataset into memory.
//
// AsyncGenerator<T> is the type. Each `yield item` suspends
// the generator until the consumer asks for the next item.
// `return` inside the generator closes the iterator cleanly.

async function* paginate<T>(
    fetchPage: (page: number) => Promise<T[]>,
    maxPages = 10,
): AsyncGenerator<T> {
    for (let page = 1; page <= maxPages; page++) {
        const items = await fetchPage(page);
        // An empty page means we have exhausted the data source.
        // `return` from an async generator sends { done: true }
        // to the for-await loop, stopping iteration.
        if (items.length === 0) return;
        // yield each item individually so the caller processes
        // one record at a time rather than waiting for a full page.
        for (const item of items) {
            yield item;
        }
    }
}

async function processAllUsers(): Promise<void> {
    const fetchPage = (page: number) =>
        fetch(`/api/users?page=${page}`).then(r => r.json() as Promise<User[]>);

    // for-await-of drives the async generator: each iteration
    // awaits the next yielded value, keeping memory usage flat
    // regardless of the total number of users.
    for await (const user of paginate(fetchPage)) {
        console.log(user.name);
    }
}

// ============================================================
// PART F — AbortController & Cancellation
// ============================================================
//
// AbortController lets you cancel in-flight fetch requests.
// This is critical for component cleanup in React and similar
// frameworks: if a component unmounts while a fetch is pending,
// you MUST cancel it. Otherwise the callback runs after unmount,
// calls setState on a dead component, and React logs a warning
// (or in older versions, causes a memory leak).
//
// How it works:
//   1. Create an AbortController — it exposes a `.signal` property.
//   2. Pass the signal to fetch(): { signal }.
//   3. Call controller.abort() to cancel. The fetch rejects with
//      a DOMException whose .name is "AbortError".
//   4. Check for AbortError in catch to distinguish cancellation
//      from real failures — you usually want to swallow it silently.

async function fetchWithAbort(
    url: string,
    signal: AbortSignal, // passed in so the owner controls cancellation
): Promise<unknown> {
    const res = await fetch(url, { signal }); // fetch watches the signal
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// CancellableRequest wraps the pattern for repeated use.
// Each call to .fetch() cancels any previous pending request
// before starting a new one — perfect for search-as-you-type
// where each keystroke should supersede the previous query.
class CancellableRequest {
    private controller: AbortController | null = null;

    async fetch(url: string): Promise<unknown> {
        this.cancel(); // abort any still-running request first
        this.controller = new AbortController();
        try {
            return await fetchWithAbort(url, this.controller.signal);
        } catch (e) {
            // AbortError is expected when we call cancel() — not a real
            // failure. Return null silently so callers don't need to
            // distinguish cancellation from network errors themselves.
            if (e instanceof Error && e.name === "AbortError") {
                console.log("Request cancelled");
                return null;
            }
            throw e; // re-throw genuine network / parse errors
        }
    }

    cancel(): void {
        this.controller?.abort(); // no-op if already null or aborted
        this.controller = null;
    }
}

// ============================================================
// PART G — Retry with Exponential Backoff
// ============================================================
//
// Transient failures (flaky network, brief server overload) often
// succeed if you simply try again. But retrying immediately and
// rapidly makes things worse — if 1000 clients all hammer a
// struggling server at the same instant, they create a "thundering
// herd" that prevents recovery.
//
// Exponential backoff solves this:
//   delay = min(baseDelay * 2^(attempt-1), maxDelay)
//   Attempt 1 fails  → wait 300ms
//   Attempt 2 fails  → wait 600ms
//   Attempt 3 fails  → wait 1200ms  ... capped at maxDelay
//
// Each client waits progressively longer, spreading retries out
// in time and giving the server breathing room to recover.
//
// `retryOn` is an optional predicate: pass it to avoid retrying
// on errors that will never succeed (e.g., 400 Bad Request or
// a ValidationError — no amount of retrying will fix a bad payload).

interface RetryOptions {
    maxAttempts: number;
    baseDelayMs: number; // initial wait; doubles each attempt
    maxDelayMs: number;  // cap so wait never grows unbounded
    retryOn?: (err: unknown) => boolean; // return false to give up early
}

async function withRetry<T>(
    fn: () => Promise<T>,    // the async operation to attempt
    options: RetryOptions,
): Promise<T> {
    const { maxAttempts, baseDelayMs, maxDelayMs, retryOn } = options;
    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn(); // success — return immediately
        } catch (err) {
            lastErr = err;
            // If the caller said "don't retry on this error", give up now.
            if (retryOn && !retryOn(err)) throw err;
            if (attempt === maxAttempts) break; // exhausted all attempts

            // Exponential backoff: 2^(attempt-1) doubles the wait each time.
            // Math.min caps it at maxDelayMs to avoid absurdly long waits.
            const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            // `await new Promise(resolve => setTimeout(...))` is the idiomatic
            // way to sleep in async TypeScript without blocking the event loop.
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastErr; // re-throw the last error after all attempts are exhausted
}

// Example: retry fetchUser(1) up to 3 times, but only for
// NetworkError or 5xx AppErrors (transient). A 400 ValidationError
// would not be retried because retryOn returns false for it.
const fetchWithRetry = () =>
    withRetry(() => fetchUser(1), {
        maxAttempts: 3,
        baseDelayMs: 300,
        maxDelayMs: 5000,
        retryOn: (err) =>
            err instanceof NetworkError ||
            (err instanceof AppError && err.statusCode >= 500),
    });

// ============================================================
// PART H — Promise Queue (concurrency limiter)
// ============================================================
//
// `Promise.all` launches every task at once. For 1000 tasks
// that means 1000 simultaneous network requests — you'll hit
// browser connection limits or server rate limits.
//
// PromiseQueue controls concurrency: at most `concurrency`
// tasks run simultaneously. When a running task finishes,
// `next()` picks the next queued task and starts it.
//
// How it works:
//   - `add()` wraps the task in a new Promise and pushes a
//     starter function onto `this.queue`, then calls `next()`.
//   - `next()` loops while `running < concurrency` and tasks
//     remain in the queue, dequeuing and starting them.
//   - When a task finishes (finally block), running-- and
//     `next()` is called again to fill the freed slot.
//
// The outer Promise returned by `add()` resolves/rejects with
// the same value as the inner task, so callers can `await` it.

class PromiseQueue {
    // Pending starters — each entry, when called, runs one task
    // and handles its own resolve/reject via closure.
    private queue: Array<() => void> = [];
    private running = 0; // how many tasks are currently active

    constructor(private concurrency: number) {}

    async add<T>(fn: () => Promise<T>): Promise<T> {
        // Wrap in a new Promise so callers can await the result.
        // The actual execution is deferred — `fn` won't start until
        // a concurrency slot opens and `next()` calls the starter.
        return new Promise<T>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    resolve(await fn()); // run the task, forward the result
                } catch (e) {
                    reject(e);          // forward rejections to the caller
                } finally {
                    // Always decrement and try to start the next task,
                    // even if this one threw — keeps the queue draining.
                    this.running--;
                    this.next();
                }
            });
            this.next(); // attempt to start immediately if slots are free
        });
    }

    private next(): void {
        // Greedily start as many tasks as concurrency allows.
        while (this.running < this.concurrency && this.queue.length > 0) {
            const task = this.queue.shift()!; // dequeue the next starter
            this.running++;
            task(); // start the task (does not await — fire and forget here)
        }
    }
}

// Only 3 fetches run at once even though 5 are queued.
// As each finishes, the queue starts the next one.
const queue = new PromiseQueue(3); // max 3 concurrent
const tasks = [1, 2, 3, 4, 5].map(id =>
    queue.add(() => fetchUser(id)),
);

export {};
console.log("Async & Error Handling demo complete");
