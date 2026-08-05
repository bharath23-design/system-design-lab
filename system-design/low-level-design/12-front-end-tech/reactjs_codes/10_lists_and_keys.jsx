import React, { useState, useMemo } from "react";

// =============================================================================
// 1. RENDERING ARRAYS WITH .map()
// =============================================================================
// .map() transforms each array element into a React element.
// React renders the resulting array of elements in order.

function SimpleList() {
  const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];

  return (
    <div>
      <h2>SimpleList</h2>

      {/* Basic .map() — each item needs a key */}
      <ul>
        {fruits.map((fruit) => (
          <li key={fruit}>{fruit}</li>
        ))}
      </ul>

      {/* Rendering objects from an array */}
      <ObjectList />
    </div>
  );
}

const USERS = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "editor" },
  { id: 3, name: "Carol", role: "viewer" },
];

function ObjectList() {
  return (
    <ul>
      {USERS.map((user) => (
        // key must live on the outermost element returned by .map()
        <li key={user.id}>
          {user.name} — <em>{user.role}</em>
        </li>
      ))}
    </ul>
  );
}

// =============================================================================
// 2. KEY PROP — WHY IT MATTERS (REACT RECONCILIATION)
// =============================================================================
// React uses keys to match elements between renders.
// Without keys (or with wrong keys) React may:
//   • re-create DOM nodes that could have been reused
//   • mix up component state (e.g. input values in the wrong row)
//
// Rules:
//   • Must be UNIQUE among siblings (not globally).
//   • Must be STABLE — same item always gets the same key across renders.
//   • Must be a STRING or NUMBER (React coerces to string internally).
//   • Do NOT use Math.random() or Date.now() — generates a new key every
//     render, forcing React to unmount and remount the element.
//
// Best source: database primary key, UUID, slug, or any natural unique ID.

function KeyDemo() {
  const [items, setItems] = useState([
    { id: "a1b2", label: "First" },
    { id: "c3d4", label: "Second" },
    { id: "e5f6", label: "Third" },
  ]);

  const prepend = () => {
    setItems([{ id: crypto.randomUUID(), label: "New" }, ...items]);
  };

  return (
    <div>
      <button onClick={prepend}>Prepend item</button>
      <ul>
        {items.map((item) => (
          // Stable UUID key — React reuses existing DOM nodes on re-render
          <li key={item.id}>
            {item.label} <input placeholder="type here" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// 3. INDEX AS KEY — ACCEPTABLE VS. PROBLEMATIC
// =============================================================================
//
// ACCEPTABLE when ALL of the following are true:
//   1. The list is static (never reordered or filtered while mounted).
//   2. Items are never inserted or deleted in the middle.
//   3. The list has no component-level state (inputs, checkboxes, etc.).
//
// Example where index key is fine — static, display-only, append-only log:
function StaticLog({ entries }) {
  // entries = [{ message, timestamp }, ...]
  return (
    <ol>
      {entries.map((entry, index) => (
        // index is acceptable: list only ever grows at the end, no user state
        <li key={index}>
          [{entry.timestamp}] {entry.message}
        </li>
      ))}
    </ol>
  );
}

// PROBLEMATIC — reordering or deletion with index key:
// If the user deletes item at index 1, React thinks item at index 1 still
// exists (just with different content) and reuses its DOM node, causing
// stale input values to appear in the wrong row.
//
// Wrong:
//   items.map((item, index) => <li key={index}><input /></li>)
//
// Right:
//   items.map((item) => <li key={item.id}><input /></li>)

// =============================================================================
// 4. NESTED LISTS
// =============================================================================
// Each level of nesting needs its own unique keys within that level.

const CATEGORIES = [
  {
    id: "cat-1",
    name: "Frontend",
    topics: [
      { id: "t-101", title: "React" },
      { id: "t-102", title: "CSS" },
    ],
  },
  {
    id: "cat-2",
    name: "Backend",
    topics: [
      { id: "t-201", title: "Node.js" },
      { id: "t-202", title: "PostgreSQL" },
    ],
  },
];

function NestedList() {
  return (
    <div>
      <h2>NestedList</h2>
      <ul>
        {CATEGORIES.map((category) => (
          // Outer key scoped to sibling categories
          <li key={category.id}>
            <strong>{category.name}</strong>
            <ul>
              {category.topics.map((topic) => (
                // Inner key scoped to sibling topics under this category.
                // cat-1/t-101 and cat-2/t-101 are fine — keys only need to
                // be unique among siblings, not globally.
                <li key={topic.id}>{topic.title}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// 5. FILTERING AND SORTING LISTS BEFORE RENDERING
// =============================================================================
// Transform data BEFORE the JSX return. Keep JSX declarative.
// Wrap in useMemo when the source list is large or the transform is expensive.

const PRODUCTS = [
  { id: 1, name: "Laptop", price: 999, inStock: true },
  { id: 2, name: "Mouse", price: 29, inStock: false },
  { id: 3, name: "Monitor", price: 399, inStock: true },
  { id: 4, name: "Keyboard", price: 79, inStock: true },
  { id: 5, name: "Headphones", price: 149, inStock: false },
];

function FilterableList() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name" | "price"
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Derived list — computed only when dependencies change
  const displayedProducts = useMemo(() => {
    let result = PRODUCTS;

    // Filter by search query
    if (query.trim()) {
      const lower = query.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lower));
    }

    // Filter by stock status
    if (showInStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    // Sort — always sort a copy so we do not mutate the original array
    result = [...result].sort((a, b) =>
      sortBy === "price" ? a.price - b.price : a.name.localeCompare(b.name)
    );

    return result;
  }, [query, sortBy, showInStockOnly]);

  return (
    <div>
      <h2>FilterableList</h2>

      {/* Controls */}
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={showInStockOnly}
          onChange={(e) => setShowInStockOnly(e.target.checked)}
        />{" "}
        In stock only
      </label>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="name">Sort by name</option>
        <option value="price">Sort by price</option>
      </select>

      {/* 6. EMPTY STATE HANDLING */}
      {displayedProducts.length === 0 ? (
        <EmptyState message="No products match your filters." />
      ) : (
        <ul>
          {displayedProducts.map((product) => (
            <li key={product.id}>
              {product.name} — ${product.price}{" "}
              {!product.inStock && <span style={{ color: "red" }}>(out of stock)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================================
// 6. EMPTY STATE HANDLING
// =============================================================================
// Always handle the zero-item case to avoid rendering an empty <ul>.
// Extract into a reusable component so every list gets consistent UX.

function EmptyState({ message = "Nothing here yet.", icon = "📭" }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
      <div style={{ fontSize: "2rem" }}>{icon}</div>
      <p>{message}</p>
    </div>
  );
}

// =============================================================================
// 7. TODO LIST — demonstrating stable keys, deletion, and reordering
// =============================================================================

let nextId = 100; // simple counter for demo; use UUID in production

function TodoList() {
  const [todos, setTodos] = useState([
    { id: nextId++, text: "Read the docs", done: false },
    { id: nextId++, text: "Write some code", done: false },
    { id: nextId++, text: "Ship it", done: false },
  ]);
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    setTodos([...todos, { id: nextId++, text: draft.trim(), done: false }]);
    setDraft("");
  };

  const toggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  // Deletion: after removal the remaining items keep their original IDs —
  // React reuses their DOM nodes correctly because keys are stable IDs,
  // not their current array index.
  const remove = (id) => setTodos(todos.filter((t) => t.id !== id));

  // Move item up one position
  const moveUp = (index) => {
    if (index === 0) return;
    const next = [...todos];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setTodos(next);
  };

  return (
    <div>
      <h2>TodoList</h2>

      {/* Add form */}
      <div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New todo..."
        />
        <button onClick={add}>Add</button>
      </div>

      {todos.length === 0 ? (
        <EmptyState message="All done! Add a new task above." icon="✅" />
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {todos.map((todo, index) => (
            // Stable ID key — safe to delete, reorder, or insert anywhere
            <li
              key={todo.id}
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                textDecoration: todo.done ? "line-through" : "none",
                color: todo.done ? "#aaa" : "inherit",
              }}
            >
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggle(todo.id)}
              />
              {/* Each checkbox retains its checked state during reorders
                  because React matches by key (todo.id), not by position */}
              <input defaultValue={todo.text} style={{ flex: 1 }} />
              <button onClick={() => moveUp(index)} disabled={index === 0}>
                ↑
              </button>
              <button onClick={() => remove(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =============================================================================
// 8. VIRTUAL LIST — mention for huge datasets
// =============================================================================
// For lists with thousands of items, rendering every DOM node is expensive.
// Use a windowing library so only the visible rows are in the DOM.
//
// react-window (lightweight):
//   npm install react-window
//
//   import { FixedSizeList } from "react-window";
//
//   function HugeList({ items }) {
//     const Row = ({ index, style }) => (
//       <div style={style}>{items[index].name}</div>
//     );
//     return (
//       <FixedSizeList
//         height={500}      // visible container height (px)
//         itemCount={items.length}
//         itemSize={40}     // height of each row (px)
//         width="100%"
//       >
//         {Row}
//       </FixedSizeList>
//     );
//   }
//
// react-virtuoso is a good alternative with variable-height row support.
// Only add windowing when you have a measured performance problem — it adds
// complexity and breaks some CSS layout patterns.

// =============================================================================
// EXPORTS
// =============================================================================
export { SimpleList, FilterableList, NestedList, TodoList };

// Default export: all demos on one page
export default function ListsAndKeysDemo() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "0 auto", padding: "1rem" }}>
      <h1>Lists and Keys</h1>
      <SimpleList />
      <hr />
      <FilterableList />
      <hr />
      <NestedList />
      <hr />
      <TodoList />
    </div>
  );
}
