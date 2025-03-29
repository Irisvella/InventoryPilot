// src/components/ThemeSwitcher.js
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext"; // Import useTheme

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme(); // Use the context

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher-button flex items-center gap-2 p-2
        dark:bg-transparent 
        dark:border-transparent
        text-gray-800 dark:text-white  
      "
    >
      {theme === "dark" ? (
        <>
          <SunIcon className="h-5 w-5 text-red-500" />
        </>
      ) : (
        <>
          <MoonIcon className="h-5 w-5 text-gray-800" />
        </>
      )}
    </button>
  );
}