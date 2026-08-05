/**
 * useReducer — React's built-in state machine hook
 *
 * Syntax:
 *   const [state, dispatch] = useReducer(reducerFn, initialState);
 *
 *   reducerFn(state, action) => newState
 *   dispatch({ type: "ACTION_TYPE", payload: ... })
 *
 * Use useReducer over useState when:
 *   - Next state depends on previous state in non-trivial ways
 *   - Multiple sub-values update together (complex object state)
 *   - Action names make state transitions self-documenting
 *   - You want predictable, testable pure reducer functions
 */

import React, {
  useReducer,
  useContext,
  createContext,
  useCallback,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SIMPLE COUNTER — INCREMENT / DECREMENT / RESET
// ─────────────────────────────────────────────────────────────────────────────

const counterInitialState = { count: 0 };

/**
 * Pure reducer — no side effects, no mutations.
 * Returns a brand-new state object for every action.
 */
function counterReducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + (action.payload ?? 1) };
    case "DECREMENT":
      return { count: state.count - (action.payload ?? 1) };
    case "RESET":
      return counterInitialState;
    default:
      // Unknown actions: return state unchanged (never throw in production)
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

export function Counter() {
  const [state, dispatch] = useReducer(counterReducer, counterInitialState);

  return (
    <div>
      <h2>Counter: {state.count}</h2>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+1</button>
      <button onClick={() => dispatch({ type: "INCREMENT", payload: 5 })}>+5</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>-1</button>
      <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPLEX STATE — TODO LIST WITH ADD / TOGGLE / DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * State shape:
 *   { todos: [{ id, text, done }], nextId: number }
 *
 * A single useReducer manages two related sub-values atomically —
 * this is the key advantage over multiple useState calls.
 */

const todoInitialState = {
  todos: [
    { id: 1, text: "Learn useReducer", done: false },
    { id: 2, text: "Build something great", done: false },
  ],
  nextId: 3,
};

function todoReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: state.nextId, text: action.payload, done: false },
        ],
        nextId: state.nextId + 1,
      };

    case "TOGGLE":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload ? { ...t, done: !t.done } : t
        ),
      };

    case "DELETE":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
      };

    case "CLEAR_DONE":
      return { ...state, todos: state.todos.filter((t) => !t.done) };

    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

export function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, todoInitialState);
  const [text, setText] = React.useState("");

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({ type: "ADD", payload: trimmed });
    setText("");
  }

  return (
    <div>
      <h2>Todos ({state.todos.filter((t) => !t.done).length} remaining)</h2>

      <div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New todo..."
        />
        <button onClick={handleAdd}>Add</button>
        <button onClick={() => dispatch({ type: "CLEAR_DONE" })}>
          Clear done
        </button>
      </div>

      <ul>
        {state.todos.map((todo) => (
          <li key={todo.id} style={{ textDecoration: todo.done ? "line-through" : "none" }}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => dispatch({ type: "TOGGLE", payload: todo.id })}
            />
            {todo.text}
            <button onClick={() => dispatch({ type: "DELETE", payload: todo.id })}>
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. useReducer + useContext — REDUX-LITE GLOBAL STATE PATTERN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pattern:
 *   1. Create a Context that holds { state, dispatch }
 *   2. Wrap your tree with a Provider that owns the useReducer call
 *   3. Any child reads state or dispatches actions via useContext
 *
 * This replaces Redux for medium-complexity apps (no middleware needed).
 */

// -- Reducer -----------------------------------------------------------------

const globalInitialState = {
  user: null,        // { name, role }
  theme: "light",   // "light" | "dark"
  notifications: [],
};

function globalReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "TOGGLE_THEME":
      return { ...state, theme: state.theme === "light" ? "dark" : "light" };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { id: Date.now(), message: action.payload },
        ],
      };
    case "DISMISS_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    default:
      throw new Error(`Unknown global action: ${action.type}`);
  }
}

// -- Context + Provider ------------------------------------------------------

const GlobalStateContext = createContext(null);

/**
 * Wrap your root (or sub-tree) with this provider.
 * Children get both state and dispatch from context.
 */
export function GlobalStateProvider({ children }) {
  const [state, dispatch] = useReducer(globalReducer, globalInitialState);

  // Memoize context value to avoid unnecessary re-renders
  // (wrap in useMemo if children are heavy)
  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

/**
 * Custom hook — encapsulates context consumption.
 * Named exports let callers destructure only what they need.
 */
export function useGlobalReducer() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalReducer must be used inside <GlobalStateProvider>");
  }
  return context; // { state, dispatch }
}

// -- Example consumers -------------------------------------------------------

function Toolbar() {
  const { state, dispatch } = useGlobalReducer();

  const login = useCallback(() => {
    dispatch({ type: "LOGIN", payload: { name: "Alice", role: "admin" } });
  }, [dispatch]);

  return (
    <div style={{ background: state.theme === "dark" ? "#333" : "#eee" }}>
      <span>Theme: {state.theme}</span>
      <button onClick={() => dispatch({ type: "TOGGLE_THEME" })}>Toggle Theme</button>
      {state.user ? (
        <>
          <span>Hello, {state.user.name}</span>
          <button onClick={() => dispatch({ type: "LOGOUT" })}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login as Alice</button>
      )}
    </div>
  );
}

function NotificationPanel() {
  const { state, dispatch } = useGlobalReducer();

  return (
    <ul>
      {state.notifications.map((n) => (
        <li key={n.id}>
          {n.message}
          <button onClick={() => dispatch({ type: "DISMISS_NOTIFICATION", payload: n.id })}>
            Dismiss
          </button>
        </li>
      ))}
      <li>
        <button
          onClick={() =>
            dispatch({ type: "ADD_NOTIFICATION", payload: "Something happened!" })
          }
        >
          Add Notification
        </button>
      </li>
    </ul>
  );
}

/** Top-level demo wiring everything together. */
export function GlobalStateDemo() {
  return (
    <GlobalStateProvider>
      <Toolbar />
      <NotificationPanel />
    </GlobalStateProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. IMMER-STYLE UPDATES (mention / pattern)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Immer lets you write "mutating" code that actually produces new state.
 * Install: npm install immer
 *
 *   import produce from "immer";
 *
 *   function immerReducer(state, action) {
 *     return produce(state, (draft) => {
 *       switch (action.type) {
 *         case "TOGGLE":
 *           // Draft mutations are safe — Immer converts to new object
 *           const todo = draft.todos.find((t) => t.id === action.payload);
 *           if (todo) todo.done = !todo.done;
 *           break;
 *         case "DELETE":
 *           const idx = draft.todos.findIndex((t) => t.id === action.payload);
 *           if (idx !== -1) draft.todos.splice(idx, 1);
 *           break;
 *       }
 *       // No return needed — Immer returns the new state automatically
 *     });
 *   }
 *
 * Use when: nested state updates produce deeply nested spread chains.
 * Immer is also the engine behind Redux Toolkit's createSlice.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 5. QUICK-REFERENCE CHEATSHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WHEN TO CHOOSE useReducer OVER useState
 * ────────────────────────────────────────
 * useState is fine when:
 *   - Single primitive value (count, isOpen, text)
 *   - Independent toggles with no cross-dependency
 *
 * Prefer useReducer when:
 *   - Next state depends on prev in complex ways
 *   - Multiple related sub-values update atomically (e.g. todos + nextId)
 *   - State transitions have meaningful names (ADD, TOGGLE, DELETE)
 *   - Logic needs to be unit-tested independently (pure function)
 *   - Shared state flows via Context (Redux-lite pattern above)
 *
 * COMMON PITFALLS
 * ───────────────
 * - Never mutate state directly inside the reducer
 * - dispatch is stable across renders — safe as a useEffect/useCallback dep
 * - Lazy initializer: useReducer(reducer, expensiveArg, initFn)
 *   runs initFn(expensiveArg) only once instead of every render
 */
