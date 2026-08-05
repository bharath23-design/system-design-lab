# Lists & Keys

## Rendering Lists
```jsx
{items.map(item => <Li key={item.id}>{item.name}</Li>)}
```

## The key Prop
- Must be unique among siblings
- Helps React identify which items changed
- Must be STABLE (not index if list can reorder/delete)

## Key Source Priority
| Priority | Source | When |
|----------|--------|------|
| 1st | Database ID | Always prefer when available |
| 2nd | Stable string | Slug, UUID, or content hash |
| 3rd | Index | Static lists only (no reorder/delete) |

## Why Index as Key Breaks
When items reorder or delete, React matches new elements to old DOM nodes by index.
The wrong component instance gets reused, causing stale state bugs (e.g. input values
staying on the wrong row after deletion).

## Filtering & Sorting
Filter and sort before `map`, not inside JSX:
```jsx
const visible = items
  .filter(item => item.active)
  .sort((a, b) => a.name.localeCompare(b.name));

return <ul>{visible.map(item => <Li key={item.id}>{item.name}</Li>)}</ul>;
```

## Empty State Pattern
```jsx
{items.length === 0 ? <Empty /> : items.map(item => (
  <Li key={item.id}>{item.name}</Li>
))}
```

## Performance: Long Lists
For 1000+ items use `react-window` or `react-virtual` — only renders visible rows,
keeping DOM node count low regardless of data size.
```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList height={500} itemCount={items.length} itemSize={35} width="100%">
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>
```

## Common Mistakes
- Missing `key` prop (React warns; falls back to index silently in some cases)
- Using `Math.random()` as key — new key every render causes full remount and loses state
- Putting `key` on an inner element instead of the outermost element returned by `map`
- Duplicating keys across siblings — React will silently skip or merge nodes
