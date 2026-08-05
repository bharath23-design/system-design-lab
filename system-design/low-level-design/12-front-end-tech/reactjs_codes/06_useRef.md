# useRef Hook

## Two Use Cases
1. Access a DOM node directly (focus, scroll, measure)
2. Hold a mutable value that persists across renders without causing a re-render

## Signature
```js
const ref = useRef(initialValue)
// read/write: ref.current
```

## ref vs state
| | useRef | useState |
|---|---|---|
| Triggers re-render | No | Yes |
| Use case | DOM access, timers, previous values | UI-driven data |
| Access pattern | `ref.current` (mutable) | `[value, setValue]` (immutable snapshot) |

## Common Patterns
| Pattern | Code Snippet |
|---|---|
| Focus input | `ref.current.focus()` inside `useEffect` or handler |
| Store interval ID | `const id = useRef(null); id.current = setInterval(fn, 1000)` |
| Previous value | `const prev = useRef(); useEffect(() => { prev.current = value; }, [value])` |
| Scroll into view | `ref.current.scrollIntoView({ behavior: 'smooth' })` |

## forwardRef
When you pass a `ref` prop to a custom component, React drops it by default. Wrap the component with `forwardRef` to forward the ref to an inner DOM node or another component.

```js
const Input = forwardRef((props, ref) => <input ref={ref} {...props} />)

// usage
const inputRef = useRef(null)
<Input ref={inputRef} />
inputRef.current.focus()
```

## Common Mistakes
- Reading `ref.current` during render — refs are a side effect; read them inside `useEffect` or event handlers only.
- Using a ref when state is needed — if the UI must update when the value changes, use `useState`.
- Forgetting to clean up — always call `clearInterval`, `clearTimeout`, or unsubscribe inside the `useEffect` cleanup function.
