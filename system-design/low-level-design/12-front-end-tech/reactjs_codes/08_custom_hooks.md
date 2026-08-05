# Custom Hooks

## What Are Custom Hooks?

Custom hooks are JavaScript functions that extract stateful logic into reusable, shareable units; they let you pull `useState`, `useEffect`, and other hook calls out of a component body into a named function so the same behavior can be composed across many components without duplicating code or changing the component tree.

## Rules

- Must start with `use`
- Can call other hooks (built-in or custom)
- Logic is isolated per component instance — each caller gets its own state

## Common Custom Hooks Reference

| Hook Name | Purpose | Key Deps |
|---|---|---|
| `useLocalStorage` | Sync state with localStorage | `useState`, `useEffect` |
| `useFetch` | Data fetching with loading/error state | `useState`, `useEffect` |
| `useDebounce` | Delay value updates until input settles | `useState`, `useEffect` |
| `useToggle` | Boolean on/off toggling | `useState`, `useCallback` |
| `usePrevious` | Track previous render's value | `useRef`, `useEffect` |
| `useOnClickOutside` | Detect clicks outside a ref'd element | `useRef`, `useEffect` |
| `useWindowSize` | Reactive window width/height | `useState`, `useEffect` |
| `useInterval` | Declarative setInterval with cleanup | `useRef`, `useEffect` |

## Building Pattern

1. **Identify** repeated stateful logic spread across multiple components
2. **Extract** the `useState` / `useEffect` / other hook calls into a new function
3. **Name** the function starting with `use` (e.g. `useFormField`)
4. **Return** only the values and setters the caller needs (object or tuple)

```js
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(v => !v), []);
  return [on, toggle];
}
```

## Custom Hook vs Utility Function

If it uses hooks → custom hook. If pure logic → regular function.

## Common Mistakes

- Using hooks inside conditions or loops **inside** the custom hook body
- Not returning stable references (new object/function each render causes infinite loops in callers — use `useMemo` / `useCallback`)
- Overcomplicating — sometimes `useState` + `useEffect` inline is perfectly fine
