/**
 * 09_forms.jsx
 * React forms: controlled inputs, validation, uncontrolled refs, and common
 * input types. For complex forms at scale, prefer React Hook Form (see note
 * at the bottom).
 */

import React, { useState, useRef } from "react";

// ---------------------------------------------------------------------------
// 1. CONTROLLED INPUT — value + onChange handler
// ---------------------------------------------------------------------------
// The input value is always driven by React state. React is the "source of
// truth". Every keystroke updates state, which re-renders the input.

export function ControlledInput() {
  const [text, setText] = useState("");

  return (
    <div>
      <input
        type="text"
        value={text}                        // controlled: React owns the value
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something…"
      />
      <p>Live preview: {text}</p>
      <button onClick={() => setText("")}>Clear</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. MULTI-FIELD FORM — single state object
// ---------------------------------------------------------------------------
// One useState object holds all fields. A generic handler reads e.target.name
// so each field doesn't need its own setter.

export function MultiFieldForm() {
  const [fields, setFields] = useState({
    username: "",
    email: "",
    age: "",
  });

  // Generic handler: spread existing state, override only the changed key.
  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault(); // 6. PREVENT DEFAULT — stops page reload
    console.log("Submitted:", fields);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        value={fields.username}
        onChange={handleChange}
        placeholder="Username"
      />
      <input
        name="email"
        type="email"
        value={fields.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <input
        name="age"
        type="number"
        value={fields.age}
        onChange={handleChange}
        placeholder="Age"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 3. FORM VALIDATION — inline errors derived from state
// ---------------------------------------------------------------------------
// Validate on submit (or onChange for real-time feedback). Store errors in a
// parallel object keyed by field name.

export function LoginForm() {
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function validate(values) {
    const errs = {};
    if (!values.email.includes("@")) errs.email = "Valid email required.";
    if (values.password.length < 8)  errs.password = "Min 8 characters.";
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setCreds((prev) => ({ ...prev, [name]: value }));
    // Clear individual error on edit
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(creds);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
    console.log("Login:", creds);
  }

  if (submitted) return <p>Logged in as {creds.email}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="email"
          type="email"
          value={creds.email}
          onChange={handleChange}
          placeholder="Email"
        />
        {errors.email && <span style={{ color: "red" }}>{errors.email}</span>}
      </div>
      <div>
        <input
          name="password"
          type="password"
          value={creds.password}
          onChange={handleChange}
          placeholder="Password"
        />
        {errors.password && <span style={{ color: "red" }}>{errors.password}</span>}
      </div>
      <button type="submit">Login</button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 4. UNCONTROLLED INPUT WITH useRef
// ---------------------------------------------------------------------------
// React does NOT track the value. The DOM owns it. Read with ref.current.value
// at submit time. Required for <input type="file"> (file objects can't be set
// via React state).

function FileUploadForm() {
  const fileRef  = useRef(null);
  const nameRef  = useRef(null); // plain text field, uncontrolled

  function handleSubmit(e) {
    e.preventDefault();
    const file = fileRef.current.files[0];  // access native File object
    const name = nameRef.current.value;
    console.log("Name:", name, "File:", file?.name);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={nameRef} type="text" defaultValue="" placeholder="Your name" />
      <input ref={fileRef} type="file" accept="image/*" />
      <button type="submit">Upload</button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 5. SELECT, CHECKBOX, RADIO — controlled
// ---------------------------------------------------------------------------
// - <select>: value prop on the element, not on <option>.
// - checkbox: use checked prop (not value), boolean state.
// - radio: checked = (state === thisValue).

export function CheckboxGroup() {
  // Select
  const [country, setCountry] = useState("us");

  // Checkbox (multi-select stored as Set or object)
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  // Radio
  const [plan, setPlan] = useState("free");

  function handleSubmit(e) {
    e.preventDefault();
    console.log({ country, agreed, newsletter, plan });
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* SELECT */}
      <label>
        Country:
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
          <option value="in">India</option>
        </select>
      </label>

      {/* CHECKBOXES */}
      <label>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        I agree to the terms
      </label>
      <label>
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
        />
        Subscribe to newsletter
      </label>

      {/* RADIO */}
      {["free", "pro", "enterprise"].map((option) => (
        <label key={option}>
          <input
            type="radio"
            name="plan"
            value={option}
            checked={plan === option}
            onChange={() => setPlan(option)}
          />
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </label>
      ))}

      <button type="submit">Save Preferences</button>
      <pre>{JSON.stringify({ country, agreed, newsletter, plan }, null, 2)}</pre>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 6. FORM SUBMISSION AND preventDefault (inline recap)
// ---------------------------------------------------------------------------
// Always call e.preventDefault() in onSubmit to stop the browser from
// sending a GET/POST request and refreshing the page. After validation,
// use fetch/axios to send data to your API.
//
//   async function handleSubmit(e) {
//     e.preventDefault();
//     await fetch("/api/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(formData),
//     });
//   }

// ---------------------------------------------------------------------------
// 7. REACT HOOK FORM — recommended for production forms
// ---------------------------------------------------------------------------
// react-hook-form (npm i react-hook-form) reduces boilerplate drastically:
//   - No per-field state; the library tracks values via uncontrolled refs
//     internally and only re-renders on validation errors.
//   - register() wires an input; handleSubmit() wraps your submit handler;
//     formState.errors holds validation messages from Yup/Zod schemas.
//
//   import { useForm } from "react-hook-form";
//   import { zodResolver } from "@hookform/resolvers/zod";
//   import { z } from "zod";
//
//   const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
//
//   function HookForm() {
//     const { register, handleSubmit, formState: { errors } } = useForm({
//       resolver: zodResolver(schema),
//     });
//     return (
//       <form onSubmit={handleSubmit((data) => console.log(data))}>
//         <input {...register("email")} />
//         {errors.email && <span>{errors.email.message}</span>}
//         <input type="password" {...register("password")} />
//         {errors.password && <span>{errors.password.message}</span>}
//         <button type="submit">Login</button>
//       </form>
//     );
//   }

// ---------------------------------------------------------------------------
// DEFAULT EXPORT — demo wrapper
// ---------------------------------------------------------------------------
export default function FormsDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }}>
      <section>
        <h2>1. Controlled Input</h2>
        <ControlledInput />
      </section>
      <section>
        <h2>2. Multi-Field Form</h2>
        <MultiFieldForm />
      </section>
      <section>
        <h2>3. Login Form with Validation</h2>
        <LoginForm />
      </section>
      <section>
        <h2>4. File Upload (Uncontrolled)</h2>
        <FileUploadForm />
      </section>
      <section>
        <h2>5. Select / Checkbox / Radio</h2>
        <CheckboxGroup />
      </section>
    </div>
  );
}
