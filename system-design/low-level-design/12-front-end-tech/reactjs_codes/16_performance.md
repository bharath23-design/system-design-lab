# React Performance

## Golden Rule
Profile BEFORE optimizing. Use React DevTools Profiler.

## Optimization Toolkit
| Tool | Prevents | Use When |
|------|----------|----------|
| `React.memo` | Child re-render | Child receives same props but parent re-renders |
| `useMemo` | Expensive recalculation | Heavy computation depends on specific deps |
| `useCallback` | Function reference churn | Passing callbacks to memo'd children |
| `React.lazy` | Eagerly loading chunks | Large components not needed on initial render |
| `useTransition` | Blocking UI on state update | Search, filtering, tab switches |
| `useDeferredValue` | Laggy derived renders | Input drives expensive list/chart render |
| Virtualization | DOM node explosion | Long lists (react-window, react-virtual) |

## Re-render Causes
1. State changes
2. Parent re-renders (unless memo'd)
3. Context value changes

## React.lazy + Suspense (Code Splitting)
```jsx
const Chart = React.lazy(() => import('./Chart'))
<Suspense fallback={<Spinner />}><Chart /></Suspense>
```

## React 18 Concurrent Features
- `useTransition`: mark update as non-urgent — keeps UI responsive while state settles
- `useDeferredValue`: defer expensive derived value without blocking the input

```jsx
const [isPending, startTransition] = useTransition()
startTransition(() => setQuery(input))

const deferred = useDeferredValue(query) // use in expensive list render
```

## Bundle Size Tips
- Dynamic imports for large libs (`import('lodash/merge')`)
- Tree-shaking: prefer named imports over default barrel imports
- Analyze with `webpack-bundle-analyzer` or `vite-bundle-visualizer`

## Common Mistakes
- Memo-ing everything — wrapping adds overhead; only memo hot paths
- Creating objects/arrays inline in render — new reference on every render breaks memo
- Anonymous functions in JSX — `onClick={() => fn()}` creates new ref each render; hoist or use `useCallback`
- Overusing context for high-frequency state — every consumer re-renders on any value change
