"use client"

import { useEffect, useRef } from "react"
import { Box } from "@mui/material"

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
  isDarkMode?: boolean
}

export default function CodeEditor({ value, language, onChange, isDarkMode = false }: CodeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const monacoRef = useRef(null)

  useEffect(() => {
    // This is a simplified version for demonstration
    // In a real app, you'd use Monaco Editor or CodeMirror
    if (editorRef.current) {
      editorRef.current.value = value
    }
  }, [value])

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        backgroundColor: isDarkMode ? "#1e1e1e" : "#282c34",
        fontFamily: "monospace",
        fontSize: "14px",
        lineHeight: 1.5,
        overflow: "auto",
      }}
    >
      {/* Line numbers */}
      <Box
        sx={{
          width: "40px",
          padding: "10px 8px",
          textAlign: "right",
          color: "#636d83",
          backgroundColor: isDarkMode ? "#252525" : "#21252b",
          userSelect: "none",
          borderRight: "1px solid",
          borderColor: isDarkMode ? "#333" : "#181a1f",
          whiteSpace: "pre-line",
        }}
      >
        {value
          .split("\n")
          .map((_, i) => i + 1)
          .join("\n")}
      </Box>

      {/* Editor area */}
      <Box
        component="textarea"
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          flexGrow: 1,
          padding: "10px",
          color: "#abb2bf",
          backgroundColor: isDarkMode ? "#1e1e1e" : "#282c34",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: 1.5,
          whiteSpace: "pre",
          overflowWrap: "normal",
          overflowX: "auto",
          tabSize: 2,
          "&:focus": {
            outline: "none",
          },
        }}
      />
    </Box>
  )
}
