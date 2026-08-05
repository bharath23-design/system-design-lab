# Error Boundaries

## What They Catch
Runtime errors during rendering, lifecycle methods, constructor of child components.
Do NOT catch: event handlers, async code, SSR, errors in the boundary itself.

## Implementation (Must Be Class Component)
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError(error) { return { hasError: true } }
  componentDidCatch(error, info) { logError(error, info) }
  render() { return this.state.hasError ? <Fallback /> : this.props.children }
}
```

## Placement Strategy
- App-level: catch all unhandled errors
- Feature-level: isolate failures (sidebar breaks, main content still works)

## react-error-boundary Library
Recommended for production. Provides useErrorBoundary hook + reset functionality.

```jsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary FallbackComponent={Fallback} onReset={reset} onError={logError}>
  <App />
</ErrorBoundary>
```

## Event Handler Errors
Use try/catch — error boundaries don't catch these.

```jsx
function MyButton() {
  const handleClick = () => {
    try {
      riskyOperation()
    } catch (err) {
      setError(err)
    }
  }
  return <button onClick={handleClick}>Click</button>
}
```

## Common Mistakes
- Wrapping single leaves (wrap subtrees instead)
- Not logging errors in componentDidCatch
- Expecting it to catch async errors (it won't)
- Using function components (class component required)
