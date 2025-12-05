# React/Supabase Fix - Quick Reference Card

## ?? The 6 Bugs (BEFORE)

```typescript
? Bug 1: No error handling
const { data: todos } = await supabase.from('todos').select()

? Bug 2: Invalid React key
{todos.map((todo) => <li key={todo}>{todo}</li>)}

? Bug 3: Renders object instead of property
<li key={todo}>{todo}</li>  // Shows [object Object]

? Bug 4: No loading state
// User sees nothing while loading

? Bug 5: No error state
// User sees nothing if error occurs

? Bug 6: No TypeScript types
const [todos, setTodos] = useState([])  // Type: never[]
```

---

## ? The Fixes (AFTER)

```typescript
? Fix 1: Proper error handling
const { data, error: supabaseError } = await supabase.from('todos').select()
if (supabaseError) { setError(supabaseError.message); return }

? Fix 2: Valid React key
{todos.map((todo) => <li key={todo.id}>{todo.title}</li>)}

? Fix 3: Render property not object
<li key={todo.id}>{todo.title}</li>  // Shows actual title

? Fix 4: Show loading state
if (loading) return <div>Loading...</div>

? Fix 5: Show error state
if (error) return <div>Error: {error}</div>

? Fix 6: Full TypeScript types
interface Todo { id: string; title: string; completed?: boolean }
const [todos, setTodos] = useState<Todo[]>([])
```

---

## ?? Pattern Reference

### Pattern 1: Async in useEffect
```typescript
? CORRECT:
useEffect(() => {
  async function fetch() { ... }
  fetch()
    .catch(err => console.error(err))
}, [])

? WRONG:
useEffect(async () => { ... })  // Don't use async on useEffect itself
```

### Pattern 2: Supabase Error Handling
```typescript
? CORRECT:
const { data, error } = await supabase.from('table').select()
if (error) {
  console.error(error)
  return
}

? WRONG:
const { data } = await supabase.from('table').select()  // Ignores error!
```

### Pattern 3: React List Keys
```typescript
? CORRECT:
{items.map((item) => (
  <div key={item.id}>{item.name}</div>  // Unique string/number
))}

? WRONG:
{items.map((item, index) => (
  <div key={index}>{item.name}</div>  // Index changes on reorder!
))}

? WRONG:
{items.map((item) => (
  <div key={item}>{item}</div>  // Object can't be key!
))}
```

### Pattern 4: Loading States
```typescript
? CORRECT:
const [loading, setLoading] = useState(true)
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error}</div>
if (data.length === 0) return <div>No data</div>
return <div>Data here</div>

? WRONG:
// Just render, no loading feedback
return <div>{data.map(...)}</div>  // User sees nothing while loading
```

### Pattern 5: TypeScript State
```typescript
? CORRECT:
interface Item { id: string; name: string; created: Date }
const [items, setItems] = useState<Item[]>([])

? WRONG:
const [items, setItems] = useState([])  // Implicitly: never[]
```

---

## ?? Implementation Checklist

- [ ] Copy fixed `TodoList.tsx` to your project
- [ ] Run `npm run typecheck` (should pass)
- [ ] Run `npm run dev` (component renders)
- [ ] Verify loading message appears
- [ ] Verify mock todos appear
- [ ] Uncomment Supabase call when ready
- [ ] Test with real data

---

## ?? File Locations

**Fixed Component**: `src/components/TodoList.tsx`  
**Documentation**: `REACT_CODE_FIX_COMPLETE.md`  
**TypeScript Config**: `tsconfig.app.json`  
**Supabase Client**: `src/lib/supabase.ts`

---

## ?? Remember

| Concept | Rule |
|---------|------|
| **Async useEffect** | Define async function INSIDE useEffect, then call it |
| **React Keys** | Always use unique ID, never index or object |
| **Error Handling** | Always destructure `{ data, error }` from Supabase |
| **Loading States** | Show feedback: loading, error, empty, data |
| **TypeScript** | Define interfaces for data structures |

---

**Status**: ? Ready to use - Just copy and deploy!
