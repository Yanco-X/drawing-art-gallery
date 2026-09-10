import { useTheme } from '../hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="flex cursor-pointer items-center gap-2 border border-line bg-transparent px-3 py-2 text-[12px] uppercase tracking-btn text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
    >
      <span aria-hidden="true" className="text-[14px] leading-none">
        {isDark ? '☾' : '☀'}
      </span>
      <span className="hidden sm:inline">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
};
