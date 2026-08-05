# React Concepts Reference

## Overview

This directory contains focused, self-contained React examples covering core concepts from JSX basics through advanced performance patterns. Each file is a runnable `.jsx` module demonstrating one concept area with minimal noise. Files are numbered to reflect a logical learning progression.

---

## File Index

| File | Concepts Covered | Key Hooks / APIs |
|------|-----------------|-----------------|
| `01_jsx_basics.jsx` | JSX syntax, expressions, attributes, fragments, self-closing tags | — |
| `02_components_and_props.jsx` | Function components, prop passing, default props, prop destructuring, children | — |
| `03_useState.jsx` | Local state, state updates, functional updates, object/array state | `useState` |
| `04_useEffect.jsx` | Side effects, dependency array, cleanup, async in effects | `useEffect` |
| `05_useContext.jsx` | Context creation, provider pattern, consuming context, avoiding prop drilling | `useContext`, `createContext` |
| `06_useRef.jsx` | DOM refs, mutable ref container, persisting values across renders | `useRef`, `forwardRef` |
| `07_useMemo_useCallback.jsx` | Memoizing values, memoizing callbacks, preventing unnecessary recalculation | `useMemo`, `useCallback` |
| `08_custom_hooks.jsx` | Extracting stateful logic, reusable hooks, composing hooks | custom hooks |
| `09_forms.jsx` | Controlled inputs, uncontrolled inputs, form submission, validation | `useState`, `useRef` |
| `10_lists_and_keys.jsx` | Rendering lists, stable keys, reconciliation, nested lists | — |
| `11_conditional_rendering.jsx` | `&&`, ternary, early return, switch patterns, nullish coalescing | — |
| `12_component_composition.jsx` | Children pattern, render props, compound components, slot pattern | — |
| `13_error_boundaries.jsx` | Catching render errors, fallback UI, `componentDidCatch` | `componentDidCatch`, `getDerivedStateFromError` |
| `14_useReducer.jsx` | Complex state transitions, action/dispatch pattern, reducer function | `useReducer` |
| `15_react_router.jsx` | Client-side routing, nested routes, dynamic segments, navigation | `useNavigate`, `useParams`, `useLocation` |
| `16_performance.jsx` | Memoization strategies, lazy loading, code splitting, profiling | `React.memo`, `lazy`, `Suspense` |
| `17_portals_and_misc.jsx` | Portals, strict mode, fragments, `cloneElement`, `Children` API | `createPortal`, `React.Children` |

---

## React Hooks Cheatsheet

| Hook | Purpose | Key Rule |
|------|---------|----------|
| `useState` | Local component state | State updates are async; use functional form for derived updates |
| `useEffect` | Sync with external system / side effects | Return cleanup fn to avoid leaks; empty `[]` = mount only |
| `useContext` | Read context value | Re-renders on every context value change |
| `useRef` | Mutable ref / DOM access | Mutating `.current` does NOT trigger re-render |
| `useMemo` | Cache expensive computed value | Only re-runs when deps change; don't overuse |
| `useCallback` | Stable function reference | Prevents child re-render when passed as prop |
| `useReducer` | Complex state with multiple sub-values or actions | Prefer over `useState` when next state depends on action type |
| `useLayoutEffect` | DOM measurements before paint | Runs synchronously after DOM mutations; blocks paint |
| `useId` | Unique, stable IDs for accessibility | Never use for list keys |

---

## Component Lifecycle (Hooks Era)

```jsx
useEffect(() => {
  // MOUNT — runs once after first render
  const subscription = subscribe(id);

  return () => {
    // UNMOUNT — cleanup; runs before component is removed
    subscription.unsubscribe();
  };
}, []); // empty deps = mount/unmount only

useEffect(() => {
  // UPDATE — runs after every render where `id` changed
  fetchData(id);
}, [id]); // dep array controls when effect re-runs

useEffect(() => {
  // EVERY RENDER — no dep array
  document.title = title;
});
```

---

## State Management Decision Tree

```
Is state local to one component?
  YES --> useState / useReducer

Does state need to be shared across a small subtree?
  YES --> lift state up + prop drilling

Does prop drilling become painful (3+ levels)?
  YES --> useContext (good for low-frequency updates: theme, auth, locale)

Is state complex (many actions, derived values, async ops)?
  YES --> useReducer (+ optional Context for dispatch)

Is state global, high-frequency, or shared across disconnected trees?
  YES --> external store: Zustand / Redux Toolkit / Jotai / Recoil
```

---

## Key React Rules

### Rules of Hooks
- Only call hooks **at the top level** — never inside loops, conditions, or nested functions.
- Only call hooks from **React function components** or other custom hooks.
- Custom hook names must start with `use`.

### Immutability
- Never mutate state directly. Always return a new object/array.
- For objects: `setState(prev => ({ ...prev, key: newValue }))`.
- For arrays: use `map`, `filter`, `concat`, or spread — never `push`/`splice` on state.

### Key Prop Rules
- Keys must be **stable, unique among siblings** — use IDs from data, not array index.
- Using index as key breaks reconciliation when the list can reorder or filter.
- Keys are not passed as props to the component (`key` is reserved).

### Pure Components
- Components must be **pure** with respect to props and state — same inputs, same output.
- Do not read/write external mutable variables during render.
- Side effects belong in `useEffect`, event handlers, or server actions — never in render.

---

## Performance Checklist

- Wrap expensive child components in `React.memo` to skip re-renders when props are unchanged.
- Use `useCallback` for functions passed as props to memoized children.
- Use `useMemo` for expensive derivations; skip for cheap calculations.
- Code-split large routes/components with `React.lazy` + `Suspense`.
- Keep Context value stable — memoize the value object with `useMemo` to avoid unnecessary consumer re-renders.
- Colocate state as close as possible to where it is used to minimize re-render scope.
- Avoid anonymous object/array literals as prop values in render — they create new references every time.
- Use the React DevTools Profiler to identify slow commits before optimizing.
- Virtualize long lists (react-window / react-virtual) instead of rendering all rows.
- Avoid defining components inside other components — this recreates the component type on every render.
