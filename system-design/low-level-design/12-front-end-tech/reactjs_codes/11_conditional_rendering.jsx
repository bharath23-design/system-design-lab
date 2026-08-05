import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. if/else OUTSIDE JSX
//    Compute the node before the return statement; keeps JSX clean.
// ─────────────────────────────────────────────────────────────────────────────
export function AuthStatus({ isLoggedIn, username }) {
  // Decide what to render before touching JSX
  let content;
  if (isLoggedIn) {
    content = <p>Welcome back, <strong>{username}</strong>!</p>;
  } else {
    content = <p>Please <a href="/login">log in</a> to continue.</p>;
  }

  return <div className="auth-status">{content}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TERNARY OPERATOR IN JSX
//    Best for two-branch inline choices; avoid nesting ternaries.
// ─────────────────────────────────────────────────────────────────────────────
export function LoadingState({ isLoading, data }) {
  return (
    <div className="loading-state">
      {/* Ternary: show spinner OR data */}
      {isLoading ? (
        <span className="spinner">Loading…</span>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}

      {/* ── Pitfall demos ───────────────────────────────────────────────────
          Logical &&: if the left side is 0 (falsy but renderable), React
          prints the number "0" instead of nothing.

          BAD  — renders "0" on screen when count is 0:
            {count && <Badge count={count} />}

          GOOD — coerce to boolean first:
            {count > 0 && <Badge count={count} />}
            {!!count && <Badge count={count} />}

          Same trap with false: false is not rendered, but 0 is.
      ─────────────────────────────────────────────────────────────────────── */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LOGICAL && (SHORT-CIRCUIT)
//    Renders right side only when left side is truthy.
//    Guard with a boolean expression to avoid the "0" pitfall.
// ─────────────────────────────────────────────────────────────────────────────
function NotificationBadge({ count }) {
  return (
    <div className="nav-icon">
      <span>Bell</span>
      {/* Safe: count > 0 is always boolean */}
      {count > 0 && <span className="badge">{count}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NULLISH COALESCING ??
//    Falls back only on null / undefined, NOT on 0 or "".
// ─────────────────────────────────────────────────────────────────────────────
export function FeatureFlag({ featureName, config }) {
  // ?? keeps 0 and "" as valid values; || would wrongly replace them
  const maxRetries = config?.maxRetries ?? 3;
  const label = config?.label ?? "Unnamed feature";
  const isEnabled = config?.enabled ?? false;

  return (
    <section className="feature-flag">
      <h3>{label}</h3>
      <p>Feature: <code>{featureName}</code></p>
      <p>Max retries: {maxRetries}</p>

      {/* && short-circuit — boolean guard, no 0-pitfall here */}
      {isEnabled && (
        <p className="enabled-badge">ENABLED</p>
      )}

      {/* ?? fallback for a nested optional value */}
      <p>Owner: {config?.owner ?? "Unassigned"}</p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EARLY RETURN PATTERN
//    Return early for guard / edge cases; keep the happy-path clean.
// ─────────────────────────────────────────────────────────────────────────────
function UserProfile({ user, isLoading, error }) {
  // Guard 1 – loading
  if (isLoading) return <p>Loading profile…</p>;

  // Guard 2 – error
  if (error) return <p className="error">Error: {error.message}</p>;

  // Guard 3 – no data
  if (!user) return <p>No user found.</p>;

  // Happy path — only reached when user exists and is valid
  return (
    <div className="profile">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SWITCH-BASED RENDERING
//    Clean multi-branch dispatch; each case returns a node.
// ─────────────────────────────────────────────────────────────────────────────
function StatusBanner({ status }) {
  // Compute node via switch before the JSX return
  const renderBanner = () => {
    switch (status) {
      case "idle":
        return <div className="banner banner--idle">Idle — nothing running.</div>;
      case "loading":
        return <div className="banner banner--loading">Fetching data…</div>;
      case "success":
        return <div className="banner banner--success">Done! Data loaded.</div>;
      case "error":
        return <div className="banner banner--error">Something went wrong.</div>;
      default:
        return <div className="banner banner--unknown">Unknown status: {status}</div>;
    }
  };

  return <section>{renderBanner()}</section>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ENUM PATTERN (object map of components)
//    O(1) lookup; adding a new variant only touches the map.
// ─────────────────────────────────────────────────────────────────────────────
const AdminPanel = () => <div className="panel panel--admin">Admin controls</div>;
const EditorPanel = () => <div className="panel panel--editor">Editor tools</div>;
const ViewerPanel = () => <div className="panel panel--viewer">Read-only view</div>;
const GuestPanel  = () => <div className="panel panel--guest">Sign up to unlock more!</div>;

// Map role → component (no switch, no chain of if/else)
const ROLE_PANELS = {
  admin:  AdminPanel,
  editor: EditorPanel,
  viewer: ViewerPanel,
  guest:  GuestPanel,
};

export function RoleBasedView({ role }) {
  // Fallback when role is missing or unrecognised
  const Panel = ROLE_PANELS[role] ?? GuestPanel;
  return (
    <div className="role-view">
      <p className="role-label">Role: <code>{role ?? "none"}</code></p>
      <Panel />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO — wires all patterns together
// ─────────────────────────────────────────────────────────────────────────────
export default function ConditionalRenderingDemo() {
  const mockUser = { name: "Alice", email: "alice@example.com", avatar: "https://i.pravatar.cc/80" };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 640 }}>
      <h1>Conditional Rendering Patterns</h1>
      <hr />

      <h2>1. if/else outside JSX — AuthStatus</h2>
      <AuthStatus isLoggedIn={true} username="Alice" />
      <AuthStatus isLoggedIn={false} />

      <h2>2. Ternary in JSX — LoadingState</h2>
      <LoadingState isLoading={true} data={null} />
      <LoadingState isLoading={false} data={{ id: 1, value: "hello" }} />

      <h2>3. Logical && — NotificationBadge</h2>
      <NotificationBadge count={5} />
      {/* count=0 — badge is hidden because we use count > 0 */}
      <NotificationBadge count={0} />

      <h2>4. Nullish coalescing ?? — FeatureFlag</h2>
      <FeatureFlag featureName="dark-mode" config={{ enabled: true, maxRetries: 0, label: "Dark Mode" }} />
      <FeatureFlag featureName="beta-ui" config={null} />

      <h2>5. Early return — UserProfile</h2>
      <UserProfile isLoading={false} error={null} user={mockUser} />
      <UserProfile isLoading={true} error={null} user={null} />
      <UserProfile isLoading={false} error={{ message: "Not found" }} user={null} />

      <h2>6. Switch-based — StatusBanner</h2>
      {["idle", "loading", "success", "error", "unknown"].map((s) => (
        <StatusBanner key={s} status={s} />
      ))}

      <h2>7. Enum pattern — RoleBasedView</h2>
      {["admin", "editor", "viewer", "guest", undefined].map((r) => (
        <RoleBasedView key={r ?? "none"} role={r} />
      ))}
    </div>
  );
}
