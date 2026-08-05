# Forms in React

## Controlled vs Uncontrolled

| | Controlled | Uncontrolled |
|-|------------|--------------|
| Data lives in | React state (`useState`) | DOM (via `ref`) |
| How to read | `value` / `checked` prop | `ref.current.value` |
| When to use | Validation, dynamic fields, dependent inputs | Simple one-off reads, file inputs |

## Controlled Input Pattern

```jsx
const [value, setValue] = useState('');

<input value={value} onChange={e => setValue(e.target.value)} />
```

## Input Type Reference

| Type | Value binding | onChange value |
|------|--------------|----------------|
| `text`, `number`, `email` | `value={val}` | `e.target.value` (string) |
| `checkbox` | `checked={bool}` | `e.target.checked` (boolean) |
| `select` | `value={val}` on `<select>` | `e.target.value` |
| `file` | uncontrolled only | `e.target.files[0]` |
| `radio` | `checked={val === option}` | `e.target.value` |

## Form Submission Pattern

```jsx
function MyForm() {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // prevents page reload
    console.log(name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Validation Approaches

1. **Manual** — keep an `errors` state object, set messages on blur or submit
   ```jsx
   const [error, setError] = useState('');
   if (!value) setError('Required');
   ```
2. **HTML5 attributes** — zero JS, browser-native, limited styling control
   ```jsx
   <input required minLength={3} pattern="[A-Za-z]+" />
   ```
3. **Libraries** (recommended for complex forms)
   - **React Hook Form** — minimal re-renders, easy validation, large ecosystem
   - **Formik** — older standard, more boilerplate
   - **Zod + RHF** — schema-based type-safe validation (`zodResolver`)

## Common Mistakes

- **Forgetting `e.preventDefault()`** on submit — causes full page reload.
- **Using array index as `key`** for dynamic fields — causes incorrect state when items are added/removed/reordered.
- **Switching uncontrolled to controlled** — passing `undefined` initially then a real value triggers React's warning; always initialise state to `''` not `undefined`.
- **Mutating state directly** — always produce a new object/array (spread or map) when updating nested form state.
