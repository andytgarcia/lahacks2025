"use client"

import { useState, useRef, useEffect } from "react"
import { Box, Paper, Typography, TextField, Button, Avatar, IconButton, Chip, CircularProgress} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import CodeIcon from "@mui/icons-material/Code"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import { AutoAwesome } from "@mui/icons-material"
import TerminalIcon from "@mui/icons-material/Terminal"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import { useTheme } from "@/lib/theme-context"
import CodeEditor from "@/app/components/ui/code-editor"
import CodeDiffView from "@/app/components/ui/CodeDiffView"
import CodeSandbox from "@/app/components/code-sandbox"
import ReactMarkdown from 'react-markdown'

export default function ChatWindow() {
  const { mode, toggleTheme } = useTheme()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<{
    role: string
    content: string
    timestamp: Date
    isCode?: boolean
    language?: string
  }[]>([
    {
      role: "assistant",
      content: "Hi there! I'm your coding assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [codeFiles, setCodeFiles] = useState([
    {
      id: "file1",
      name: "index.js",
      language: "javascript",
      content: "// Your code here\nconsole.log('Hello, world!');",
    },
    {
      id: "file2",
      name: "styles.css",
      language: "css",
      content:
        "body {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n  border-radius: 8px;\n  background-color: white;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n}",
    },
  ])
  const [consoleOutput, setConsoleOutput] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [activeSandbox, setActiveSandbox] = useState("sandbox1")
  const [sandboxes, setSandboxes] = useState<{
    [key: string]: {
      name: string
      files: string[]
      activeFile: string
    }
  }>({
    sandbox1: {
      name: "Main Sandbox",
      files: ["file1", "file2"],
      activeFile: "file1",
    },
  })
  // New state for code suggestions
  const [codeSuggestion, setCodeSuggestion] = useState<{
    fileId: string
    originalCode: string
    suggestedCode: string
    language: string
    message?: string
    isActive: boolean
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/geminichat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Gemini');
      }

      const data = await response.json();
      
      // Add assistant's response to messages
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.result.text || "Sorry, I couldn't process that request.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCodeChange = (value: string) => {
    const currentSandbox = sandboxes[activeSandbox]
    const currentFileId = currentSandbox.activeFile
    const fileIndex = codeFiles.findIndex((file) => file.id === currentFileId)

    if (fileIndex !== -1) {
      const updatedFiles = [...codeFiles]
      updatedFiles[fileIndex].content = value
      setCodeFiles(updatedFiles)
    }
  }

  const executeCode = () => {
    setIsExecuting(true)
    setConsoleOutput("Executing code...\n")

    // Get current file
    const currentSandbox = sandboxes[activeSandbox]
    const currentFileId = currentSandbox.activeFile
    const currentFile = codeFiles.find((file) => file.id === currentFileId)
    if (!currentFile) return

    // Simulate code execution
    setTimeout(() => {
      try {
        let output = ""

        if (currentFile.language === "javascript" || currentFile.language === "jsx") {
          output = "✅ Code executed successfully!\n\n"

          if (currentFile.content.includes("console.log")) {
            const logMatches = currentFile.content.match(/console\.log$$['"](.+?)['"]$$/g)
            if (logMatches) {
              logMatches.forEach((match) => {
                const content = match.match(/console\.log$$['"](.+?)['"]$$/)?.[1] ?? ""
                output += `> ${content}\n`
              })
            } else {
              output += "> Hello, world!\n"
            }
          } else {
            output += "> Function defined successfully\n"
          }

          if (currentFile.content.includes("Button")) {
            output += "> Component rendered\n"
          }
        } else {
          output = "✅ File processed successfully!\n"
        }

        setConsoleOutput((prev) => prev + output)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        setConsoleOutput((prev) => prev + `❌ Error: ${errorMessage}\n`)
      }

      setIsExecuting(false)
    }, 1500)
  }

  const addCodeToSandbox = (code: string, language: string) => {
    // Create a new file
    const newFileId = `file${codeFiles.length + 1}`
    const fileName =
      language === "jsx"
        ? "Component.jsx"
        : language === "javascript"
          ? "script.js"
          : language === "css"
            ? "styles.css"
            : "file.txt"

    // Add to files
    setCodeFiles((prev) => [
      ...prev,
      {
        id: newFileId,
        name: fileName,
        language,
        content: code,
      },
    ])

    // Add to current sandbox
    const updatedSandboxes = { ...sandboxes }
    updatedSandboxes[activeSandbox].files.push(newFileId)
    updatedSandboxes[activeSandbox].activeFile = newFileId
    setSandboxes(updatedSandboxes)
  }

  const createNewSandbox = () => {
    const newSandboxId = `sandbox${Object.keys(sandboxes).length + 1}`
    const newFileId = `file${codeFiles.length + 1}`

    // Create a new file
    setCodeFiles((prev) => [
      ...prev,
      {
        id: newFileId,
        name: "main.js",
        language: "javascript",
        content: "// New sandbox\nconsole.log('Hello from new sandbox!');",
      },
    ])

    // Create new sandbox
    setSandboxes((prev) => ({
      ...prev,
      [newSandboxId]: {
        name: `Sandbox ${Object.keys(sandboxes).length + 1}`,
        files: [newFileId],
        activeFile: newFileId,
      },
    }))

    setActiveSandbox(newSandboxId)
  }

  // Get current file content
  const getCurrentFileContent = () => {
    const currentSandbox = sandboxes[activeSandbox]
    if (!currentSandbox) return ""

    const currentFileId = currentSandbox.activeFile
    const currentFile = codeFiles.find((file) => file.id === currentFileId)
    return currentFile ? currentFile.content : ""
  }

  // Get current file language
  const getCurrentFileLanguage = () => {
    const currentSandbox = sandboxes[activeSandbox]
    if (!currentSandbox) return "javascript"

    const currentFileId = currentSandbox.activeFile
    const currentFile = codeFiles.find((file) => file.id === currentFileId)
    return currentFile ? currentFile.language : "javascript"
  }

  // Get files for current sandbox
  const getCurrentSandboxFiles = () => {
    const currentSandbox = sandboxes[activeSandbox]
    if (!currentSandbox) return []
    return currentSandbox.files
      .map((fileId) => codeFiles.find((file) => file.id === fileId))
      .filter((file): file is { id: string; name: string; language: string; content: string } => file !== undefined)
  }

  // Get gradient based on theme mode
  const getHeaderGradient = () => {
    return mode === "light"
      ? "linear-gradient(90deg, #FF6B6B 0%, #9370DB 50%, #FF9E2C 100%)"
      : "linear-gradient(90deg, #FF5151 0%, #7952D1 50%, #E58B1F 100%)"
  }

  const getCodeHeaderGradient = () => {
    return mode === "light"
      ? "linear-gradient(90deg, #6B66FF 0%, #9370DB 100%)"
      : "linear-gradient(90deg, #5550E3 0%, #7952D1 100%)"
  }

/* CHANGE */

  // Function to demonstrate code suggestion feature
  const generateSampleSuggestion = () => {
    // Get current file content
    const currentSandbox = sandboxes[activeSandbox];
    const currentFileId = currentSandbox.activeFile;
    const currentFile = codeFiles.find((file) => file.id === currentFileId);
    
    if (!currentFile) return;
    
    // Create a sample suggestion
    let suggestedCode = currentFile.content;
    
    // Make different suggestions based on file type
    if (currentFile.language === "javascript" || currentFile.language === "jsx") {
      // Suggest adding comments and improving variable names
      if (suggestedCode.includes("console.log")) {
        suggestedCode = suggestedCode.replace(
          /console\.log\((.*)\)/g, 
          "// Output the result to console\nconsole.log($1) // Consider using more descriptive logging"
        );
      } else {
        // Add a sample function with good practices
        suggestedCode += "\n\n/**\n * Calculate sum of two numbers\n * @param {number} a - First number\n * @param {number} b - Second number\n * @returns {number} Sum of a and b\n */\nfunction calculateSum(a, b) {\n  return a + b;\n}\n";
      }
    } else if (currentFile.language === "css") {
      // Suggest using variables and better practices
      suggestedCode = suggestedCode.replace(
        /background: linear-gradient.*;/g,
        "/* Use CSS variables for consistent theming */\n--primary-gradient: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);\nbackground: var(--primary-gradient);"
      );
    }
    
    // Set the suggestion
    setCodeSuggestion({
      fileId: currentFileId,
      originalCode: currentFile.content,
      suggestedCode: suggestedCode,
      language: currentFile.language,
      isActive: true
    });
  };

  const messagesStartRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    messagesStartRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        overflow: "hidden",
        background:
          mode === "light"
            ? "linear-gradient(135deg, #FF6B6B 0%, #6B66FF 50%, #FF9E2C 100%)"
            : "linear-gradient(135deg, #CC4B4B 0%, #4B46CC 50%, #CC7E0C 100%)",
      }}
    >
      {/* Chat panel - 60% */}
      <Box
        sx={{
          width: "60%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor: mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: getHeaderGradient(),
            padding: "16px 24px",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
              awesome-project/frontend
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50",
                  marginRight: 1,
                }}
              />
              Pull Request #42
            </Typography>
          </Box>
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: "white",
              backgroundColor: "rgba(255,255,255,0.2)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.3)",
              },
            }}
          >
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>

        {/* Messages area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            padding: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            backgroundColor: mode === "light" ? "#f9fafc" : "#1a1a1a",
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 1,
                opacity: 1,
                animation: "fadeIn 0.5s ease-in-out",
                "@keyframes fadeIn": {
                  "0%": { opacity: 0, transform: "translateY(10px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {/* Message content */}
              <Paper
                elevation={3}
                sx={{
                  maxWidth: "85%",
                  padding: 2,
                  borderRadius: message.role === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                  background:
                    message.role === "user"
                      ? "linear-gradient(135deg, #9370DB 0%, #FF6B6B 100%)"
                      : mode === "light"
                        ? "#ffffff"
                        : "#2a2a2a",
                  color: message.role === "user" ? "white" : "inherit",
                  position: "relative",
                  "&::before":
                    message.role === "user"
                      ? {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          right: "-10px",
                          width: "20px",
                          height: "20px",
                          background: "linear-gradient(135deg, transparent 50%, #FF6B6B 50%)",
                          transform: "rotate(45deg)",
                          borderRadius: "0 0 5px 0",
                        }
                      : {},
                  "&::after":
                    message.role === "assistant"
                      ? {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          left: "-10px",
                          width: "20px",
                          height: "20px",
                          background:
                            mode === "light"
                              ? "linear-gradient(135deg, #ffffff 50%, transparent 50%)"
                              : "linear-gradient(135deg, #2a2a2a 50%, transparent 50%)",
                          transform: "rotate(45deg)",
                          borderRadius: "0 0 0 5px",
                        }
                      : {},
                }}
              >
                {message.role === "assistant" && (
                  <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1, gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: "linear-gradient(135deg, #FF6B6B 0%, #9370DB 50%, #FF9E2C 100%)",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                      }}
                    >
                      G
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Google Gemini
                    </Typography>
                  </Box>
                )}

                {message.isCode && message.language ? (
                  <Box sx={{ position: "relative" }}>
                    <CodeSandbox code={message.content} language={message.language} isDarkMode={mode === "dark"} />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => addCodeToSandbox(message.content, message.language || "javascript")}
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "linear-gradient(90deg, #FF6B6B 0%, #9370DB 100%)",
                        fontSize: "0.75rem",
                        py: 0.5,
                      }}
                    >
                      Try in Sandbox
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ 
                    '& pre': { 
                      backgroundColor: mode === 'light' ? '#f5f5f5' : '#2a2a2a',
                      padding: '1rem',
                      borderRadius: '4px',
                      overflowX: 'auto'
                    },
                    '& code': {
                      fontFamily: 'monospace',
                      fontSize: '0.9em'
                    },
                    '& p': {
                      margin: '0.5em 0'
                    },
                    '& ul, & ol': {
                      paddingLeft: '1.5em',
                      margin: '0.5em 0'
                    },
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      margin: '1em 0 0.5em 0',
                      fontWeight: 600
                    },
                    '& blockquote': {
                      borderLeft: '4px solid #9370DB',
                      paddingLeft: '1em',
                      margin: '1em 0',
                      color: mode === 'light' ? '#666' : '#aaa'
                    }
                  }}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "right",
                    marginTop: 1,
                    opacity: 0.7,
                    color: message.role === "user" ? "rgba(255,255,255,0.9)" : "inherit",
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Paper>
            </Box>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: 1,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  padding: 2,
                  borderRadius: "20px 20px 20px 5px",
                  background: mode === "light" ? "#ffffff" : "#2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={20} sx={{ color: "#9370DB" }} />
                <Typography variant="body2" sx={{ color: mode === "light" ? "#666" : "#aaa" }}>
                  Thinking...
                </Typography>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Input area */}
        <Box
          sx={{
            padding: 2,
            borderTop: "1px solid",
            borderColor: mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            background: mode === "light" ? "white" : "#2a2a2a",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Google Gemini something..."
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.3s",
                  backgroundColor: mode === "light" ? "white" : "#333",
                  "&:hover": {
                    borderColor: "#9370DB",
                  },
                  "&.Mui-focused": {
                    boxShadow: `0 0 0 2px ${mode === "light" ? "rgba(147,112,219,0.3)" : "rgba(147,112,219,0.5)"}`,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setInput((prev) => prev + "\n```js\n\n```")
                    }}
                    sx={{ color: "text.secondary" }}
                  >
                    <CodeIcon />
                  </IconButton>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              sx={{
                borderRadius: 2,
                padding: "10px 20px",
                background: "linear-gradient(90deg, #FF6B6B 0%, #9370DB 100%)",
                boxShadow: "0 4px 10px rgba(147,112,219,0.3)",
                transition: "all 0.3s",
                "&:hover": {
                  background: "linear-gradient(90deg, #FF5151 0%, #8A60D0 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 15px rgba(147,112,219,0.4)",
                },
              }}
              startIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Code sandbox panel - 40% */}
      <Box
        sx={{
          width: "40%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sandbox tabs */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "16px 24px",
            background: getCodeHeaderGradient(),
            color: "white",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Code Sandboxes
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {Object.entries(sandboxes).map(([id, sandbox]) => (
              <Chip
                key={id}
                label={sandbox.name}
                onClick={() => setActiveSandbox(id)}
                sx={{
                  backgroundColor: activeSandbox === id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                  color: "white",
                  fontWeight: activeSandbox === id ? 600 : 400,
                  borderRadius: "16px",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.25)",
                  },
                }}
              />
            ))}
            <IconButton
              size="small"
              onClick={createNewSandbox}
              sx={{
                color: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
                width: 32,
                height: 32,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Action buttons for code sandbox */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px 24px",
            background: mode === "light"
              ? "linear-gradient(90deg, rgba(107,102,255,0.05) 0%, rgba(147,112,219,0.05) 100%)"
              : "linear-gradient(90deg, rgba(107,102,255,0.1) 0%, rgba(147,112,219,0.1) 100%)",
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(getCurrentFileContent())
            }}
            sx={{
              background: mode === "light" ? "rgba(255,255,255,0.8)" : "rgba(50,50,50,0.8)",
              color: mode === "light" ? "text.secondary" : "#e0e0e0",
              "&:hover": {
                background: mode === "light" ? "rgba(255,255,255,0.95)" : "rgba(60,60,60,0.95)",
              },
            }}
            startIcon={<ContentCopyIcon />}
          >
            Copy
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={generateSampleSuggestion}
            sx={{
              background: "linear-gradient(90deg, #9370DB 0%, #6B66FF 100%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(90deg, #8360CB 0%, #5B56EF 100%)",
              },
            }}
          >
            <AutoAwesome/>
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={executeCode}
            disabled={isExecuting}
            sx={{
              background: "linear-gradient(90deg, #FF9E2C 0%, #FF6B6B 100%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(90deg, #FF8E1C 0%, #FF5B5B 100%)",
              },
            }}
            startIcon={<PlayArrowIcon />}
          >
            Run
          </Button>
        </Box>

        {/* File tabs */}
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
            background:
              mode === "light"
                ? "linear-gradient(90deg, rgba(107,102,255,0.05) 0%, rgba(147,112,219,0.05) 100%)"
                : "linear-gradient(90deg, rgba(107,102,255,0.1) 0%, rgba(147,112,219,0.1) 100%)",
            padding: "8px 16px",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {getCurrentSandboxFiles().map((file) => (
              <Chip
                key={file.id}
                label={file.name}
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        file.language === "javascript" || file.language === "jsx"
                          ? "#F7DF1E"
                          : file.language === "css"
                            ? "#2965F1"
                            : file.language === "html"
                              ? "#E34F26"
                              : "#9370DB",
                      display: "inline-block",
                    }}
                  />
                }
                onClick={() => {
                  const updatedSandboxes = { ...sandboxes }
                  updatedSandboxes[activeSandbox].activeFile = file.id
                  setSandboxes(updatedSandboxes)
                }}
                sx={{
                  backgroundColor:
                    sandboxes[activeSandbox]?.activeFile === file.id
                      ? mode === "light"
                        ? "rgba(107,102,255,0.1)"
                        : "rgba(107,102,255,0.2)"
                      : "transparent",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  height: 28,
                  borderRadius: "4px",
                  transition: "all 0.2s",
                  color: mode === "light" ? "inherit" : "#e0e0e0",
                  "&:hover": {
                    backgroundColor: mode === "light" ? "rgba(107,102,255,0.05)" : "rgba(107,102,255,0.15)",
                  },
                }}
              />
            ))}
            <IconButton
              size="small"
              onClick={() => {
                const newFileId = `file${codeFiles.length + 1}`
                setCodeFiles((prev) => [
                  ...prev,
                  {
                    id: newFileId,
                    name: "newfile.js",
                    language: "javascript",
                    content: "// New file\n",
                  },
                ])

                const updatedSandboxes = { ...sandboxes }
                updatedSandboxes[activeSandbox].files.push(newFileId)
                updatedSandboxes[activeSandbox].activeFile = newFileId
                setSandboxes(updatedSandboxes)
              }}
              sx={{
                color: "text.secondary",
                width: 24,
                height: 24,
                "&:hover": {
                  backgroundColor: mode === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Code editor */}
        <Box sx={{ flexGrow: 1, overflow: "hidden", position: "relative" }}>
          {/* Show code suggestion if available */}
          {codeSuggestion && codeSuggestion.isActive && codeSuggestion.fileId === sandboxes[activeSandbox]?.activeFile && (
            <CodeDiffView 
              originalCode={codeSuggestion.originalCode}
              suggestedCode={codeSuggestion.suggestedCode}
              language={codeSuggestion.language}
              message={codeSuggestion.message}
              isDarkMode={mode === "dark"}
              onAccept={() => {
                // Update current file content with the suggested code
                const fileIndex = codeFiles.findIndex((file) => file.id === codeSuggestion.fileId);
                if (fileIndex !== -1) {
                  const updatedFiles = [...codeFiles];
                  updatedFiles[fileIndex].content = codeSuggestion.suggestedCode;
                  setCodeFiles(updatedFiles);
                }
                // Clear the suggestion
                setCodeSuggestion(null);
              }}
              onReject={() => {
                // Just dismiss the suggestion
                setCodeSuggestion(null);
              }}
            />
          )}

          {/* Only show the editor when there's no active suggestion or if we're viewing a different file */}
          {!codeSuggestion?.isActive || codeSuggestion.fileId !== sandboxes[activeSandbox]?.activeFile ? (
            <CodeEditor
              value={getCurrentFileContent()}
              language={getCurrentFileLanguage()}
              onChange={handleCodeChange}
              isDarkMode={mode === "dark"}
            />
          ) : null}
        </Box>

        {/* Console output */}
        <Box
          sx={{
            height: "30%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid",
            borderColor: mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              background: "linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.8) 100%)",
              color: "white",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TerminalIcon sx={{ fontSize: 18, marginRight: 1 }} />
              <Typography variant="subtitle2">Console Output</Typography>
            </Box>
            <IconButton size="small" onClick={() => setConsoleOutput("")} sx={{ color: "rgba(255,255,255,0.7)" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              padding: 2,
              fontFamily: "monospace",
              fontSize: "0.875rem",
              backgroundColor: "#282c34",
              color: "#abb2bf",
              whiteSpace: "pre-wrap",
            }}
          >
            {consoleOutput || "Run your code to see output here..."}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
