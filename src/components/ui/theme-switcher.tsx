"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Droplet } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/40 bg-card/40 p-1 backdrop-blur">
      <button
        onClick={() => setTheme("dark")}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          theme === "dark"
            ? "bg-primary/20 text-primary ring-1 ring-primary/40"
            : "text-foreground hover:bg-secondary/50"
        }`}
        title="Escuro"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("light")}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          theme === "light"
            ? "bg-primary/20 text-primary ring-1 ring-primary/40"
            : "text-foreground hover:bg-secondary/50"
        }`}
        title="Claro"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("blue")}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          theme === "blue"
            ? "bg-primary/20 text-primary ring-1 ring-primary/40"
            : "text-foreground hover:bg-secondary/50"
        }`}
        title="Azul"
      >
        <Droplet className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
