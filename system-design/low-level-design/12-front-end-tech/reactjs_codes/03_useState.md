# useState Hook

## Signature
```js
const [state, setState] = useState(initialValue)
```

## Key Rules
- Calling `setState` triggers a re-render of the component
- Updates are **async and batched** — state is not changed inline; the new value is available on the next render
- **Never mutate state directly** (`state.x = 1` is wrong); always return a new value/reference
- Pass a **function** as `initialValue` for lazy initialization: `useState(() => expensiveCompute())` — runs once, not on every render

## State Update Patterns
| State Type | Update Pattern |
|------------|----------------|
| Primitive  | `setState(newValue)` |
| Object     | `setState(prev => ({ ...prev, key: newValue }))` |
| Array add  | `setState(prev => [...prev, newItem])` |
| Array remove | `setState(prev => prev.filter(item => item.id !== id))` |
| Array update | `setState(prev => prev.map(item => item.id === id ? { ...item, ...changes } : item))` |

## Functional Update Form
Use `setState(prev => ...)` when the new state depends on the previous state.

```js
// Safe — always reads the latest state
setState(prev => prev + 1)

// Unsafe — captures stale closure value
setState(count + 1)
```

This matters inside async callbacks, `useEffect`, or when multiple updates are batched together.

## Common Mistakes
- **Mutating objects/arrays directly** — `state.items.push(x)` does not trigger a re-render because the reference is unchanged.
- **Reading state immediately after setState** — `setState(5); console.log(state)` still logs the old value; read it on the next render.
- **Expensive `initialValue` computed on every render** — `useState(heavyFn())` calls `heavyFn` on every render; use `useState(() => heavyFn())` instead.

## useState vs useReducer
Switch to `useReducer` when:
- State has **multiple sub-values** that change together or depend on each other (e.g., form fields + validation + submission status)
- The **next state depends on complex logic** over the previous state, making a series of `setState` calls hard to follow
- You need **predictable, testable transitions** — a reducer function is a pure function easy to unit-test outside React
