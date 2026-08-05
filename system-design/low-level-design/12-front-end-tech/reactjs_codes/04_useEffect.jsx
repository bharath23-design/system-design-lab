import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. No dependency array — runs after EVERY render
// ─────────────────────────────────────────────────────────────────────────────
function RunEveryRender() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Executes after the initial render AND after every subsequent render.
    // Useful for side-effects that must stay in sync with the entire component
    // state, but be careful: it fires very frequently.
    console.log("Rendered. count =", count);
  }); // <-- no second argument

  return <button onClick={() => setCount((c) => c + 1)}>Clicks: {count}</button>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Empty dependency array [] — runs ONCE on mount (componentDidMount)
// ─────────────────────────────────────────────────────────────────────────────
function RunOnMount() {
  const [message, setMessage] = useState("waiting…");

  useEffect(() => {
    // Fires exactly once after the first paint.
    setMessage("Component mounted!");
    // Cleanup (optional): runs on unmount only.
    return () => console.log("RunOnMount unmounted");
  }, []); // <-- empty array

  return <p>{message}</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. With dependencies — runs when listed values change
// ─────────────────────────────────────────────────────────────────────────────
function RunOnDepChange() {
  const [userId, setUserId] = useState(1);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Re-runs whenever `userId` changes.
    // Simulating a lookup (replace with real async call in practice).
    setProfile({ id: userId, name: `User #${userId}` });
  }, [userId]); // <-- dependency list

  return (
    <div>
      <p>Profile: {profile ? profile.name : "loading…"}</p>
      <button onClick={() => setUserId((id) => id + 1)}>Next user</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Cleanup — cancel subscriptions, clear timers, abort fetches
// ─────────────────────────────────────────────────────────────────────────────

// Timer component: starts an interval, clears it on unmount or dep change.
export function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return; // nothing to set up

    const id = setInterval(() => setSeconds((s) => s + 1), 1000);

    // Cleanup: called before the next effect run OR on unmount.
    return () => clearInterval(id);
  }, [running]); // re-run when `running` changes

  return (
    <div>
      <p>Elapsed: {seconds}s</p>
      <button onClick={() => setRunning((r) => !r)}>
        {running ? "Pause" : "Resume"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Fetch data pattern — loading / error / data states + AbortController
// ─────────────────────────────────────────────────────────────────────────────
export function FetchPost({ postId = 1 }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // AbortController lets us cancel the in-flight request when the component
    // unmounts or `postId` changes before the fetch completes.
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://jsonplaceholder.typicode.com/posts/${postId}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPost(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          // Ignore cancellation "errors" — they are expected.
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Cleanup: abort the fetch if deps change or component unmounts.
    return () => controller.abort();
  }, [postId]);

  if (loading) return <p>Loading post {postId}…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  return (
    <div>
      <h3>{post?.title}</h3>
      <p>{post?.body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Event listener — setup and cleanup
// ─────────────────────────────────────────────────────────────────────────────
export function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener("resize", handleResize);

    // Cleanup: remove the listener to prevent memory leaks.
    return () => window.removeEventListener("resize", handleResize);
  }, []); // only attach/detach once

  return (
    <p>
      Window: {size.width} x {size.height}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Common mistakes
// ─────────────────────────────────────────────────────────────────────────────

/*
  MISTAKE A — Missing dependency causes stale closure:

    const [value, setValue] = useState(0);
    useEffect(() => {
      console.log(value); // always logs 0 (stale closure)
    }, []);               // BUG: `value` should be in the dep array

  FIX: add `value` to the dependency list.
*/

/*
  MISTAKE B — Object / array literal in deps causes infinite loop:

    useEffect(() => {
      fetchData(options);
    }, [{ page: 1 }]); // BUG: new object reference every render → endless loop

  FIX: stabilize the value with useMemo, useState, or useRef, or list only
  primitive fields:

    useEffect(() => {
      fetchData({ page });
    }, [page]); // stable primitive
*/

/*
  MISTAKE C — Async function directly inside useEffect:

    useEffect(async () => {   // BUG: returns a Promise, not a cleanup fn
      const data = await fetchSomething();
    }, []);

  FIX: define an inner async function and call it:

    useEffect(() => {
      async function load() { ... }
      load();
    }, []);
*/

// ─────────────────────────────────────────────────────────────────────────────
// DataFetcher — generic fetcher with configurable URL (demonstrates patterns
// 3, 4, and 5 together)
// ─────────────────────────────────────────────────────────────────────────────
export function DataFetcher({ url }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!url) return; // nothing to fetch

    const controller = new AbortController();
    setStatus("loading");

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setStatus("success");
      } catch (err) {
        if (err.name !== "AbortError") {
          setErrorMsg(err.message);
          setStatus("error");
        }
      }
    })();

    return () => controller.abort();
  }, [url]); // re-fetch whenever the URL changes

  if (status === "idle") return <p>No URL provided.</p>;
  if (status === "loading") return <p>Loading…</p>;
  if (status === "error") return <p style={{ color: "red" }}>Error: {errorMsg}</p>;
  return <pre style={{ overflow: "auto" }}>{JSON.stringify(data, null, 2)}</pre>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo: wire everything together (used during local development only)
// ─────────────────────────────────────────────────────────────────────────────
export default function UseEffectDemo() {
  const [postId, setPostId] = useState(1);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 640 }}>
      <h1>useEffect Examples</h1>

      <section>
        <h2>1. Runs after every render</h2>
        <RunEveryRender />
      </section>

      <section>
        <h2>2. Runs once on mount</h2>
        <RunOnMount />
      </section>

      <section>
        <h2>3. Runs when dependency changes</h2>
        <RunOnDepChange />
      </section>

      <section>
        <h2>4. Timer with cleanup</h2>
        <Timer />
      </section>

      <section>
        <h2>5. Fetch with loading / error</h2>
        <label>
          Post ID:{" "}
          <input
            type="number"
            min={1}
            max={100}
            value={postId}
            onChange={(e) => setPostId(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <FetchPost postId={postId} />
      </section>

      <section>
        <h2>6. Window size (event listener)</h2>
        <WindowSize />
      </section>

      <section>
        <h2>DataFetcher (generic)</h2>
        <DataFetcher url="https://jsonplaceholder.typicode.com/todos/1" />
      </section>
    </div>
  );
}
