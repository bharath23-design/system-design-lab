# useEffect Hook

## Signature
```js
useEffect(() => {
  // side effect
  return () => { /* cleanup */ }
}, [dependencies])
```

## Dependency Array Behavior
| Deps Array | When Effect Runs |
|------------|-----------------|
| omitted    | After every render |
| `[]`       | Once on mount only |
| `[a, b]`   | On mount and whenever `a` or `b` changes |

## Common Use Cases
1. Data fetching from an API
2. Subscribing to external data sources (WebSocket, Redux store)
3. Adding/removing event listeners (resize, keydown, scroll)
4. Starting and clearing timers (setTimeout, setInterval)
5. Direct DOM mutations (focus management, third-party library init)

## Cleanup Function
Returned from the effect; React calls it before the next effect run and on unmount. Prevents memory leaks and stale callbacks.

| Resource | Cleanup Action |
|----------|----------------|
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| Event listener | `removeEventListener` |
| Subscription | `subscription.unsubscribe()` |
| Fetch request | `abortController.abort()` |

## Common Mistakes
| Mistake | Fix |
|---------|-----|
| Missing deps — reads stale closure values | Add the missing variable to the deps array |
| Object/array literal in deps (new ref each render) | Memoize with `useMemo` / `useCallback`, or move outside component |
| `setState` in effect with no deps (infinite loop) | Add correct deps or restructure logic |
| `async` function directly as effect callback | Declare an inner `async` function and call it inside the effect |

## Data Fetching Pattern
```js
useEffect(() => {
  const controller = new AbortController()

  async function fetchData() {
    try {
      const res = await fetch(`/api/items/${id}`, { signal: controller.signal })
      const data = await res.json()
      setItems(data)
    } catch (err) {
      if (err.name !== 'AbortError') setError(err)
    }
  }

  fetchData()

  return () => controller.abort() // cancel in-flight request on cleanup
}, [id])
```
