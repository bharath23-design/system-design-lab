# Components & Props

## Component Types

| Feature | Functional | Class |
|---|---|---|
| Syntax | Plain JS function | Extends `React.Component` |
| State | `useState` hook | `this.state` |
| Lifecycle | `useEffect` hook | Lifecycle methods |
| `this` keyword | Not needed | Required |
| Boilerplate | Minimal | Verbose |
| Performance | Slightly lighter | Slightly heavier |
| **Why functional wins** | Hooks cover all use cases; simpler, easier to test and compose | Legacy; avoid for new code |

## Props Rules

- **Read-only** — never mutate props inside a component
- Accept **any JS value**: string, number, boolean, array, object, function, JSX
- Passed as **JSX attributes**: `<Card title="Hello" count={42} />`
- **Destructure in params** for cleaner code: `function Card({ title, count }) {}`

## Quick Reference

| Pattern | Syntax |
|---|---|
| Default prop | `function Btn({ label = "Click" }) {}` |
| Children prop | `function Card({ children }) { return <div>{children}</div>; }` |
| Spread props | `<input {...inputProps} />` |
| Conditional prop | `<Btn disabled={isLoading} />` |

## Props vs State

Props are **external, read-only inputs** passed by a parent; state is **internal, mutable data** owned and managed by the component itself.

## Component Patterns Cheatsheet

```jsx
// Basic functional component
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

```jsx
// Default props
function Button({ label = "Submit", onClick }) {
  return <button onClick={onClick}>{label}</button>;
}
```

```jsx
// Children prop
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// Usage
<Card title="Info">
  <p>Any content here becomes children.</p>
</Card>
```

```jsx
// Spread props — forward known attributes to DOM elements
function Input({ className, ...rest }) {
  return <input className={`base ${className}`} {...rest} />;
}
```

## Common Mistakes

- **Mutating props** — `props.value = "new"` breaks React's data flow; derive new values instead
- **Forgetting `key`** when rendering lists — always use a stable, unique id, not the array index
- **Passing objects that change reference each render** — `<Comp style={{ color: "red" }} />` creates a new object every render; extract it outside the component or memoize it
