# Portals & Miscellaneous APIs

## ReactDOM.createPortal
Renders children into a DOM node outside the React tree.
```jsx
ReactDOM.createPortal(<Modal />, document.getElementById('modal-root'))
```
Use cases: modals, tooltips, dropdowns (need to escape overflow:hidden parents).
Event bubbling still works through React tree (not DOM tree).

## React.StrictMode
- Double-invokes render + effects in dev to detect side effects
- No production impact
- Wrap at app root: `<React.StrictMode><App /></React.StrictMode>`

## Other Useful APIs
| API | Purpose |
|-----|---------|
| `React.cloneElement` | Clone element and inject/override props |
| `React.Children.map` | Safely iterate over children (handles null/array) |
| `React.isValidElement` | Check if a value is a React element |
| `flushSync` | Force synchronous DOM flush (React 18) |
| `createRef` | Create a ref object for class components |

## flushSync (React 18)
Forces synchronous state flush — needed when reading DOM immediately after setState.
```jsx
import { flushSync } from 'react-dom'

flushSync(() => setState(newVal))
// DOM is updated now
```

## React.cloneElement
Inject additional props into a child element — used in compound component patterns.
```jsx
React.cloneElement(child, { extraProp: value })
```

## Common Mistakes
- Portal modal missing click-outside close
- StrictMode hiding real bugs (effects run twice — write idempotent effects)

---

## Props vs State

| | Props | State |
|--|-------|-------|
| Owned by | Parent (passed in) | The component itself |
| Mutable? | No — read-only inside component | Yes — via `setState` / `useState` |
| Triggers re-render? | Yes (when parent re-renders) | Yes (when updated) |
| Use for | Configuration, data from outside | Internal UI state (toggle, input, selection) |

```tsx
// Props — passed from parent, never mutated inside
function Button({ label, onClick }: Props) {
    // ❌ Wrong: props.label = 'new'   — never mutate props
    return <button onClick={onClick}>{label}</button>
}

// State — owned and updated by this component
function Counter() {
    const [count, setCount] = useState(0)  // mutable via setter
    return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

---

## Mutable vs Immutable

React state must be treated as **immutable** — never mutate directly, always return a new value.

### Why?
React compares the old and new state reference to decide if a re-render is needed.
Mutating directly keeps the same reference → React sees no change → UI doesn't update.

### Objects — spread to create new object
```tsx
// ❌ Wrong — mutates existing object, same reference
state.name = 'Alice'
setState(state)

// ✅ Correct — new object, new reference
setState({ ...state, name: 'Alice' })
```

### Arrays — use non-mutating methods
```tsx
// ❌ Wrong — push/splice mutate the original array
items.push(newItem)
setItems(items)

// ✅ Correct — spread creates a new array
setItems([...items, newItem])           // add
setItems(items.filter(i => i !== item)) // remove
setItems(items.map(i => i.id === id ? {...i, done: true} : i)) // update
```

---

## Core React Notes

### Component = function that returns JSX
```tsx
function MyComponent() {
    return <h1>Hello</h1>   // must return JSX (or null)
}
```

### Re-render triggers
1. `setState` / `useState` setter called
2. Parent component re-renders
3. Context value changes

### Rules of Hooks
- Only call hooks at the **top level** (not inside loops, conditions, or nested functions)
- Only call hooks inside **React function components** or **custom hooks**

### Key mental model
```
UI = f(state)
```
React re-runs the component function whenever state changes and updates only what changed in the DOM.
