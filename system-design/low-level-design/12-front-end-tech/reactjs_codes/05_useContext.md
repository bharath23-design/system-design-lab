# Context API & useContext

## When to Use Context
- Theme (dark/light mode)
- Auth (current user, token, roles)
- Language/locale (i18n)
- Cart state (e-commerce global state)
- NOT for all state — prefer local state or props for component-scoped data

## Setup Pattern (3 steps)
1. **createContext** — define context with an optional default value
2. **Provider wrapping** — wrap the component tree that needs access
3. **useContext consuming** — read the value anywhere inside the tree

## Quick Reference
```js
// 1. Create
const MyCtx = createContext(defaultValue)

// 2. Provider
<MyCtx.Provider value={sharedValue}>
  <App />
</MyCtx.Provider>

// 3. Consumer
const value = useContext(MyCtx)
```

## Context Re-render Behavior
**Key point:** every consumer re-renders whenever the context value changes, even if only part of the value changed.

**Optimize with:**
- **Split contexts** — separate frequently-changing values from stable ones
- **Memoize value** — wrap the value object in `useMemo` to prevent unnecessary re-renders

```js
const value = useMemo(() => ({ user, login, logout }), [user])
<AuthCtx.Provider value={value}>
```

## Context vs Props vs External Store
| Scenario | Recommendation |
|---|---|
| Few levels deep | Props (simpler, easier to trace) |
| Many levels deep (prop drilling) | Context |
| High-frequency updates (mouse pos, animations) | External store (Zustand, Redux) |
| Complex logic / async actions | External store (Redux Toolkit, Zustand) |

## Common Mistakes
- **No Provider wrapping** — `useContext` returns the default value silently; easy to miss
- **New object as value without `useMemo`** — `value={{ user, theme }}` creates a new reference on every render, causing all consumers to re-render
- **Using context for everything** — high-frequency state in context kills performance; use local state or an external store instead
