import React, { useState } from "react";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeToggler = () => {
  const {systemTheme, setTheme} = useTheme();

  const [currentTheme, setCurrentTheme] = useState(systemTheme || "light");

  // console.log("Current theme:", theme);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={()=>toggleTheme(systemTheme)}>
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
  );
};

export default ThemeToggler;
