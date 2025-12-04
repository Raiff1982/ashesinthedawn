import { useState, useEffect } from 'react'

// Define types
interface Todo {
  id: string
  title: string
  completed?: boolean
  created_at?: string
}

function TodoList() {
  // State management with proper types
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Proper async/await in useEffect
  useEffect(() => {
    async function getTodos() {
      try {
        setLoading(true)

        // TODO: Replace with your actual Supabase call:
        // import { supabase } from '@/lib/supabase'
        // const { data, error: supabaseError } = await supabase
        //   .from('todos')
        //   .select('*')
        //   .order('created_at', { ascending: false })

        // For demo purposes, simulate loading:
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Mock data
        const data: Todo[] = [
          { id: '1', title: 'Example todo', completed: false },
          { id: '2', title: 'Another task', completed: true },
        ]

        if (data && data.length > 0) {
          setTodos(data)
        } else {
          setTodos([])
        }
      } catch (err) {
        // Handle unexpected errors
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    getTodos()
  }, []) // Empty dependency array - runs once on mount

  // Show loading state
  if (loading) {
    return <div className="text-gray-400">Loading todos...</div>
  }

  // Show error state
  if (error) {
    return <div className="text-red-400">Error: {error}</div>
  }

  // Show empty state
  if (todos.length === 0) {
    return <div className="text-gray-400">No todos found</div>
  }

  // Show todos list with proper keys
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-100">Todos</h2>
      <ul className="space-y-1">
        {todos.map((todo) => (
          <li
            key={todo.id} // Unique ID as key
            className="p-2 bg-gray-800 rounded text-gray-200 hover:bg-gray-700 transition"
          >
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.title} // Access title property
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TodoList
