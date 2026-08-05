# Conditional Rendering

## Patterns Comparison
| Pattern | Syntax | Best For |
|---------|--------|----------|
| if/else | `if (cond) return <A />` | Early returns, complex logic |
| ternary | `cond ? <A /> : <B />` | Two-branch inline choices |
| && | `cond && <A />` | Show or show nothing |
| ?? | `value ?? fallback` | Null/undefined defaults |
| switch/enum | `views[status]` | Multiple named states |

## Code Examples
```jsx
// ternary
{isLoggedIn ? <Dashboard /> : <Login />}

// && (careful with 0!)
{count > 0 && <Badge count={count} />}

// nullish coalescing
{user?.name ?? 'Guest'}
```

## The && Gotcha
```jsx
// BUG: renders "0" when items is empty array length
{items.length && <List />}
// FIX:
{items.length > 0 && <List />}
```

## Early Return Pattern
When: complex conditions. Return null to render nothing.
```jsx
function Alert({ message }) {
  if (!message) return null;
  return <div className="alert">{message}</div>;
}
```

## Enum Pattern
```jsx
const views = { loading: <Spinner />, error: <Error />, data: <Data /> }
return views[status]
```

## Common Mistakes
- Rendering 0 with && (use boolean condition)
- Deeply nested ternaries (use early return or enum instead)
