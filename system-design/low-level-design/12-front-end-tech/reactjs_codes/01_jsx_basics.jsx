/**
 * 01_jsx_basics.jsx
 * JSX is syntactic sugar — Babel transforms it to React.createElement() calls.
 * Rules enforced at compile time, not runtime.
 */

import React from "react";

// ---------------------------------------------------------------------------
// 1. JSX COMPILATION EQUIVALENCE
//    JSX is NOT HTML — it's JS that returns React elements.
// ---------------------------------------------------------------------------

// JSX form:
const elementJSX = <h1 className="title">Hello</h1>;

// What Babel compiles it to (React 17+ uses automatic runtime; classic shown here):
const elementJS = React.createElement("h1", { className: "title" }, "Hello");

// Both produce the same virtual DOM object — prefer JSX for readability.


// ---------------------------------------------------------------------------
// 2. SINGLE ROOT RULE
//    Every JSX expression must have ONE root element.
//    Use Fragment (<> </>) to avoid adding an extra <div> to the DOM.
// ---------------------------------------------------------------------------

// Bad — two sibling roots cause a SyntaxError:
//   return <h1>A</h1><p>B</p>;

// Good — Fragment:
const TwoSiblings = () => (
  <>
    <h1>A</h1>
    <p>B</p>
  </>
);

// React.Fragment long-form (useful when you need a key prop on the fragment):
const TwoSiblingsKeyed = ({ id }) => (
  <React.Fragment key={id}>
    <h1>A</h1>
    <p>B</p>
  </React.Fragment>
);


// ---------------------------------------------------------------------------
// 3. CAMELCASE ATTRIBUTES  +  className / htmlFor
//    HTML attribute names collide with JS reserved words or differ in casing.
// ---------------------------------------------------------------------------

const AttributeExamples = () => (
  <form>
    {/* class → className  (class is a JS keyword) */}
    <label className="label" htmlFor="email">  {/* for → htmlFor */}
      Email
    </label>

    {/* onclick → onClick  (all events are camelCase) */}
    <input
      id="email"
      type="email"
      onChange={(e) => console.log(e.target.value)}  // onChange, not onchange
      tabIndex={1}                                    // number, not string
    />
  </form>
);


// ---------------------------------------------------------------------------
// 4. SELF-CLOSING TAGS
//    In JSX every tag without children MUST be self-closed — HTML allows omitting
//    the slash; JSX does not.
// ---------------------------------------------------------------------------

const SelfClosingExamples = () => (
  <>
    <img src="/logo.png" alt="Logo" />   {/* NOT <img src="...">  */}
    <input type="text" />
    <br />
    <hr />
    <MyComponent />                       {/* custom components too */}
  </>
);

// Placeholder to satisfy the reference above
const MyComponent = () => null;


// ---------------------------------------------------------------------------
// 5. JSX EXPRESSIONS  { }
//    Curly braces embed any valid JS expression (not statements).
// ---------------------------------------------------------------------------

const user = { name: "Bharath", score: 42, isAdmin: true };

const Expressions = () => {
  const greet = (name) => `Hello, ${name}!`;

  return (
    <div>
      {/* JS value */}
      <p>{user.name}</p>

      {/* Function call */}
      <p>{greet(user.name)}</p>

      {/* Ternary — the idiomatic JSX conditional */}
      <p>{user.isAdmin ? "Admin" : "Guest"}</p>

      {/* Arithmetic */}
      <p>Score: {user.score * 2}</p>

      {/* Template literal */}
      <p>{`User score is ${user.score}`}</p>
    </div>
  );
};


// ---------------------------------------------------------------------------
// 6. SHORT-CIRCUIT RENDERING  (&&)
//    Render something only when a condition is truthy.
//    GOTCHA: 0 && <X /> renders "0" — use !!count || Boolean(count).
// ---------------------------------------------------------------------------

const Notifications = ({ count }) => (
  <div>
    {/* Safe: Boolean coerces count to true/false */}
    {count > 0 && <span className="badge">{count}</span>}

    {/* WRONG — if count=0, React renders the number 0 in the DOM */}
    {/* {count && <span>{count}</span>} */}
  </div>
);


// ---------------------------------------------------------------------------
// 7. INLINE STYLES AS OBJECTS
//    style prop takes a JS object with camelCase keys — not a CSS string.
//    Values are strings (or numbers for px-based properties).
// ---------------------------------------------------------------------------

// Defined outside the component to avoid re-creating the object on every render.
const cardStyle = {
  backgroundColor: "#f0f4ff",   // not "background-color"
  padding: "1rem",
  borderRadius: 8,              // React appends "px" for unitless numbers on DOM nodes
  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
};

const StyledCard = ({ children }) => (
  <div style={cardStyle}>
    {/* Inline object literal (creates new object each render — avoid for hot paths) */}
    <p style={{ color: "#333", margin: 0 }}>{children}</p>
  </div>
);


// ---------------------------------------------------------------------------
// 8. DEMO COMPONENT — ties everything together
// ---------------------------------------------------------------------------

const JSXDemo = () => {
  const isLoggedIn = true;
  const notifCount = 3;
  const username = "Bharath";

  return (
    // Single root via Fragment
    <>
      <StyledCard>
        {/* Expression: function call */}
        <strong>{`Welcome, ${username}`}</strong>
      </StyledCard>

      {/* Ternary conditional */}
      {isLoggedIn ? (
        <p className="status">You are logged in.</p>
      ) : (
        <p className="status">Please log in.</p>
      )}

      {/* Short-circuit */}
      <Notifications count={notifCount} />

      {/* Self-closing custom component */}
      <AttributeExamples />

      {/* Sibling nodes without extra DOM wrapper */}
      <TwoSiblings />
    </>
  );
};

export default JSXDemo;
