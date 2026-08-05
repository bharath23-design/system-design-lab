# useMemo & useCallback

## Quick Distinction
| Hook | Memoizes | Returns |
|------|----------|---------|
| `useMemo` | A computed **value** | The value itself |
| `useCallback` | A **function** | The function reference |

## Signatures
```js
const value = useMemo(() => compute(), [deps])
const fn = useCallback(() => doWork(), [deps])
```

## When to Use Each

**useMemo**
- Expensive computation (sorting, filtering large arrays, heavy math)
- Stable object/array reference passed as a context value (prevents all consumers re-rendering)

**useCallback**
- Stable function reference passed as a prop to a `React.memo`-wrapped child
- Function used as a dependency in another hook (`useEffect`, `useMemo`)

## React.memo

Wraps a component so it only re-renders when its props change (shallow comparison).

```js
const Child = React.memo(({ onClick, label }) => <button onClick={onClick}>{label}</button>)
```

Works best **with** `useCallback`: without it, a new function reference is created on every parent render, defeating the memo.

## Optimization Decision Tree

1. Is the UI actually slow? Profile with React DevTools Profiler first — skip if not.
2. Is an expensive value recomputed on every render? Use `useMemo`.
3. Is a child component re-rendering unnecessarily? Wrap it with `React.memo`.
4. Is a callback passed as a prop to that memoized child? Use `useCallback` on the callback.
5. Is a function a dep of `useEffect`/`useMemo`? Use `useCallback` to stabilize it.

## Common Mistakes

- **Over-optimizing** — both hooks allocate a closure and run a dep comparison; applying them to cheap operations adds overhead, not savings.
- **Wrong deps array** — omitting a dep causes stale closures; adding too many defeats memoization. Use `eslint-plugin-react-hooks` exhaustive-deps rule.
- **`useCallback` without `React.memo` on the child** — a stable function ref only matters if the child can actually skip re-rendering; `useCallback` alone does nothing to prevent child renders.
- **`useMemo` for side effects** — `useMemo` is for pure derivations only; side effects belong in `useEffect`.
