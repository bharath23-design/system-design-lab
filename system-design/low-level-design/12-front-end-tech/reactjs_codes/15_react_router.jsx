// React Router v6 Examples
// Requires: npm install react-router-dom
// Package: 'react-router-dom' v6

import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Outlet,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

// ─────────────────────────────────────────────
// 1. BrowserRouter + Routes + Route setup
//    Wrap the entire app in <BrowserRouter>.
//    <Routes> picks the first matching <Route>.
// ─────────────────────────────────────────────
export function AppRouter() {
  // Simulated auth state – swap for real context/store in production.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Navbar onLogin={() => setIsAuthenticated(true)} onLogout={() => setIsAuthenticated(false)} />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/users/:userId" element={<UserProfile />} />
        <Route path="/search" element={<SearchPage />} />

        {/* Nested routes — children rendered via <Outlet> in DashboardLayout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>

        {/* Protected route — redirects to /login if not authenticated */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />

        {/* 8. 404 catch-all — must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// ─────────────────────────────────────────────
// 2. Link and NavLink
//    Link  — basic navigation, no active styling.
//    NavLink — adds `active` class (or custom style)
//              when its href matches the current URL.
// ─────────────────────────────────────────────
export function Navbar({ onLogin, onLogout }) {
  const navLinkStyle = ({ isActive }) => ({
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#007bff' : '#333',
    textDecoration: 'none',
    marginRight: 12,
  });

  return (
    <nav style={{ padding: '8px 16px', borderBottom: '1px solid #ddd' }}>
      {/* NavLink — applies active style automatically */}
      <NavLink to="/" style={navLinkStyle} end>
        Home
      </NavLink>
      <NavLink to="/dashboard" style={navLinkStyle}>
        Dashboard
      </NavLink>
      <NavLink to="/admin" style={navLinkStyle}>
        Admin
      </NavLink>
      <NavLink to="/search?q=react" style={navLinkStyle}>
        Search
      </NavLink>

      {/* Plain Link — no active state tracking */}
      <Link to="/users/42" style={{ marginRight: 12 }}>
        User #42
      </Link>

      <button onClick={onLogin} style={{ marginRight: 8 }}>
        Log In
      </button>
      <button onClick={onLogout}>Log Out</button>
    </nav>
  );
}

// ─────────────────────────────────────────────
// Home page
// ─────────────────────────────────────────────
export function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Home</h1>
      <p>Welcome! Navigate using the links above.</p>
    </main>
  );
}

// ─────────────────────────────────────────────
// 4. useParams — reading URL params
//    Route: /users/:userId
// ─────────────────────────────────────────────
export function UserProfile() {
  const { userId } = useParams(); // extracts :userId from the URL

  return (
    <main style={{ padding: 16 }}>
      <h1>User Profile</h1>
      <p>Showing profile for user ID: <strong>{userId}</strong></p>
    </main>
  );
}

// ─────────────────────────────────────────────
// 5. useSearchParams — reading/writing query strings
//    URL: /search?q=react&page=2
// ─────────────────────────────────────────────
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const page  = Number(searchParams.get('page') ?? 1);

  function handleSearch(e) {
    e.preventDefault();
    const form = e.currentTarget;
    // Update query string without a full page reload
    setSearchParams({ q: form.elements.q.value, page: 1 });
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>Search</h1>
      <form onSubmit={handleSearch}>
        <input name="q" defaultValue={query} placeholder="Search..." />
        <button type="submit" style={{ marginLeft: 8 }}>Go</button>
      </form>
      <p>Query: <strong>{query}</strong> | Page: <strong>{page}</strong></p>
      <button onClick={() => setSearchParams({ q: query, page: page + 1 })}>
        Next Page
      </button>
    </main>
  );
}

// ─────────────────────────────────────────────
// 6. Nested routes with Outlet
//    /dashboard        → DashboardHome
//    /dashboard/settings → DashboardSettings
// ─────────────────────────────────────────────
function DashboardLayout() {
  return (
    <div style={{ display: 'flex', padding: 16 }}>
      <aside style={{ width: 150, borderRight: '1px solid #ddd', paddingRight: 16 }}>
        <h3>Dashboard</h3>
        <nav>
          {/* `end` ensures /dashboard matches exactly, not /dashboard/settings */}
          <NavLink to="/dashboard" end style={{ display: 'block', marginBottom: 8 }}>
            Overview
          </NavLink>
          <NavLink to="/dashboard/settings" style={{ display: 'block' }}>
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Outlet renders the matched child route */}
      <main style={{ paddingLeft: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}

function DashboardHome() {
  return <p>Dashboard overview content.</p>;
}

function DashboardSettings() {
  return <p>Dashboard settings content.</p>;
}

// ─────────────────────────────────────────────
// 3. useNavigate — programmatic navigation
// ─────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    onLogin();
    // navigate(path, options)
    // Replace: true replaces the current history entry so Back won't return to /login
    navigate('/admin', { replace: true });
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Username" style={{ marginRight: 8 }} />
        <input type="password" placeholder="Password" style={{ marginRight: 8 }} />
        <button type="submit">Login</button>
      </form>
      <button onClick={() => navigate(-1)} style={{ marginTop: 8 }}>
        Go Back
      </button>
    </main>
  );
}

// ─────────────────────────────────────────────
// 7. Protected route pattern
//    Wraps any route that requires authentication.
//    Redirects to /login if user is not authenticated.
// ─────────────────────────────────────────────
export function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    // Navigate replaces the current entry so the user can't Back into the protected page.
    // `state` carries the intended destination so LoginPage can redirect after login.
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  return children;
}

function AdminPage() {
  const navigate = useNavigate();

  return (
    <main style={{ padding: 16 }}>
      <h1>Admin (Protected)</h1>
      <p>You are authenticated. Welcome to the admin panel.</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </main>
  );
}

// ─────────────────────────────────────────────
// 8. 404 Not Found catch-all
//    Matched by path="*" — always place last.
// ─────────────────────────────────────────────
export function NotFound() {
  const navigate = useNavigate();

  return (
    <main style={{ padding: 16, textAlign: 'center' }}>
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <button onClick={() => navigate('/')}>Go Home</button>
    </main>
  );
}
