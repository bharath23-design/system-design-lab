// ============================================================
// 11 - Design Patterns in TypeScript
//
// Design patterns are reusable solutions to commonly recurring
// problems in software design. They are not finished code —
// they are templates you adapt to your situation.
//
// Grouped into three families (GoF classification):
//   A. Creational  — how objects are created
//   B. Structural  — how objects are composed / related
//   C. Behavioral  — how objects communicate / divide responsibility
// ============================================================

// ============================================================
// PART A — Creational Patterns
//
// Creational patterns abstract the instantiation process.
// They let you control WHAT gets created, WHO creates it,
// HOW it is created, and WHEN it is created.
// ============================================================

// --- Singleton ---
//
// INTENT: Guarantee that only ONE instance of a class ever exists
//         in the entire application, and provide a global access point to it.
//
// HOW TypeScript enforces it:
//   • `private constructor()` — no external code can call `new Config()`.
//   • `private static instance` — the sole reference lives on the class itself.
//   • `static getInstance()` — lazy-initialises the instance on first call;
//     every subsequent call returns the SAME object (referential equality).
//
// WHY you want this: shared state that must be consistent everywhere —
//   configuration, connection pools, logging singletons, theme stores.
//
// TypeScript in the wild: Angular's dependency-injection container
//   uses singleton services by default (`providedIn: 'root'`).
//   Redux `store` is also effectively a singleton.
class Config {
    // The single, class-level reference — undefined until first call.
    private static instance: Config;

    // Internal key-value store for all settings.
    private settings: Map<string, unknown> = new Map();

    // Private constructor blocks `new Config()` from outside the class.
    // This is the cornerstone of the Singleton — without it, callers
    // could bypass getInstance() and create duplicate instances.
    private constructor() {}

    // Lazy initialiser: create the instance only when first needed.
    // After the first call, `Config.instance` is already set so we
    // just return the cached reference.
    static getInstance(): Config {
        if (!Config.instance) Config.instance = new Config();
        return Config.instance;
    }

    // Typed setter — stores any value under a string key.
    set<T>(key: string, value: T): void { this.settings.set(key, value); }

    // Typed getter — casts stored `unknown` back to the expected type T.
    get<T>(key: string): T | undefined { return this.settings.get(key) as T; }
}

// Both variables point to the EXACT same object in memory.
const config = Config.getInstance();
config.set("port", 3000);

// --- Factory Method ---
//
// INTENT: Decouple object CREATION from object USAGE.
//         The caller asks for a Logger; it does not know (or care)
//         whether it gets a ConsoleLogger, FileLogger, or CloudLogger.
//         Adding a new logger type requires zero changes to callers.
//
// KEY IDEA: "Program to an interface, not an implementation."
//   The factory function owns the `switch`; the rest of the app
//   only deals with the `Logger` interface.
//
// TypeScript in the wild: `http.createServer()`, `fs.createWriteStream()`,
//   NestJS `LoggerService`, and most ORM connection factories follow this pattern.
interface Logger {
    log(msg: string): void;
    error(msg: string): void;
}

// Concrete product A — writes to stdout/stderr.
class ConsoleLogger implements Logger {
    log(msg: string): void { console.log(`[INFO] ${msg}`); }
    error(msg: string): void { console.error(`[ERROR] ${msg}`); }
}

// Concrete product B — writes to a named file (simulated here with console).
class FileLogger implements Logger {
    constructor(private filePath: string) {}
    log(msg: string): void { console.log(`[FILE:${this.filePath}] ${msg}`); }
    error(msg: string): void { console.error(`[FILE:${this.filePath}] ERROR: ${msg}`); }
}

// The factory function: centralised creation logic.
// Callers pass a string tag; the factory returns the correct concrete type.
// If you add a "cloud" variant, you add ONE case here — callers are untouched.
function createLogger(type: "console" | "file", filePath?: string): Logger {
    switch (type) {
        case "console": return new ConsoleLogger();
        case "file": return new FileLogger(filePath ?? "app.log");
    }
}

// --- Abstract Factory ---
//
// INTENT: A factory-of-factories.
//         Provide an interface for creating FAMILIES of related objects
//         (e.g., all dark-theme widgets, or all light-theme widgets)
//         without specifying concrete classes anywhere in consuming code.
//
// KEY IDEA: The consuming code (`renderUI(factory: UIFactory)`) only knows
//   the abstract `UIFactory` interface. Swapping the entire theme is a
//   one-line change at the call site — pass a different factory.
//
// TypeScript in the wild: UI component libraries (Material-UI theming,
//   Chakra UI `ColorModeProvider`), cross-platform toolkits, and
//   database provider abstractions (TypeORM `DataSource` drivers).

// Abstract product interfaces — one per component type.
interface Button { render(): string; onClick(): void }
interface Input { render(): string; getValue(): string }

// The abstract factory interface — declares creation methods for each product.
// Any concrete theme factory must implement ALL of these.
interface UIFactory {
    createButton(label: string): Button;
    createInput(placeholder: string): Input;
}

// --- Concrete dark-theme products ---
class DarkButton implements Button {
    constructor(private label: string) {}
    render(): string { return `<button class="dark">${this.label}</button>`; }
    onClick(): void { console.log(`Dark button "${this.label}" clicked`); }
}

class LightButton implements Button {
    constructor(private label: string) {}
    render(): string { return `<button class="light">${this.label}</button>`; }
    onClick(): void { console.log(`Light button "${this.label}" clicked`); }
}

class DarkInput implements Input {
    render(): string { return `<input class="dark" />`; }
    getValue(): string { return ""; }
}

class LightInput implements Input {
    render(): string { return `<input class="light" />`; }
    getValue(): string { return ""; }
}

// --- Concrete factories: each produces a consistent family of products ---

// DarkThemeFactory guarantees every component it produces is dark-styled.
// The consuming code never imports DarkButton or DarkInput directly.
class DarkThemeFactory implements UIFactory {
    createButton(label: string): Button { return new DarkButton(label); }
    createInput(_placeholder: string): Input { return new DarkInput(); }
}

// LightThemeFactory is a drop-in replacement — same interface, different products.
class LightThemeFactory implements UIFactory {
    createButton(label: string): Button { return new LightButton(label); }
    createInput(_placeholder: string): Input { return new LightInput(); }
}

// --- Builder ---
//
// INTENT: Construct complex objects step-by-step using a fluent (chainable) API.
//         Separate the construction of an object from its representation so that
//         the same builder process can create different representations.
//
// WHY NOT just a constructor with many params?
//   A constructor with 7 optional args is hard to read and error-prone.
//   The Builder makes each step self-documenting and allows partial builds.
//
// HOW the fluent API works:
//   Each setter mutates `this.config` and then `return this` — returning the
//   builder itself. This enables method chaining: `.from().select().where()...`
//   The terminal step `.build()` assembles and returns the final product.
//
// TypeScript in the wild: `knex` and `TypeORM` query builders,
//   `fetch` `Request` builders, test fixture libraries (e.g., `fishery`).
interface QueryConfig {
    table: string;
    fields: string[];
    conditions: string[];
    limit?: number;
    offset?: number;
    orderBy?: string;
}

class QueryBuilder {
    // Start with a valid but empty config — builder will fill it incrementally.
    private config: QueryConfig = { table: "", fields: [], conditions: [] };

    // Each method below mutates one part of the config and returns `this`
    // so calls can be chained without intermediate variables.

    from(table: string): this {
        this.config.table = table;
        return this;
    }
    select(...fields: string[]): this {
        this.config.fields = fields;
        return this;
    }
    where(condition: string): this {
        // Multiple `.where()` calls accumulate — joined later with AND.
        this.config.conditions.push(condition);
        return this;
    }
    limit(n: number): this {
        this.config.limit = n;
        return this;
    }
    offset(n: number): this {
        this.config.offset = n;
        return this;
    }
    orderBy(field: string): this {
        this.config.orderBy = field;
        return this;
    }

    // Terminal step: assemble all parts into a SQL string.
    // Called once — after this point the builder's state is consumed.
    build(): string {
        const fields = this.config.fields.length ? this.config.fields.join(", ") : "*";
        let sql = `SELECT ${fields} FROM ${this.config.table}`;
        if (this.config.conditions.length) {
            sql += ` WHERE ${this.config.conditions.join(" AND ")}`;
        }
        if (this.config.orderBy) sql += ` ORDER BY ${this.config.orderBy}`;
        if (this.config.limit) sql += ` LIMIT ${this.config.limit}`;
        if (this.config.offset) sql += ` OFFSET ${this.config.offset}`;
        return sql;
    }
}

// Fluent chain — each call returns the same QueryBuilder instance.
// `.build()` is the only call that produces the final string product.
const query = new QueryBuilder()
    .from("users")
    .select("id", "name", "email")
    .where("age > 18")
    .where("role = 'admin'")
    .orderBy("name")
    .limit(10)
    .build();
console.log(query);

// ============================================================
// PART B — Structural Patterns
//
// Structural patterns deal with object COMPOSITION.
// They describe how classes and objects are assembled into
// larger structures while keeping those structures flexible
// and efficient.
// ============================================================

// --- Adapter ---
//
// INTENT: Make an incompatible interface work with code that expects
//         a different interface — without modifying the original class.
//         Think of it as a "plug converter" for software interfaces.
//
// PROBLEM HERE: Our app expects `ModernApi.getUser(id: string)` but we
//   have a third-party `LegacyApi.fetchUser(numericId: number)` that
//   returns a different shape. We cannot (or should not) modify LegacyApi.
//
// SOLUTION: `LegacyApiAdapter` wraps LegacyApi and translates
//   the call signature and response shape so consumers see ModernApi.
//
// TypeScript in the wild: Axios adapters, `node-fetch` vs browser `fetch`
//   polyfills, database driver wrappers (e.g., wrapping pg in a common DAO).
interface ModernApi {
    getUser(id: string): Promise<{ id: string; fullName: string }>;
}

// Legacy third-party class we cannot modify.
class LegacyApi {
    fetchUser(numericId: number): { uid: number; first: string; last: string } {
        return { uid: numericId, first: "John", last: "Doe" };
    }
}

// The Adapter: implements the interface consumers expect (ModernApi)
// while delegating to the legacy implementation under the hood.
class LegacyApiAdapter implements ModernApi {
    constructor(private legacy: LegacyApi) {}

    async getUser(id: string): Promise<{ id: string; fullName: string }> {
        // Bridge: convert string id → number for legacy, then reshape the response.
        const raw = this.legacy.fetchUser(Number(id));
        return { id: String(raw.uid), fullName: `${raw.first} ${raw.last}` };
    }
}

// --- Decorator (structural) ---
//
// INTENT: Attach additional behaviour to an object DYNAMICALLY at runtime,
//         without subclassing. Decorators wrap a component and can intercept
//         or augment calls before/after delegating to the wrapped object.
//
// KEY IDEA: Both the wrapper and the wrappee implement the SAME interface.
//   Wrappers can be stacked: `new Compression(new Encryption(new File()))`.
//   Each layer adds one responsibility — Single Responsibility Principle.
//
// TypeScript in the wild: Express/Koa middleware chains, Angular's
//   `@Pipe` decorators, and the `@decorator` syntax (TC39 Stage 3)
//   all follow this structural pattern. NestJS interceptors are decorators.
interface DataSource {
    writeData(data: string): void;
    readData(): string;
}

// The base concrete component — plain file storage with no extras.
class FileDataSource implements DataSource {
    private data = "";
    writeData(data: string): void { this.data = data; }
    readData(): string { return this.data; }
}

// Abstract base decorator: holds a reference to another DataSource (the wrappee)
// and delegates both methods to it by default. Concrete decorators override
// only the methods they need to augment.
abstract class DataSourceDecorator implements DataSource {
    constructor(protected wrapped: DataSource) {}
    writeData(data: string): void { this.wrapped.writeData(data); }
    readData(): string { return this.wrapped.readData(); }
}

// Concrete decorator 1 — adds encryption/decryption as a transparent layer.
// On write: encrypt first, then pass ciphertext down to the next layer.
// On read:  get ciphertext from the next layer, then decrypt before returning.
class EncryptionDecorator extends DataSourceDecorator {
    writeData(data: string): void {
        const encrypted = btoa(data); // btoa is available in both browser & Node 16+
        super.writeData(encrypted);
    }
    readData(): string {
        const data = super.readData();
        return atob(data);
    }
}

// Concrete decorator 2 — adds compression on top of whatever is below it.
// Stacking: `new Compression(new Encryption(new File()))` means data is
// compressed THEN encrypted on write, and decrypted THEN decompressed on read.
class CompressionDecorator extends DataSourceDecorator {
    writeData(data: string): void {
        super.writeData(`compressed(${data})`);
    }
    readData(): string {
        const data = super.readData();
        return data.replace(/^compressed\(/, "").replace(/\)$/, "");
    }
}

// --- Facade ---
//
// INTENT: Provide a single, simplified interface to a complex subsystem.
//         The Facade does not add new behaviour — it orchestrates existing
//         subsystems so callers don't have to know the internal steps.
//
// KEY IDEA: Callers interact with one method (`processPayment`) instead of
//   having to know about validators, processors, notifiers, and loggers.
//   The Facade hides complexity and reduces coupling to subsystem internals.
//
// TypeScript in the wild: `axios` is a facade over `XMLHttpRequest`/`http`.
//   AWS SDK high-level clients are facades over REST APIs.
//   Next.js `getServerSideProps` is a facade over SSR lifecycle.
class PaymentFacade {
    // Private subsystems — callers never reference these directly.
    private validator = { validate: (card: string) => card.length === 16 };
    private processor = { charge: (amount: number) => console.log(`Charged $${amount}`) };
    private notifier = { notify: (email: string) => console.log(`Receipt sent to ${email}`) };
    private logger = { log: (msg: string) => console.log(`[LOG] ${msg}`) };

    // Single public entry point: orchestrates all subsystems in the right order.
    // The caller only needs to know: card number, amount, email.
    processPayment(cardNumber: string, amount: number, email: string): boolean {
        this.logger.log(`Processing $${amount} payment`);
        if (!this.validator.validate(cardNumber)) {
            this.logger.log("Invalid card");
            return false;
        }
        this.processor.charge(amount);
        this.notifier.notify(email);
        this.logger.log("Payment successful");
        return true;
    }
}

// ============================================================
// PART C — Behavioral Patterns
//
// Behavioral patterns are concerned with algorithms and the
// assignment of responsibilities between objects.
// They describe patterns of communication between objects.
// ============================================================

// --- Observer / Event Emitter ---
//
// INTENT: Define a one-to-many dependency so that when the SUBJECT (publisher)
//         changes state, all registered OBSERVERS (subscribers) are notified
//         automatically — without the subject knowing who they are.
//
// KEY IDEA (publish-subscribe):
//   • The subject maintains a list of listener functions per event.
//   • It calls them when an event fires via `emit()`.
//   • It does NOT reference observers directly — total decoupling.
//   • Observers can be added or removed at runtime via `on()` / `off()`.
//
// WHY TYPED? TypeScript generics let us enforce the argument shape for each
//   named event at compile time — e.g., `"login"` always passes `[userId, Date]`.
//   Mismatched listener signatures are caught before runtime.
//
// TypeScript in the wild: Node.js `EventEmitter`, RxJS `Subject/Observable`,
//   DOM `addEventListener`, Redux `store.subscribe`, React `useEffect` deps.
type EventMap = Record<string, unknown[]>;

// Generic, type-safe event emitter.
// `Events` is a map of event-name → tuple of argument types.
class TypedEventEmitter<Events extends EventMap> {
    // Map from event name to the list of registered listener functions.
    private listeners = new Map<keyof Events, Array<(...args: unknown[]) => void>>();

    // Subscribe: add `listener` to the handler list for `event`.
    // Returns `this` for fluent chaining: emitter.on("a", ...).on("b", ...).
    on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
        const handlers = this.listeners.get(event) ?? [];
        handlers.push(listener as (...args: unknown[]) => void);
        this.listeners.set(event, handlers);
        return this;
    }

    // Unsubscribe: remove the specific `listener` from the handler list.
    // Uses reference equality — the same function object passed to `on()`.
    off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
        const handlers = this.listeners.get(event) ?? [];
        this.listeners.set(event, handlers.filter(h => h !== listener));
        return this;
    }

    // Publish: invoke all listeners registered for `event` with the given args.
    // The subject (`emitter`) has no knowledge of how many listeners exist
    // or what they do — that is the power of Observer decoupling.
    emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
        this.listeners.get(event)?.forEach(h => h(...args));
    }
}

// Declare the application's event catalogue with typed argument tuples.
// TypeScript uses this to validate every `.on()` and `.emit()` call.
interface AppEvents extends EventMap {
    login: [userId: string, timestamp: Date];  // two args: string, Date
    logout: [userId: string];                  // one arg: string
    error: [error: Error];                     // one arg: Error
}

const emitter = new TypedEventEmitter<AppEvents>();
// TypeScript enforces that this listener receives (string, Date) — no guessing.
emitter.on("login", (userId, ts) => console.log(`${userId} logged in at ${ts}`));
emitter.emit("login", "user-123", new Date());

// --- Strategy ---
//
// INTENT: Encapsulate a family of interchangeable algorithms behind a common
//         interface so they can be swapped at runtime without changing the
//         "context" object that uses them.
//
// KEY IDEA:
//   • Define an interface (`SortStrategy`) that all algorithms implement.
//   • The context (`Sorter`) holds a reference to the current strategy.
//   • At runtime, call `setStrategy()` to swap algorithms — the context
//     does not care which one runs, only that it has a `sort()` method.
//
// WHY this beats `if/else` chains:
//   Adding a new algorithm means adding a new class — zero changes to `Sorter`.
//   Open/Closed Principle: open for extension, closed for modification.
//
// TypeScript in the wild: `Array.prototype.sort` comparator functions,
//   Passport.js authentication strategies, payment gateway strategy in e-commerce,
//   compression codec selection, validation rule engines.

// The strategy interface — all sorting algorithms must conform to this contract.
interface SortStrategy<T> {
    sort(data: T[]): T[];
}

// Concrete strategy A — O(n²) bubble sort. Simple, slow for large datasets.
class BubbleSort<T> implements SortStrategy<T> {
    sort(data: T[]): T[] {
        const arr = [...data]; // non-destructive: operate on a copy
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                const a = arr[j], b = arr[j + 1];
                if (a != null && b != null && a > b) { // != null guards both null and undefined
                    arr[j] = b;
                    arr[j + 1] = a;
                }
            }
        }
        return arr;
    }
}

// Concrete strategy B — O(n log n) average quicksort. Better for production use.
// Implements the same interface, so it is a drop-in replacement for BubbleSort.
class QuickSort<T> implements SortStrategy<T> {
    sort(data: T[]): T[] {
        if (data.length <= 1) return data; // base case: already sorted
        const pivot = data[Math.floor(data.length / 2)] as T; // length > 1, so always defined
        const left = data.filter(x => x < pivot);
        const mid = data.filter(x => x === pivot);
        const right = data.filter(x => x > pivot);
        return [...this.sort(left), ...mid, ...this.sort(right)];
    }
}

// The context: owns a strategy reference and delegates sorting to it.
// `Sorter` is completely unaware of BubbleSort vs QuickSort internals.
class Sorter<T> {
    constructor(private strategy: SortStrategy<T>) {}

    // Hot-swap the algorithm at runtime — e.g., switch from quick to merge sort
    // based on data size, environment, or user preference.
    setStrategy(strategy: SortStrategy<T>): void { this.strategy = strategy; }

    sort(data: T[]): T[] { return this.strategy.sort(data); }
}

// Start with QuickSort. Could call `sorter.setStrategy(new BubbleSort())` later.
const sorter = new Sorter(new QuickSort<number>());
console.log(sorter.sort([5, 2, 8, 1, 9]));

// --- Command ---
//
// INTENT: Encapsulate a request (action) as a standalone OBJECT.
//         This object captures everything needed to perform AND reverse the action,
//         enabling: undo/redo stacks, operation queuing, audit logging,
//         and deferred/remote execution.
//
// KEY IDEA:
//   • `execute()` performs the action and records enough state to reverse it.
//   • `undo()` restores the previous state using that saved snapshot.
//   • The invoker (`TextEditor`) only deals with the `Command` interface —
//     it does not know whether the command inserts text, deletes it, or formats it.
//
// HOW UNDO WORKS HERE:
//   `InsertCommand.execute()` snapshots `editor.getText()` into `previousText`
//   before making the change. `undo()` restores from that snapshot.
//   The history stack in `TextEditor` keeps all executed commands;
//   `undo()` pops the last one and calls its `undo()`.
//
// TypeScript in the wild: browser History API, Redux actions (every dispatched
//   action is a command object), `monaco-editor` undo stack, transactional
//   migrations in database ORMs, task queues (Bull, BullMQ).

// The command interface — every concrete command must implement both halves.
interface Command {
    execute(): void;
    undo(): void;
}

// The receiver/invoker hybrid: holds state and a history of executed commands.
// It does not know what type of Command it receives — only that it has
// `execute()` and `undo()` methods.
class TextEditor {
    private text = "";
    private history: Command[] = []; // undo stack — LIFO order

    // Execute a command and push it onto the history stack for future undo.
    executeCommand(cmd: Command): void {
        cmd.execute();
        this.history.push(cmd);
    }

    // Pop the most-recent command off the stack and reverse it.
    undo(): void {
        this.history.pop()?.undo();
    }

    getText(): string { return this.text; }
    setText(t: string): void { this.text = t; }
}

// Concrete command: inserts text at the end of the editor's content.
// Carries its own snapshot (`previousText`) so it can self-reverse.
class InsertCommand implements Command {
    // Snapshot taken at execute() time — needed to restore state on undo().
    private previousText = "";

    constructor(
        private editor: TextEditor,
        private textToInsert: string,
    ) {}

    execute(): void {
        // Save a snapshot of current state BEFORE mutating.
        this.previousText = this.editor.getText();
        this.editor.setText(this.previousText + this.textToInsert);
    }

    // Restore the snapshot — effectively reversing the insert.
    undo(): void {
        this.editor.setText(this.previousText);
    }
}

// Demo: two inserts followed by one undo.
const editor = new TextEditor();
editor.executeCommand(new InsertCommand(editor, "Hello"));
editor.executeCommand(new InsertCommand(editor, " World"));
console.log(editor.getText()); // "Hello World"
editor.undo();                 // reverses " World" insert
console.log(editor.getText()); // "Hello"

export {};
console.log("Design Patterns demo complete");
