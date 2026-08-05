/**
 * 13_error_boundaries.jsx
 *
 * Error boundaries catch JavaScript errors anywhere in their child component
 * tree during rendering, lifecycle methods, and constructors.
 *
 * KEY RULES:
 *   - Error boundaries MUST be class components.
 *   - They do NOT catch errors in: event handlers, async code, SSR, or
 *     errors thrown by the error boundary itself.
 *   - Two lifecycle methods make a class component an error boundary:
 *       static getDerivedStateFromError(error)  -- update state to show fallback
 *       componentDidCatch(error, info)           -- log the error
 */

import React from "react";

// ---------------------------------------------------------------------------
// 1. ErrorBoundary class component
// ---------------------------------------------------------------------------
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // Called during rendering when a descendant throws.
  // Return value is merged into state.
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Called after rendering with error details — ideal for logging.
  componentDidCatch(error, info) {
    // info.componentStack is the React component stack trace.
    console.error("[ErrorBoundary] Caught an error:", error);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);

    // Example: send to an external monitoring service
    // logErrorToService(error, info.componentStack);
  }

  // Reset handler — allows users to retry after an error.
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Render a custom fallback or delegate to a prop-supplied component.
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      return (
        <FallbackUI
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// 2. FallbackUI — what the user sees when an error is caught
// ---------------------------------------------------------------------------
export function FallbackUI({ error, onReset }) {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Something went wrong.</h2>
      {error && (
        <pre style={styles.message}>{error.message}</pre>
      )}
      <button style={styles.button} onClick={onReset}>
        Try again
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    border: "2px solid #e53e3e",
    borderRadius: "8px",
    background: "#fff5f5",
    color: "#742a2a",
    textAlign: "center",
  },
  heading: { margin: "0 0 0.75rem", fontSize: "1.25rem" },
  message: {
    background: "#fed7d7",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    fontSize: "0.85rem",
    textAlign: "left",
    overflowX: "auto",
  },
  button: {
    marginTop: "1rem",
    padding: "0.5rem 1.25rem",
    background: "#e53e3e",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

// ---------------------------------------------------------------------------
// 3. BuggyComponent — intentionally throws during render
// ---------------------------------------------------------------------------
export function BuggyComponent({ shouldThrow = false }) {
  if (shouldThrow) {
    // This throw is caught by the nearest ancestor ErrorBoundary.
    throw new Error("BuggyComponent: intentional render error!");
  }
  return <p>BuggyComponent rendered successfully.</p>;
}

// ---------------------------------------------------------------------------
// 4. SafeApp — composes ErrorBoundary around potentially failing subtrees
// ---------------------------------------------------------------------------
export function SafeApp() {
  const [throwError, setThrowError] = React.useState(false);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Error Boundary Demo</h1>

      {/* --- Basic usage: wrap a risky component --- */}
      <section>
        <h2>Basic Boundary</h2>
        <button onClick={() => setThrowError((v) => !v)}>
          {throwError ? "Reset (unmounts BuggyComponent)" : "Trigger error"}
        </button>

        {/*
          Once the boundary catches an error the child subtree is unmounted.
          Clicking "Try again" in FallbackUI calls handleReset(), which resets
          state and re-renders children — giving BuggyComponent a fresh start.
          We also toggle throwError so the re-mounted component does not
          immediately throw again.
        */}
        <ErrorBoundary key={String(throwError)}>
          <BuggyComponent shouldThrow={throwError} />
        </ErrorBoundary>
      </section>

      {/* --- Custom fallback via render prop --- */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Custom Fallback (render prop)</h2>
        <ErrorBoundary
          fallback={(error, reset) => (
            <div>
              <p style={{ color: "orange" }}>
                Custom fallback: {error?.message}
              </p>
              <button onClick={reset}>Retry</button>
            </div>
          )}
        >
          <BuggyComponent shouldThrow />
        </ErrorBoundary>
      </section>

      {/* --- Multiple independent boundaries --- */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Independent Boundaries (one fails, others stay alive)</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <ErrorBoundary>
            <BuggyComponent shouldThrow />
          </ErrorBoundary>
          <ErrorBoundary>
            <BuggyComponent shouldThrow={false} />
          </ErrorBoundary>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. React 18 / react-error-boundary library — useErrorBoundary hook
// ---------------------------------------------------------------------------
/**
 * The react-error-boundary library (v4+, works with React 16-18) provides
 * a hook-friendly API that avoids writing class components manually.
 *
 * Installation:
 *   npm install react-error-boundary
 *
 * Basic usage:
 *
 *   import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
 *
 *   function RiskyButton() {
 *     const { showBoundary } = useErrorBoundary();
 *
 *     const handleClick = async () => {
 *       try {
 *         await fetchData();           // async errors are NOT auto-caught
 *       } catch (err) {
 *         showBoundary(err);           // manually forward to nearest boundary
 *       }
 *     };
 *
 *     return <button onClick={handleClick}>Load data</button>;
 *   }
 *
 *   function App() {
 *     return (
 *       <ErrorBoundary
 *         FallbackComponent={FallbackUI}
 *         onError={(error, info) => logErrorToService(error, info)}
 *         onReset={() => queryClient.clear()}        // optional cleanup
 *         resetKeys={[userId]}                       // auto-reset on value change
 *       >
 *         <RiskyButton />
 *       </ErrorBoundary>
 *     );
 *   }
 *
 * Key points:
 *   - useErrorBoundary() lets function components trigger the boundary
 *     for errors that originate outside of render (e.g. event handlers,
 *     async fetch failures).
 *   - resetKeys causes the boundary to auto-reset when listed values change.
 *   - The library's ErrorBoundary still uses a class component internally —
 *     the hook is syntactic sugar that bridges to it.
 */

// ---------------------------------------------------------------------------
// Default export for quick import
// ---------------------------------------------------------------------------
export default SafeApp;
