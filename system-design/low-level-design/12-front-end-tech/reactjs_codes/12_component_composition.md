# Component Composition Patterns

## Patterns Overview
| Pattern | What It Solves | Trade-off |
|---------|---------------|-----------|
| Children | Simple content injection | No logic sharing |
| Render Props | Consumer controls rendering | Verbose, callback hell risk |
| HOC | Cross-cutting concerns | Wrapper hell, prop collisions |
| Compound Components | Shared implicit state | More setup, requires context |
| Slots (named children) | Multiple injection points | Prop naming conventions needed |

## Children Pattern
Simple content injection. Most common.
```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card><p>Content</p></Card>
```

## Render Props
Pass a function as prop that returns JSX. Gives consumer control over rendering.
```jsx
<DataProvider render={data => <Chart data={data} />} />

function DataProvider({ render }) {
  const data = useFetchData();
  return render(data);
}
```
Modern alternative: custom hooks (prefer hooks over render props today).

## Higher-Order Components (HOC)
Function that takes a component and returns an enhanced component.
When to use: cross-cutting concerns (auth, logging, theming).
```js
function withAuth(Component) {
  function Protected(props) {
    const user = useAuth();
    if (!user) return <Redirect to="/login" />;
    return <Component {...props} />;
  }
  Protected.displayName = `withAuth(${Component.displayName || Component.name})`;
  return Protected;
}

const ProtectedPage = withAuth(Dashboard);
```

## Compound Components
Components that work together sharing implicit state via context (Tabs, Select, Accordion).
```jsx
const TabsContext = React.createContext();

function Tabs({ children }) {
  const [active, setActive] = React.useState(0);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Tab = function Tab({ index, label }) {
  const { active, setActive } = React.useContext(TabsContext);
  return <button onClick={() => setActive(index)} aria-selected={active === index}>{label}</button>;
};

// Usage
<Tabs>
  <Tabs.Tab index={0} label="One" />
  <Tabs.Tab index={1} label="Two" />
</Tabs>
```

## Composition vs Inheritance
React prefers composition. Never use class inheritance for sharing UI logic.
```js
// Bad
class SpecialButton extends Button { ... }

// Good
function SpecialButton(props) {
  return <Button {...props} className="special" />;
}
```

## Common Mistakes
- Prop drilling more than 2 levels deep (use context or composition instead)
- Overusing HOCs when a custom hook is clearer and testable
- Forgetting `displayName` on HOCs (breaks React DevTools component names)
- Using render props when a hook achieves the same with less nesting
