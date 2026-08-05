/**
 * React Performance Hooks: useMemo, useCallback, React.memo
 *
 * Core idea:
 *   - useMemo    -> memoize a computed VALUE  (skip expensive recalculation)
 *   - useCallback-> memoize a FUNCTION REF   (stable reference for child props)
 *   - React.memo -> skip re-rendering a COMPONENT if its props are unchanged
 *
 * Rule of thumb:
 *   Use these only when you have a measured performance problem.
 *   Memoization itself has a cost; premature optimization can hurt readability.
 */

import React, { useState, useMemo, useCallback, memo } from "react";

// ---------------------------------------------------------------------------
// 1. useMemo — memoize expensive computation
//    Syntax: const value = useMemo(() => expensiveFn(deps), [deps]);
//    React recomputes only when deps change; otherwise returns the cached value.
// ---------------------------------------------------------------------------

function computePrimes(limit) {
  // Simulate a slow computation (sieve of Eratosthenes).
  const sieve = Array(limit + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) sieve[j] = false;
    }
  }
  return sieve.reduce((acc, isPrime, n) => (isPrime ? [...acc, n] : acc), []);
}

export function ExpensiveList() {
  const [limit, setLimit] = useState(1000);
  const [theme, setTheme] = useState("light"); // unrelated state

  // Without useMemo: computePrimes runs on EVERY render, even theme toggles.
  // With useMemo   : computePrimes runs ONLY when `limit` changes.
  const primes = useMemo(() => computePrimes(limit), [limit]);

  return (
    <div style={{ background: theme === "light" ? "#fff" : "#333", padding: 16 }}>
      <h2>useMemo — Expensive Computation</h2>

      <label>
        Limit:&nbsp;
        <input
          type="number"
          value={limit}
          min={2}
          max={100000}
          onChange={(e) => setLimit(Number(e.target.value))}
        />
      </label>

      {/* Toggling theme re-renders the component but does NOT recompute primes. */}
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle theme (no recompute)
      </button>

      <p>
        Found <strong>{primes.length}</strong> primes up to {limit}.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. useCallback — memoize a function reference
//    Syntax: const fn = useCallback(() => { ... }, [deps]);
//
//    Every render creates a NEW function object.  When that function is passed
//    as a prop to a memoized child, the child sees a new prop and re-renders —
//    defeating React.memo.  useCallback keeps the same reference across renders
//    as long as deps have not changed.
// ---------------------------------------------------------------------------

// 3. React.memo — skip re-render when props are shallowly equal
//    Wrap a functional component: const MemoComp = memo(Comp);
//    React skips re-rendering MemoComp if its props did not change.

export const MemoizedChild = memo(function MemoizedChild({ onAdd, label }) {
  // This component renders only when `onAdd` or `label` actually changes.
  // Without React.memo it would re-render on every parent render.
  console.log(`MemoizedChild rendered — ${label}`);

  return (
    <div style={{ border: "1px solid #aaa", margin: 8, padding: 8 }}>
      <h3>React.memo — MemoizedChild ({label})</h3>
      <p>I re-render only when my props change.</p>
      <button onClick={onAdd}>Add item</button>
    </div>
  );
});

// ---------------------------------------------------------------------------
// 4. Combined example: parent uses useCallback so MemoizedChild stays stable
// ---------------------------------------------------------------------------

export function ParentComponent() {
  const [itemsA, setItemsA] = useState([]);
  const [itemsB, setItemsB] = useState([]);
  const [counter, setCounter] = useState(0); // unrelated state

  // Without useCallback: new function created every render -> MemoizedChild
  // would re-render even when `counter` changes (unrelated to A or B).
  //
  // With useCallback: addA / addB references are stable; MemoizedChild
  // only re-renders when their own list changes.

  const addA = useCallback(() => {
    setItemsA((prev) => [...prev, `A-${prev.length + 1}`]);
  }, []); // no deps -> always the same reference

  const addB = useCallback(() => {
    setItemsB((prev) => [...prev, `B-${prev.length + 1}`]);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>useCallback + React.memo — ParentComponent</h2>

      {/* Incrementing counter re-renders Parent but NOT the memoized children. */}
      <button onClick={() => setCounter((c) => c + 1)}>
        Increment unrelated counter: {counter}
      </button>

      <MemoizedChild onAdd={addA} label="List A" />
      <MemoizedChild onAdd={addB} label="List B" />

      <ul>
        {itemsA.map((i) => (
          <li key={i}>{i}</li>
        ))}
        {itemsB.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Quick decision guide
//
//   Situation                                  Hook to reach for
//   ----------------------------------------   -------------------
//   Expensive calculation (sort, filter, map)  useMemo
//   Passing a handler down to a memoized child useCallback
//   Prevent child re-render on same props      React.memo
//
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 6. When NOT to optimize (premature optimization)
//
//   - The computation is trivially fast (adding two numbers, string concat).
//     useMemo/useCallback add overhead for the bookkeeping themselves.
//
//   - The component renders rarely anyway.  Memoization only pays off when
//     renders are frequent and expensive.
//
//   - You haven't measured a perf problem.  Measure first with React DevTools
//     Profiler; optimize only proven bottlenecks.
//
//   - Over-memoizing makes code harder to read and maintain for no gain.
//
//   Bad example (unnecessary useMemo):
//     const doubled = useMemo(() => value * 2, [value]);
//     // Just write: const doubled = value * 2;
// ---------------------------------------------------------------------------

// Default export wires all examples into one page for quick demo purposes.
export default function PerformanceHooksDemo() {
  return (
    <>
      <ExpensiveList />
      <hr />
      <ParentComponent />
    </>
  );
}
