"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles"
import { CssBaseline } from "@mui/material"

type ThemeContextType = {
  mode: "light" | "dark"
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light")

  useEffect(() => {
    const savedMode = localStorage.getItem("themeMode") as "light" | "dark"
    if (savedMode) {
      setMode(savedMode)
    }
  }, [])

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light"
    setMode(newMode)
    localStorage.setItem("themeMode", newMode)
  }

  // Create theme based on mode
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: "#9370DB",
        light: "#B591F0",
        dark: "#7952D1",
        contrastText: "#fff",
      },
      secondary: {
        main: "#FF6B6B",
        light: "#FF8E8E",
        dark: "#E54B4B",
        contrastText: "#fff",
      },
      error: {
        main: "#FF5252",
      },
      warning: {
        main: "#FF9E2C",
      },
      info: {
        main: "#4FC3F7",
      },
      success: {
        main: "#66BB6A",
      },
      background: {
        default: mode === "light" ? "#f5f7fa" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1e1e1e",
      },
      text: {
        primary: mode === "light" ? "#333333" : "#f5f5f5",
        secondary: mode === "light" ? "#666666" : "#b0b0b0",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 500,
      },
      subtitle2: {
        fontWeight: 500,
      },
      body1: {
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 600,
        textTransform: "none",
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "8px 16px",
          },
          contained: {
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            "&:hover": {
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          },
        },
      },
    },
  })

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

