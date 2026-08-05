/**
 * React useState Hook - Concise Examples
 *
 * Covers:
 * 1. Basic useState - counter
 * 2. String state
 * 3. Object state (spread to update)
 * 4. Array state (add, remove, update)
 * 5. Toggle boolean
 * 6. Lazy initial state with function
 * 7. useState vs direct mutation (why mutation is wrong)
 */

import React, { useState } from "react";

// ---------------------------------------------------------------------------
// 1. Basic useState - Counter
// ---------------------------------------------------------------------------
export function Counter() {
  const [count, setCount] = useState(0); // initial value: 0

  return (
    <div>
      <h3>Counter: {count}</h3>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount((prev) => prev - 1)}>-1 (functional update)</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. String State
// ---------------------------------------------------------------------------
export function TextInput() {
  const [text, setText] = useState(""); // initial value: empty string

  return (
    <div>
      <h3>String State</h3>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)} // update string directly
        placeholder="Type something..."
      />
      <p>You typed: {text || "(nothing yet)"}</p>
      <p>Length: {text.length}</p>
      <button onClick={() => setText("")}>Clear</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Object State
// RULE: Always spread previous state when updating a single field.
//       setState({ key: val }) alone would LOSE all other fields.
// ---------------------------------------------------------------------------
export function UserForm() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    age: 0,
  });

  // Correct: spread existing state, then override only the changed key
  const handleChange = (field) => (e) => {
    setUser((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // WRONG (commented out - loses other fields):
  // setUser({ name: "Alice" }); // email and age disappear!

  return (
    <div>
      <h3>Object State</h3>
      <input placeholder="Name"  value={user.name}  onChange={handleChange("name")}  />
      <input placeholder="Email" value={user.email} onChange={handleChange("email")} />
      <input placeholder="Age"   value={user.age}   onChange={handleChange("age")} type="number" />
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Array State - Add, Remove, Update
// RULE: Never mutate the array (push/splice/sort mutate in place).
//       Always produce a new array via spread, filter, or map.
// ---------------------------------------------------------------------------
export function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Learn useState", done: false },
    { id: 2, text: "Build something", done: false },
  ]);
  const [input, setInput] = useState("");

  // ADD - spread existing + append new item
  const addTodo = () => {
    if (!input.trim()) return;
    const newItem = { id: Date.now(), text: input.trim(), done: false };
    setTodos((prev) => [...prev, newItem]); // correct: new array
    setInput("");
  };

  // REMOVE - filter returns a new array without the target id
  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // UPDATE (toggle done) - map returns a new array with one item changed
  const toggleDone = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div>
      <h3>Array State - Todo List</h3>

      {/* Add */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="New todo"
      />
      <button onClick={addTodo}>Add</button>

      {/* List */}
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} style={{ textDecoration: todo.done ? "line-through" : "none" }}>
            <span onClick={() => toggleDone(todo.id)} style={{ cursor: "pointer" }}>
              {todo.text}
            </span>
            <button onClick={() => removeTodo(todo.id)} style={{ marginLeft: 8 }}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Toggle Boolean State
// ---------------------------------------------------------------------------
export function ToggleExample() {
  const [isOpen, setIsOpen] = useState(false);

  // Use functional update so toggling is always based on latest state,
  // especially important inside async callbacks or rapid clicks.
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div>
      <h3>Boolean Toggle</h3>
      <button onClick={toggle}>{isOpen ? "Close" : "Open"} Panel</button>
      {isOpen && <p>Panel content is visible.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Lazy Initial State with Function
// Use when the initial value is expensive to compute.
// The function runs ONLY on the first render, not on every re-render.
// ---------------------------------------------------------------------------
function expensiveComputation() {
  // Simulate a slow calculation (e.g. parsing localStorage, large dataset)
  console.log("Running expensive init (only once)");
  return Array.from({ length: 5 }, (_, i) => i * i); // [0,1,4,9,16]
}

export function LazyInitExample() {
  // Pass a FUNCTION REFERENCE (not a call) so React defers execution
  const [data, setData] = useState(expensiveComputation); // correct
  // useState(expensiveComputation())  <-- WRONG: runs on every render

  return (
    <div>
      <h3>Lazy Initial State</h3>
      <p>Squares: {data.join(", ")}</p>
      <button onClick={() => setData((prev) => [...prev, prev.length ** 2])}>
        Add next square
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. useState vs Direct Mutation - Why Mutation Is Wrong
// ---------------------------------------------------------------------------
export function MutationDangerExample() {
  const [items, setItems] = useState(["apple", "banana"]);

  // WRONG - mutates state directly; React does NOT detect this change
  // because the array reference stays the same, so no re-render occurs.
  const addWrong = () => {
    items.push("cherry"); // mutates in place - BAD
    setItems(items);      // same reference -> React bails out, UI stuck
  };

  // CORRECT - create a new array; React sees a new reference and re-renders
  const addCorrect = () => {
    setItems((prev) => [...prev, "cherry"]); // new array reference - GOOD
  };

  return (
    <div>
      <h3>Mutation vs Immutable Update</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <button onClick={addWrong} style={{ color: "red" }}>
        Add Wrong (mutation - may not re-render)
      </button>
      <button onClick={addCorrect} style={{ color: "green", marginLeft: 8 }}>
        Add Correct (spread)
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary / Cheat-sheet (as comments)
// ---------------------------------------------------------------------------
/*
useState RULES:
  1. Never mutate state directly (push, splice, sort, obj.key = val).
     Always produce a NEW value / reference.
  2. For objects: setX(prev => ({ ...prev, key: newVal }))
  3. For arrays add:    setX(prev => [...prev, newItem])
  4. For arrays remove: setX(prev => prev.filter(i => i.id !== id))
  5. For arrays update: setX(prev => prev.map(i => i.id === id ? {...i, ...patch} : i))
  6. Use functional update (prev =>) whenever next state depends on prev state.
  7. Pass a function to useState(() => compute()) for expensive initial values.
*/
