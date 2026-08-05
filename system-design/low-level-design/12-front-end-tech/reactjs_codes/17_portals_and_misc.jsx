/**
 * 17_portals_and_misc.jsx
 *
 * Covers:
 *  1. ReactDOM.createPortal - render outside the DOM tree
 *  2. Modal using portal
 *  3. StrictMode - double-invokes effects in dev to catch side effects
 *  4. Profiler API - measure rendering performance
 *  5. cloneElement - inject props into children
 *  6. createRef vs useRef
 *  7. flushSync - force synchronous state update (React 18)
 */

import React, {
  useState,
  useEffect,
  useRef,
  createRef,
  cloneElement,
  Profiler,
  StrictMode,
  Component,
} from "react";
import ReactDOM, { createPortal, flushSync } from "react-dom";

// ---------------------------------------------------------------------------
// 1 & 2. ReactDOM.createPortal — Modal rendered into document.body
//        The modal DOM node lives outside #root, but React events still bubble
//        through the React component tree (not the DOM tree).
// ---------------------------------------------------------------------------

function ModalOverlay({ onClose, children }) {
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };
  const boxStyle = {
    background: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    minWidth: "320px",
    position: "relative",
  };

  // Trap focus: close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      {/* Stop click from bubbling to overlay and closing unintentionally */}
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 8, right: 8 }}
          aria-label="Close modal"
        >
          x
        </button>
        {children}
      </div>
    </div>
  );
}

/**
 * Modal - renders its overlay into document.body via a portal so it is
 * visually above everything else regardless of parent CSS stacking context.
 */
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  // createPortal(reactElement, domNode)
  // The second argument is where in the real DOM the element is inserted.
  return createPortal(
    <ModalOverlay onClose={onClose}>
      {title && <h2 style={{ marginTop: 0 }}>{title}</h2>}
      {children}
    </ModalOverlay>,
    document.body // mount point outside #root
  );
}

// Usage demo (not exported)
function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Hello Portal">
        <p>This content is rendered in document.body, not inside #root.</p>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2b. Tooltip using portal
//     Tooltip anchors to the trigger element position but lives in body,
//     avoiding overflow:hidden clipping from parent containers.
// ---------------------------------------------------------------------------

/**
 * Tooltip - a lightweight portal-based tooltip.
 * Usage: wrap any element and the tooltip follows the trigger's position.
 */
export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const show = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }
    setVisible(true);
  };

  const tooltipStyle = {
    position: "absolute",
    top: coords.top,
    left: coords.left,
    background: "#333",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    pointerEvents: "none",
    zIndex: 9999,
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        style={{ display: "inline-block" }}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div style={tooltipStyle}>{text}</div>,
          document.body
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 3. StrictMode
//    - Wraps any subtree (does NOT affect production builds).
//    - In development: double-invokes render functions, state initializers,
//      and useEffect cleanup/setup pairs to surface impure side effects.
//    - Also warns about deprecated APIs.
// ---------------------------------------------------------------------------

function SideEffectChild() {
  useEffect(() => {
    // In StrictMode dev, this logs TWICE: mount → unmount → mount.
    console.log("Effect mounted");
    return () => console.log("Effect cleaned up");
  }, []);
  return <p>Check the console — StrictMode double-invokes this effect.</p>;
}

/**
 * StrictModeApp - wraps a subtree in React.StrictMode.
 * The wrapper itself has no visual output; it only changes dev behavior.
 */
export function StrictModeApp() {
  return (
    <StrictMode>
      <div style={{ border: "2px dashed orange", padding: "1rem" }}>
        <h3>Inside StrictMode</h3>
        <SideEffectChild />
      </div>
    </StrictMode>
  );
}

// ---------------------------------------------------------------------------
// 4. Profiler API
//    <Profiler id="..." onRender={callback}> wraps a subtree.
//    callback signature:
//      (id, phase, actualDuration, baseDuration, startTime, commitTime)
//    phase: "mount" | "update" | "nested-update"
//    actualDuration: time to render the profiled tree (ms)
//    baseDuration:   estimated time without memoization
// ---------------------------------------------------------------------------

function onRenderCallback(id, phase, actualDuration, baseDuration) {
  console.table({ id, phase, actualDuration: `${actualDuration.toFixed(2)}ms`, baseDuration: `${baseDuration.toFixed(2)}ms` });
}

function ExpensiveList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * ProfiledComponent - wraps ExpensiveList in a Profiler to log timing.
 * In production builds the Profiler is a no-op (zero overhead).
 */
export function ProfiledComponent() {
  const [items, setItems] = useState(["Apple", "Banana", "Cherry"]);

  return (
    <div>
      <button onClick={() => setItems((prev) => [...prev, `Item ${prev.length + 1}`])}>
        Add Item
      </button>
      {/* Profiler wraps the subtree you want to measure */}
      <Profiler id="ExpensiveList" onRender={onRenderCallback}>
        <ExpensiveList items={items} />
      </Profiler>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. cloneElement - inject/override props into an existing React element.
//    Common use cases: design systems injecting className, size, or callbacks
//    into children without requiring children to accept them explicitly.
// ---------------------------------------------------------------------------

/**
 * ButtonGroup - clones each child and injects shared props.
 * Children retain their own props; injected props can be overridden per child.
 */
function ButtonGroup({ children, size = "md", variant = "primary" }) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        // cloneElement(element, extraProps, ...newChildren)
        return cloneElement(child, {
          "data-size": size,
          "data-variant": variant,
          // children's own onClick is preserved via spread inside cloneElement
        });
      })}
    </div>
  );
}

function CloneElementDemo() {
  return (
    <ButtonGroup size="lg" variant="outline">
      <button onClick={() => console.log("Save")}>Save</button>
      <button onClick={() => console.log("Cancel")}>Cancel</button>
    </ButtonGroup>
  );
}

// ---------------------------------------------------------------------------
// 6. createRef vs useRef
//
//    createRef(): creates a new ref object on EVERY render — use in class
//                 components (where hooks are not available).
//    useRef():    returns the SAME ref object across re-renders — the React
//                 way for functional components.
// ---------------------------------------------------------------------------

// Class component — must use createRef (hooks not available)
class ClassWithRef extends Component {
  constructor(props) {
    super(props);
    // createRef is recreated on each render but in a class component
    // the constructor runs only once, so this.inputRef is stable.
    this.inputRef = createRef();
  }

  focus = () => this.inputRef.current?.focus();

  render() {
    return (
      <div>
        <input ref={this.inputRef} placeholder="Class component input" />
        <button onClick={this.focus}>Focus (createRef)</button>
      </div>
    );
  }
}

// Functional component — always use useRef
function FuncWithRef() {
  // useRef returns the SAME object on every render; .current is mutable.
  const inputRef = useRef(null);

  // useRef also stores arbitrary mutable values without triggering a re-render
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <div>
      <input ref={inputRef} placeholder="Functional component input" />
      <button onClick={() => inputRef.current?.focus()}>Focus (useRef)</button>
      <p style={{ color: "gray", fontSize: "0.8rem" }}>
        Rendered {renderCount.current} time(s) — stored in useRef, no re-render
        triggered.
      </p>
    </div>
  );
}

function RefComparisonDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <ClassWithRef />
      <FuncWithRef />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. flushSync - force React to flush state updates synchronously.
//    Introduced in React 18 to opt out of automatic batching for cases where
//    you need the DOM to update before reading layout (e.g. scrollTo).
//    Use sparingly — automatic batching is usually more efficient.
// ---------------------------------------------------------------------------

function FlushSyncDemo() {
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  const addMessage = () => {
    // Without flushSync: React batches this update; listRef.current.scrollHeight
    // would reflect the OLD DOM before the new message is painted.
    //
    // With flushSync: React synchronously commits the update so we can
    // immediately read the updated DOM measurements below.
    flushSync(() => {
      setMessages((prev) => [...prev, `Message ${prev.length + 1}`]);
    });

    // At this point the DOM has already been updated.
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  return (
    <div>
      <ul
        ref={listRef}
        style={{ height: "120px", overflowY: "auto", border: "1px solid #ccc", padding: "0.5rem" }}
      >
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
      <button onClick={addMessage} style={{ marginTop: "0.5rem" }}>
        Add & Scroll (flushSync)
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root demo — wires everything together
// ---------------------------------------------------------------------------

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "720px", margin: "2rem auto", padding: "0 1rem" }}>
      <h1>React Portals & Misc Patterns</h1>

      <section>
        <h2>1 & 2. createPortal — Modal</h2>
        <button onClick={() => setModalOpen(true)}>Open Portal Modal</button>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Portal Modal">
          <p>Rendered into document.body, outside #root.</p>
          <p>Press Escape or click outside to close.</p>
        </Modal>
      </section>

      <section>
        <h2>2b. createPortal — Tooltip</h2>
        <Tooltip text="I am rendered in document.body!">
          <span style={{ textDecoration: "underline dotted", cursor: "help" }}>
            Hover over me
          </span>
        </Tooltip>
      </section>

      <section>
        <h2>3. StrictMode</h2>
        <StrictModeApp />
      </section>

      <section>
        <h2>4. Profiler API</h2>
        <p>Open the console to see render timings.</p>
        <ProfiledComponent />
      </section>

      <section>
        <h2>5. cloneElement</h2>
        <CloneElementDemo />
      </section>

      <section>
        <h2>6. createRef vs useRef</h2>
        <RefComparisonDemo />
      </section>

      <section>
        <h2>7. flushSync</h2>
        <FlushSyncDemo />
      </section>
    </div>
  );
}
