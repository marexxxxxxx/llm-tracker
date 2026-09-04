interface ThemeToggleProps {
  darkMode: boolean
  onToggle: () => void
}

export function ThemeToggle({ darkMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  )
}
