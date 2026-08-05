/**
 * 08_custom_hooks.jsx
 *
 * Custom Hooks in React
 * --------------------
 * Custom hooks are JavaScript functions whose names start with "use" and that
 * may call other hooks. They let you extract and reuse stateful logic across
 * components without changing the component hierarchy.
 *
 * Rules of Hooks (must be followed inside custom hooks too):
 *   1. Only call hooks at the top level — never inside loops, conditions, or
 *      nested functions. React relies on call order to associate hook state
 *      with the correct component instance.
 *   2. Only call hooks from React function components or other custom hooks —
 *      never from plain JavaScript functions, class components, or callbacks.
 *   3. Name must start with "use" — this lets linters enforce the rules above
 *      and signals to readers that hook rules apply.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

// =============================================================================
// 1. useLocalStorage
// =============================================================================
// Persists state to localStorage so it survives page refreshes.
// Falls back to initialValue when the key does not exist yet.

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        // Allow functional updates just like useState
        const valueToStore =
          typeof value === "function" ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error("useLocalStorage write error:", error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// Demo
export function LocalStorageDemo() {
  const [name, setName] = useLocalStorage("user_name", "");

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "0.5rem" }}>
      <h3>useLocalStorage Demo</h3>
      <p>Value is persisted in localStorage under key "user_name".</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type your name — refresh the page!"
      />
      <p>Stored name: <strong>{name || "(empty)"}</strong></p>
    </div>
  );
}

// =============================================================================
// 2. useFetch
// =============================================================================
// Generic data-fetching hook. Returns { data, loading, error }.
// Re-fetches whenever the url changes. Handles cleanup via AbortController
// so that stale responses from unmounted components are ignored.

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();

    setLoading(true);
    setData(null);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });

    // Cleanup: cancel the in-flight request if url changes or component unmounts
    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Demo
export function FetchDemo() {
  const [userId, setUserId] = useState(1);
  const url = `https://jsonplaceholder.typicode.com/users/${userId}`;
  const { data, loading, error } = useFetch(url);

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "0.5rem" }}>
      <h3>useFetch Demo</h3>
      <label>
        User ID:{" "}
        <input
          type="number"
          min={1}
          max={10}
          value={userId}
          onChange={(e) => setUserId(Number(e.target.value))}
          style={{ width: "4rem" }}
        />
      </label>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data && (
        <pre style={{ background: "#f4f4f4", padding: "0.5rem" }}>
          {JSON.stringify({ id: data.id, name: data.name, email: data.email }, null, 2)}
        </pre>
      )}
    </div>
  );
}

// =============================================================================
// 3. useDebounce
// =============================================================================
// Returns a debounced version of `value` that only updates after `delay` ms
// of inactivity. Useful for search inputs to avoid firing on every keystroke.

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Clear the previous timer if value changes before delay expires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Demo
export function DebounceDemo() {
  const [text, setText] = useState("");
  const debouncedText = useDebounce(text, 500);

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "0.5rem" }}>
      <h3>useDebounce Demo (500 ms)</h3>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type quickly..."
      />
      <p>Raw value: <code>{text}</code></p>
      <p>Debounced value (updates 500 ms after you stop): <code>{debouncedText}</code></p>
    </div>
  );
}

// =============================================================================
// 4. useToggle
// =============================================================================
// Manages a boolean flag and exposes a stable toggle callback.
// Optionally accepts an initial value (default false).

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(Boolean(initialValue));

  // useCallback ensures the toggle reference is stable across renders
  const toggle = useCallback(() => setValue((prev) => !prev), []);

  return [value, toggle];
}

// Demo
export function ToggleDemo() {
  const [isOpen, toggleOpen] = useToggle(false);
  const [isDark, toggleDark] = useToggle(false);

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "0.5rem" }}>
      <h3>useToggle Demo</h3>
      <button onClick={toggleOpen}>
        Modal is {isOpen ? "Open" : "Closed"} — click to toggle
      </button>
      {isOpen && (
        <p style={{ background: "#e8f4fd", padding: "0.5rem" }}>
          Modal content visible!
        </p>
      )}
      <br />
      <button onClick={toggleDark}>
        Theme: {isDark ? "Dark" : "Light"} — click to toggle
      </button>
    </div>
  );
}

// =============================================================================
// 5. useOnClickOutside
// =============================================================================
// Calls `handler` whenever a click (or touch) occurs outside the `ref` element.
// Useful for closing dropdowns, modals, and context menus.

export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if the click is inside the referenced element or its children
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]); // Re-register if ref or handler changes
}

// Demo
export function ClickOutsideDemo() {
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef(null);

  // useCallback keeps handler reference stable so the effect does not re-run unnecessarily
  const handleOutsideClick = useCallback(() => setIsVisible(false), []);
  useOnClickOutside(dropdownRef, handleOutsideClick);

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "0.5rem" }}>
      <h3>useOnClickOutside Demo</h3>
      <button onClick={() => setIsVisible(true)}>Open dropdown</button>
      {isVisible && (
        <div
          ref={dropdownRef}
          style={{
            border: "1px solid #999",
            padding: "0.75rem",
            marginTop: "0.5rem",
            background: "#fff",
            width: "200px",
          }}
        >
          <p style={{ margin: 0 }}>Click outside this box to close it.</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Combined App
// =============================================================================

export default function CustomHooksApp() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "640px", margin: "2rem auto" }}>
      <h1>Custom Hooks Reference</h1>

      <section>
        <h2>Rules of Hooks</h2>
        <ol>
          <li>
            <strong>Call at the top level.</strong> Never inside loops, conditions,
            or nested functions — hook call order must be identical on every render.
          </li>
          <li>
            <strong>Only call from React functions.</strong> Function components and
            other custom hooks are the only valid callers.
          </li>
          <li>
            <strong>Name must start with "use".</strong> This is both a convention
            and a lint-enforced requirement (eslint-plugin-react-hooks).
          </li>
        </ol>
      </section>

      <LocalStorageDemo />
      <FetchDemo />
      <DebounceDemo />
      <ToggleDemo />
      <ClickOutsideDemo />
    </div>
  );
}
