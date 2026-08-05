/**
 * useRef Examples
 *
 * useRef returns a mutable { current: ... } object that persists for the full
 * lifetime of the component.  Two key properties:
 *   1. Changing ref.current does NOT trigger a re-render.
 *   2. The value survives re-renders (unlike a plain local variable).
 */

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

// ---------------------------------------------------------------------------
// 1. DOM ref – focus an input and scroll a container
// ---------------------------------------------------------------------------
export function FocusInput() {
  const inputRef = useRef(null); // initially null; set by React when mounted
  const boxRef = useRef(null);

  const handleFocus = () => {
    // Direct DOM API call – no state needed
    inputRef.current.focus();
  };

  const handleScroll = () => {
    boxRef.current.scrollTop = 0; // scroll the div back to top
  };

  return (
    <div>
      <input ref={inputRef} placeholder="Click button to focus me" />
      <button onClick={handleFocus}>Focus Input</button>

      <div
        ref={boxRef}
        style={{ height: 80, overflowY: "auto", border: "1px solid #ccc" }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>Line {i + 1}</p>
        ))}
      </div>
      <button onClick={handleScroll}>Scroll to Top</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Mutable ref – store a value that persists across renders WITHOUT
//    triggering a re-render (unlike useState)
// ---------------------------------------------------------------------------
export function RenderCounter() {
  const [count, setCount] = useState(0);
  const renderCount = useRef(0);

  // Increment on every render – no state, so no infinite loop
  renderCount.current += 1;

  return (
    <div>
      <p>State count: {count}</p>
      {/* renderCount.current is always current but never stale */}
      <p>Total renders (via ref, NOT state): {renderCount.current}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment State</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Previous value pattern – capture the previous render's value
// ---------------------------------------------------------------------------
export function PreviousValue() {
  const [value, setValue] = useState("");
  const prevValue = useRef("");

  useEffect(() => {
    // After render, store current as the "previous" for the NEXT render
    prevValue.current = value;
  }); // no dependency array → runs after every render

  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type something"
      />
      <p>Current : {value}</p>
      <p>Previous: {prevValue.current}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Interval / timer ref – keep the interval ID so cleanup always works,
//    even when the callback closes over stale state
// ---------------------------------------------------------------------------
export function IntervalTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null); // stores the interval ID

  const start = () => {
    if (intervalRef.current) return; // already running
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1); // functional update avoids stale closure
    }, 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  };

  const reset = () => {
    stop();
    setSeconds(0);
  };

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div>
      <p>Elapsed: {seconds}s</p>
      <button onClick={start} disabled={running}>Start</button>
      <button onClick={stop} disabled={!running}>Stop</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. forwardRef – let a parent pass its ref down to a child's DOM node
// ---------------------------------------------------------------------------
const TextInput = forwardRef(function TextInput({ label, ...rest }, ref) {
  // ref is now attached to the underlying <input> element
  return (
    <label>
      {label}
      <input ref={ref} {...rest} style={{ marginLeft: 8 }} />
    </label>
  );
});

export function ForwardRefDemo() {
  const inputRef = useRef(null);

  return (
    <div>
      <TextInput ref={inputRef} label="Name:" placeholder="Enter name" />
      <button onClick={() => inputRef.current.focus()}>Focus Child Input</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. useImperativeHandle – expose a custom API to the parent instead of the
//    raw DOM node.  Parent calls methods like child.focus() / child.clear().
// ---------------------------------------------------------------------------
const FancyInputInner = forwardRef(function FancyInputInner(props, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    // Only expose these two methods – parent cannot touch the raw DOM node
    focus() {
      inputRef.current.focus();
    },
    clear() {
      inputRef.current.value = "";
      inputRef.current.focus();
    },
  }));

  return (
    <input
      ref={inputRef}
      style={{ border: "2px solid royalblue", borderRadius: 4, padding: 4 }}
      placeholder="Fancy input"
      {...props}
    />
  );
});

export function FancyInput() {
  const fancyRef = useRef(null);

  return (
    <div>
      <FancyInputInner ref={fancyRef} />
      {/* Parent can only call the two methods exposed via useImperativeHandle */}
      <button onClick={() => fancyRef.current.focus()}>Focus</button>
      <button onClick={() => fancyRef.current.clear()}>Clear</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export: a single page that renders all demos
// ---------------------------------------------------------------------------
export default function UseRefExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 600 }}>
      <h2>1. DOM ref (focus + scroll)</h2>
      <FocusInput />

      <hr />
      <h2>2. Mutable ref (render counter, no re-render)</h2>
      <RenderCounter />

      <hr />
      <h2>3. Previous value pattern</h2>
      <PreviousValue />

      <hr />
      <h2>4. Interval / timer ref with cleanup</h2>
      <IntervalTimer />

      <hr />
      <h2>5. forwardRef (parent ref reaches child DOM node)</h2>
      <ForwardRefDemo />

      <hr />
      <h2>6. useImperativeHandle (custom child API)</h2>
      <FancyInput />
    </div>
  );
}
