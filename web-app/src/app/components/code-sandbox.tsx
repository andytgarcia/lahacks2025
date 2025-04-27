"use client"

import { useState } from "react"
import { Box, Paper, Typography, Button, Divider } from "@mui/material"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import CheckIcon from "@mui/icons-material/Check"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import {
  vscDarkPlus,
  prism,
} from "react-syntax-highlighter/dist/esm/styles/prism"

interface CodeSandboxProps {
  code: string
  language: string
  isDarkMode?: boolean
}

export default function CodeSandbox({ code, language, isDarkMode = false }: CodeSandboxProps) {
  const [copied, setCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const runCode = () => {
    setIsRunning(true)
    setOutput("Running code...")

    // Simulate code execution
    setTimeout(() => {
      setIsRunning(false)
      setOutput("✅ Code executed successfully!\n\nOutput: Component rendered")
    }, 1500)
  }

  // Map common language names to Prism's supported languages
  const getLanguageAlias = (lang: string): string => {
    const aliases: Record<string, string> = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      html: "html",
      css: "css",
      json: "json",
    }
    return aliases[lang.toLowerCase()] || lang.toLowerCase()
  }

  return (
    <Paper
      elevation={3}
      sx={{
        overflow: "hidden",
        borderRadius: 2,
        border: "1px solid",
        borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        background: isDarkMode ? "#252525" : "#f8f9fa",
        marginTop: 1,
        marginBottom: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(107,102,255,0.2) 0%, rgba(147,112,219,0.2) 100%)"
            : "linear-gradient(90deg, rgba(147,112,219,0.1) 0%, rgba(255,105,180,0.1) 100%)",
          borderBottom: "1px solid",
          borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#FF6B6B",
            }}
          />
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#FFCC5C",
            }}
          />
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#88D8B0",
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              marginLeft: 1,
              fontFamily: "monospace",
              color: isDarkMode ? "#e0e0e0" : "text.secondary",
              fontWeight: 600,
            }}
          >
            {language}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={copyToClipboard}
            sx={{
              textTransform: "none",
              color: isDarkMode ? "#e0e0e0" : "text.secondary",
              "&:hover": {
                backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              },
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          {(language === "jsx" || language === "js" || language === "javascript") && (
            <Button
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={runCode}
              disabled={isRunning}
              sx={{
                textTransform: "none",
                color: isDarkMode ? "#e0e0e0" : "text.secondary",
                "&:hover": {
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                },
              }}
            >
              Run
            </Button>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          padding: 2,
          background: isDarkMode ? "#1e1e1e" : "#282c34",
          overflowX: "auto",
          position: "relative",
        }}
      >
        <SyntaxHighlighter
          language={getLanguageAlias(language)}
          style={isDarkMode ? vscDarkPlus : prism}
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
            fontSize: "0.875rem",
          }}
          showLineNumbers
          lineNumberStyle={{
            opacity: 0.5,
            minWidth: "2em",
            paddingRight: "1em",
            textAlign: "right",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </Box>
      {output && (
        <Box>
          <Divider />
          <Box
            sx={{
              padding: 2,
              background: isDarkMode ? "#252525" : "#21252b",
              color: "#abb2bf",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {output}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
