# React CLI Commands Cheatsheet

## Create React App (CRA)

```bash
# Create a new React project
npx create-react-app my-app

# Create with TypeScript template
npx create-react-app my-app --template typescript

# Navigate into project
cd my-app

# Start development server (localhost:3000)
npm start

# Run tests (watch mode)
npm test

# Build for production (outputs to /build)
npm run build

# Eject CRA config (IRREVERSIBLE — exposes webpack/babel config)
npm run eject
```

---

## Vite (Recommended for new projects — faster than CRA)

```bash
# Step 1 — Create project (interactive: prompts for name, framework, variant)
npm create vite@latest

# Step 1 (non-interactive) — pass name and template directly
npm create vite@latest my-app -- --template react       # JavaScript
npm create vite@latest my-app -- --template react-ts    # TypeScript

# Step 2 — Move into the app folder
cd my-app

# Step 3 — Install all dependencies
npm install

# Step 4 — Start dev server (localhost:5173, hot reload)
npm run dev

# Build for production (outputs to /dist)
npm run build

# Preview the production build locally before deploying
npm run preview
```

### Interactive prompts from `npm create vite@latest`
```
✔ Project name: › my-app
✔ Select a framework: › React
✔ Select a variant: › TypeScript   (or JavaScript)
```

---

## Common Package Commands

```bash
# Install all dependencies (after cloning)
npm install

# Install a package
npm install axios
npm install -D @types/node          # dev dependency

# Remove a package
npm uninstall axios

# Update packages
npm update

# Check for outdated packages
npm outdated
```

---

## Popular React Library Installs

```bash
# Routing
npm install react-router-dom

# State management
npm install redux @reduxjs/toolkit react-redux
npm install zustand                              # lighter alternative

# Styling
npm install tailwindcss postcss autoprefixer
npm install styled-components

# Forms
npm install react-hook-form
npm install react-hook-form zod @hookform/resolvers  # with validation

# HTTP client
npm install axios

# UI component libraries
npm install @mui/material @emotion/react @emotion/styled   # Material UI
npm install antd                                            # Ant Design
npm install @chakra-ui/react                               # Chakra UI

# Icons
npm install react-icons

# Error boundaries
npm install react-error-boundary

# Data fetching / caching
npm install @tanstack/react-query    # React Query

# Animations
npm install framer-motion
```

---

## Helpful npm Scripts to Add

Add to `package.json > scripts`:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write src/**/*.{js,jsx,ts,tsx,css}"
  }
}
```

---

## Environment Variables

```bash
# CRA — must prefix with REACT_APP_
REACT_APP_API_URL=https://api.example.com

# Vite — must prefix with VITE_
VITE_API_URL=https://api.example.com
```

```js
// Access in code
const url = process.env.REACT_APP_API_URL    // CRA
const url = import.meta.env.VITE_API_URL     // Vite
```

---

## VS Code Extensions

### ES7+ React/Redux/React-Native Snippets
Install: search **ES7+ React/Redux/React-Native snippets** by dsznajder in VS Code Extensions.

Key snippets:
| Shortcut | Expands to |
|----------|-----------|
| `rafce` | Arrow function component with export |
| `rfce` | Regular function component with export |
| `rfc` | Function component (no export) |
| `rce` | Class component with export |
| `useState` | `const [state, setState] = useState()` |
| `useEffect` | `useEffect(() => {}, [])` |
| `useRef` | `const ref = useRef(null)` |
| `useContext` | `const value = useContext(Context)` |
| `imp` | `import X from 'module'` |
| `imn` | `import 'module'` |
| `imr` | `import React from 'react'` |
| `clg` | `console.log()` |

> Fastest way to scaffold a new component — type `rafce` + Tab in a `.tsx` file.

---

### Prettier — Code Formatter
Install: search **Prettier - Code formatter** by Prettier in VS Code Extensions.

```bash
# Install in project (recommended — team shares same config)
npm install -D prettier
```

Add `.prettierrc` in project root:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "jsxSingleQuote": false,
  "bracketSpacing": true
}
```

Add `.prettierignore` to skip generated files:
```
node_modules
dist
build
.next
coverage
```

Enable format on save in VS Code settings (`.vscode/settings.json`):
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

Format manually from terminal:
```bash
npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,json}"
npx prettier --check "src/**/*.{ts,tsx}"    # CI: fails if files not formatted
```

---

### ESLint
Install: search **ESLint** by Microsoft in VS Code Extensions.

```bash
# Install ESLint + React rules
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks

# Or use the flat config initializer
npx eslint --init
```

Add `.eslintrc.json`:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

> Vite projects with TypeScript template already include ESLint. Run `npm run lint` to check.

---

### Auto Rename Tag
Install: search **Auto Rename Tag** by Jun Han in VS Code Extensions.

- Automatically renames the paired HTML/JSX closing tag when you rename the opening tag.
- No config needed — works immediately in `.jsx` and `.tsx` files.

---

### Path Intellisense
Install: search **Path Intellisense** by Christian Kohler in VS Code Extensions.

- Autocompletes file paths in `import` statements.
- Works with relative paths (`../components/Button`) and aliases if configured.

Add to `.vscode/settings.json` for Vite `@` alias support:
```json
{
  "path-intellisense.mappings": {
    "@": "${workspaceRoot}/src"
  }
}
```

---

### GitLens (Optional)
Install: search **GitLens** by GitKraken in VS Code Extensions.

- Shows inline `git blame` annotations (who changed this line, when).
- Useful for tracing why a component was written a certain way.

---

## VS Code Extensions — Quick Install List

Press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`) and search each name:

| Extension | Publisher | Purpose |
|-----------|-----------|---------|
| ES7+ React/Redux/React-Native snippets | dsznajder | Component scaffolding shortcuts |
| Prettier - Code formatter | Prettier | Auto-format on save |
| ESLint | Microsoft | Lint errors and hook rules |
| Auto Rename Tag | Jun Han | Sync open/close JSX tags |
| Path Intellisense | Christian Kohler | Import path autocomplete |
| GitLens | GitKraken | Inline git blame |
| Tailwind CSS IntelliSense | Tailwind Labs | Class name autocomplete (if using Tailwind) |

---

## Browser DevTools Extensions

### React Developer Tools (Chrome / Brave / Edge)
Install from Chrome Web Store: search **React Developer Tools** by Meta.

- Open `chrome://extensions/` (or `brave://extensions/`) → enable **Developer mode**
- Install → `⚛` icon appears in the browser toolbar
- Open DevTools (`F12`) → two new tabs appear:

| Tab | What it does |
|-----|-------------|
| **Components** | Browse the full component tree, inspect props and state live |
| **Profiler** | Record renders, identify slow components, see render counts |

**Components tab tips:**
- Click any component → inspect its props, state, hooks, and context on the right panel
- Edit props/state directly in the panel to test changes without touching code
- The `<>` button next to a component jumps to its source file in VS Code

**Profiler tab tips:**
- Click record → interact with the app → stop → see a flame chart of every render
- Components highlighted in yellow/red rendered slowly — investigate with `React.memo` or `useMemo`

---

### Redux DevTools (Chrome / Brave / Edge)
Install from Chrome Web Store: search **Redux DevTools** by Redux Team.

- Required if using Redux Toolkit or plain Redux for state management.
- Open DevTools → **Redux** tab → see every dispatched action and state snapshot.
- Time-travel debugging: click any past action to rewind app state to that moment.

```bash
# No extra npm package needed for Redux Toolkit (it detects DevTools automatically)
# For plain Redux, install the enhancer:
npm install @redux-devtools/extension
```

---

### React DevTools — Standalone (non-Chromium or React Native)
```bash
# Run standalone DevTools server on localhost:8097
npx react-devtools

# Or install globally
npm install -g react-devtools
react-devtools
```

Then add to `index.html` **inside `<head>`** (dev only — remove before deploying):
```html
<!-- DEV ONLY — localhost:8097 is a local server, not a CDN.
     SRI (integrity="sha384-...") does not apply to localhost scripts.
     NEVER leave this tag in production — it exposes your app to a local
     network attack if port 8097 is reachable by other processes. -->
<script src="http://localhost:8097"></script>
```

> **Security note:** `integrity` / `crossorigin` attributes are for external CDN resources with fixed, hashable content. A localhost dev server generates content dynamically so SRI cannot be used — and is unnecessary since the script never leaves your machine. The only rule that matters: **delete this `<script>` tag before `npm run build`**. Check with `grep -r "localhost:8097" index.html` in CI if you want a hard guard.

---

## CRA vs Vite Quick Comparison

| | CRA | Vite |
|--|-----|------|
| Dev start speed | Slow (webpack) | Fast (ESBuild) |
| HMR speed | Seconds | Milliseconds |
| Config | Hidden (or eject) | vite.config.js |
| Port | 3000 | 5173 |
| Build output | /build | /dist |
| Status | Maintenance mode | Actively maintained |

> Use **Vite** for new projects. CRA is legacy.
