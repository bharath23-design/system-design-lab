# useReducer Hook

## Signature
```js
const [state, dispatch] = useReducer(reducer, initialState)
// reducer: (state, action) => newState
```

## useState vs useReducer
| | useState | useReducer |
|-|----------|------------|
| Complexity | Simple, single values | Complex, related state |
| Related state | Separate calls | Single state object |
| Testing | Harder (tied to component) | Easy (pure function) |
| Next state depends on prev | Functional update `s => s+1` | Natural in reducer |

## Action Convention
```js
dispatch({ type: 'INCREMENT', payload: 1 })
// reducer switches on action.type
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + action.payload }
    default: return state
  }
}
```

## State Immutability
Return new state object — never mutate. Use spread or immer for complex state.
```js
// correct
case 'UPDATE': return { ...state, name: action.payload }
// wrong — mutates
case 'UPDATE': state.name = action.payload; return state
```

## useReducer + Context = Redux-lite
Pattern: wrap app in Provider with dispatch, consume with useContext.
```js
const StateCtx = createContext()
const DispatchCtx = createContext()

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}
// Consumer:
const dispatch = useContext(DispatchCtx)
```

## When to Switch from useState
- 3+ related state values that update together
- Next state depends on previous in complex ways
- State update logic needs to be testable in isolation

## Common Mistakes
- Mutating state in reducer (return new object)
- Async logic in reducer (put in dispatch caller or middleware)
- Forgetting to handle unknown action types (default: return state)
