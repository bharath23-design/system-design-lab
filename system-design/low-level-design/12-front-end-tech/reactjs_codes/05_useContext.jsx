/**
 * React Context API - Concise Examples
 *
 * Covers:
 * 1. createContext with default value
 * 2. Context Provider wrapping children
 * 3. useContext hook to consume context
 * 4. Theme context (light/dark toggle)
 * 5. Auth context (user login state)
 * 6. Context + useReducer for state management
 * 7. When NOT to use context
 */

import React, {
  createContext,
  useContext,
  useState,
  useReducer,
  useCallback,
} from "react";

// ─────────────────────────────────────────────
// 1. createContext with a default value
//    The default is used ONLY when a component
//    has no matching Provider above it in the tree.
// ─────────────────────────────────────────────
export const ThemeContext = createContext({
  theme: "light",       // default value
  toggleTheme: () => {}, // no-op default
});

// ─────────────────────────────────────────────
// 2. Context Provider wrapping children
//    ThemeProvider owns the state and exposes it.
// ─────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // useCallback avoids recreating the function on every render
  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────
// 3. useContext hook to consume the context
//    ThemeToggle reads theme and calls toggleTheme.
// ─────────────────────────────────────────────
export function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const styles = {
    background: theme === "light" ? "#fff" : "#333",
    color: theme === "light" ? "#333" : "#fff",
    padding: "1rem",
    borderRadius: "4px",
  };

  return (
    <div style={styles}>
      <p>Current theme: <strong>{theme}</strong></p>
      <button onClick={toggleTheme}>
        Switch to {theme === "light" ? "dark" : "light"} mode
      </button>
    </div>
  );
}

// Usage:
// <ThemeProvider>
//   <ThemeToggle />    {/* reads from ThemeContext */}
// </ThemeProvider>


// ─────────────────────────────────────────────
// 5. Auth context — user login state
// ─────────────────────────────────────────────
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = logged out

  const login = useCallback((credentials) => {
    // In a real app: call API, then set user from response
    setUser({ id: 1, name: credentials.username, role: "user" });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — encapsulates useContext + guards
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}

// Consumer example
function LoginStatus() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return (
      <button onClick={() => login({ username: "alice" })}>
        Log in as Alice
      </button>
    );
  }
  return (
    <div>
      <span>Welcome, {user.name}</span>
      <button onClick={logout}>Log out</button>
    </div>
  );
}


// ─────────────────────────────────────────────
// 6. Context + useReducer for complex state
//    Suitable when multiple fields change together
//    or when transitions need clear action names.
// ─────────────────────────────────────────────
const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Expose both state and dispatch so consumers can read and mutate
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}

// Consumer example
function CartSummary() {
  const { state, dispatch } = useCart();
  return (
    <div>
      <p>{state.items.length} item(s) in cart</p>
      <button
        onClick={() =>
          dispatch({ type: "ADD_ITEM", payload: { id: Date.now(), name: "Book" } })
        }
      >
        Add Book
      </button>
      <button onClick={() => dispatch({ type: "CLEAR_CART" })}>
        Clear cart
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────
// 7. When NOT to use Context
//
// Context is NOT a replacement for all prop passing.
//
// USE CONTEXT when:
//   - Data is truly global: current user, locale, theme, feature flags.
//   - Many components at different nesting levels need the same value.
//   - Changing the value should re-render a wide subtree anyway.
//
// AVOID CONTEXT when:
//   - Only 1-2 levels of passing are needed — just use props.
//   - The data changes very frequently (every keystroke, animation frame)
//     because every Context consumer re-renders on each change.
//   - The component is reusable; baking in a specific Context couples it
//     and makes it harder to test in isolation.
//   - You need fine-grained subscriptions — prefer Zustand, Jotai, or
//     Redux Toolkit which avoid the "all consumers re-render" problem.
//
// Rule of thumb: if you find yourself reaching for Context to avoid
// passing a prop through *two* components, step back — prop drilling
// that shallow is perfectly readable and avoids hidden coupling.
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Root composition — wires all providers together
// ─────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ThemeToggle />
          <LoginStatus />
          <CartSummary />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
