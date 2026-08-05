# JSX Basics

## What is JSX?

JSX (JavaScript XML) is syntactic sugar that lets you write HTML-like markup inside JavaScript. The Babel compiler transforms every JSX expression into a `React.createElement(type, props, ...children)` call, so JSX requires no browser support of its own — it is purely a build-time convenience that makes component trees easier to read and write.

## Core Rules

1. **Single root element** — every JSX expression must return exactly one root node (use a Fragment if you need to avoid an extra DOM node).
2. **`className`, not `class`** — `class` is a reserved JS keyword; use `className` for CSS classes.
3. **camelCase attributes** — HTML attributes become camelCase: `onclick` → `onClick`, `tabindex` → `tabIndex`, `maxlength` → `maxLength`.
4. **Self-close empty tags** — tags with no children must be self-closed: `<img />`, `<input />`, `<br />`.
5. **Expressions in `{}`** — embed any JS expression inside curly braces: `{user.name}`, `{2 + 2}`, `{fn()}`.
6. **No statements in JSX** — `if`, `for`, `while` are statements and cannot appear inside `{}`. Use ternaries, `&&`, or move logic above the return.

## Quick Reference Table

| Feature | Syntax | Notes |
|---|---|---|
| Expression | `{value}` | Any JS expression |
| Fragment | `<> ... </>` or `<React.Fragment>` | No extra DOM node |
| Conditional `&&` | `{isOpen && <Modal />}` | Renders right side when truthy |
| Ternary | `{ok ? <A /> : <B />}` | Use for if/else branches |
| Style object | `style={{ color: 'red', fontSize: 14 }}` | Outer `{}` = expression, inner `{}` = object |
| Comment in JSX | `{/* comment */}` | Must be inside `{}` |

## JSX → createElement

```jsx
// JSX
const el = (
  <button className="btn" onClick={handleClick}>
    Save
  </button>
);
```

```js
// Compiled equivalent
const el = React.createElement(
  "button",
  { className: "btn", onClick: handleClick },
  "Save"
);
```

## Common Gotchas

- **`0` renders as `"0"`** — `{count && <Badge />}` prints `0` when `count` is `0`. Fix: use `{!!count && <Badge />}` or `{count > 0 && <Badge />}` or a ternary.
- **`false` / `null` / `undefined` render nothing** — safe to use as no-op returns, but be aware they suppress output silently.
- **String attributes don't need `{}`** — `<img alt="logo" />` is fine; `<img alt={"logo"} />` is redundant.

## When to Use Fragments

Use a Fragment when a component must return multiple sibling elements but adding a wrapper `<div>` would break layout (e.g., table rows, flex children, or list items).

```jsx
// Bad — extra <div> breaks <table> structure
function Rows() {
  return (
    <div>
      <tr><td>A</td></tr>
      <tr><td>B</td></tr>
    </div>
  );
}

// Good — Fragment leaves DOM untouched
function Rows() {
  return (
    <>
      <tr><td>A</td></tr>
      <tr><td>B</td></tr>
    </>
  );
}
```

Use the explicit `<React.Fragment key={id}>` form when you need to attach a `key` prop inside a `.map()`.
