// ============================================================
// STATE MANAGEMENT PATTERNS IN TYPESCRIPT
// ============================================================
// State management is one of the hardest problems in UI engineering.
// As apps grow, components need to share data, react to changes, and
// stay in sync — without creating spaghetti of callbacks and globals.
//
// This file covers five foundational patterns, from simple to advanced:
//   A. Observable Store       — subscribe to state changes
//   B. Reducer / Redux-style  — predictable state transitions
//   C. Event Bus / Pub-Sub    — cross-module communication
//   D. Immutable Update Idioms — how to change state safely
//   E. Persistence Layer       — survive page refresh via storage
//
// Each section explains not just HOW but WHY the pattern works.
// ============================================================


// ============================================================
// PART A — SIMPLE STATE STORE (OBSERVABLE PATTERN)
// ============================================================
// Problem: multiple UI components need to read the same piece of data
// and react whenever it changes.
//
// Solution: a single "store" object owns the data. Anyone who wants
// updates calls subscribe() to register a callback. When setState() is
// called the store notifies every listener.
//
// This is the Observer / Pub-Sub pattern applied to application state.
// React's Context, Zustand, and MobX all implement some variant of this.
// ============================================================

// A "Listener" is simply a callback that receives the new state snapshot.
// Using a generic type <T> means one Store class works for any shape of
// state — user profile, shopping cart, theme settings, etc.
type Listener<T> = (state: T) => void;

class Store<T> {
  // The private field holds the current state.
  // It is NEVER exposed by reference — callers always get a copy via getState().
  // This is important: if you hand out the raw reference, callers could mutate
  // the state without going through setState(), breaking the notification system.
  private state: T;

  // An array of listener callbacks. Using an array (not a Set) keeps insertion
  // order, which makes debugging easier — logs fire in the same sequence as
  // subscribe() calls.
  private listeners: Listener<T>[] = [];

  constructor(initialState: T) {
    // Freeze the initial state so accidental mutation throws at runtime (dev mode).
    // Object.freeze() is shallow, so nested objects are still mutable —
    // Part D covers deep immutability strategies.
    this.state = Object.freeze({ ...initialState } as T);
  }

  // ---- getState -------------------------------------------------------
  // Returns a SHALLOW COPY, not the internal reference.
  // Why a copy? Because if you return `this.state` directly, callers can do:
  //   const s = store.getState(); s.count = 99;
  // …and silently corrupt the store without firing any listeners.
  // Shallow spread is cheap and sufficient for top-level primitive fields.
  // If your state has nested objects, see Part D for deep clone strategies.
  getState(): T {
    return { ...this.state };
  }

  // ---- setState -------------------------------------------------------
  // Accepts a PARTIAL update — callers only supply the fields they want to change.
  // The store merges the update with the existing state, creating a NEW object.
  //
  // WHY IMMUTABILITY MATTERS:
  //   1. Predictability: every state change is explicit. No hidden mutation.
  //   2. Undo / Redo: you can store previous state snapshots cheaply.
  //   3. Change detection: `prevState !== newState` is O(1) reference comparison,
  //      vs. deep equality checks which are O(n). React and virtual-DOM frameworks
  //      rely on reference inequality to know when to re-render.
  //   4. Time-travel debugging (Redux DevTools): each snapshot is independent.
  setState(partial: Partial<T>): void {
    const previousState = this.state;

    // Object spread creates a NEW object. `this.state` is never mutated in place.
    // Object.freeze prevents accidental downstream mutation.
    this.state = Object.freeze({ ...this.state, ...partial } as T);

    // Only notify if something actually changed — avoids unnecessary renders.
    // This works because we always produce a new object reference on every setState,
    // so reference equality is a reliable "dirty" check.
    if (this.state !== previousState) {
      this.notify();
    }
  }

  // ---- subscribe ------------------------------------------------------
  // Registers a listener. Returns an unsubscribe function — this "cleanup"
  // pattern avoids memory leaks in components that mount/unmount repeatedly.
  // Usage:
  //   const unsub = store.subscribe(state => render(state));
  //   // later, when the component unmounts:
  //   unsub();
  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);

    // Return an unsubscribe function (closure captures the listener reference).
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // ---- notify ---------------------------------------------------------
  // Private: fans out the current state to every listener.
  // Each listener receives a fresh copy — not the internal reference —
  // so one listener mutating its copy cannot affect another listener's copy.
  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

// --- Usage Example (Part A) ---
interface CounterState {
  count: number;
  label: string;
}

const counterStore = new Store<CounterState>({ count: 0, label: "clicks" });

// Subscribe to changes — the callback fires every time state changes.
const unsubscribeCounter = counterStore.subscribe(state => {
  console.log(`[Store] ${state.label}: ${state.count}`);
});

counterStore.setState({ count: 1 });         // logs: [Store] clicks: 1
counterStore.setState({ count: 2 });         // logs: [Store] clicks: 2
counterStore.setState({ label: "taps" });    // logs: [Store] taps: 2

// Clean up listener (e.g. when a component unmounts).
unsubscribeCounter();
counterStore.setState({ count: 3 });         // no log — listener was removed


// ============================================================
// PART B — REDUCER PATTERN (REDUX-STYLE)
// ============================================================
// Problem: as state gets more complex, ad-hoc setState() calls scatter
// business logic across many files. It becomes hard to answer: "what
// actions can change this state, and how?"
//
// Solution: define ALL possible state transitions as named "actions".
// A "reducer" function maps (currentState, action) => nextState.
// Every transition lives in one place, making the code auditable.
//
// This is the pattern Redux made famous. It is also the foundation of
// React's useReducer hook and Angular's NgRx library.
// ============================================================

// ---- Discriminated Union for Actions --------------------------------
// A discriminated union is a TypeScript technique where each variant
// carries a unique literal `type` field. This allows the compiler to
// narrow the type inside a switch/case, giving you full type safety
// on `payload` without any casts.
//
// Adding a new action? Add a new interface here — TypeScript will flag
// every switch statement that doesn't handle it (if you use `never` exhaustion).
type CounterAction =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" }
  | { type: "SET_COUNT"; payload: number }
  | { type: "SET_LABEL"; payload: string };

// ---- Reducer Function -----------------------------------------------
// Signature: (state: S, action: A) => S
//
// A reducer MUST be a PURE FUNCTION:
//   - Same inputs always produce the same output (deterministic).
//   - No side effects: no API calls, no DOM writes, no Math.random().
//   - Never mutates the input state — always returns a new object.
//
// WHY PURE? Because:
//   1. Testability: you can test every branch with simple unit tests.
//   2. Time-travel debugging: you can replay actions against old state snapshots.
//   3. Optimistic updates: rollback is trivial — just replay without the action.
//   4. Server-side rendering: same state + same actions = same UI everywhere.
function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "INCREMENT":
      // Spread creates a new object. The original `state` is untouched.
      return { ...state, count: state.count + 1 };

    case "DECREMENT":
      // Business rule: count cannot go below zero. Reducers are a great
      // place to enforce invariants — the rule lives next to the data.
      return { ...state, count: Math.max(0, state.count - 1) };

    case "RESET":
      return { ...state, count: 0 };

    case "SET_COUNT":
      // TypeScript narrows `action` to { type: "SET_COUNT"; payload: number }
      // here — no cast needed. This is the power of discriminated unions.
      return { ...state, count: action.payload };

    case "SET_LABEL":
      return { ...state, label: action.payload };

    default:
      // Exhaustiveness check: if a new action type is added to CounterAction
      // but not handled here, TypeScript raises a compile-time error.
      // `never` is the type of an impossible value.
      const _exhaustive: never = action;
      throw new Error(`Unhandled action: ${JSON.stringify(_exhaustive)}`);
  }
}

// ---- createStore with Reducer ---------------------------------------
// This factory function wires the reducer into the Store from Part A.
// The key difference: instead of calling setState() with raw data,
// callers call dispatch() with an action object.
// The store is responsible for passing the action to the reducer and
// applying the returned state.
function createReducerStore<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S
): {
  getState: () => S;
  dispatch: (action: A) => void;
  subscribe: (listener: Listener<S>) => () => void;
} {
  // We reuse our Store<S> internally — the reducer store is just a
  // higher-level wrapper that enforces action-based updates.
  const store = new Store<S>(initialState);

  function dispatch(action: A): void {
    const currentState = store.getState();

    // Call the pure reducer to compute the next state.
    // The reducer does NOT touch the store — it's just a function.
    const nextState = reducer(currentState, action);

    // Apply the computed state. Because the reducer is pure and returns
    // a new object, setState() will detect the change and notify listeners.
    store.setState(nextState as Partial<S>);
  }

  return {
    getState: store.getState.bind(store),
    dispatch,
    subscribe: store.subscribe.bind(store),
  };
}

// --- Usage Example (Part B) ---
const reducerStore = createReducerStore(counterReducer, { count: 0, label: "items" });

reducerStore.subscribe(state => {
  console.log(`[Reducer Store] ${state.label}: ${state.count}`);
});

reducerStore.dispatch({ type: "INCREMENT" });            // 1
reducerStore.dispatch({ type: "INCREMENT" });            // 2
reducerStore.dispatch({ type: "DECREMENT" });            // 1
reducerStore.dispatch({ type: "SET_COUNT", payload: 10 }); // 10
reducerStore.dispatch({ type: "RESET" });                // 0


// ============================================================
// PART C — SIMPLE EVENT BUS / PUB-SUB
// ============================================================
// Problem: two modules (say, a payment module and a notification module)
// need to communicate, but we don't want them to import each other.
// Direct imports create coupling — if PaymentModule imports NotificationModule,
// you can't use one without the other, and testing either becomes harder.
//
// Solution: a shared EventBus. PaymentModule emits "payment:completed".
// NotificationModule listens for "payment:completed". Neither knows the
// other exists. The bus is the only shared dependency.
//
// This is the classic Observer pattern applied at the module level.
// Browser's addEventListener/dispatchEvent does exactly this for DOM events.
// Node.js EventEmitter is another well-known implementation.
//
// Trade-off: event buses can make data flow hard to trace ("who emits this?").
// Use them for truly cross-cutting concerns (logging, analytics, notifications),
// not as a substitute for direct prop/callback passing in tightly related UI.
// ============================================================

// Define all event names and their payload types in one map.
// This gives us type-safe on/emit calls — the compiler knows exactly what
// payload type is associated with each event name.
interface AppEvents {
  "user:login": { userId: string; email: string };
  "user:logout": { userId: string };
  "cart:updated": { itemCount: number; total: number };
  "payment:completed": { orderId: string; amount: number };
  "notification:show": { message: string; level: "info" | "warn" | "error" };
}

// Generic handler type: a callback receiving the payload for event K.
type EventHandler<K extends keyof AppEvents> = (payload: AppEvents[K]) => void;

class EventBus {
  // Map from event name to array of handlers.
  // We use `unknown[]` internally to avoid complex generics in the storage map,
  // then cast safely inside each typed method.
  private handlers: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  // ---- on -------------------------------------------------------------
  // Register a handler for an event. Returns an unsubscribe function.
  // Using a return-unsubscribe pattern (vs. a separate off() call with the
  // same function reference) is more ergonomic and avoids reference equality bugs.
  on<K extends keyof AppEvents>(
    event: K,
    handler: EventHandler<K>
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    // Cast: we store the handler as `unknown[]`-typed function but the caller
    // supplied a correctly typed one. The `on`/`emit` pair enforces consistency.
    this.handlers.get(event)!.push(handler as (...args: unknown[]) => void);

    // Return unsubscribe closure.
    return () => this.off(event, handler);
  }

  // ---- off ------------------------------------------------------------
  // Remove a specific handler for an event.
  // Named removal is useful when the "unsubscribe" approach is inconvenient
  // (e.g., you want to remove a handler from a different code path than where
  // you subscribed). Requires keeping the original function reference.
  off<K extends keyof AppEvents>(
    event: K,
    handler: EventHandler<K>
  ): void {
    const list = this.handlers.get(event);
    if (!list) return;
    this.handlers.set(
      event,
      list.filter(h => h !== (handler as (...args: unknown[]) => void))
    );
  }

  // ---- emit -----------------------------------------------------------
  // Publish an event. All registered handlers for that event are called
  // synchronously in registration order.
  //
  // Why synchronous? Simpler mental model — the emitter knows all handlers
  // have run by the time emit() returns. For async handlers, you'd need
  // Promise.all semantics and error handling gets complex. Start sync,
  // add async only when you have a concrete need.
  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
    const list = this.handlers.get(event);
    if (!list || list.length === 0) return;

    // Snapshot the list before iterating: if a handler calls off() during
    // emit(), we don't want to skip the next handler or cause index errors.
    [...list].forEach(handler => {
      try {
        handler(payload as unknown);
      } catch (err) {
        // Isolate handler errors — one bad handler should not silence others.
        console.error(`[EventBus] Error in handler for "${String(event)}":`, err);
      }
    });
  }

  // ---- once -----------------------------------------------------------
  // Register a handler that auto-removes itself after firing once.
  // Useful for "wait for the next login event" patterns.
  once<K extends keyof AppEvents>(
    event: K,
    handler: EventHandler<K>
  ): () => void {
    const wrapper: EventHandler<K> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

// Singleton pattern: export a single EventBus instance for the whole app.
// Modules import THIS instance, not the class, ensuring they share one bus.
const eventBus = new EventBus();

// --- Usage Example (Part C) ---

// Notification module subscribes — it doesn't know about PaymentModule.
eventBus.on("payment:completed", ({ orderId, amount }) => {
  console.log(`[Notifications] Order ${orderId} paid: $${amount}`);
});

// Analytics module also subscribes to the same event independently.
eventBus.on("payment:completed", ({ orderId }) => {
  console.log(`[Analytics] Tracking conversion for order ${orderId}`);
});

// Payment module emits — it doesn't know who is listening.
eventBus.emit("payment:completed", { orderId: "ORD-42", amount: 99.99 });
// Both handlers fire: notifications and analytics both respond.

// once() example: run setup only on the very first login.
eventBus.once("user:login", ({ userId }) => {
  console.log(`[Onboarding] First login for ${userId} — showing tour`);
});


// ============================================================
// PART D — IMMUTABLE UPDATE PATTERNS
// ============================================================
// "Immutable" means: never modify a value in place. Instead, produce a
// new value that incorporates the change.
//
// Why does this matter so much in state management?
//   - Frameworks like React use reference comparison (===) to detect changes.
//     If you mutate an object in place, the reference stays the same, and
//     React (or your store) won't know anything changed.
//   - Immutability makes state history trivial: just keep an array of snapshots.
//   - Concurrent rendering (React 18+) replays render functions; mutable state
//     causes race conditions that are almost impossible to debug.
// ============================================================

// ---- Objects: spread operator ----------------------------------------
// Shallow spread creates a new top-level object but shares nested references.
// This is fine for flat state, but see the "deep clone" section for nested objects.
interface UserProfile {
  id: string;
  name: string;
  address: {
    city: string;
    zip: string;
  };
}

const originalProfile: UserProfile = {
  id: "u1",
  name: "Alice",
  address: { city: "Austin", zip: "78701" },
};

// WRONG — mutates the original, breaks reference equality checks:
// originalProfile.name = "Bob"; // <-- never do this

// CORRECT — new top-level object, name updated:
const updatedName: UserProfile = { ...originalProfile, name: "Bob" };

// CORRECT — nested object update requires spreading the nested level too:
// If you only spread the top level, `address` is still a SHARED reference,
// so mutating `updatedCity.address` would also mutate `originalProfile.address`.
const updatedCity: UserProfile = {
  ...originalProfile,
  address: { ...originalProfile.address, city: "Denver" },
};

// At this point:
// originalProfile.address.city === "Austin"  ✓ unchanged
// updatedCity.address.city === "Denver"       ✓ new value

// ---- Arrays: immutable operations ------------------------------------
// JavaScript arrays have two kinds of methods:
//   MUTATING  (never use in state): push, pop, shift, unshift, splice, sort, reverse
//   RETURNING NEW (safe to use):    map, filter, reduce, slice, concat, spread
//
// The key rule: if a method returns a new array, it's immutable-safe.
// If it returns undefined (or the removed element), it mutated in place.

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

const todos: TodoItem[] = [
  { id: 1, text: "Buy milk", done: false },
  { id: 2, text: "Write code", done: true },
  { id: 3, text: "Exercise", done: false },
];

// ADD an item — spread existing items, append new one:
const afterAdd: TodoItem[] = [
  ...todos,
  { id: 4, text: "Read book", done: false },
];
// Never: todos.push({ id: 4, ... })

// REMOVE an item by id — filter creates a new array excluding the match:
const afterRemove: TodoItem[] = todos.filter(t => t.id !== 2);
// Never: todos.splice(1, 1)

// UPDATE an item — map creates a new array; only the matching item gets a new object:
const afterUpdate: TodoItem[] = todos.map(t =>
  t.id === 1 ? { ...t, done: true } : t
  // Items that didn't change return the SAME reference — React can skip re-rendering
  // those list items because their reference didn't change.
);

// SORT immutably — .sort() mutates in place, so slice first to copy:
const sorted: TodoItem[] = [...todos].sort((a, b) => a.id - b.id);
// Or in ES2023+: todos.toSorted((a, b) => a.id - b.id);

// ---- Shallow vs Deep Clone ------------------------------------------
// Spread (`{ ...obj }`) is SHALLOW: it copies top-level keys only.
// Nested objects are still shared references.
//
// Shallow clone is the right default — it's fast and sufficient when you
// spread nested objects manually (as shown above with `address`).
//
// Deep clone copies EVERY nested level into new objects. Use it when:
//   - You don't control the shape of the data (e.g., third-party API responses).
//   - The nesting depth is variable or unknown.
//   - You want a "snapshot" to compare against later without risk of drift.

// Method 1: JSON round-trip (legacy, commonly seen in older codebases)
// Pros: simple, no dependencies
// Cons: loses Date objects (converted to strings), loses undefined values,
//       loses functions, cannot handle circular references, slower than structuredClone
function jsonDeepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Method 2: structuredClone() — modern standard (Node 17+, all modern browsers)
// Pros: handles Date, RegExp, Map, Set, ArrayBuffer, circular references
// Cons: cannot clone functions or DOM nodes
// This is the RECOMMENDED approach for deep cloning plain data objects.
const deepClonedProfile = structuredClone(originalProfile);
deepClonedProfile.address.city = "Seattle"; // does NOT affect originalProfile

// Method 3: recursive custom clone — only needed for exotic types or legacy environments.
// Not shown here; prefer structuredClone when available.

// ---- Practical Guideline --------------------------------------------
// Use shallow spread (fast, explicit) for state updates in reducers.
// Use structuredClone for snapshots, undo/redo history, or when passing
// data across module boundaries where you must guarantee independence.


// ============================================================
// PART E — PERSISTENCE LAYER
// ============================================================
// In-memory state dies when the page reloads.
// For state that should survive refresh (user preferences, auth tokens,
// draft form data), we need to persist to Web Storage.
//
// Two options:
//   localStorage  — persists indefinitely (until cleared by user or code).
//                   Survives browser restart. Per-origin, not per-tab.
//   sessionStorage — persists only for the current browser tab/session.
//                   Cleared when the tab is closed. Useful for transient
//                   wizard/stepper state that shouldn't persist across sessions.
//
// Both are synchronous and limited to ~5MB strings.
// For larger or structured data, consider IndexedDB.
// ============================================================

// ---- Generic LocalStorage Wrapper -----------------------------------
// The raw localStorage API works with strings only. This wrapper adds:
//   1. Type safety via generics — TypeScript knows the shape you expect.
//   2. JSON serialization/deserialization — store any serializable value.
//   3. Error handling — localStorage can throw (storage full, private mode).
//   4. Default value — avoids null checks at every call site.

class TypedStorage<T> {
  private readonly key: string;
  private readonly defaultValue: T;
  private readonly storage: Storage;

  // Accept storage as a parameter so the same class works for both
  // localStorage and sessionStorage — dependency injection at its simplest.
  constructor(key: string, defaultValue: T, storage: Storage = localStorage) {
    this.key = key;
    this.defaultValue = defaultValue;
    this.storage = storage;
  }

  // ---- get -----------------------------------------------------------
  // Reads and deserializes the stored value.
  // Why try/catch? Two reasons:
  //   1. JSON.parse throws on malformed data (corrupted storage, manual edits).
  //   2. Reading localStorage can throw SecurityError in certain iframe contexts.
  // On any error, we return the defaultValue — the app degrades gracefully.
  get(): T {
    try {
      const raw = this.storage.getItem(this.key);
      if (raw === null) {
        // Key doesn't exist yet — first run or was cleared.
        return this.defaultValue;
      }
      // JSON.parse returns `unknown`, so we cast to T.
      // In production code, add a runtime validator (zod, etc.) to ensure
      // the shape matches — storage can contain data from old app versions.
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[TypedStorage] Failed to read key "${this.key}":`, err);
      return this.defaultValue;
    }
  }

  // ---- set -----------------------------------------------------------
  // Serializes and stores the value.
  // Returns a boolean so callers know if the write succeeded —
  // important for "offline/quota exceeded" error handling.
  set(value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(this.key, serialized);
      return true;
    } catch (err) {
      // DOMException: QuotaExceededError — storage is full.
      // Common on mobile browsers with strict per-origin quotas (~2MB on iOS Safari).
      console.error(`[TypedStorage] Failed to write key "${this.key}":`, err);
      return false;
    }
  }

  // ---- update --------------------------------------------------------
  // Reads current value, applies a partial update, writes back.
  // This is a convenience method that avoids the read-modify-write boilerplate
  // at every call site. Uses immutable spread (see Part D).
  update(partial: Partial<T>): boolean {
    const current = this.get();
    const next = { ...current, ...partial };
    return this.set(next);
  }

  // ---- remove --------------------------------------------------------
  // Deletes the key from storage. Use when the user logs out, clears data, etc.
  remove(): void {
    try {
      this.storage.removeItem(this.key);
    } catch (err) {
      console.warn(`[TypedStorage] Failed to remove key "${this.key}":`, err);
    }
  }

  // ---- exists --------------------------------------------------------
  // Returns true if the key is present (regardless of value).
  // Useful for "has the user seen the onboarding?" style checks.
  exists(): boolean {
    return this.storage.getItem(this.key) !== null;
  }
}

// ---- Persist-Aware Store -------------------------------------------
// Combines the Observable Store from Part A with the TypedStorage above.
// On construction, it hydrates from storage. On every setState(), it
// automatically persists the new state.
//
// This pattern ("hydrate on init, persist on change") is what Redux Persist
// and Zustand's persist middleware implement.

class PersistentStore<T extends object> extends Store<T> {
  private storage: TypedStorage<T>;

  constructor(key: string, defaultState: T, useSession = false) {
    // Determine which storage backend to use.
    const backend = useSession ? sessionStorage : localStorage;
    const typedStorage = new TypedStorage<T>(key, defaultState, backend);

    // Hydrate: read from storage (or fall back to defaultState if not found).
    // This is why the state survives a page refresh — we initialize the store
    // with the last-saved value, not the hardcoded default.
    const hydratedState = typedStorage.get();

    super(hydratedState);
    this.storage = typedStorage;

    // Auto-persist: subscribe to our own store and write to storage on every change.
    // Using `bind(this)` so `this` refers to the PersistentStore inside the callback.
    this.subscribe(this.persistState.bind(this));
  }

  private persistState(state: T): void {
    const success = this.storage.set(state);
    if (!success) {
      // Storage write failed (quota exceeded?). You might emit a "storage:error"
      // event here so the UI can show a warning banner.
      console.error("[PersistentStore] Could not persist state — storage write failed.");
    }
  }

  // clearPersisted: wipe from storage (e.g. on logout).
  // The in-memory store keeps running; only the persisted copy is removed.
  clearPersisted(): void {
    this.storage.remove();
  }
}

// --- Usage Examples (Part E) ---

// Simple typed localStorage wrapper:
interface UserPreferences {
  theme: "light" | "dark";
  fontSize: number;
  language: string;
}

const prefsStorage = new TypedStorage<UserPreferences>(
  "user_prefs",
  { theme: "light", fontSize: 14, language: "en" }
);

// First run: returns default { theme: "light", fontSize: 14, language: "en" }
const prefs = prefsStorage.get();
console.log("[Storage] Loaded prefs:", prefs);

// Update just the theme — other fields are preserved via spread:
prefsStorage.update({ theme: "dark" });
console.log("[Storage] Updated prefs:", prefsStorage.get());

// SessionStorage for transient checkout wizard state:
interface CheckoutState {
  step: number;
  shippingAddress: string;
  paymentMethod: string;
}

const checkoutStorage = new TypedStorage<CheckoutState>(
  "checkout_wizard",
  { step: 1, shippingAddress: "", paymentMethod: "" },
  sessionStorage  // clears when the tab is closed — appropriate for checkout
);

// Persistent store that auto-saves to localStorage:
const persistentCounter = new PersistentStore<CounterState>(
  "counter_v1",
  { count: 0, label: "visits" }
);

persistentCounter.subscribe(state => {
  console.log(`[Persistent] State: ${state.label} = ${state.count}`);
});

persistentCounter.setState({ count: persistentCounter.getState().count + 1 });
// State is automatically saved to localStorage["counter_v1"] after each setState.

// On next page load, PersistentStore will hydrate with the saved count
// rather than restarting from 0.


// ============================================================
// SUMMARY — When to Use Which Pattern
// ============================================================
// Store<T>            — small, local state shared between a few components.
//                       (React alternative: useState + Context)
//
// createReducerStore  — complex state with many transition types.
//                       Use when you want an audit log of "what happened".
//                       (React alternative: useReducer)
//
// EventBus            — cross-module communication where direct coupling is wrong.
//                       Logging, analytics, toast notifications, auth events.
//                       Avoid for primary data flow — prefer explicit props/stores.
//
// Immutable updates   — everywhere, always. Never mutate state in place.
//                       Use spread for known shapes, structuredClone for snapshots.
//
// PersistentStore     — user preferences, auth tokens, draft data.
//                       Choose localStorage for "survive restart",
//                       sessionStorage for "survive refresh but not tab close".
// ============================================================
