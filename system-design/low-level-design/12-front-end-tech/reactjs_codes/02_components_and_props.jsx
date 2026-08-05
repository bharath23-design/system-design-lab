// ============================================================
// React Components & Props — Core Patterns
// ============================================================
// Run in a CRA / Vite project:
//   import App from './02_components_and_props';
//   ReactDOM.createRoot(document.getElementById('root')).render(<App />);
// ============================================================

// ------------------------------------------------------------
// 1. FUNCTIONAL COMPONENT (modern standard)
//    - Plain function that returns JSX
//    - React 18+: no class components needed
// ------------------------------------------------------------
function Greeting() {
  return <h1>Hello, world!</h1>;
}

// ------------------------------------------------------------
// 2. PROPS — read-only, destructured in params, default values
//    - Props flow DOWN (parent → child); never mutate them
//    - Default values via ES6 default params
// ------------------------------------------------------------
function UserCard({ name, role = "Member", age }) {
  // `role` defaults to "Member" when not provided by caller
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>Role: {role}</p>
      {/* 5. CONDITIONAL RENDERING — show age only when present */}
      {age !== undefined && <p>Age: {age}</p>}
    </div>
  );
}

// ------------------------------------------------------------
// 3. CHILDREN PROP — composition via slot-like pattern
//    - `children` is whatever JSX is placed between open/close tags
// ------------------------------------------------------------
function Card({ title, children }) {
  return (
    <div className="card" style={{ border: "1px solid #ccc", padding: "1rem", margin: "0.5rem" }}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-body">{children}</div>
    </div>
  );
}

// ------------------------------------------------------------
// 4. SPREADING PROPS WITH ...rest
//    - Capture "everything else" and forward to the DOM element
//    - Useful for wrapper / primitive components (Button, Input…)
// ------------------------------------------------------------
function Button({ label, variant = "primary", ...rest }) {
  // `rest` may contain: onClick, disabled, type, aria-*, data-*, etc.
  const style = {
    background: variant === "danger" ? "#e53e3e" : "#3182ce",
    color: "#fff",
    padding: "0.4rem 1rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  return (
    <button style={style} {...rest}>
      {label}
    </button>
  );
}

// ------------------------------------------------------------
// 5. CONDITIONAL RENDERING PATTERNS
//    a) Short-circuit  — condition && <JSX />
//    b) Ternary        — condition ? <A /> : <B />
//    c) Early return   — return null to render nothing
// ------------------------------------------------------------
function StatusBadge({ status }) {
  if (!status) return null; // early return

  return (
    <span>
      {status === "active" ? (
        <span style={{ color: "green" }}>● Active</span>
      ) : (
        <span style={{ color: "red" }}>● Inactive</span>
      )}
    </span>
  );
}

// ------------------------------------------------------------
// 6. COMPONENT COMPOSITION — parent / child relationship
//    Parent owns state/data; children are pure display units.
// ------------------------------------------------------------
const USERS = [
  { id: 1, name: "Alice", role: "Admin",  age: 30, status: "active"   },
  { id: 2, name: "Bob",   role: "Editor", age: 25, status: "inactive" },
  { id: 3, name: "Carol"                                               }, // minimal props
];

function UserList({ users }) {
  return (
    <section>
      <h2>Team Members</h2>
      {users.map((user) => (
        // Each child in a list needs a stable key
        <Card key={user.id} title={user.name}>
          {/* Children here: UserCard + StatusBadge nested inside Card */}
          <UserCard name={user.name} role={user.role} age={user.age} />
          <StatusBadge status={user.status} />
        </Card>
      ))}
    </section>
  );
}

// ------------------------------------------------------------
// 7. PROPTYPES — runtime type-checking (development only)
//    Install:  npm install prop-types
//    Import:   import PropTypes from 'prop-types';
//
//    UserCard.propTypes = {
//      name:   PropTypes.string.isRequired,
//      role:   PropTypes.string,
//      age:    PropTypes.number,
//    };
//    UserCard.defaultProps = { role: "Member" };   // (legacy alt. to default params)
//
//    Prefer TypeScript interfaces for static checking in real projects.
// ------------------------------------------------------------

// ------------------------------------------------------------
// ROOT APP — wires everything together
// ------------------------------------------------------------
function App() {
  const handleSave = () => alert("Saved!");

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "2rem auto" }}>
      {/* 1 — plain functional component */}
      <Greeting />

      {/* 2 — props with destructuring and defaults */}
      <UserCard name="Diana" role="Owner" age={28} />

      {/* 3 — children prop */}
      <Card title="Quick Note">
        <p>This content is passed as <code>children</code>.</p>
      </Card>

      {/* 4 — spreading ...rest (onClick forwarded via rest) */}
      <Button label="Save"   variant="primary" onClick={handleSave} />
      <Button label="Delete" variant="danger"  onClick={() => alert("Deleted!")} disabled />

      {/* 6 — composition: parent → child tree */}
      <UserList users={USERS} />
    </div>
  );
}

// Named exports for targeted import; App is the default entry point.
export { Greeting, UserCard, Card, Button, App };
export default App;
