/**
 * React Performance Optimization Examples
 *
 * Rule #0: Profile BEFORE you optimize.
 * Open React DevTools -> Profiler tab, record interactions, find slow components,
 * THEN apply the techniques below. Premature optimization wastes time and adds complexity.
 */

import React, {
  memo,
  lazy,
  Suspense,
  useState,
  useDeferredValue,
  useTransition,
  useMemo,
} from "react";

// ---------------------------------------------------------------------------
// 1. React.memo — skip re-render when props have not changed
//    The wrapped component only re-renders if its props change (shallow compare).
//    Use when: a child is pure and its parent re-renders often for unrelated state.
// ---------------------------------------------------------------------------

const ExpensiveCard = memo(function ExpensiveCard({ title, count }) {
  // Imagine this renders a complex chart or big list.
  console.log("ExpensiveCard rendered");
  return (
    <div style={{ border: "1px solid #ccc", padding: 12 }}>
      <h3>{title}</h3>
      <p>Count: {count}</p>
    </div>
  );
});

// Custom comparator: re-render only when `count` changes, ignore title changes.
const ExpensiveCardCustom = memo(
  function ExpensiveCardCustom({ title, count }) {
    console.log("ExpensiveCardCustom rendered");
    return (
      <div style={{ border: "1px solid #aaf", padding: 12 }}>
        <h3>{title}</h3>
        <p>Count: {count}</p>
      </div>
    );
  },
  (prev, next) => prev.count === next.count // return true => skip re-render
);

function MemoDemo() {
  const [count, setCount] = useState(0);
  const [unrelated, setUnrelated] = useState(0);

  return (
    <div>
      <h2>React.memo Demo</h2>
      <button onClick={() => setCount((c) => c + 1)}>Increment count</button>
      <button onClick={() => setUnrelated((u) => u + 1)} style={{ marginLeft: 8 }}>
        Unrelated state ({unrelated})
      </button>

      {/* Re-renders only when count changes — unrelated clicks are skipped */}
      <ExpensiveCard title="Memoized Card" count={count} />

      {/* Re-renders only when count changes, even if title prop changes */}
      <ExpensiveCardCustom title={`Title ${unrelated}`} count={count} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. React.lazy + Suspense — code splitting / lazy loading
//    The bundle for HeavyPage is loaded only when the component is first rendered.
//    Suspense shows a fallback while the chunk is being fetched.
// ---------------------------------------------------------------------------

// Simulated heavy component in a separate chunk.
// In a real app this would be: const HeavyPage = lazy(() => import('./HeavyPage'));
export const HeavyPage = memo(function HeavyPage() {
  return (
    <div style={{ padding: 20, background: "#f0fff0" }}>
      <h2>Heavy Page (lazy loaded)</h2>
      <p>This component was loaded on-demand, not in the initial bundle.</p>
    </div>
  );
});

// Wrap the lazy import in a Suspense boundary with a fallback.
const LazyHeavyPage = lazy(
  () =>
    // Simulate a dynamic import that resolves immediately for this example.
    // Replace with: import('./HeavyPage') in a real project.
    new Promise((resolve) =>
      setTimeout(() => resolve({ default: HeavyPage }), 800)
    )
);

export function LazyApp() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <h2>React.lazy + Suspense Demo</h2>
      <button onClick={() => setShow(true)}>Load Heavy Page</button>

      {show && (
        <Suspense fallback={<p>Loading heavy page chunk...</p>}>
          <LazyHeavyPage />
        </Suspense>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. useDeferredValue — defer non-urgent UI updates (React 18)
//    The deferred value lags behind the urgent value.
//    Use for: expensive derived renders (filtered lists, charts) driven by user input.
//    The input stays responsive; the expensive list re-render happens when idle.
// ---------------------------------------------------------------------------

function buildItems(query) {
  // Simulate an expensive filter over a large dataset.
  return Array.from({ length: 5_000 }, (_, i) => `Item ${i + 1}`).filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );
}

function DeferredList({ query }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery; // true while deferred value is catching up

  const items = useMemo(() => buildItems(deferredQuery), [deferredQuery]);

  return (
    <div style={{ opacity: isStale ? 0.5 : 1, transition: "opacity 0.2s" }}>
      <p>
        Showing {items.length} results for{" "}
        <strong>{deferredQuery || "(all)"}</strong>
        {isStale && " — updating..."}
      </p>
      <ul style={{ maxHeight: 200, overflowY: "auto" }}>
        {items.slice(0, 50).map((item) => (
          <li key={item}>{item}</li>
        ))}
        {items.length > 50 && <li>...and {items.length - 50} more</li>}
      </ul>
    </div>
  );
}

function DeferredDemo() {
  const [query, setQuery] = useState("");

  return (
    <div>
      <h2>useDeferredValue Demo</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to filter 5000 items..."
        style={{ width: "100%", padding: 8 }}
      />
      {/* DeferredList internally defers its own update — input stays snappy */}
      <DeferredList query={query} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. useTransition — mark state updates as non-urgent (React 18)
//    isPending: true while the transition is in progress.
//    Use when navigating between expensive views or filtering large lists
//    where you want the current UI to stay interactive during the update.
// ---------------------------------------------------------------------------

export function SearchResults({ query }) {
  const items = useMemo(() => buildItems(query), [query]);
  return (
    <ul style={{ maxHeight: 200, overflowY: "auto" }}>
      {items.slice(0, 50).map((item) => (
        <li key={item}>{item}</li>
      ))}
      {items.length > 50 && <li>...and {items.length - 50} more</li>}
    </ul>
  );
}

export function TransitionSearch() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    const value = e.target.value;
    setInputValue(value); // urgent — update input immediately

    startTransition(() => {
      setSearchQuery(value); // non-urgent — update results when React is free
    });
  }

  return (
    <div>
      <h2>useTransition Demo</h2>
      <input
        value={inputValue}
        onChange={handleChange}
        placeholder="Type to search 5000 items..."
        style={{ width: "100%", padding: 8 }}
      />
      {isPending && (
        <p style={{ color: "#888" }}>Updating results...</p>
      )}
      <SearchResults query={searchQuery} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Virtualization — only render rows visible in the viewport
//    react-window renders only the visible subset of a long list,
//    keeping DOM node count small regardless of list length.
//
//    Install: npm install react-window
//
//    import { FixedSizeList } from 'react-window';
//
//    const Row = ({ index, style }) => (
//      <div style={style}>Row {index}</div>
//    );
//
//    function VirtualList() {
//      return (
//        <FixedSizeList height={400} itemCount={100_000} itemSize={35} width="100%">
//          {Row}
//        </FixedSizeList>
//      );
//    }
//
//    react-virtual (TanStack) is a lighter alternative with no component wrapping.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 6. Quick reference — when to use each tool
//
//    React.memo          — pure child re-rendering too often due to parent state
//    useMemo             — expensive computed value, recompute only on dep change
//    useCallback         — stable function reference passed to memoized children
//    React.lazy+Suspense — large component not needed on initial load
//    useDeferredValue    — expensive child driven by external value (e.g. input)
//    useTransition       — expensive setState you can mark as interruptible
//    react-window        — lists with thousands of rows
//
//    Always: React DevTools Profiler -> record -> find slow commit -> optimize that.
// ---------------------------------------------------------------------------

// Default export: combined demo page
export default function PerformancePage() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h1>React Performance Optimizations</h1>
      <p>
        <strong>Rule #0:</strong> Open React DevTools Profiler, record a real
        interaction, identify the slow component, THEN optimize. Never guess.
      </p>
      <hr />
      <MemoDemo />
      <hr />
      <LazyApp />
      <hr />
      <DeferredDemo />
      <hr />
      <TransitionSearch />
    </div>
  );
}
