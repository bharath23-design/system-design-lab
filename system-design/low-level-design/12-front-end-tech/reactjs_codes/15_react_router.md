# React Router v6

## Installation
```bash
npm install react-router-dom
```

## Core Components
| Component | Purpose |
|-----------|---------|
| `BrowserRouter` | Top-level provider using HTML5 history API |
| `Routes` | Container that picks the best matching route |
| `Route` | Maps a path to an element |
| `Link` | Client-side navigation anchor |
| `NavLink` | Link with active class/style support |
| `Outlet` | Renders matched child route in a parent layout |
| `Navigate` | Declarative redirect component |

## Core Hooks
| Hook | Returns |
|------|---------|
| `useNavigate` | Function to navigate programmatically |
| `useParams` | Object of URL dynamic segment values |
| `useSearchParams` | `[searchParams, setSearchParams]` tuple |
| `useLocation` | Current location object (pathname, search, state) |
| `useMatch` | Match object if path matches current URL |

## Basic Setup
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:id" element={<UserProfile />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

## Nested Routes Pattern
```jsx
// Parent declares child routes; Outlet renders them
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Overview />} />
  <Route path="settings" element={<Settings />} />
</Route>

// DashboardLayout.jsx
const DashboardLayout = () => (
  <div>
    <Sidebar />
    <Outlet /> {/* child route renders here */}
  </div>
);
```

## Protected Route Pattern
```jsx
const ProtectedRoute = ({ children }) =>
  isAuth ? children : <Navigate to="/login" replace />;

// Usage
<Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
```

## Programmatic Navigation
```jsx
const navigate = useNavigate();
navigate('/home');          // push
navigate(-1);               // go back
navigate('/login', { replace: true });
```

## v5 → v6 Key Changes
- `Switch` → `Routes`
- `component`/`render` props → `element` prop (pass JSX, not a reference)
- Nested routes declared inline in JSX, not via a separate config
- `useHistory` → `useNavigate`
- Exact matching is default; no more `exact` prop
- `<Redirect>` → `<Navigate>`
