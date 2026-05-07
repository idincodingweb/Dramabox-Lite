import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  const themes = [
    { id: "light", label: "Light", color: "oklch(0.24 0.04 253)" },
    { id: "dark", label: "Dark", color: "oklch(0.73 0.18 64)" },
    { id: "pink", label: "Pink Tua", color: "oklch(0.65 0.25 340)" },
    { id: "red", label: "Red", color: "oklch(0.6 0.22 25)" },
    { id: "purple", label: "Purple", color: "oklch(0.65 0.25 300)" },
    { id: "green", label: "Hijau Muda", color: "oklch(0.7 0.2 140)" },
    { id: "blue", label: "Biru Muda", color: "oklch(0.7 0.15 230)" },
    { id: "yellow", label: "Kuning", color: "oklch(0.8 0.18 90)" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground" />}>
        <Palette className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px] p-2 rounded-2xl">
        <div className="grid grid-cols-1 gap-1">
          {themes.map((theme) => (
            <DropdownMenuItem 
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-200"
            >
              <div 
                className="w-4 h-4 rounded-full border border-white/10 shadow-sm" 
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-sm font-medium">{theme.label}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
