/**
 * React Component Composition Patterns
 *
 * Patterns covered:
 * 1. Compound Components  - Tabs/Tab, shared state via Context
 * 2. Render Props         - DataProvider exposes data through a function child
 * 3. Higher-Order Components (HOC) - withAuth, withLoading
 * 4. Children as Function - explicit "function as children"
 * 5. Slot Pattern         - named children props (header/footer/body)
 * 6. Polymorphic Component - <Box as="section" /> via `as` prop
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

// ─────────────────────────────────────────────
// 1. COMPOUND COMPONENTS — Tabs / Tab
// ─────────────────────────────────────────────

const TabsContext = createContext(null);

/**
 * <Tabs> owns the active-tab state and exposes it through context.
 * <Tab> reads context — no prop-drilling needed.
 *
 * Usage:
 *   <Tabs defaultTab="a">
 *     <Tab id="a">First</Tab>
 *     <Tab id="b">Second</Tab>
 *   </Tabs>
 */
export function Tabs({ defaultTab, children }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div role="tablist" style={{ display: "flex", gap: 8 }}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function Tab({ id, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === id;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(id)}
      style={{
        fontWeight: isActive ? "bold" : "normal",
        borderBottom: isActive ? "2px solid blue" : "2px solid transparent",
        background: "none",
        cursor: "pointer",
        padding: "4px 12px",
      }}
    >
      {children}
    </button>
  );
}

// Compound Select/Option mirrors the same pattern
const SelectContext = createContext(null);

export function Select({ value, onChange, children }) {
  return (
    <SelectContext.Provider value={{ value, onChange }}>
      <ul role="listbox" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {children}
      </ul>
    </SelectContext.Provider>
  );
}

export function Option({ value: optValue, children }) {
  const { value, onChange } = useContext(SelectContext);
  const selected = value === optValue;
  return (
    <li
      role="option"
      aria-selected={selected}
      onClick={() => onChange(optValue)}
      style={{ background: selected ? "#e0e7ff" : "transparent", padding: "4px 8px", cursor: "pointer" }}
    >
      {children}
    </li>
  );
}

// ─────────────────────────────────────────────
// 2. RENDER PROPS — DataProvider
// ─────────────────────────────────────────────

/**
 * DataProvider fetches from `url` and calls `children` with { data, loading, error }.
 * The consumer decides how to render — full inversion of control.
 *
 * Usage:
 *   <DataProvider url="/api/users">
 *     {({ data, loading, error }) => loading ? <Spinner /> : <List items={data} />}
 *   </DataProvider>
 */
export function DataProvider({ url, children }) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });

    return () => { cancelled = true; };
  }, [url]);

  return children(state);
}

// ─────────────────────────────────────────────
// 3. HIGHER-ORDER COMPONENTS — withAuth, withLoading
// ─────────────────────────────────────────────

/**
 * withAuth — redirects unauthenticated users.
 * Wraps any component and gates render on `isAuthenticated` from a fake auth hook.
 */
function useAuth() {
  // Replace with real auth context in production
  return { isAuthenticated: true, user: { name: "Alice" } };
}

export function withAuth(WrappedComponent) {
  function AuthenticatedComponent(props) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
      return <p style={{ color: "red" }}>Please log in to view this page.</p>;
    }
    return <WrappedComponent {...props} />;
  }
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return AuthenticatedComponent;
}

/**
 * withLoading — shows a spinner while `isLoading` prop is true.
 */
export function withLoading(WrappedComponent, loadingMessage = "Loading...") {
  function WithLoadingComponent({ isLoading, ...rest }) {
    if (isLoading) return <p>{loadingMessage}</p>;
    return <WrappedComponent {...rest} />;
  }
  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithLoadingComponent;
}

// Example usage of HOCs
function UserProfile({ user }) {
  return <div>Welcome, {user?.name}</div>;
}
export const ProtectedProfile = withAuth(withLoading(UserProfile));

// ─────────────────────────────────────────────
// 4. CHILDREN AS FUNCTION
// ─────────────────────────────────────────────

/**
 * Toggle exposes its boolean state by calling children as a function.
 * Pure "children as function" — no context needed.
 *
 * Usage:
 *   <Toggle initialOn={false}>
 *     {({ on, toggle }) => (
 *       <button onClick={toggle}>{on ? "ON" : "OFF"}</button>
 *     )}
 *   </Toggle>
 */
export function Toggle({ initialOn = false, children }) {
  const [on, setOn] = useState(initialOn);
  const toggle = () => setOn((prev) => !prev);
  return children({ on, toggle });
}

/**
 * MouseTracker uses children-as-function to share pointer coordinates.
 *
 * Usage:
 *   <MouseTracker>
 *     {({ x, y }) => <p>Mouse at {x},{y}</p>}
 *   </MouseTracker>
 */
export function MouseTracker({ children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      style={{ height: 120, border: "1px dashed #ccc" }}
    >
      {children(pos)}
    </div>
  );
}

// ─────────────────────────────────────────────
// 5. SLOT PATTERN — Modal with named children props
// ─────────────────────────────────────────────

/**
 * Modal accepts named slot props: header, body, footer.
 * Consumers pass JSX for each region; Modal owns the layout.
 *
 * Usage:
 *   <Modal
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     header={<h2>Title</h2>}
 *     footer={<button onClick={() => setOpen(false)}>Close</button>}
 *   >
 *     <p>Modal body content here.</p>
 *   </Modal>
 */
export function Modal({ isOpen, onClose, header, footer, children }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 8, minWidth: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* header slot */}
        {header && (
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            {header}
            <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>
              &times;
            </button>
          </div>
        )}

        {/* body slot — default children */}
        <div style={{ padding: "16px" }}>{children}</div>

        {/* footer slot */}
        {footer && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #e5e7eb",
              display: "flex", justifyContent: "flex-end", gap: 8,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 6. POLYMORPHIC COMPONENT — Box with `as` prop
// ─────────────────────────────────────────────

/**
 * Box renders as any HTML element (or component) via the `as` prop.
 * Consumers get consistent styling + semantically correct markup.
 *
 * Usage:
 *   <Box as="section" style={{ padding: 16 }}>content</Box>
 *   <Box as="article">...</Box>
 *   <Box as={Link} to="/home">Home</Box>
 */
export function Box({ as: Component = "div", children, style, ...rest }) {
  const baseStyle = { boxSizing: "border-box", ...style };
  return (
    <Component style={baseStyle} {...rest}>
      {children}
    </Component>
  );
}

/**
 * Button — polymorphic button that can render as <a> for link-style buttons.
 *
 * Usage:
 *   <PolyButton as="a" href="/docs" variant="outline">Docs</PolyButton>
 *   <PolyButton variant="primary" onClick={handleClick}>Submit</PolyButton>
 */
const variantStyles = {
  primary: { background: "#3b82f6", color: "#fff", border: "none" },
  outline: { background: "transparent", color: "#3b82f6", border: "1px solid #3b82f6" },
  ghost:   { background: "transparent", color: "#374151", border: "none" },
};

export function PolyButton({ as: Component = "button", variant = "primary", children, style, ...rest }) {
  const combined = {
    ...variantStyles[variant],
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 500,
    textDecoration: "none",
    display: "inline-block",
    ...style,
  };
  return (
    <Component style={combined} {...rest}>
      {children}
    </Component>
  );
}

// ─────────────────────────────────────────────
// DEMO — puts all patterns together
// ─────────────────────────────────────────────

export default function CompositionDemo() {
  const [selectVal, setSelectVal] = useState("react");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box as="main" style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>Component Composition Patterns</h1>

      {/* 1. Compound Components */}
      <section>
        <h2>1. Compound Components — Tabs</h2>
        <Tabs defaultTab="overview">
          <Tab id="overview">Overview</Tab>
          <Tab id="details">Details</Tab>
          <Tab id="settings">Settings</Tab>
        </Tabs>

        <h3 style={{ marginTop: 16 }}>Select / Option</h3>
        <Select value={selectVal} onChange={setSelectVal}>
          <Option value="react">React</Option>
          <Option value="vue">Vue</Option>
          <Option value="svelte">Svelte</Option>
        </Select>
        <p>Selected: <strong>{selectVal}</strong></p>
      </section>

      <hr />

      {/* 2. Render Props */}
      <section>
        <h2>2. Render Props — DataProvider</h2>
        <DataProvider url="https://jsonplaceholder.typicode.com/todos/1">
          {({ data, loading, error }) => {
            if (loading) return <p>Loading...</p>;
            if (error)   return <p style={{ color: "red" }}>Error: {error.message}</p>;
            return <pre style={{ background: "#f3f4f6", padding: 8, borderRadius: 4 }}>{JSON.stringify(data, null, 2)}</pre>;
          }}
        </DataProvider>
      </section>

      <hr />

      {/* 3. HOC */}
      <section>
        <h2>3. Higher-Order Components</h2>
        <ProtectedProfile isLoading={false} user={{ name: "Alice" }} />
      </section>

      <hr />

      {/* 4. Children as Function */}
      <section>
        <h2>4. Children as Function</h2>
        <Toggle initialOn={false}>
          {({ on, toggle }) => (
            <button onClick={toggle} style={{ padding: "6px 14px" }}>
              Toggle is <strong>{on ? "ON" : "OFF"}</strong>
            </button>
          )}
        </Toggle>

        <h3>Mouse Tracker</h3>
        <MouseTracker>
          {({ x, y }) => (
            <p style={{ margin: 0, paddingTop: 8 }}>
              Mouse: ({x}, {y})
            </p>
          )}
        </MouseTracker>
      </section>

      <hr />

      {/* 5. Slot Pattern */}
      <section>
        <h2>5. Slot Pattern — Modal</h2>
        <PolyButton onClick={() => setModalOpen(true)}>Open Modal</PolyButton>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          header={<h3 style={{ margin: 0 }}>Confirm Action</h3>}
          footer={
            <>
              <PolyButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</PolyButton>
              <PolyButton variant="primary" onClick={() => setModalOpen(false)}>Confirm</PolyButton>
            </>
          }
        >
          <p>Are you sure you want to proceed? This action cannot be undone.</p>
        </Modal>
      </section>

      <hr />

      {/* 6. Polymorphic Component */}
      <section>
        <h2>6. Polymorphic Component</h2>
        <Box as="section" style={{ background: "#f9fafb", padding: 12, borderRadius: 6, marginBottom: 8 }}>
          This div is rendered as a &lt;section&gt;
        </Box>
        <Box as="article" style={{ background: "#eff6ff", padding: 12, borderRadius: 6 }}>
          This div is rendered as an &lt;article&gt;
        </Box>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <PolyButton variant="primary">Primary</PolyButton>
          <PolyButton variant="outline">Outline</PolyButton>
          <PolyButton as="a" href="#" variant="ghost">Ghost Link</PolyButton>
        </div>
      </section>
    </Box>
  );
}
